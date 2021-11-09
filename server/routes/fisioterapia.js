const express = require('express');
const _ = require('underscore');

const Usuario = require('../models/usuario');
const Datospersonales = require('../models/datospersonales');
const Evaluaciondeportiva = require('../models/datoshistoriaclinica');
const Datosfisioterapia = require('../models/datosfisioterapia');

const { verificarTokenUrl, verificarTokenDesconexion } = require('../middlewares/autenticacion');

const app = express();


const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())



/**
 * CREAR REGISTRO DE HISTORIA CLINICA DE LOS DEPORTISTAS
 * Este servicio permite crear un registro de historia clinica de un usuario deportista
 * por parte de un usuario con rol Deportologo, Se debe enviar el ID del deportologo y deportista mediante parametro
 */
app.get('/fisioterapia/obtenerdatos/:ceduladeportista', [verificarTokenUrl, verificarTokenDesconexion], function(req, res) {

    let ceduladeportista = req.params.ceduladeportista;
    let body = req.body;

    Datospersonales.findOne({ numeroDocumento: ceduladeportista }, function(err, usuarioDB) {
        if (!usuarioDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                mensaje: `No exite un usuario Estudiante registrado con el número de documento ingresado`
            });
        } else {
            const iddeportista = usuarioDB.usuarioId;
            Usuario.aggregate([{ "$addFields": { "userId": { "$toString": "$_id" } } },
                {
                    $match: {
                        estado: true,
                        userId: iddeportista
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
                    $lookup: {
                        from: 'datosdeportivos',
                        localField: 'userId',
                        foreignField: 'usuarioId',
                        as: 'datosdeportivosUsuario'
                    }
                },
                {
                    $unwind: {
                        path: "$datosdeportivosUsuario",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $lookup: {
                        from: 'datosinstitucionales',
                        localField: 'userId',
                        foreignField: 'usuarioId',
                        as: 'datosinstitucionalesUsuario'
                    }
                },
                {
                    $unwind: {
                        path: "$datosinstitucionalesUsuario",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $lookup: {
                        from: 'evaluaciondeportivas',
                        localField: 'userId',
                        foreignField: 'deportistaId',
                        as: 'evaluaciondeportivasUsuario'
                    }
                },
                {
                    $unwind: {
                        path: "$evaluaciondeportivasUsuario",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $lookup: {
                        from: 'datosresidencias',
                        localField: 'userId',
                        foreignField: 'usuarioId',
                        as: 'datosresidenciasUsuario'
                    }
                },
                {
                    $unwind: {
                        path: "$datosresidenciasUsuario",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $project: {
                        nombres: "$datospersonalesUsuario.nombres",
                        primerApellido: "$datospersonalesUsuario.primerApellido",
                        segundoApellido: "$datospersonalesUsuario.segundoApellido",
                        tipoDocumento: "$datospersonalesUsuario.tipoDocumento",
                        numeroDocumento: "$datospersonalesUsuario.numeroDocumento",
                        edad: "$datospersonalesUsuario.edad",
                        sexo: "$datospersonalesUsuario.sexo",
                        talla: "$datospersonalesUsuario.talla",
                        peso: "$datospersonalesUsuario.peso",
                        fechaNacimiento: "$datospersonalesUsuario.fechaNacimiento",
                        celular: "$datosresidenciasUsuario.celular",
                        correo: "$datosresidenciasUsuario.correo",
                        facultad: "$datosinstitucionalesUsuario.facultad",
                        programaAcademico: "$datosinstitucionalesUsuario.programaAcademico",
                        semestreActual: "$datosinstitucionalesUsuario.semestreActual",
                        eps: "$datospersonalesUsuario.eps",
                        disciplinaDeportiva: "$datosdeportivosUsuario.disciplinaDeportiva",
                        diagnosticoMedico: "$evaluaciondeportivasUsuario.diagnostico",
                        medicoRemite: "$evaluaciondeportivasUsuario.cedulaDeportologo",
                        recomendacionMedica: "$evaluaciondeportivasUsuario.opinionPlan",
                    }
                }
            ]).exec((err, datosCompletosUsuarios) => {
                if (datosCompletosUsuarios.length < 1) {
                    res.json({
                        estado: false,
                        codigo: '0404',
                        mensaje: `ERROR: El estudiante con cedula ${ceduladeportista} no presenta revisiones clinicas registradas`
                    });
                } else {
                    res.json({
                        estado: true,
                        codigo: '0000',
                        datosRegistroFisioterapia: datosCompletosUsuarios[0]
                    });
                }
            });
        }
    });
});




/**
 * CREAR REGISTRO DE HISTORIA CLINICA DE LOS DEPORTISTAS
 * Este servicio permite crear un registro de historia clinica de un usuario deportista
 * por parte de un usuario con rol Deportologo, Se debe enviar el ID del deportologo y deportista mediante parametro
 */
app.post('/fisioterapia/registrardatos/:idfisioterapeuta/:iddeportista', [verificarTokenUrl, verificarTokenDesconexion], function(req, res) {

    let idfisioterapeuta = req.params.idfisioterapeuta;
    let iddeportista = req.params.iddeportista;
    let body = req.body;

    Usuario.findOne({ _id: idfisioterapeuta }, function(err, usuarioDb) {
        if (!usuarioDb) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    mensaje: `No exite un usuario Fisioterapeuta registrado con el Id ingresado`
                }
            });
        } else {
            Usuario.findOne({ _id: iddeportista }, function(err, usuarioDB) {
                if (!usuarioDB) {
                    return res.status(200).json({
                        estado: false,
                        codigo: '0011',
                        err: {
                            mensaje: `No exite un usuario Deportista registrado con el Id ingresado`
                        }
                    });
                } else {
                    let datosFisioterapia = new Datosfisioterapia({
                        deportistaId: iddeportista,
                        fisioterapeutaId: idfisioterapeuta,
                        nombres: body.nombres,
                        tipoDocumento: body.tipoDocumento,
                        numeroDocumento: body.numeroDocumento,
                        sexo: body.sexo,
                        edad: body.edad,
                        talla: body.talla,
                        peso: body.peso,
                        fechaNacimiento: body.fechaNacimiento,
                        celular: body.celular,
                        correo: body.correo,
                        facultad: body.facultad,
                        programaAcademico: body.programaAcademico,
                        semestre: body.semestre,
                        eps: body.eps,
                        disciplinaDeportiva: body.disciplinaDeportiva,
                        diagnosticoMedico: body.diagnosticoMedico,
                        medicoRemite: body.medicoRemite,
                        recomendacionMedica: body.recomendacionMedica,
                        fechaIngreso: body.fechaIngreso,
                        antecedentesPersonales: body.antecedentesPersonales,
                        antecedentesFamiliares: body.antecedentesFamiliares,
                        evaluacionInicial: body.evaluacionInicial,
                        estadoPiel: body.estadoPiel,
                        sensibilidad: body.sensibilidad,
                        dolor: body.dolor,
                        arcosMovilidad: body.arcosMovilidad,
                        fuerzaMuscular: body.fuerzaMuscular,
                        flexibilidad: body.flexibilidad,
                        pruebasSimiologicas: body.pruebasSimiologicas,
                        posturaMarcha: body.posturaMarcha,
                        observaciones: body.observaciones,
                        planTratamiento: body.planTratamiento,
                        cedulaFisioterapeuta: body.cedulaFisioterapeuta
                    });
                    datosFisioterapia.save((err, datosFisioterapiaDB) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }
                        res.json({
                            estado: true,
                            codigo: '0000',
                            mensaje: 'Formulario de Fisioterapia registrado exitosamente'
                        });
                    });
                }
            });
        }
    });
});



app.get('/fisioterapeuta/obtenerevaluaciones/:idfisioterapeuta', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {

    let idfisioterapeuta = req.params.idfisioterapeuta;

    var perPage = 10
    var page = req.query.page || 1;

    Usuario.findOne({ _id: idfisioterapeuta }, function(err, usuarioDB) {
        if (err) {
            return res.status(400).json({
                estado: false,
                codigo: '0404',
                err
            });
        }
        if (!usuarioDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    mensaje: `No exite un usuario Fisioterapeuta registrado con el ID ingresado`
                }
            });
        } else {
            Usuario.aggregate([{ "$addFields": { "userId": { "$toString": "$_id" } } },
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
                        $lookup: {
                            from: 'datosfisioterapias',
                            localField: 'userId',
                            foreignField: 'deportistaId',
                            as: 'datosfisioterapiasUsuario'
                        }
                    },
                    {
                        $unwind: {
                            path: "$datosfisioterapiasUsuario",
                            preserveNullAndEmptyArrays: false
                        }
                    },
                    {
                        $project: {
                            nombres: "$datospersonalesUsuario.nombres",
                            primerApellido: "$datospersonalesUsuario.primerApellido",
                            segundoApellido: "$datospersonalesUsuario.segundoApellido",
                            numeroDocumento: "$datospersonalesUsuario.numeroDocumento",
                            celular: "$datosfisioterapiasUsuario.celular",
                            fechaIngreso: "$datosfisioterapiasUsuario.fechaIngreso",
                            medicoRemite: "$datosfisioterapiasUsuario.medicoRemite",
                            idConsulta: "$datosfisioterapiasUsuario._id"
                        }
                    },
                ])
                .skip((perPage * page) - perPage)
                .limit(perPage)
                .exec((err, datosCompletosUsuarios) => {

                    if (datosCompletosUsuarios) {
                        Datosfisioterapia.estimatedDocumentCount({ fisioterapeutaId: idfisioterapeuta }, (err, conteo) => {
                            let paginas = Math.ceil(conteo / perPage);
                            res.json({
                                estado: true,
                                codigo: '0000',
                                datosCompletosUsuarios,
                                totalItems: conteo,
                                pages: paginas
                            })

                        })

                    }
                })
        }
    })
});




app.get('/fisioterapeuta/obtenerevaluacion/:idconsulta', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {

    let idconsulta = req.params.idconsulta;

    Datosfisioterapia.findOne({ _id: idconsulta }, function(err, evaluacionDB) {
        if (!evaluacionDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                mensaje: `No exite una consulta de fisioterapia registrada con el ID ingresado`
            });
        } else {

            Datosfisioterapia.aggregate([{ "$addFields": { "consultaId": { "$toString": "$_id" } } }, {
                    $match: {
                        consultaId: idconsulta
                    }
                },
                {
                    $lookup: {
                        from: 'datospersonales',
                        localField: 'deportistaId',
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
                        nombres: "$datospersonalesUsuario.nombres",
                        primerApellido: "$datospersonalesUsuario.primerApellido",
                        segundoApellido: "$datospersonalesUsuario.segundoApellido",
                        numeroDocumento: "$datospersonalesUsuario.numeroDocumento",
                        fechaIngreso: 1,
                        disciplinaDeportiva: 1,
                        observaciones: 1,
                        planTratamiento: 1,
                        cedulaFisioterapeuta: 1,
                    }
                },
            ]).exec((err, datosUsuario) => {
                if (!datosUsuario) {
                    res.json({
                        estado: false,
                        codigo: '0404',
                        mensaje: 'No se encontraron datos de usuario para el ID de consulta ingresado'
                    })
                } else {
                    res.json({
                        estado: true,
                        codigo: '0000',
                        mensaje: 'Datos del usuario consultados exitosamente',
                        datosUsuario: datosUsuario[0]
                    })
                }
            })
        }
    })
});





app.get('/fisioterapeuta/historiaclinica/deportologos', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {

    var perPage = 10
    var page = req.query.page || 1;


    Usuario.aggregate([{ "$addFields": { "userId": { "$toString": "$_id" } } },
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
                $lookup: {
                    from: 'evaluaciondeportivas',
                    localField: 'userId',
                    foreignField: 'deportistaId',
                    as: 'evaluacionportivasUsuario'
                }
            },
            {
                $unwind: {
                    path: "$evaluacionportivasUsuario",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $project: {
                    nombres: "$datospersonalesUsuario.nombres",
                    primerApellido: "$datospersonalesUsuario.primerApellido",
                    segundoApellido: "$datospersonalesUsuario.segundoApellido",
                    numeroDocumento: "$datospersonalesUsuario.numeroDocumento",
                    fecha: "$evaluacionportivasUsuario.fecha",
                    responsable: "$evaluacionportivasUsuario.responsable",
                    telefonoResponsable: "$evaluacionportivasUsuario.telefonoResponsable",
                    idEvaluacion: "$evaluacionportivasUsuario._id",
                }
            },
        ])
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec((err, datosCompletosUsuarios) => {
            if (datosCompletosUsuarios) {

                Evaluaciondeportiva.estimatedDocumentCount({}, (err, conteo) => {
                    let paginas = Math.ceil(conteo / perPage)
                    res.json({
                        estado: true,
                        codigo: '0000',
                        evaluaciones: datosCompletosUsuarios,
                        totalItems: conteo,
                        pages: paginas
                    })
                })
            }
        })
});







module.exports = app;