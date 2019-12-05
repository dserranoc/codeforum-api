'use strict'

var express = require('express');
var bodyParser = require('body-parser');

var app = express();



// ARCHIVOS DE RUTAS

var UserRoutes = require('./routes/user');
var TopicRoutes = require('./routes/topic');
var CommentRoutes = require('./routes/comment');

// MIDDLEWARES


app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

// CORS

// Configurar cabeceras y cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});


// RUTAS

app.use('/api', UserRoutes);
app.use('/api', TopicRoutes);
app.use('/api', CommentRoutes);



// EXPORTAR

module.exports = app;

