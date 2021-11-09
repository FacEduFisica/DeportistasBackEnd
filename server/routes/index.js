const express = require('express');

const app = express();



app.use(require('./administracion'));
app.use(require('./autenticacion'));
app.use(require('./usuario'));
app.use(require('./upload'));
app.use(require('./deportologo'));
app.use(require('./reportes'));
app.use(require('./fisioterapia'));
app.use(require('./entrenador'));


module.exports = app;