const express = require('express');
const fileUpload = require('express-fileupload');
const aws = require('aws-sdk');

const Usuario = require('../models/usuario');

const app = express();

const fs = require('fs');
const path = require('path');

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

const s3 = new aws.S3({
    accessKeyId: "AKIA4PCMMUEKFUDMUC5Y",
    secretAccessKey: "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",
    region: "us-east-2"
});

const { verificarTokenDesconexion, verificarTokenUrl } = require('../middlewares/autenticacion');

app.post('/upload/user/imagen/:id', [verificarTokenUrl, verificarTokenDesconexion], function(req, res) {

    let id = req.params.id;

    if (!req.files) {
        return res.status(400)
            .json({
                estado: false,
                mensaje: 'No se ha seleccionado ningún archivo'
            });
    }

    let archivo = req.files.archivo;
    let nombreCortado = archivo.name.split('.');
    let extension = nombreCortado[nombreCortado.length - 1];

    //Extensiones permitidas
    let extensionesValidas = ['png', 'jpeg', 'jpg'];

    if (extensionesValidas.indexOf(extension) < 0) {
        return res.status(400).json({
            estado: false,
            mensaje: 'Las extensiones permitidas son ' + extensionesValidas.join(', ')
        })
    }

    let milliseconds = new Date().getMilliseconds();

    //cambiar nombre al archivo
    let nombreArchivo = `${id}-${milliseconds}.${extension}`;

    archivo.mv(`uploads/usuarios/${nombreArchivo}`, function(err) {
        if (err)
            return res.status(500).json({
                estado: false,
                err
            });

        imagenUsuario(id, res, nombreArchivo);

    });
});

app.post("/upload/user/imagen/amazon/:nombreArchivo", [verificarTokenUrl, verificarTokenDesconexion], function(req, res) {

    const nombreArchivo = req.params.nombreArchivo;

    var bitmap = fs.readFileSync(`uploads/usuarios/${nombreArchivo}`);

    // console.log(req.files.file);
    const params = {
        Bucket: 'sgdarpoli-imagenes',
        Key: nombreArchivo,
        ACL: 'public-read',
        ContentType: 'image/jpg',
        Body: bitmap
    };

    s3.putObject(params, function(err, data) {
        if (err) {
            console.log("Error: ", err);
        } else {
            res.json({
                estado: true,
                codigo: '0000',
                mensaje: 'Imagen agregada exitosamente en el repositorio de Amazon S3',
                linkImagen: nombreArchivo
            })
        }
    });
    borrarArchivo(nombreArchivo);
});



function imagenUsuario(id, res, nombreArchivo) {

    Usuario.findById(id, function(err, usuarioDB) {

        if (!usuarioDB) {
            borrarArchivo(nombreArchivo);
            return res.status(200).json({
                estado: false,
                codigo: '0002',
                err: {
                    mensaje: 'eL ID no pertenece a ningun usuario registrado'
                }
            });
        }
        if (err) {
            borrarArchivo(nombreArchivo);
            return res.status(400).json({
                estado: false,
                codigo: '0001',
                err
            });
        }
        borrarArchivo(usuarioDB.foto);

        usuarioDB.foto = nombreArchivo;

        usuarioDB.save((err, usuarioGuardado) => {
            res.json({
                estado: true,
                codigo: '0000',
                mensaje: 'Foto agregada exitosamente',
                nombreArchivo
            });

        });

    });
}

function borrarArchivo(nombreImagen) {
    let pathImagen = path.resolve(__dirname, `../../uploads/usuarios/${ nombreImagen }`);

    if (fs.existsSync(pathImagen)) {
        fs.unlinkSync(pathImagen);
    }
}





module.exports = app;