const jwt = require('jsonwebtoken');
const _ = require('underscore');

const TokenDesconexion = require('../models/desconexion');

// ===================================
// Verificar Token
// ===================================
let verificarToken = (req, res, next) => {
    // obtenemos el header en este caso token
    let token = req.get('token');

    jwt.verify(token, process.env.SEED, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                err: {
                    message: 'Token no válido'
                }
            });
        }
        req.usuario = decoded.usuario;
        next();
    });

};

// ===================================
// Verificar Token de conexión
// ===================================
let verificarTokenDesconexion = (req, res, next) => {
    // obtenemos el header en este caso token
    let token = req.query.token;
    let usuario = req.usuario;

    TokenDesconexion.findOne({ _userId: usuario._id }, function(error, tokenDesconexion) {
        if (error) {
            return res.status(400).json({
                ok: false,
                error
            });
        }

        if (tokenDesconexion.estadoToken == token) {
            next();

        } else {
            return res.json({
                estado: false,
                codigo: '9999',
                err: {
                    mensaje: 'Debe de iniciar sesión para continuar'
                }
            });
        }
    });
};


// ===================================
// Verificar AdminRole
// ===================================
let verificaAdmin_Role = (req, res, next) => {

    let usuario = req.usuario;

    if (usuario.role === 'ADMINISTRADOR_ROLE') {
        next();
    } else {
        return res.json({
            estado: false,
            codigo: '9999',
            mensaje: 'El usuario no es administrador'

        });
    }
};


// ===================================
// Verificar DeportologoRole
// ===================================
let verificarDeportologo_Role = (req, res, next) => {

    let usuario = req.usuario;

    if (usuario.role === 'DEPORTOLOGO_ROLE' || usuario.role === 'ADMINISTRADOR_ROLE') {
        next();
    } else {
        return res.json({
            estado: false,
            codigo: '9998',
            mensaje: 'El usuario no es Deportologo'
        });
    }
};

// ===================================
// Verificar FisioterapeutaRole
// ===================================
let verificarFisioterapeuta_Role = (req, res, next) => {

    let usuario = req.usuario;

    if (usuario.role === 'FISIOTERAPEUTA_ROLE' || usuario.role === 'ADMINISTRADOR_ROLE') {
        next();
    } else {
        return res.json({
            estado: false,
            codigo: '9997',
            mensaje: 'El usuario no es Fisioterapeuta'
        });
    }
};

// ===================================
// Verificar ConsultorRole
// ===================================
let verificarConsultor_Role = (req, res, next) => {

    let usuario = req.usuario;

    if (usuario.role === 'CONSULTOR_ROLE' || usuario.role === 'ADMINISTRADOR_ROLE') {
        next();
    } else {
        return res.json({
            estado: false,
            codigo: '9997',
            mensaje: 'El usuario no es Consultor'
        });
    }
};

// ===================================
// Verificar EstudianteRole
// ===================================
let verificarEstudiante_Role = (req, res, next) => {

    let usuario = req.usuario;

    if (usuario.role === 'ESTUDIANTE_ROL' || usuario.role === 'ADMINISTRADOR_ROLE') {
        next();
    } else {
        return res.json({
            estado: false,
            codigo: '9997',
            mensaje: 'El usuario no es Consultor'
        });
    }
};



// ===================================
// Verificar Token por URL
// ===================================
let verificarTokenUrl = (req, res, next) => {

    let token = req.query.token;

    jwt.verify(token, process.env.SEED, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                estado: false,
                codigo: '9990',
                err: {
                    mensaje: 'El token ya expiró, debe de iniciar sesión nuevamente.'
                }
            });
        }
        req.usuario = decoded.usuario;
        next();
    });
}


// ===================================
// Verificar Token por URL
// ===================================
let verificarEstadoTokenUrl = (req, res, next) => {

    let token = req.query.token;

    jwt.verify(token, process.env.SEED, (err, decoded) => {
        if (err) {
            return res.status(200).json({
                estado: false,
                codigo: '9990',
                err: {
                    mensaje: 'El token ya expiró, debe de iniciar sesión nuevamente.'
                }
            });
        }
        req.usuario = decoded.usuario;
        next();
    });

}



module.exports = {
    verificarToken,
    verificaAdmin_Role,
    verificarTokenDesconexion,
    verificarTokenUrl,
    verificarConsultor_Role,
    verificarEstudiante_Role,
    verificarFisioterapeuta_Role,
    verificarDeportologo_Role,
    verificarEstadoTokenUrl
}