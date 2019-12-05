'use strict'

var validator = require('validator');

var Topic = require('../models/topic');


var controller = {

    save: function (req, res) {
        // RECOGER PARAMETROS DE LA REQUEST

        var params = req.body;

        // VALIDAR LOS DATOS

        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
            var validate_lang = !validator.isEmpty(params.lang);

        } catch (error) {
            return res.status(200).send({
                status: 'error',
                message: 'Faltan datos por enviar.'
            })
        }
        if (validate_content && validate_title && validate_lang) {

            // CREAR EL OBJETO A GUARDAR

            var topic = new Topic();

            // ASGINAR VALORES A LAS PROPIEDADES DEL OBJETO

            topic.title = params.title;
            topic.content = params.content;
            topic.code = params.code;
            topic.lang = params.lang;
            topic.user = req.user.sub;

            // GUARDAR EL TOPIC EN LA BASE DE DATOS
            topic.save((err, topicStored) => {
                if (err | !topicStored) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No se ha podido guardar el tema'
                    });
                }
                return res.status(200).send({
                    status: 'success',
                    topic: topicStored
                });
            });

            // DEVOLVER UNA RESPUESTA
        } else {
            return res.status(200).send({
                status: 'error',
                message: 'Los datos no son válidos.'
            });
        }
    },

    getTopics: function (req, res) {
        // CARGAR LIBRERIA DE PAGINACION (MODELO)

        // RECOGER LA PAGINA ACTUAL
        if (!req.params.page || req.params.page == null | req.params.page == undefined || req.params.page == 0 || req.params.page == '0' || isNaN(req.params.page)) {
            var page = 1;
        } else {
            page = parseInt(req.params.page);
        }


        // INDICAR OPCIONES DE PAGINACION

        var options = {
            sort: { date: -1 },
            populate: 'user',
            limit: 5,
            page: page
        };

        // FIND PAGINADO

        Topic.paginate({}, options, (err, topics) => {


            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al hacer la consulta a la base de datos.',
                    err
                });
            }

            if (!topics) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se han encontrado temas.'
                });
            }
            // DEVOLVER RESULTADO (TOPICS, NUMERO DE TOPICS, TOTAL DE PAGINAS)

            return res.status(200).send({
                status: 'success',
                topics: topics.docs,
                totalDocs: topics.totalDocs,
                totalPages: topics.totalPages
            });
        });
    },

    getTopicsByUser: function (req, res) {
        // CONSEGUIR EL ID DEL USUARIO
        var UserId = req.params.user;

        // HACER UN FIND CON LA CONDICION DE USUARIO
        Topic.find({ user: UserId }).sort([['date', 'descending']]).exec((err, topics) => {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error en la petición.'
                });
            }

            if (topics.length == 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay temas para mostrar.'
                });
            }

            // DEVOLVER UN RESULTADO
            return res.status(200).send({
                status: 'success',
                topics
            });
        });


    },

    getTopic: function (req, res) {
        // RECOGER ID DEL TOPIC DE LA REQUEST
        var topicId = req.params.id;

        // BUSCAR TOPIC EN LA BASE DE DATOS CON LA CONDICION ID
        Topic.findById(topicId).populate('user').populate('comments.user').exec((err, topic) => {
            if (err) {
                console.log(err);
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al procesar la petición.'
                });
            }

            if (!topic) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el tema especificado.'
                });
            }

            // DEVOLVER LA RESPUESTA
            return res.status(200).send({
                status: 'success',
                topic
            });
        });

    },
    update: function (req, res) {
        // RECOGER ID DEL TOPIC
        var topicId = req.params.id;

        // RECOGER LOS DATOS DE LA REQUEST
        var params = req.body;

        // VALIDAR DATOS
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
            var validate_lang = !validator.isEmpty(params.lang);

        } catch (err) {
            return res.status(200).send({
                status: 'error',
                message: 'Rellena los datos correctamente.'
            });
        }

        if (validate_title && validate_content && validate_lang) {

            // CREAR UN OBJETO CON LOS DATOS MODIFICADOS

            var update = {
                title: params.title,
                content: params.content,
                code: params.code,
                lang: params.lang
            };

            // FINDANDUPDATE DEL TOPIC POR _ID y USER

            Topic.findOneAndUpdate({ _id: topicId, user: req.user.sub }, update, { new: true }, (err, topicUpdated) => {
                if (err) {
                    return res.status(500).send({
                        status: 'error',
                        message: 'Error al procesar la petición.'
                    });
                }

                if (!topicUpdated) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No existe el tema especificado.'
                    });
                }

                return res.status(200).send({
                    status: 'success',
                    topic: topicUpdated
                });
            });

            // DEVOLVER RESPUESTA
        } else {
            return res.status(200).send({
                status: 'error',
                message: 'Rellena los datos correctamente.'
            });
        }
    },
    delete: function (req, res) {
        // RECOGER ID POR LA URL
        var topicId = req.params.id;
        // BORRAR DOCUMENTO
        Topic.findOneAndDelete({ _id: topicId, user: req.user.sub }, (err, topic) => {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al procesar la petición.'
                });
            }
            if (!topic) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha encontrado el tema especificado.'
                });
            }

            // DEVOLVER RESPUESTA
            return res.status(200).send({
                status: 'success',
                topic
            });
        });
    },

    search: function (req, res) {
        // SACAR STRING A BUSCAR DE LA URL

        var string = req.params.search;

        // FIND CON EL OPERADOR OR

        Topic.find({
            "$or": [
                { "title": { "$regex": string, "$options": "i" } },
                { "content": { "$regex": string, "$options": "i" } },
                { "code": { "$regex": string, "$options": "i" } },
                { "lang": { "$regex": string, "$options": "i" } }

            ]
        }).populate('user').sort([['date', 'descending']]).exec((err, topics) => {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al procesar la petición.'
                });
            }
            if (!topics) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se han encontrado coincidencias de busqueda.'
                });
            }

            // DEVOLVER RESULTADO

            return res.status(200).send({
                status: 'success',
                topics
            });

        });

    }
};

module.exports = controller;