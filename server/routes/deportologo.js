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
app.get('/deportologo/obtenerdatos/:ceduladeportista', [verificarTokenUrl, verificarTokenDesconexion], function(req, res) {

    let ceduladeportista = req.params.ceduladeportista;
    let body = req.body;


    Datospersonales.findOne({ numeroDocumento: ceduladeportista }, function(err, usuarioDB) {
        if (!usuarioDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    mensaje: `No exite un usuario Deportista registrado con el numero de documento ingresado`
                }
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
                        direccion: "$datosresidenciasUsuario.direccion",
                        telefono: "$datosresidenciasUsuario.telefono",
                        fechaNacimiento: "$datospersonalesUsuario.fechaNacimiento",
                        edad: "$datospersonalesUsuario.edad",
                        estadoCivil: "$datospersonalesUsuario.estadoCivil",
                        sexo: "$datospersonalesUsuario.sexo",
                        lugarResidencia: "$datospersonalesUsuario.lugarResidencia",
                    }
                }
            ]).exec((err, datosCompletosUsuarios) => {
                if (datosCompletosUsuarios.length < 1) {
                    res.json({
                        estado: false,
                        codigo: '0404',
                        mensaje: `ERROR: El estudiante con cedula ${ceduladeportista} no tiene diligenciados todos sus datos en el sistema`
                    });
                } else {
                    res.json({
                        estado: true,
                        codigo: '0000',
                        datosConsultaDeportologo: datosCompletosUsuarios[0]
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
app.post('/deportologo/registrardatos/:iddeportologo/:iddeportista', [verificarTokenUrl, verificarTokenDesconexion], function(req, res) {

    let iddeportologo = req.params.iddeportologo;
    let iddeportista = req.params.iddeportista;
    let body = req.body;

    Usuario.findOne({ _id: iddeportologo }, function(err, usuarioDb) {
        if (!usuarioDb) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    mensaje: `No exite un usuario Deportologo registrado con el Id ingresado`
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
                    let evaluacionDeportiva = new Evaluaciondeportiva({
                        deportistaId: iddeportista,
                        deportologoId: iddeportologo,
                        responsable: body.responsable,
                        telefonoResponsable: body.telefonoResponsable,
                        parentesco: body.parentesco,
                        acompanante: body.acompanante,
                        telefonoAcompanante: body.telefonoAcompanante,
                        motivoConsulta: body.motivoConsulta,
                        sistemaCabezaCuello: body.sistemaCabezaCuello,
                        sistemaOftalmologico: body.sistemaOftalmologico,
                        sistemaOtorrino: body.sistemaOtorrino,
                        sistemaMaxilofacial: body.sistemaMaxilofacial,
                        sistemaPulmonar: body.sistemaPulmonar,
                        sistemaAbdomen: body.sistemaAbdomen,
                        sistemaUrinario: body.sistemaUrinario,
                        sistemaMusculoEsqueletico: body.sistemaMusculoEsqueletico,
                        sistemaPiel: body.sistemaPiel,
                        sistemaHematologico: body.sistemaHematologico,
                        sistemaMetabolico: body.sistemaMetabolico,
                        sistemaNeurologico: body.sistemaNeurologico,
                        sistemaVascular: body.sistemaVascular,
                        sistemaOtros: body.sistemaOtros,
                        sistemaObservaciones: body.sistemaObservaciones,
                        antecedenteCardioTabaquismo: body.antecedenteCardioTabaquismo,
                        antecedenteCardioTabaquismoCantidad: body.antecedenteCardioTabaquismoCantidad,
                        antecedenteCardioDislipidemia: body.antecedenteCardioDislipidemia,
                        antecedenteCardioSedentario: body.antecedenteCardioSedentario,
                        antecedenteCardioObesidad: body.antecedenteCardioObesidad,
                        antecedenteCardioHipertension: body.antecedenteCardioHipertension,
                        antecedenteCardioCoronaria: body.antecedenteCardioCoronaria,
                        antecedenteCardioSoplo: body.antecedenteCardioSoplo,
                        antecedenteCardioArritmia: body.antecedenteCardioArritmia,
                        antecedenteCardioDiabetes: body.antecedenteCardioDiabetes,
                        antecedenteCardioOtros: body.antecedenteCardioOtros,
                        antecedenteCardioObservaciones: body.antecedenteCardioObservaciones,
                        antecedenteDeporDesmayo: body.antecedenteDeporDesmayo,
                        antecedenteDeporProblemaEjercicio: body.antecedenteDeporProblemaEjercicio,
                        antecedenteDeporCardio: body.antecedenteDeporCardio,
                        antecedenteDeporPulmonar: body.antecedenteDeporPulmonar,
                        antecedenteDeporLesion: body.antecedenteDeporLesion,
                        antecedenteDeporOtros: body.antecedenteDeporOtros,
                        antecedenteDeporObservaciones: body.antecedenteDeporObservaciones,
                        antecedenteGralMedicamento: body.antecedenteGralMedicamento,
                        antecedenteGralAlergia: body.antecedenteGralAlergia,
                        antecedenteFamiliares: body.antecedenteFamiliares,
                        antecedenteGineco: body.antecedenteGineco,
                        examenFisico: body.examenFisico,
                        antropometriaPeso: body.antropometriaPeso,
                        antropometriaTalla: body.antropometriaTalla,
                        antropometriaCalificacion: body.antropometriaCalificacion,
                        antropometriaImc: body.antropometriaImc,
                        antropometriaPesoImc: body.antropometriaPesoImc,
                        frecuenciaCardiacaReposo: body.frecuenciaCardiacaReposo,
                        presionArterialSistolica: body.presionArterialSistolica,
                        presionArterialDiastolica: body.presionArterialDiastolica,
                        riesgoFramiPorcentaje: body.riesgoFramiPorcentaje,
                        riesgoFramiCalificacion: body.riesgoFramiCalificacion,
                        cabezaCuello: body.cabezaCuello,
                        cardioPulmonar: body.cardioPulmonar,
                        abdomen: body.abdomen,
                        osteoMuscular: body.osteoMuscular,
                        vascularPeriferico: body.vascularPeriferico,
                        pielAnexos: body.pielAnexos,
                        postura: body.postura,
                        flexibilidad: body.flexibilidad,
                        fuerza: body.fuerza,
                        diagnostico: body.diagnostico,
                        opinionPlan: body.opinionPlan,
                        cedulaDeportologo: body.cedulaDeportologo
                    });
                    //grabar el objeto usuario en la bd
                    evaluacionDeportiva.save((err, evaluacionDeportivaDB) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }
                        res.json({
                            estado: true,
                            codigo: '0000',
                            mensaje: 'Evaluación deportiva registrada exitosamente',
                            evaluacion: evaluacionDeportivaDB
                        });
                    });
                }
            });
        }
    });
});


app.get('/deportologo/obtenerevaluaciones/:iddeportologo', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {

    let iddeportologo = req.params.iddeportologo;

    var perPage = 10
    var page = req.query.page || 1;

    Usuario.findOne({ _id: iddeportologo }, function(err, usuarioDB) {
        if (!usuarioDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                mensaje: `No exite un usuario Deportologo registrado con el ID ingresado`
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
                ]).skip((perPage * page) - perPage)
                .limit(perPage)
                .exec((err, datosCompletosUsuarios) => {
                    if (datosCompletosUsuarios) {
                        Evaluaciondeportiva.estimatedDocumentCount({ deportologoId: iddeportologo }, (err, conteo) => {
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



app.get('/deportologo/obtenerevaluacion/:idevaluacion', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {

    let idevaluacion = req.params.idevaluacion;

    Evaluaciondeportiva.findOne({ _id: idevaluacion }, function(err, evaluacionDB) {
        if (!evaluacionDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                mensaje: `No exite una evaluación medica registrada con el ID ingresado`
            });
        } else {
            Evaluaciondeportiva.aggregate([{ "$addFields": { "evaluacionId": { "$toString": "$_id" } } }, {
                    $match: {
                        evaluacionId: idevaluacion
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
                        fecha: 1,
                        antecedenteDeporObservaciones: 1,
                        diagnostico: 1,
                        cedulaDeportologo: 1,
                        opinionPlan: 1,
                    }
                },
            ]).exec((err, datosUsuario) => {
                if (!datosUsuario) {
                    res.json({
                        estado: false,
                        codigo: '0404',
                        mensaje: 'No se encontraron datos de usuario para el ID de revision ingresado'
                    })
                } else {
                    res.json({
                        estado: true,
                        codigo: '0000',
                        mensaje: 'Datos obtenidos exitosamente',
                        datosUsuario: datosUsuario[0]
                    })
                }
            })
        }
    })
});




app.get('/deportologo/obtenerconsultas/fisioterapeutas', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {


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

                Datosfisioterapia.estimatedDocumentCount({}, (err, conteo) => {
                    let paginas = Math.ceil(conteo / perPage)
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
});




module.exports = app;