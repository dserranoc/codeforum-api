'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = process.env.PORT || 3999;

mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/api_rest_node', { useNewUrlParser: true })
        .then(()=>{
            console.log('Conexión a la base de datos establecida satisfactoriamente');
            // CREACION DEL SERVIDOR
            app.listen(port, () => {
                console.log('Servidor corriendo correctamente en la url http://localhost:'+port);
            })
        })
        .catch(err => console.log(err));