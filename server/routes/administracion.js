const express = require('express');

const bcrypt = require('bcrypt');
const _ = require('underscore');

const Usuario = require('../models/usuario');
const Disciplina = require('../models/disciplina');
const TokenDesconexion = require('../models/desconexion');
const Datospersonales = require('../models/datospersonales');
const Datosresidencia = require('../models/datosresidencia');
const Datosdeportivos = require('../models/datosdeportivos');
const Datosinstitucionales = require('../models/datosinstitucionales');
const CambioDatosPersonales = require('../models/cambioDatosPersonales');

const nodemailer = require('nodemailer');

const { verificaAdmin_Role, verificarTokenDesconexion, verificarTokenUrl, verificarEstadoTokenUrl } = require('../middlewares/autenticacion');


const app = express();



const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//app.get('/admin/users', [verificarToken, verificaAdmin_Role, verificarTokenDesconexion], (req, res) => { 
app.get('/admin/users', (req, res) => {

    var perPage = 10
    var page = req.query.page || 1;


    Usuario.find({ estado: true }, 'nombre email role estado verificado foto fechaRegistro')
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec((err, usuarios) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            Usuario.estimatedDocumentCount({ estado: true }, (err, conteo) => {
                let paginas = Math.ceil(conteo / perPage)
                res.json({
                    estado: true,
                    codigo: '0000',
                    usuarios,
                    totalItems: conteo,
                    pages: paginas
                })
            })

        })
});

app.get('/admin/obtenerusuarios', [verificarTokenUrl, verificaAdmin_Role, verificarTokenDesconexion], (req, res) => {

    var perPage = 10
    var page = req.query.page || 1;

    Usuario.aggregate([{ "$addFields": { "userId": { "$toString": "$_id" } } },
            {
                $match: {
                    estado: true
                }
            },
            {
                $lookup: {
                    from: 'datospersonales',
                    localField: 'userId',
                    foreignField: 'usuarioId',
                    as: 'datospersonalesUsuario'
                }
            },
            {
                $unwind: {
                    path: "$datospersonalesUsuario",
                    preserveNullAndEmptyArrays: false
                }
            },

            {
                $project: {
                    email: 1,
                    role: 1,
                    foto: 1,
                    verificado: 1,
                    fechaRegistro: 1,
                    tipoDocumento: "$datospersonalesUsuario.tipoDocumento",
                    numeroDocumento: "$datospersonalesUsuario.numeroDocumento",
                    nombres: "$datospersonalesUsuario.nombres",
                    primerApellido: "$datospersonalesUsuario.primerApellido",
                    segundoApellido: "$datospersonalesUsuario.segundoApellido",
                    edad: "$datospersonalesUsuario.edad",
                }
            },
        ])
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec((err, datosCompletosUsuarios) => {
            if (datosCompletosUsuarios) {

                Datospersonales.estimatedDocumentCount({}, (err, conteo) => {
                    let paginas = Math.ceil(conteo / perPage)
                    res.json({
                        estado: true,
                        codigo: '0000',
                        usuarios: datosCompletosUsuarios,
                        totalItems: conteo,
                        pages: paginas
                    })
                })



            } else {
                res.json({
                    estado: true,
                    codigo: '0004',
                    mensaje: 'Error al consultar los usuarios registrados'
                })
            }
        });

});



//obtener usuario por id
app.get('/admin/users/:id', [verificarTokenUrl, verificaAdmin_Role, verificarTokenDesconexion], (req, res) => {

    let id = req.params.id;

    Usuario.findById(id)
        .exec((err, usuarioDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            if (!usuarioDB) {
                return res.status(200).json({
                    ok: false,
                    err: {
                        message: 'ID no existe'
                    }
                });
            }

            res.json({
                ok: true,
                usuario: usuarioDB
            })

        });

});

/**
 * CREAR USUARIO
 * Permite al administrador crear un usuario (Deportologo, Fisioterapeuta, Administrador, Visualizador)
 * Este no requiere que confirme el correo, quedara verificado inmediatamente
 * No se permite tampoco que registre usuarios con rol Deportista
 * Los deportistas deberan registrarse mediante el servicio de registro
 */
app.post('/admin/users/crearusuario', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let body = req.body;

    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role,
        verificado: true
    });

    Usuario.findOne({ email: body.email }, function(err, user) {
        if (user) {
            return res.status(200).json({
                estado: false,
                codigo: '0009',
                err: {
                    mensaje: 'El email ya se encuentra registrado en el sistema'
                }
            });
        } else {
            //grabar el objeto usuario en la bd
            usuario.save((err, usuarioDB) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    });
                }
                const tokenDesconexion = new TokenDesconexion({
                    _userId: usuarioDB._id
                });
                tokenDesconexion.save(function(err) {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }
                });

                const URL_PRODUCCION = `http://sgdarpoli.com/`;
                const URL_DESARROLLO = `http://localhost:3000/`;

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USERNAME,
                        pass: process.env.GMAIL_PASSWORD
                    }


                });

                const mailOptions = {
                    from: 'no-reply@tdgpolijic.com',
                    to: req.body.email,
                    subject: "Bienvenid@ al sistema SGDAR POLI JIC",
                    html: `<center><table width="900"><tbody><tr><td><br><br><br></td></tr><tr><td><br><p align="left"></p><h3><b>Estimado ${usuarioDB.nombre},</b>
                       </h3><p></p><p>Hemos recibido una solicitud de registro en el portal de SGDAR POLI JIC. por parte del Administrador del sitio </p><p>El <b>Link,</b> para ingresar al sitio web es el siguiente:</p>
                       </td></tr><tr><td align="center"><br> <div><p style="padding:0px 0px;word-wrap:break-word">
                       <a href="${URL_DESARROLLO}"><input type="button" style="background-color: #4CAF50; border: none; color: white; padding: 15px 200px; text-align: center;
                       text-decoration: none; display: inline-block; font-size: 18px" value="INGRESAR AL SITIO WEB SGDAR POLI JIC"></a></p></div><br></td></tr><tr><td align="left">
                       <p>Los datos para iniciar sesión son los siguientes: <br><br><b>Correo: </b>${usuarioDB.email} <br> <b>Clave: </b>${req.body.password} <p><b>Nota</b>: Una vez cumplido este procedimiento ya puede iniciar sesión en el portal con sus datos.</p><div style="text-align:justify;font-size:10px">
                       <p style="text-align:justify">AVISO LEGAL</p><p>Este mensaje es confidencial, privado y está protegido por las normas jurídicas que aplican. Usted no debe copiar el mensaje ni divulgar su contenido a ninguna persona y por ningún medio. Si lo ha recibido por error, por favor elimínelo de su sistema.
                       <br>Esta cuenta de correo es de uso exclusivo para envío, por favor absténgase de escribir o responder al mismo, puesto que rebotará y/o no obtendrá respuesta</p>
                       </div></td></tr><tr><td></td></tr><tr><td><div style="float:left;width:50%;height:10px;background-color:#5bb75b"></div>
                       <div style="float:left;width:50%;height:10px;background-color:#faa732"></div></td></tr></tbody></table></center>`
                };

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.log(err);
                        return next(err);
                    }
                    res.json({
                        estado: true,
                        codigo: '0000',
                        mensaje: 'Usuario registrado exitosamente',
                        usuarioRegistrado: usuarioDB
                    });
                });
            });
        }
    });
});

/**
 * HABILITAR USUARIO
 * Permite habilitar un usuario del sistema que fue deshabilitado
 * Este quedara con los datos que registro antes de ser deshabilitado
 */
app.get('/admin/users/habilitarusuario/:id', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;

    let cambiaEstado = {
        estado: true
    };
    Usuario.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, usuarioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: `Usuario ${usuarioBorrado.email} habilitado exitosamente`
        });
    });
});


/**
 * DESHABILITAR USUARIO (ELIMINAR)
 * Permite deshabilitar un usuario del sistema
 * Cumple la funcion de eliminar usuario, se utiliza la deshabilitación
 * Para tener la trazabilidad de los datos registrados por el usuario
 */
app.get('/admin/users/deshabilitarusuario/:id', [verificarTokenUrl, verificarTokenDesconexion], function(req, res) {

    let id = req.params.id;

    let cambiaEstado = {
        estado: false
    };
    Usuario.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, usuarioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if (!usuarioBorrado) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: `Usuario ${usuarioBorrado.email} deshabilitado exitosamente`
        });
    });
});


/**
 * CAMBIAR ROL DE USUARIO
 * Permite cambiar el rol a un usuario registrado
 * en el sistema, esta funcion solamente puede ser
 * utilizada por usuario con rol ADMIN
 */
app.put('/admin/users/cambioderol/:id', function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['role']);

    //forma de actualizar
    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                estado: false,
                mensaje: 'El ID no corresponde a ningun usuario registrado'
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: `El rol fue cambiado con exito, ahora el usuario ${usuarioDB.nombre} (${usuarioDB.email}) tiene el rol de: ${req.body.role}`
        })
    })
});


// =================================================
//              Disciplina deportiva              //
// =================================================

/**
 * OBTENER DISCIPLINAS
 * Este servicio permite obtener todas las disciplinas
 * Que se han registrado en la BD del sistema
 */
app.get('/admin/disciplinas/obtenerdisciplinas', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {

    Disciplina.find({}, 'nombre')
        .exec((err, disciplinas) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            res.json({
                estado: true,
                codigo: '0000',
                disciplinas
            })
        })
});

/**
 * REGISTRAR DISCIPLINA
 * Este servicio permite agregar una nueva disciplina
 * a la lista de disciplinas, solamente se requiere
 * el nombre de la disciplina a crear (UNICO)
 */
app.post('/admin/disciplinas/registrardisciplina', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let body = req.body;

    let disciplina = new Disciplina({
        nombre: body.nombre
    });

    disciplina.save((err, disciplinaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Disciplina registrada exitosamente'
        });
    });
});

/**
 * MODIFICAR DISCIPLINA
 * Permite modificar el nombre de una disciplina
 * se requiere el ID de esta para su modificación
 */
app.put('/admin/disciplinas/modificardisciplina/:id', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['nombre']);

    Disciplina.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, disciplinaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if (!disciplinaDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0010',
                mensaje: 'El ID de la disciplina no existe'
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Disciplina modificada exitosamente'
        })
    })
});

/**
 * ELIMINAR DISCIPLINA
 * Permite eliminar una disciplina que ya se encuentra
 * creada en la BD, se elimina mediante su ID
 */
app.delete('/admin/disciplinas/eliminardisciplina/:nombre', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let nombreDisciplina = req.params.nombre;
    console.log("DISCIPLINA")
    console.log(nombreDisciplina)

    Datosdeportivos.find({ disciplinaDeportiva: nombreDisciplina }, (err, conteo) => {
        if (conteo.length >= 1) {
            return res.status(200).json({
                estado: false,
                codigo: '0099',
                mensaje: 'Hay usuarios vinculados a la disciplina que intenta eliminar'

            });
        } else {
            Disciplina.findOneAndDelete({ nombre: nombreDisciplina }, (err, disciplinaBorrada) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err: {
                            message: 'Error al procesar la solicitud en la API'
                        }
                    });
                }
                if (!disciplinaBorrada) {
                    return res.status(200).json({
                        estado: false,
                        codigo: '0010',
                        mensaje: 'La disciplina no existe'

                    });
                }
                res.json({
                    estado: true,
                    codigo: '0000',
                    mensaje: 'Disciplina eliminada correctamente'
                });
            });


        }
    })

});


// ==============================================================
//            HABILITAR - DESHABILITAR CAMBIO DE DATOS          //
// ===============================================================

/**
 * CREAR COLECCION CAMBIO DATOS
 * Solamente se utiliza una(1) sola vez, crea el objeto en la coleccion
 * el cual posteriormente se consultara y modificara para permitir o no el cambio
 * de datos de los usuarios en el sistema
 */
app.post('/admin/users/cambiodedatos', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let cambioDatosPersonales = new CambioDatosPersonales({
        codigo: '2020',
        estado: 'false'
    });
    cambioDatosPersonales.save((err, cambioDatosPersonalesDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            cambioDatosPersonales: cambioDatosPersonalesDB
        });
    });
});


/**
 * HABILITAR CAMBIO DE DATOS 
 * Habilita el cambio de datos
 * para todos los usuarios registrados en el sistema
 * este servicio cambia el valor de la variable 'estado' a 'true'
 */
app.get('/admin/users/cambiodedatos/habilitar', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    CambioDatosPersonales.findOne({ codigo: '2020' }, function(err, codigoDB) {
        if (!codigoDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0404',
                err: {
                    mensaje: 'Codigo de cambio de datos personales INCORRECTO'
                }
            });
        } else {
            codigoDB.estado = 'true';
            codigoDB.save(function(err) {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'No se pudo habilitar el cambio de datos'
                        }
                    });
                } else {
                    res.json({
                        estado: true,
                        codigo: '0000',
                        mensaje: 'Cambio de datos HABILITADO exitosamente'
                    });
                }

            });
        }
    });
});

/**
 * DESHABILITAR CAMBIO DE DATOS
 * Deshabilita el cambio de datos
 * para todos los usuarios registrados en el sistema
 * este servicio cambia el valor de la variable 'estado' a 'false'
 */
app.get('/admin/users/cambiodedatos/deshabilitar', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    CambioDatosPersonales.findOne({ codigo: '2020' }, function(err, codigoDB) {
        if (!codigoDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0013',
                err: {
                    mensaje: 'Codigo de cambio de datos personales INCORRECTO'
                }
            });
        } else {
            codigoDB.estado = 'false';
            codigoDB.save(function(err) {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'No se pudo deshabilitar el cambio de datos'
                        }
                    });
                } else {
                    res.json({
                        estado: true,
                        codigo: '0000',
                        mensaje: 'Cambio de datos DESHABILITADO exitosamente'
                    });
                }

            });
        }
    });
});


/**
 * CONSULTAR ESTADO CAMBIO DE DATOS 
 * Api que permite consultar si esta habilitado o deshabilitado
 * el cambio de datos
 */
app.get('/admin/users/cambiodedatos/consultar', function(req, res) {

    CambioDatosPersonales.find({}, function(err, puedeModificar) {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0001',
                err: {
                    mensaje: 'No se pudo consultar el estado del cambio de datos personales'
                }
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            puedeModificar
        });

    });
});



// =========================================================================
//                     MODIFICAR DATOS DEL USUARIO                        //
//   REGISTRO - PERSONALES - RESIDENCIA - INSTITUCIONALES - DEPORTIVOS    //
// =========================================================================


/**
 * MODIFICAR DATOS DE REGISTRO DE USUARIO
 * Permite la modificación de los datos de registro de los
 * usuarios registrados (nombre, email, estado, role, foto), se debe enviar el ID del usuario 
 * a modificar como parametro
 */
app.put('/admin/users/modificarusuario/datosregistro/:id', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['nombre', 'email']);

    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json({
            ok: true,
            usuario: usuarioDB
        })
    })
});


/**
 * MODIFICAR DATOS PERSONALES DE UN USUARIO
 * Servicio que permite modificar los datos personales
 * de acuerdo al documento del usuario ingresado
 */
app.put('/admin/users/modificarusuario/datospersonales/:id', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['tipoDocumento', 'lugarExpedicionDocumento', 'numeroDocumento', 'edad', 'sexo', 'primerApellido', 'segundoApellido', 'nombres', 'fechaNacimiento', 'paisNacimiento', 'estadoCivil', 'eps', 'grupoSanguineo', 'peso', 'talla', 'discapacidad', 'tipoDiscapacidad', 'etnia', 'desplazado', 'trabaja', 'cabezaHogar']);

    Datospersonales.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                estado: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos personales del usuario actualizados exitosamente'
        })
    });
});

/**
 * MODIFICAR DATOS DE RESIDENCIA DE UN USUARIO
 * Servicio que permite modificar los datos de residencia
 * de acuerdo al Id del usuario enviado como parametro
 */
app.put('/admin/users/modificarusuario/datosresidencia/:id', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['pais', 'departamento', 'municipio', 'barrio', 'direccion', 'estrato', 'telefono', 'celular', 'correo']);

    Datosresidencia.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                estado: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos de residencia del usuario actualizados exitosamente',
            usuario: usuarioDB
        })
    });
});

/**
 * MODIFICAR DATOS INSTITUCIONALES DEL USUARIO
 * Servicio que permite modificar los datos institucionales
 * de acuerdo al Id del usuario enviado como parametro
 */
app.put('/admin/users/modificarusuario/datosinstitucionales/:id', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['tipoAspirante', 'anioIngreso', 'facultad', 'tipoEstudio', 'programaAcademico', 'semestreActual', 'promedioAcumulado', 'sede']);

    Datosinstitucionales.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                estado: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos institucionales del usuario actualizados exitosamente',
            usuario: usuarioDB
        })
    });
});


/**
 * MODIFICAR DATOS DEPORTIVOS DEL USUARIO
 * Servicio que permite modificar los datos deportivos
 * de acuerdo al Id del usuario enviado como parametro
 */
app.put('/admin/users/modificarusuario/datosdeportivos/:id', [verificarTokenUrl, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['foto', 'fechaInscripcion', 'disciplinaDeportiva', 'especialidad', 'genero', 'categorizacion', 'tipoDeportista', 'nivelDeportivo', 'cicloOlimpico', 'cicloOlimpicoActual', 'mayorLogroObtenido']);

    Datosdeportivos.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                estado: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos deportivos del usuario actualizados exitosamente',
            usuario: usuarioDB
        })
    });
});



app.get('/token/obtenerestado', [verificarEstadoTokenUrl, verificarTokenDesconexion], function(err, res) {
    res.json({
        estado: true,
        codigo: '0000',
        mensaje: 'Token activo'
    })
})




/**
 * 
 * 
 * 
 *     SERVICIOS SOLAMENTE PARA PRUEBAS EN DESARROLLO
 * 
 * 
 * 
 */





/**
 * Servicio para eliminar usuario
 * Solamente utilizado para pruebas - NO PRODUCCIÓN
 */
app.delete('/usuario/eliminar/:id', function(req, res) {

    Usuario.findOneAndRemove({ _id: req.params.id }, (err, usuarioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0404',
                err
            });
        }
        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                codigo: '0002',
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }
        res.json({
            ok: true,
            codigo: '0000',
            message: 'Usuario eliminado exitosamente'
        });
    });
});

/**
 * Servicio para eliminar token de desconexion de usuario
 * Solamente utilizado para pruebas - NO PRODUCCIÓN
 */
app.delete('/usuario/eliminar-token/:id', function(req, res) {
    TokenDesconexion.findOneAndRemove({ _userId: req.params.id }, (err, tokenDesconexionBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0404',
                err
            });
        }
        res.json({
            ok: true,
            codigo: '0000',
            message: 'Token de desconexion asociado al usuario eliminado exitosamente'
        });

    })
});


/**
 * ELIMINAR DATOS PERSONALES DE USUARIO
 */
app.delete('/admin/eliminardatospersonales/:id', function(req, res) {

    Datospersonales.findOneAndDelete({ usuarioId: req.params.id }, (err, datosPersonalesDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Error al procesar la solicitud en la API'
                }
            });
        }
        if (!datosPersonalesDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0010',
                mensaje: 'El ID del usuario no existe'

            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos personales eliminados correctamente'
        });
    });
});


/**
 * ELIMINAR DATOS DEPORTIVOS DE USUARIO
 */
app.delete('/admin/eliminardatosdeportivos/:id', function(req, res) {

    Datosdeportivos.findOneAndDelete({ usuarioId: req.params.id }, (err, datosDeportivosDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Error al procesar la solicitud en la API'
                }
            });
        }
        if (!datosDeportivosDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0010',
                mensaje: 'El ID del usuario no existe'

            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos deportivos eliminados correctamente'
        });
    });
});


/**
 * ELIMINAR DATOS INSTITUCIONALES DE USUARIO
 */
app.delete('/admin/eliminardatosinstitucionales/:id', function(req, res) {

    Datosinstitucionales.findOneAndDelete({ usuarioId: req.params.id }, (err, datosInstitucionalesDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Error al procesar la solicitud en la API'
                }
            });
        }
        if (!datosInstitucionalesDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0010',
                mensaje: 'El ID del usuario no existe'

            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos institucionales eliminados correctamente'
        });
    });
});


/**
 * ELIMINAR DATOS SOCIOECONOMICOS DE USUARIO
 */
app.delete('/admin/eliminardatosresidencia/:id', function(req, res) {

    Datosresidencia.findOneAndDelete({ usuarioId: req.params.id }, (err, datosResidenciaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Error al procesar la solicitud en la API'
                }
            });
        }
        if (!datosResidenciaDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0010',
                mensaje: 'El ID del usuario no existe'

            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos socioeconómicos eliminados correctamente'
        });
    });
});








module.exports = app;