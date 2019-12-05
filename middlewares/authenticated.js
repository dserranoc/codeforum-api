'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');

var secret = "clave-secreta-para-generar-el-token-13372704";

exports.authenticated = function(req, res, next){

    // COMPROBAR SI NOS LLEGA EL HEADER AUTHORIZATION
    if(!req.headers.authorization){
        
        return res.status(403).send({
            message: 'No estas autorizado para realizar esta acción.'
        });
    }

    // LIMPIAR EL TOKEN Y QUITAR COMILLAS SI LAS TRAE
    var token = req.headers.authorization.replace(/['"]+/g, '');
    try {
        // DECODIFICAR EL TOKEN
        var payload = jwt.decode(token, secret);

        // COMPROBAR LA EXPIRACION DEL TOKEN
        if(payload.exp <= moment.unix()){
            return res.status(404).send({
                message: 'El token ha expirado.'
            });
        }
        
    } catch (ex) {
        return res.status(404).send({
            message: 'El token no es válido.'
        });
    }


    // ADJUNTAR USUARIO IDENTIFICADO A LA REQUEST
    req.user = payload;

    // PASAR A LA ACCION DEL CONTROLADOR
    next();
}