const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let antecedentesValidos = {
    values: ['TRAUMÁTICOS', 'QUIRÚRGICOS', 'FARMACÓLOGICOS', 'PATÓLOGICOS', 'NINGUNO'],
    message: '{VALUE} no es un antecedente válido'
};



let datosFisioterapiaSchema = new Schema({
    fisioterapeutaId: {
        type: String,
        required: true
    },
    deportistaId: {
        type: String,
        required: true
    },
    nombres: {
        type: String,
        required: true
    },
    tipoDocumento: {
        type: String,
        required: true
    },
    numeroDocumento: {
        type: Number,
        required: true
    },
    sexo: {
        type: String,
        required: true
    },
    edad: {
        type: Number,
        required: true
    },
    talla: {
        type: String,
        required: true
    },
    peso: {
        type: Number,
        required: true
    },
    fechaNacimiento: {
        type: Date,
        required: true
    },
    celular: {
        type: Number,
        required: true
    },
    correo: {
        type: String,
        required: true
    },
    facultad: {
        type: String,
        required: true
    },
    programaAcademico: {
        type: String,
        required: true
    },
    semestre: {
        type: Number,
        required: true
    },
    eps: {
        type: String,
        required: true
    },
    disciplinaDeportiva: {
        type: String,
        required: true
    },
    diagnosticoMedico: {
        type: String,
        required: true
    },
    medicoRemite: {
        type: String,
        required: true
    },
    recomendacionMedica: {
        type: String,
        required: true
    },
    fechaIngreso: {
        type: Date,
        default: Date.now()
    },
    antecedentesPersonales: {
        type: String,
        required: true,
        enum: antecedentesValidos
    },
    antecedentesFamiliares: {
        type: String,
        required: true,
    },
    evaluacionInicial: {
        type: String,
        required: true
    },
    estadoPiel: {
        type: String,
        required: false
    },
    sensibilidad: {
        type: String,
        required: false
    },
    dolor: {
        type: String,
        required: false
    },
    arcosMovilidad: {
        type: String,
        required: false
    },
    fuerzaMuscular: {
        type: String,
        required: false
    },
    flexibilidad: {
        type: String,
        required: false
    },
    pruebasSimiologicas: {
        type: String,
        required: false
    },
    posturaMarcha: {
        type: String,
        required: true
    },
    observaciones: {
        type: String,
        required: true
    },
    planTratamiento: {
        type: String,
        required: true
    },
    cedulaFisioterapeuta: {
        type: String,
        required: true
    }

});


module.exports = mongoose.model('Datosfisioterapia', datosFisioterapiaSchema);