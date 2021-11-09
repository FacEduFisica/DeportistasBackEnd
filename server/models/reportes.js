const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let reporteSchema = new Schema({
    nombreArchivo: {
        type: String,
        unique: true,
        required: true
    },
    usuarioId: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model('Reporte', reporteSchema);