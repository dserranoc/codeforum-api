'use strict'

var Topic = require('../models/topic');

var validator = require('validator');

var controller = {
    add: function (req, res) {
        // RECOGER ID DEL TOPIC DE LA URL
        var topicId = req.params.topicId;

        var params = req.body;

        // FIND POR ID DEL TOPIC

        Topic.findById(topicId).exec((err, topic) => {
            if (err) {
                res.status(500).send({
                    status: 'error',
                    message: 'Error al procesar la petición.'
                });
            }

            if (!topic) {
                res.status(404).send({
                    status: 'error',
                    message: 'No existe el tema especificado.'
                });
            }

            if (req.body.content) {
                // COMPROBAR OBJETO Y VALIDAR DATOS

                try {
                    var validate_content = !validator.isEmpty(params.content);
                } catch (err) {
                    res.status(500).send({
                        status: 'error',
                        message: 'Error al procesar la petición.'
                    });
                }

                if (validate_content) {
                    // DENTRO DE LA PROPIEDAD COMMENTS DEL TOPIC, HACER PUSH AL ARRAY

                    var comment = {
                        user: req.user.sub,
                        content: params.content,
                    };

                    topic.comments.push(comment);

                    // GUARDAR LOS CAMBIOS DEL TOPIC EN LA BASE DE DATOS

                    topic.save((err) => {
                        if (err) {
                            res.status(500).send({
                                status: 'error',
                                message: 'Error al procesar la petición.'
                            });
                        }

                        Topic.findById(topic._id).populate('user').populate('comments.user').exec((err, topic) => {
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



                    });


                } else {
                    res.status(200).send({
                        status: 'error',
                        message: 'El comentario no puede estar vacío.'
                    });
                }


            }

        })

    },


    update: function (req, res) {
        // RECOGER ID DEL COMENTARIO

        var commentId = req.params.commentId;


        // RECOGER DATOS DE LA REQUEST

        var params = req.body;

        // VALIDAR LOS DATOS

        try {
            var validate_content = !validator.isEmpty(params.content)
        } catch (error) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al procesar la petición.'
            });
        }

        if (validate_content) {
            // HACER FIND DEL COMENTARIO CON TOPICID, COMMENTID y USER Y ACTUALIZAR

            Topic.findOneAndUpdate(
                { "comments._id": commentId },
                {
                    "$set": {
                        "comments.$.content": params.content
                    }
                },
                { new: true },
                (err, topicUpdated) => {
                    if (err) {
                        return res.status(500).send({
                            status: 'error',
                            message: 'Error al procesar la petición.'
                        });
                    }

                    if (!topicUpdated) {
                        return res.status(404).send({
                            status: 'error',
                            message: 'No se ha encontrado el tema especificado.'
                        });
                    }

                    return res.status(200).send({
                        status: 'success',
                        topic: topicUpdated
                    });
                }
            );

            // DEVOLVER UNA RESPUESTA

        } else {
            return res.status(200).send({
                status: 'error',
                message: 'El comentario no puede estar vacío.'
            });
        }

    },

    delete: function (req, res) {
        // SACAR ID DEL TOPIC Y DEL COMENTARIO A BORRAR

        var topicId = req.params.topicId;

        var commentId = req.params.commentId;

        // BUSCAR EL TOPIC

        Topic.findById(topicId, (err, topic) => {
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

            // SELECCIONAR EL COMENTARIO 
            var comment = topic.comments.id(commentId);

            // BORRAR EL COMENTARIO

            if (comment) {
                comment.remove();
                // GUARDAR EL TOPIC

                topic.save((err) => {
                    if (err) {
                        return res.status(500).send({
                            status: 'error',
                            message: 'Error al procesar la petición.'
                        });
                    }

                    Topic.findById(topic._id).populate('user').populate('comments.user').exec((err, topic) => {
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


                });
            } else {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha encontrado el comentario especificado.'
                });
            }

        });

    }
}

module.exports = controller;