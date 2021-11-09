const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let valoresValidos = {
    values: ['SI', 'NO'],
    message: '{VALUE} no es un valor válido'
};


let Schema = mongoose.Schema;

let evaluacionDeportivaSchema = new Schema({
    deportistaId: {
        type: String,
        required: true
    },
    deportologoId: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    responsable: {
        type: String,
        required: true
    },
    telefonoResponsable: {
        type: Number,
        required: true
    },
    parentesco: {
        type: String,
        required: true
    },
    acompanante: {
        type: String,
        required: true
    },
    telefonoAcompanante: {
        type: Number,
        required: true
    },
    motivoConsulta: {
        type: String,
        required: true
    },
    sistemaCabezaCuello: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaOftalmologico: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaOtorrino: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaMaxilofacial: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaPulmonar: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaAbdomen: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaUrinario: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaMusculoEsqueletico: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaPiel: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaHematologico: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaMetabolico: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaNeurologico: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaVascular: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaOtros: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    sistemaObservaciones: {
        type: String,
        required: false
    },
    antecedenteCardioTabaquismo: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteCardioTabaquismoCantidad: {
        type: String,
        required: false,
        default: '0'
    },
    antecedenteCardioDislipidemia: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteCardioSedentario: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteCardioObesidad: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteCardioHipertension: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteCardioCoronaria: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteCardioSoplo: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteCardioArritmia: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteCardioDiabetes: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteCardioOtros: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteCardioObservaciones: {
        type: String,
        required: false
    },
    antecedenteDeporDesmayo: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteDeporProblemaEjercicio: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteDeporCardio: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteDeporPulmonar: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteDeporLesion: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteDeporOtros: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteDeporObservaciones: {
        type: String,
        required: false
    },
    antecedenteGralMedicamento: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteGralAlergia: {
        type: String,
        required: true,
        enum: valoresValidos
    },
    antecedenteFamiliares: {
        type: String,
        required: false
    },
    antecedenteGineco: {
        type: String,
        required: false
    },
    examenFisico: {
        type: String,
        required: false
    },
    antropometriaPeso: {
        type: Number,
        required: true
    },
    antropometriaTalla: {
        type: Number,
        required: true
    },
    antropometriaCalificacion: {
        type: Number,
        required: true
    },
    antropometriaImc: {
        type: Number,
        required: true
    },
    antropometriaPesoImc: {
        type: Number,
        required: true
    },
    frecuenciaCardiacaReposo: {
        type: String,
        required: true
    },
    presionArterialSistolica: {
        type: String,
        required: true
    },
    presionArterialDiastolica: {
        type: String,
        required: true
    },
    riesgoFramiPorcentaje: {
        type: String,
        required: false
    },
    riesgoFramiCalificacion: {
        type: String,
        required: false
    },
    cabezaCuello: {
        type: String,
        required: false
    },
    cardioPulmonar: {
        type: String,
        required: false
    },
    abdomen: {
        type: String,
        required: false
    },
    osteoMuscular: {
        type: String,
        required: false
    },
    vascularPeriferico: {
        type: String,
        required: false
    },
    pielAnexos: {
        type: String,
        required: false
    },
    postura: {
        type: String,
        required: false
    },
    flexibilidad: {
        type: String,
        required: false
    },
    fuerza: {
        type: String,
        required: false
    },
    diagnostico: {
        type: String,
        required: true
    },
    opinionPlan: {
        type: String,
        required: true
    },
    cedulaDeportologo: {
        type: Number,
        required: true
    }

});



evaluacionDeportivaSchema.plugin(uniqueValidator, {
    message: '{PATH} debe de ser único'
});

module.exports = mongoose.model('Evaluaciondeportiva', evaluacionDeportivaSchema);