const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let generosValidos = {
    values: ['MASCULINO', 'FEMENINO'],
    message: '{VALUE} no es un genero válido'
};

let disciplinaEntrenadoresSchema = new Schema({
    entrenadorId: {
        type: String,
        unique: true,
        required: true
    },
    nombreDisciplina: {
        type: String,
        required: true
    },
    generoDisciplina: {
        type: String,
        required: true,
        enum: generosValidos
    }
});

module.exports = mongoose.model('Disciplinaentrenadores', disciplinaEntrenadoresSchema);