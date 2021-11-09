const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');


let rolesValidos = {
    values: ['ADMINISTRADOR_ROLE', 'ESTUDIANTE_ROLE', 'FISIOTERAPEUTA_ROLE', 'ENTRENADOR_ROLE', 'DEPORTOLOGO_ROLE', 'CONSULTOR_ROLE'],
    message: '{VALUE} no es un rol válido'
};


let Schema = mongoose.Schema;


let usuarioSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'El correo es necesario']
    },
    password: {
        type: String,
        required: [true, 'El password es obligatorio']
    },
    role: {
        type: String,
        required: [true, 'El rol es obligatorio'],
        enum: rolesValidos
    },
    foto: {
        type: String,
        default: 'SIN-ESTABLECER'
    },
    estado: {
        type: Boolean,
        default: true
    },
    verificado: {
        type: Boolean,
        default: false
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    }

});

//para no mostrar el campo password cuando imprimimos la respuesta del servidor
usuarioSchema.methods.toJSON = function() {

    let user = this;
    let userObject = user.toObject();
    delete userObject.password;
    delete userObject.passwordResetToken;
    delete userObject.passwordResetExpires;

    return userObject;
}


usuarioSchema.plugin(uniqueValidator, {
    message: '{PATH} debe de ser único'
});

module.exports = mongoose.model('Usuario', usuarioSchema);