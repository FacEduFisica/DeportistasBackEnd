const express = require('express');
const _ = require('underscore');

const Usuario = require('../models/usuario');
const Disciplinaentrenadores = require('../models/disciplinaentrenadores');
const CambioDatosPersonales = require('../models/cambioDatosPersonales');
const Datospersonales = require('../models/datospersonales');

const { verificarTokenUrl, verificarTokenDesconexion } = require('../middlewares/autenticacion');

const app = express();


const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


app.post('/entrenador/registrardisciplina/:identrenador', [verificarTokenUrl, verificarTokenDesconexion], function(req, res) {

    let identrenador = req.params.identrenador;

    let body = req.body;

    let disciplinaEntrenadores = new Disciplinaentrenadores({
        entrenadorId: identrenador,
        nombreDisciplina: body.nombreDisciplina,
        generoDisciplina: body.generoDisciplina
    });

    Usuario.findOne({ _id: identrenador }, function(err, user) {
        if (!user) {
            return res.status(200).json({
                estado: false,
                codigo: '0009',
                mensaje: 'No se encuentra un Entrenador con el ID ingresado'
            });
        } else {
            Disciplinaentrenadores.findOne({ entrenadorId: identrenador }, function(err, disciplinaEntrenador) {
                if (disciplinaEntrenador) {
                    return res.status(200).json({
                        estado: false,
                        codigo: '0009',
                        mensaje: 'Ya el entrenador tiene una disciplina registrada, debe modificar la que se tiene'

                    });
                } else {
                    disciplinaEntrenadores.save((err, disciplinaDB) => {
                        if (err) {
                            return res.status(400).json({
                                estado: false,
                                codigo: '4040',
                                mensaje: 'Error al asociar la disciplina al entrenador'
                            });
                        }
                        res.json({
                            estado: true,
                            codigo: '0000',
                            mensaje: 'Disciplina registrada exitosamente al Entrenador'
                        });
                    });
                }
            });
        }
    });
});


app.get('/entrenador/obtenerdisciplina/:identrenador', [verificarTokenUrl, verificarTokenDesconexion], function(req, res) {

    let identrenador = req.params.identrenador;

    Disciplinaentrenadores.findOne({ entrenadorId: identrenador }, 'nombreDisciplina generoDisciplina')
        .exec((err, entrenadorDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            if (!entrenadorDB) {
                return res.status(400).json({
                    estado: false,
                    codigo: '4040',
                    nombreDisciplina: 'El entrenador no tiene una disciplina registrada.'
                });
            }
            res.json({
                estado: true,
                codigo: '0000',
                nombreDisciplina: entrenadorDB.nombreDisciplina,
                generoDisciplina: entrenadorDB.generoDisciplina,
            });
        });
});


app.put('/entrenador/actualizardisciplina/:identrenador', [verificarTokenUrl, verificarTokenDesconexion], function(req, res) {

    let identrenador = req.params.identrenador;
    let body = req.body;

    CambioDatosPersonales.findOne({ codigo: '2020' }, function(err, puedeModificar) {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0001',
                err: {
                    mensaje: 'No se pudo consultar el estado del cambio de datos personales'
                }
            });
        }
        if (!puedeModificar.estado) {
            return res.status(200).json({
                ok: false,
                codigo: '0013',
                err: {
                    mensaje: 'El cambio de datos esta deshabilitado'
                }
            });
        } else {
            Disciplinaentrenadores.findOneAndUpdate({ entrenadorId: identrenador }, body, { context: 'query', new: true, runValidators: true }, (err, disciplinaDB) => {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        err
                    });
                }
                if (!disciplinaDB) {
                    return res.status(200).json({
                        ok: false,
                        codigo: '0013',
                        err: {
                            mensaje: 'ID de disciplina no registrado'
                        }
                    });
                }
                res.json({
                    estado: true,
                    codigo: '0000',
                    mensaje: 'Disciplina actualizada exitosamente!'
                })


            });
        }
    });
});


app.get('/entrenador/obtenerestudiantes/:identrenador', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {

    let identrenador = req.params.identrenador;

    var perPage = 10
    var page = req.query.page || 1;

    Disciplinaentrenadores.findOne({ entrenadorId: identrenador }, function(err, disciplinaDB) {

        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0001',
                err: {
                    mensaje: 'No se pudo consultar el estado del cambio de datos personales'
                }
            });
        }
        if (!disciplinaDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0013',
                mensaje: 'No se encontro una disciplina asociada al entrenador'
            });
        } else {
            const disciplina = disciplinaDB.nombreDisciplina;
            const genero = disciplinaDB.generoDisciplina;
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
                        $match: {
                            estado: true,
                            "datosdeportivosUsuario.genero": genero,
                            "datosdeportivosUsuario.disciplinaDeportiva": disciplina
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

                        const conteo = datosCompletosUsuarios.length;
                        let paginas = Math.ceil(conteo / perPage)
                        res.json({
                            estado: true,
                            codigo: '0000',
                            usuarios: datosCompletosUsuarios,
                            totalItems: conteo,
                            pages: paginas
                        })




                    } else {
                        res.json({
                            estado: true,
                            codigo: '0004',
                            mensaje: 'Error al consultar los usuarios registrados'
                        })
                    }
                });
        }
    });
});






module.exports = app;