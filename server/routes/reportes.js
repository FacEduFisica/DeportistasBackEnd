const express = require('express');
const _ = require('underscore');
const bodyParser = require('body-parser');

const fs = require('fs');
const xl = require('excel4node');

const Reporte = require('../models/reportes');
const Datosdeportivos = require('../models/datosdeportivos');
const Evaluaciondeportiva = require('../models/datoshistoriaclinica');
const Datosfisioterapia = require('../models/datosfisioterapia');
const Usuario = require('../models/usuario');
const Disciplinaentrenadores = require('../models/disciplinaentrenadores');

const path = require('path');

const app = express();

const { verificarTokenDesconexion, verificarTokenUrl, verificarDeportologo_Role, verificarFisioterapeuta_Role, verificarConsultor_Role } = require('../middlewares/autenticacion');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())



app.get('/generarreporte/general/:id', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {
    let id = req.params.id;

    const fechaActual = new Date();

    const milisegundos = fechaActual.getMilliseconds()
    const nombreArchivo = `Reporte_Consultor_${id}_${milisegundos}.xlsx`;

    Usuario.aggregate([{ "$addFields": { "userId": { "$toString": "$_id" } } },
        {
            $match: {
                estado: true
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
                from: 'datospersonales',
                localField: 'datosdeportivosUsuario.usuarioId',
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
                from: 'datosinstitucionales',
                localField: 'datospersonalesUsuario.usuarioId',
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
                from: 'datosresidencias',
                localField: 'datospersonalesUsuario.usuarioId',
                foreignField: 'usuarioId',
                as: 'datosresidenciaUsuario'
            }
        },
        {
            $unwind: {
                path: "$datosresidenciaUsuario",
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $project: {
                tipoDocumento: "$datospersonalesUsuario.tipoDocumento",
                numeroDocumento: "$datospersonalesUsuario.numeroDocumento",
                nombres: "$datospersonalesUsuario.nombres",
                primerApellido: "$datospersonalesUsuario.primerApellido",
                segundoApellido: "$datospersonalesUsuario.segundoApellido",
                fechaNacimiento: "$datospersonalesUsuario.fechaNacimiento",
                fechaInscripcion: "$datosdeportivosUsuario.fechaInscripcion",
                disciplinaDeportiva: "$datosdeportivosUsuario.disciplinaDeportiva",
                genero: "$datospersonalesUsuario.sexo",
                telefonoFijo: "$datosresidenciaUsuario.telefono",
                celular: "$datosresidenciaUsuario.celular",
                direccion: "$datosresidenciaUsuario.direccion",
                barrio: "$datosresidenciaUsuario.barrio",
                estrato: "$datosresidenciaUsuario.estrato",
                correo: "$email",
                etnia: "$datospersonalesUsuario.etnia",
                desplazado: "$datospersonalesUsuario.desplazado",
                discapacidad: "$datospersonalesUsuario.discapacidad",
                tipoDiscapacidad: "$datospersonalesUsuario.tipoDiscapacidad",
                carrera: "$datosinstitucionalesUsuario.programaAcademico",
                anioIngreso: "$datosinstitucionalesUsuario.anioIngreso",
                semestreActual: "$datosinstitucionalesUsuario.semestreActual",
                seguridadSocial: "$datospersonalesUsuario.eps",
                peso: "$datospersonalesUsuario.peso",
                talla: "$datospersonalesUsuario.talla",
                grupoSanguineo: "$datospersonalesUsuario.grupoSanguineo",
                trabaja: "$datospersonalesUsuario.trabaja",
                cabezaHogar: "$datospersonalesUsuario.cabezaHogar",
                nivelDeportivo: "$datosdeportivosUsuario.nivelDeportivo",
            }
        },
    ]).exec((err, datosCompletosUsuarios) => {
        if (datosCompletosUsuarios) {
            // console.log(result);

            const wb = new xl.Workbook();
            const ws = wb.addWorksheet('Data', {
                disableRowSpansOptimization: true,
            });

            // Create a reusable style
            const style = wb.createStyle({
                alignment: {

                    wrapText: true,
                    vertical: ['center'],
                    horizontal: ['left']
                },
                font: {
                    color: '000000',
                    size: 12
                },
                border: {
                    bottom: {
                        style: 'thin',
                        color: '000000'
                    },
                    right: {
                        style: 'thin',
                        color: '000000'
                    },
                    left: {
                        style: 'thin',
                        color: '000000'
                    },
                    top: {
                        style: 'thin',
                        color: '000000'
                    }
                }
            });

            // Create a reusable style
            const styleTitulos = wb.createStyle({
                alignment: {
                    shrinkToFit: true,
                    wrapText: true,
                    vertical: ['center'],
                    horizontal: ['center']
                },
                font: {
                    bold: true, //negrilla
                    color: '000000',
                    size: 12
                },
                border: {
                    bottom: {
                        style: 'thin',
                        color: '000000'
                    },
                    right: {
                        style: 'thin',
                        color: '000000'
                    },
                    left: {
                        style: 'thin',
                        color: '000000'
                    },
                    top: {
                        style: 'thin',
                        color: '000000'
                    }
                }
            });


            ws.cell(1, 1).string('N°').style(styleTitulos);
            ws.cell(1, 2).string('TIPO DOCUMENTO').style(styleTitulos);
            ws.cell(1, 3).string('NÚMERO DOCUMENTO').style(styleTitulos);
            ws.cell(1, 4).string('NOMBRES').style(styleTitulos);
            ws.cell(1, 5).string('PRIMER APELLIDO').style(styleTitulos);
            ws.cell(1, 6).string('SEGUNDO APELLIDO').style(styleTitulos);
            ws.cell(1, 7).string('FECHA NACIMIENTO').style(styleTitulos);
            ws.cell(1, 8).string('FECHA DE INSCRIPCIÓN').style(styleTitulos);
            ws.cell(1, 9).string('DISCIPLINA DEPORTIVA').style(styleTitulos);
            ws.cell(1, 10).string('GENERO').style(styleTitulos);
            ws.cell(1, 11).string('TELEFONO FIJO').style(styleTitulos);
            ws.cell(1, 12).string('CELULAR').style(styleTitulos);
            ws.cell(1, 13).string('DIRECCIÓN').style(styleTitulos);
            ws.cell(1, 14).string('BARRIO / VEREDA').style(styleTitulos);
            ws.cell(1, 15).string('ESTRATO').style(styleTitulos);
            ws.cell(1, 16).string('E-MAIL').style(styleTitulos);
            ws.cell(1, 17).string('ETNIA').style(styleTitulos);
            ws.cell(1, 18).string('DESPLAZADO').style(styleTitulos);
            ws.cell(1, 19).string('DISCAPACIDAD').style(styleTitulos);
            ws.cell(1, 20).string('TIPO DE DISCAPACIDAD').style(styleTitulos);
            ws.cell(1, 21).string('CARRERA').style(styleTitulos);
            ws.cell(1, 22).string('AÑO INGRESO').style(styleTitulos);
            ws.cell(1, 23).string('SEMESTRE EN CURSO').style(styleTitulos);
            ws.cell(1, 24).string('SEGURIDAD SOCIAL').style(styleTitulos);
            ws.cell(1, 25).string('PESO').style(styleTitulos);
            ws.cell(1, 26).string('TALLA').style(styleTitulos);
            ws.cell(1, 27).string('TIPO DE SANGRE').style(styleTitulos);
            ws.cell(1, 28).string('TRABAJA').style(styleTitulos);
            ws.cell(1, 29).string('CABEZA DE HOGAR').style(styleTitulos);

            const startRow = 2;
            if (datosCompletosUsuarios.length) {
                datosCompletosUsuarios.forEach((item, i) => {

                    const currentRow = i + startRow;
                    const newtarget = 'newtarget';
                    const newprogress = 'newprogress';

                    ws.cell(currentRow, 1).number(i + 1).style(style);
                    ws.cell(currentRow, 2).string(item.tipoDocumento).style(style);
                    ws.cell(currentRow, 3).number(item.numeroDocumento).style(style);
                    ws.cell(currentRow, 4).string(item.nombres).style(style);
                    ws.cell(currentRow, 5).string(item.primerApellido).style(style);
                    ws.cell(currentRow, 6).string(item.segundoApellido).style(style);
                    ws.cell(currentRow, 7).date(item.fechaNacimiento).style(style);
                    ws.cell(currentRow, 8).date(item.fechaInscripcion).style(style);
                    ws.cell(currentRow, 9).string(item.disciplinaDeportiva).style(style);
                    ws.cell(currentRow, 10).string(item.genero).style(style);
                    ws.cell(currentRow, 11).number(item.telefonoFijo).style(style);
                    ws.cell(currentRow, 12).number(item.celular).style(style);
                    ws.cell(currentRow, 13).string(item.direccion).style(style);
                    ws.cell(currentRow, 14).string(item.barrio).style(style);
                    ws.cell(currentRow, 15).number(item.estrato).style(style);
                    ws.cell(currentRow, 16).string(item.correo).style(style);
                    ws.cell(currentRow, 17).string(item.etnia).style(style);
                    ws.cell(currentRow, 18).string(item.desplazado).style(style);
                    ws.cell(currentRow, 19).string(item.discapacidad).style(style);
                    ws.cell(currentRow, 20).string(item.tipoDiscapacidad).style(style);
                    ws.cell(currentRow, 21).string(item.carrera).style(style);
                    ws.cell(currentRow, 22).string(item.anioIngreso).style(style);
                    ws.cell(currentRow, 23).number(item.semestreActual).style(style);
                    ws.cell(currentRow, 24).string(item.seguridadSocial).style(style);
                    ws.cell(currentRow, 25).number(item.peso).style(style);
                    ws.cell(currentRow, 26).number(item.talla).style(style);
                    ws.cell(currentRow, 27).string(item.grupoSanguineo).style(style);
                    ws.cell(currentRow, 28).string(item.trabaja).style(style);
                    ws.cell(currentRow, 29).string(item.cabezaHogar).style(style);

                });
                ws.column(1).setWidth(3);
                ws.column(2).setWidth(12);
                ws.column(3).setWidth(15);
                ws.column(4).setWidth(19);
                ws.column(5).setWidth(14);
                ws.column(6).setWidth(14);
                ws.column(7).setWidth(12);
                ws.column(8).setWidth(12);
                ws.column(12).setWidth(13);
                ws.column(13).setWidth(22);
                ws.column(16).setWidth(25);
                ws.column(18).setWidth(13);
                ws.column(19).setWidth(14);
                ws.column(20).setWidth(14);
                ws.column(21).setWidth(16);

                wb.write(`reportes/${nombreArchivo}`);
            }


            const reporte = new Reporte({
                usuarioId: id,
                nombreArchivo
            });
            // Guardamos el token de confirmacion
            reporte.save(function(err) {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'No se guardo el reporte en el historico'
                        }
                    });
                }
            });


            res.json({
                estado: true,
                codigo: '0000',
                mensaje: 'Reporte generado exitosamente.',
                nombreArchivo
            })
        }
    });

});



app.get('/generarreporte/deportologo/:id', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {
    let id = req.params.id;

    const fechaActual = new Date();

    const milisegundos = fechaActual.getMilliseconds()
    const nombreArchivo = `Reporte_Deportologo_${id}_${milisegundos}.xlsx`;

    Evaluaciondeportiva.aggregate([{
            $match: {
                deportologoId: id
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
            $lookup: {
                from: 'datosinstitucionales',
                localField: 'datospersonalesUsuario.usuarioId',
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
                from: 'datosresidencias',
                localField: 'datospersonalesUsuario.usuarioId',
                foreignField: 'usuarioId',
                as: 'datosresidenciaUsuario'
            }
        },
        {
            $unwind: {
                path: "$datosresidenciaUsuario",
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $lookup: {
                from: 'datosdeportivos',
                localField: 'datospersonalesUsuario.usuarioId',
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
            $project: {
                nombres: "$datospersonalesUsuario.nombres",
                primerApellido: "$datospersonalesUsuario.primerApellido",
                segundoApellido: "$datospersonalesUsuario.segundoApellido",
                fecha: 1,
                edad: "$datospersonalesUsuario.edad",
                disciplinaDeportiva: "$datosdeportivosUsuario.disciplinaDeportiva",
                tipoDocumento: "$datospersonalesUsuario.tipoDocumento",
                numeroDocumento: "$datospersonalesUsuario.numeroDocumento",
                facultad: "$datosinstitucionalesUsuario.facultad",
                programaAcademico: "$datosinstitucionalesUsuario.programaAcademico",
                diagnostico: 1,
                cedulaDeportologo: 1
            }
        },



    ]).exec((err, datosCompletosUsuarios) => {
        if (datosCompletosUsuarios) {

            const wb = new xl.Workbook();
            const ws = wb.addWorksheet('Data', {
                disableRowSpansOptimization: true,
            });

            // Create a reusable style
            const style = wb.createStyle({
                alignment: {
                    vertical: ['center'],
                    horizontal: ['left']
                },
                font: {
                    color: '000000',
                    size: 12
                },
                border: {
                    bottom: {
                        style: 'thin',
                        color: '000000'
                    },
                    right: {
                        style: 'thin',
                        color: '000000'
                    },
                    left: {
                        style: 'thin',
                        color: '000000'
                    },
                    top: {
                        style: 'thin',
                        color: '000000'
                    }
                }
            });

            const styleCabezera = wb.createStyle({
                alignment: {
                    shrinkToFit: true,
                    wrapText: true,
                    horizontal: 'center',
                    vertical: 'center',

                },
                font: {
                    bold: true, //negrilla
                    color: '000000',
                    size: 12
                },


            });

            // Create a reusable style
            const styleTitulos = wb.createStyle({
                alignment: {
                    shrinkToFit: true,
                    wrapText: true,
                    vertical: ['center'],
                    horizontal: ['center']
                },
                font: {
                    bold: true, //negrilla
                    color: '000000',
                    size: 12
                },
                border: {
                    bottom: {
                        style: 'thin',
                        color: '000000'
                    },
                    right: {
                        style: 'thin',
                        color: '000000'
                    },
                    left: {
                        style: 'thin',
                        color: '000000'
                    },
                    top: {
                        style: 'thin',
                        color: '000000'
                    }
                }
            });


            ws.cell(2, 1).string(' ').style(styleTitulos);
            ws.cell(2, 2).string('NOMBRE').style(styleTitulos);
            ws.cell(2, 3).string('FECHA').style(styleTitulos);
            ws.cell(2, 4).string('EDAD').style(styleTitulos);
            ws.cell(2, 5).string('DEPORTE').style(styleTitulos);
            ws.cell(2, 6).string('TIPO DOCUMENTO').style(styleTitulos);
            ws.cell(2, 7).string('NUMERO DOCUMENTO').style(styleTitulos);
            ws.cell(2, 8).string('FACULTAD').style(styleTitulos);
            ws.cell(2, 9).string('PROGRAMA').style(styleTitulos);
            ws.cell(2, 10).string('DIAGNOSTICO').style(styleTitulos);

            if (datosCompletosUsuarios[0] == null) {
                return res.json({
                    estado: true,
                    codigo: '0404',
                    mensaje: 'No se encontro un deportologo con el ID ingresado'
                })
            }
            let cedulaDeportologo = datosCompletosUsuarios[0].cedulaDeportologo;

            const startRow = 3;
            const numeroRegistros = datosCompletosUsuarios.length;
            if (datosCompletosUsuarios.length) {
                datosCompletosUsuarios.forEach((item, i) => {

                    const currentRow = i + startRow;
                    const newtarget = 'newtarget';
                    const newprogress = 'newprogress';

                    ws.cell(currentRow, 1).number(i + 1).style(style);
                    ws.cell(currentRow, 2).string(`${item.nombres} ${item.primerApellido} ${item.segundoApellido}`).style(style);
                    ws.cell(currentRow, 3).date(item.fecha).style(style);
                    ws.cell(currentRow, 4).number(item.edad).style(style);
                    ws.cell(currentRow, 5).string(item.disciplinaDeportiva).style(style);
                    ws.cell(currentRow, 6).string(item.tipoDocumento).style(style);
                    ws.cell(currentRow, 7).number(item.numeroDocumento).style(style)
                    ws.cell(currentRow, 8).string(item.facultad).style(style);
                    ws.cell(currentRow, 9).string(item.programaAcademico).style(style);
                    ws.cell(currentRow, 10).string(item.diagnostico).style(style);
                });
                ws.cell(1, 1, 1, 9, true)
                    .string(
                        `PACIENTES ATENDIDOS POR MEDICO DEPORTOLOGO PROGRAMA DE LESIONES DEPORTIVAS POLITECNICO COLOMBIANO JAIME ISAZA CADAVID                                                                                          NRO DOCUMENTO DEPORTOLOGO: ${cedulaDeportologo}`)
                    .style(styleCabezera);
                ws.row(1).setHeight(70);

                ws.cell(numeroRegistros + 3, 1, numeroRegistros + 3, 9, true)
                    .string(
                        `NUMERO DE REVISIONES MEDICAS REALIZADAS: ${numeroRegistros}`)
                    .style(styleCabezera);
                ws.row(numeroRegistros + 3).setHeight(70);


                ws.column(1).setWidth(3);
                ws.column(2).setWidth(25);
                ws.column(3).setWidth(13);
                ws.column(4).setWidth(12);
                ws.column(5).setWidth(15);
                ws.column(6).setWidth(13);
                ws.column(7).setWidth(13);
                ws.column(8).setWidth(15);
                ws.column(9).setWidth(20);
                ws.column(10).setWidth(80);
                ws.row(2).setHeight(30);


                wb.write(`reportes/${nombreArchivo}`);
            }

            const reporte = new Reporte({
                usuarioId: id,
                nombreArchivo
            });
            // Guardamos el token de confirmacion
            reporte.save(function(err) {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'No se guardo el reporte en el historico'
                        }
                    });
                }
            });
            res.json({
                estado: true,
                codigo: '0000',
                mensaje: 'Reporte generado exitosamente',
                nombreArchivo
            })
        }
    });
});

app.get('/generarreporte/fisioterapeuta/:id', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {
    let id = req.params.id;

    const fechaActual = new Date();
    const milisegundos = fechaActual.getMilliseconds()
    const nombreArchivo = `Reporte_Fisioterapia_${id}_${milisegundos}.xlsx`;

    Datosfisioterapia.aggregate([{
            $match: {
                fisioterapeutaId: id
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
            $lookup: {
                from: 'datosinstitucionales',
                localField: 'datospersonalesUsuario.usuarioId',
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
                from: 'datosresidencias',
                localField: 'datospersonalesUsuario.usuarioId',
                foreignField: 'usuarioId',
                as: 'datosresidenciaUsuario'
            }
        },
        {
            $unwind: {
                path: "$datosresidenciaUsuario",
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $lookup: {
                from: 'datosdeportivos',
                localField: 'datospersonalesUsuario.usuarioId',
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
            $project: {
                nombres: "$datospersonalesUsuario.nombres",
                primerApellido: "$datospersonalesUsuario.primerApellido",
                segundoApellido: "$datospersonalesUsuario.segundoApellido",
                fechaIngreso: 1,
                edad: "$datospersonalesUsuario.edad",
                disciplinaDeportiva: "$datosdeportivosUsuario.disciplinaDeportiva",
                tipoDocumento: "$datospersonalesUsuario.segundoApellido",
                numeroDocumento: "$datospersonalesUsuario.numeroDocumento",
                facultad: "$datosinstitucionalesUsuario.facultad",
                programaAcademico: "$datosinstitucionalesUsuario.programaAcademico",
                planTratamiento: 1,
                cedulaFisioterapeuta: 1
            }
        },



    ]).exec((err, datosCompletosUsuarios) => {
        if (!datosCompletosUsuarios < 1) {
            // console.log(result);

            const wb = new xl.Workbook();
            const ws = wb.addWorksheet('Data', {
                disableRowSpansOptimization: true,
            });

            // Create a reusable style
            const style = wb.createStyle({
                alignment: {
                    vertical: ['center'],
                    horizontal: ['left']
                },
                font: {
                    color: '000000',
                    size: 12
                },
                border: {
                    bottom: {
                        style: 'thin',
                        color: '000000'
                    },
                    right: {
                        style: 'thin',
                        color: '000000'
                    },
                    left: {
                        style: 'thin',
                        color: '000000'
                    },
                    top: {
                        style: 'thin',
                        color: '000000'
                    }
                }
            });

            const styleCabezera = wb.createStyle({
                alignment: {
                    shrinkToFit: true,
                    wrapText: true,
                    horizontal: 'center',
                    vertical: 'center',

                },
                font: {
                    bold: true, //negrilla
                    color: '000000',
                    size: 12
                },


            });

            // Create a reusable style
            const styleTitulos = wb.createStyle({
                alignment: {
                    shrinkToFit: true,
                    wrapText: true,
                    vertical: ['center'],
                    horizontal: ['center']
                },
                font: {
                    bold: true, //negrilla
                    color: '000000',
                    size: 12
                },
                border: {
                    bottom: {
                        style: 'thin',
                        color: '000000'
                    },
                    right: {
                        style: 'thin',
                        color: '000000'
                    },
                    left: {
                        style: 'thin',
                        color: '000000'
                    },
                    top: {
                        style: 'thin',
                        color: '000000'
                    }
                }
            });



            ws.cell(2, 1).string(' ').style(styleTitulos);
            ws.cell(2, 2).string('NOMBRE').style(styleTitulos);
            ws.cell(2, 3).string('FECHA').style(styleTitulos);
            ws.cell(2, 4).string('EDAD').style(styleTitulos);
            ws.cell(2, 5).string('DEPORTE').style(styleTitulos);
            ws.cell(2, 6).string('TIPO DOCUMENTO').style(styleTitulos);
            ws.cell(2, 7).string('NUMERO DOCUMENTO').style(styleTitulos);
            ws.cell(2, 8).string('FACULTAD').style(styleTitulos);
            ws.cell(2, 9).string('PROGRAMA').style(styleTitulos);
            ws.cell(2, 10).string('PLAN TRATAMIENTO').style(styleTitulos);


            let cedulaFisioterapeuta = datosCompletosUsuarios[0].cedulaFisioterapeuta;

            const startRow = 3;
            const numeroRegistros = datosCompletosUsuarios.length;
            if (datosCompletosUsuarios.length) {
                datosCompletosUsuarios.forEach((item, i) => {

                    const currentRow = i + startRow;
                    const newtarget = 'newtarget';
                    const newprogress = 'newprogress';

                    ws.cell(currentRow, 1).number(i + 1).style(style);
                    ws.cell(currentRow, 2).string(`${item.nombres} ${item.primerApellido} ${item.segundoApellido}`).style(style);
                    ws.cell(currentRow, 3).date(item.fechaIngreso).style(style);
                    ws.cell(currentRow, 4).number(item.edad).style(style);
                    ws.cell(currentRow, 5).string(item.disciplinaDeportiva).style(style);
                    ws.cell(currentRow, 6).string(item.tipoDocumento).style(style);
                    ws.cell(currentRow, 7).number(item.numeroDocumento).style(style)
                    ws.cell(currentRow, 8).string(item.facultad).style(style);
                    ws.cell(currentRow, 9).string(item.programaAcademico).style(style);
                    ws.cell(currentRow, 10).string(item.planTratamiento).style(style);
                });

                ws.cell(1, 1, 1, 9, true)
                    .string(
                        `PACIENTES ATENDIDOS POR FISIOTERAPEUTA PROGRAMA DE LESIONES DEPORTIVAS POLITECNICO COLOMBIANO JAIME ISAZA CADAVID                                                                                          NRO DOCUMENTO FISIOTERAPEUTA: ${cedulaFisioterapeuta}`
                    ).style(styleCabezera);
                ws.row(1).setHeight(70);

                ws.cell(numeroRegistros + 3, 1, numeroRegistros + 3, 9, true).string(`NUMERO DE CONSULTAS REALIZADAS: ${numeroRegistros}`)
                    .style(styleCabezera);
                ws.row(numeroRegistros + 3).setHeight(70);


                ws.column(1).setWidth(3);
                ws.column(2).setWidth(25);
                ws.column(3).setWidth(13);
                ws.column(4).setWidth(12);
                ws.column(5).setWidth(15);
                ws.column(6).setWidth(13);
                ws.column(7).setWidth(13);
                ws.column(8).setWidth(15);
                ws.column(9).setWidth(20);
                ws.column(10).setWidth(80);
                ws.row(2).setHeight(30);


                wb.write(`reportes/${nombreArchivo}`);
            }

            const reporte = new Reporte({
                usuarioId: id,
                nombreArchivo
            });
            reporte.save(function(err) {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'No se guardo el reporte en el historico'
                        }
                    });
                }
            });
            res.json({
                estado: true,
                codigo: '0000',
                mensaje: 'Reporte generado exitosamente',
                nombreArchivo
            })
        }
    });
});


app.get('/generarplanilla/entrenador/:id', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {
    let id = req.params.id;
    const fechaActual = new Date();

    const milisegundos = fechaActual.getMilliseconds()
    const nombreArchivo = `Planilla_ASCUN_2020_${id}_${milisegundos}.xlsx`;

    Disciplinaentrenadores.findOne({ entrenadorId: id }, function(err, disciplinaEntrenadorDB) {
        if (!disciplinaEntrenadorDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    mensaje: `El Entrenador con id ${id} no tiene una disciplina asociada`
                }
            });
        } else {
            const disciplina = disciplinaEntrenadorDB.nombreDisciplina;
            const genero = disciplinaEntrenadorDB.generoDisciplina;

            Usuario.aggregate([{ "$addFields": { "userId": { "$toString": "$_id" } } },
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
                        "datosdeportivosUsuario.genero": genero,
                        "datosdeportivosUsuario.disciplinaDeportiva": disciplina
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
                        from: 'datosinstitucionales',
                        localField: 'datospersonalesUsuario.usuarioId',
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
                        from: 'datosresidencias',
                        localField: 'datospersonalesUsuario.usuarioId',
                        foreignField: 'usuarioId',
                        as: 'datosresidenciaUsuario'
                    }
                },
                {
                    $unwind: {
                        path: "$datosresidenciaUsuario",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $project: {
                        nombres: "$datospersonalesUsuario.nombres",
                        primerApellido: "$datospersonalesUsuario.primerApellido",
                        segundoApellido: "$datospersonalesUsuario.segundoApellido",
                        numeroDocumento: "$datospersonalesUsuario.numeroDocumento",
                        correo: "$email",
                        estado: 1,
                        carrera: "$datosinstitucionalesUsuario.programaAcademico",
                        promedio: "$datosinstitucionalesUsuario.promedioAcumulado",
                        semestre: "$datosinstitucionalesUsuario.semestreActual",
                        tipoEstudio: "$datosinstitucionalesUsuario.tipoEstudio",
                    }
                },
            ]).exec((err, datosCompletosUsuarios) => {
                if (datosCompletosUsuarios) {

                    const wb = new xl.Workbook();
                    const ws = wb.addWorksheet('Data', {
                        disableRowSpansOptimization: true,
                    });

                    // Create a reusable style
                    const style = wb.createStyle({
                        alignment: {
                            vertical: ['center'],
                            horizontal: ['left']
                        },
                        font: {
                            color: '000000',
                            size: 12
                        },
                        border: {
                            bottom: {
                                style: 'thin',
                                color: '000000'
                            },
                            right: {
                                style: 'thin',
                                color: '000000'
                            },
                            left: {
                                style: 'thin',
                                color: '000000'
                            },
                            top: {
                                style: 'thin',
                                color: '000000'
                            }
                        }
                    });

                    const styleCabezera = wb.createStyle({
                        alignment: {
                            shrinkToFit: true,
                            wrapText: true,
                            horizontal: 'center',
                            vertical: 'center',

                        },
                        font: {
                            bold: true, //negrilla
                            color: 'ffffff',
                            size: 12
                        },
                        fill: {
                            type: 'pattern', // the only one implemented so far.
                            patternType: 'solid', // most common.
                            fgColor: '000080', // you can add two extra characters to serve as alpha, i.e. '2172d7aa'.
                        }
                    });

                    // Create a reusable style
                    const styleTitulos = wb.createStyle({
                        alignment: {
                            shrinkToFit: true,
                            wrapText: true,
                            vertical: ['center'],
                            horizontal: ['center']
                        },
                        font: {
                            bold: false, //negrilla
                            color: 'ffffff',
                            size: 10
                        },
                        border: {
                            bottom: {
                                style: 'thin',
                                color: 'ffffff'
                            },
                            right: {
                                style: 'thin',
                                color: 'ffffff'
                            },
                            left: {
                                style: 'thin',
                                color: 'ffffff'
                            },
                            top: {
                                style: 'thin',
                                color: 'ffffff'
                            }
                        },
                        fill: {
                            type: 'pattern', // the only one implemented so far.
                            patternType: 'solid', // most common.
                            fgColor: '000080', // you can add two extra characters to serve as alpha, i.e. '2172d7aa'.
                        }
                    });
                    const styleCenter = wb.createStyle({
                        alignment: {
                            vertical: ['center'],
                            horizontal: ['center']
                        },
                        font: {
                            color: '000000',
                            size: 12
                        },
                        border: {
                            bottom: {
                                style: 'thin',
                                color: '000000'
                            },
                            right: {
                                style: 'thin',
                                color: '000000'
                            },
                            left: {
                                style: 'thin',
                                color: '000000'
                            },
                            top: {
                                style: 'thin',
                                color: '000000'
                            }
                        }
                    });

                    ws.cell(2, 1).string('Código').style(styleTitulos);
                    ws.cell(2, 2).string('Nombre').style(styleTitulos);
                    ws.cell(2, 3).string('Documento').style(styleTitulos);
                    ws.cell(2, 4).string('Email').style(styleTitulos);
                    ws.cell(2, 5).string('Estado').style(styleTitulos);
                    ws.cell(2, 6).string('Carrera').style(styleTitulos);
                    ws.cell(2, 7).string('Nivel de estudio').style(styleTitulos);
                    ws.cell(2, 8).string('Promedio Postgrado').style(styleTitulos);
                    ws.cell(2, 9).string('Promedio Pregrado').style(styleTitulos);
                    ws.cell(2, 10).string('Semestre Postgrado').style(styleTitulos);
                    ws.cell(2, 11).string('Semestre Pregrado').style(styleTitulos);
                    ws.cell(2, 12).string('Institución Educativa').style(styleTitulos);

                    const startRow = 3;
                    const numeroRegistros = datosCompletosUsuarios.length;
                    if (datosCompletosUsuarios.length) {
                        datosCompletosUsuarios.forEach((item, i) => {

                            const currentRow = i + startRow;
                            const newtarget = 'newtarget';
                            const newprogress = 'newprogress';

                            ws.cell(currentRow, 1).number(i + 1).style(styleCenter);
                            ws.cell(currentRow, 2).string(`${item.nombres} ${item.primerApellido} ${item.segundoApellido}`).style(style);
                            ws.cell(currentRow, 3).number(item.numeroDocumento).style(style);
                            ws.cell(currentRow, 4).string(item.correo).style(style);

                            if (item.estado) {
                                ws.cell(currentRow, 5).string('Activo').style(styleCenter);
                            } else {
                                ws.cell(currentRow, 5).string('Inactivo').style(styleCenter);
                            }

                            ws.cell(currentRow, 6).string(item.carrera).style(style)
                            ws.cell(currentRow, 7).number(item.semestre).style(styleCenter)

                            if (item.tipoEstudio == 'POSTGRADO') {
                                ws.cell(currentRow, 8).string(item.promedio).style(styleCenter);
                                ws.cell(currentRow, 9).string(' ').style(styleCenter);
                                ws.cell(currentRow, 10).string('X').style(styleCenter);
                                ws.cell(currentRow, 11).string(' ').style(styleCenter);
                            } else {
                                ws.cell(currentRow, 8).string(' ').style(styleCenter);
                                ws.cell(currentRow, 9).string(item.promedio).style(styleCenter);
                                ws.cell(currentRow, 10).string(' ').style(styleCenter);
                                ws.cell(currentRow, 11).string('X').style(styleCenter);
                            }
                            ws.cell(currentRow, 12).string('Politécnico Colombiano Jaime Isaza Cadavid').style(style);

                        });

                        ws.cell(1, 1, 1, 12, true).string(`PLANILLA ${disciplina} - ${genero}`).style(styleCabezera);
                        ws.row(1).setHeight(70);

                        /*  ws.cell(numeroRegistros + 5, 1, numeroRegistros + 5, 5, true).string(`PERSONAL DE APOYO`).style(styleCabezera);
                         ws.cell(numeroRegistros + 6, 1).string('No.').style(styleTitulos);
                         ws.cell(numeroRegistros + 6, 2).string('Nombre').style(styleTitulos);
                         ws.cell(numeroRegistros + 6, 3).string('Documento').style(styleTitulos);
                         ws.cell(numeroRegistros + 6, 4).string('Email').style(styleTitulos);
                         ws.cell(numeroRegistros + 6, 5).string('Rol').style(styleTitulos);

                         const registrosVacios = numeroRegistros + 7;
                         for (let i = 0; i < 5; i++) {
                             ws.cell(registrosVacios + i, 1).string(' ').style(style);
                             ws.cell(registrosVacios + i, 2).string(' ').style(style);
                             ws.cell(registrosVacios + i, 3).string(' ').style(style);
                             ws.cell(registrosVacios + i, 4).string(' ').style(style);
                             ws.cell(registrosVacios + i, 5).string(' ').style(style);
                         } */


                        ws.column(1).setWidth(7);
                        ws.column(2).setWidth(25);
                        ws.column(3).setWidth(13);
                        ws.column(4).setWidth(40);
                        ws.column(5).setWidth(13);
                        ws.column(6).setWidth(20);
                        ws.column(7).setWidth(9);
                        ws.column(8).setWidth(10);
                        ws.column(9).setWidth(10);
                        ws.column(10).setWidth(10);
                        ws.column(11).setWidth(10);
                        ws.column(12).setWidth(40);
                        ws.row(2).setHeight(30);


                        wb.write(`reportes/${nombreArchivo}`);
                    }

                    const reporte = new Reporte({
                        usuarioId: id,
                        nombreArchivo
                    });
                    // Guardamos el token de confirmacion
                    reporte.save(function(err) {
                        if (err) {
                            return res.status(400).json({
                                estado: false,
                                codigo: '0001',
                                err: {
                                    mensaje: 'No se guardo el reporte en el historico'
                                }
                            });
                        }
                    });
                    res.json({
                        estado: true,
                        codigo: '0000',
                        mensaje: 'Planilla ASCUN generada exitosamente',
                        usuariosAtendidos: datosCompletosUsuarios,
                        nombreArchivo
                    })
                }
            });
        }
    });
});


app.get('/descargarreporte/:nombre', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {
    let file = path.resolve(__dirname, `../../reportes/${ req.params.nombre }`);

    if (fs.existsSync(file)) {
        res.download(file);
    } else {
        return res.json({
            codigo: '0001',
            mensaje: 'Error, nombre de reporte no existe en el sistema'
        })
    }
});


app.get('/historicoreportes/:id', [verificarTokenUrl, verificarTokenDesconexion], (req, res) => {

    var perPage = 10
    var page = req.query.page || 1;

    let id = req.params.id;

    Reporte.find({ usuarioId: id }, 'nombreArchivo fecha')
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec((err, reportes) => {
            if (err) {
                return res.json({
                    estado: false,
                    codigo: '0202',
                    mensaje: 'Error de comunicación con el API'
                })
            }
            if (reportes.length < 1) {
                return res.json({
                    estado: false,
                    codigo: '0404',
                    mensaje: 'No se encontraron archivos generados por el usuario'
                })
            }
            let paginas = Math.ceil(reportes.length / perPage)
            res.json({
                estado: true,
                codigo: '0000',
                reportes,
                totalItems: reportes.length,
                pages: paginas

            })
        });
});





module.exports = app;