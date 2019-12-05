'use strict'

var validator = require('validator');

var User = require('../models/user');

var bcrypt = require('bcrypt-nodejs');

var jwt = require('../services/jwt');

var fs = require('fs');

var path = require('path');
var controller = {

    save: function (req, res) {
        // RECOGER PARAMETROS DE LA PETICION
        var params = req.body;
        // VALIDAR LOS DATOS
        try {

            var validate_name = !validator.isEmpty(params.name);
            var validate_surname = !validator.isEmpty(params.surname);
            var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
            var validate_password = !validator.isEmpty(params.password);
        } catch (err) {
            return res.status(200).send({
                message: 'Introduce todos los datos.',
            });
        }



        if (validate_name && validate_surname && validate_email && validate_password) {
            // CREAR OBJETO DE USUARIO
            var user = new User();

            // ASIGNAR VALORES AL USUARIO
            user.name = params.name;
            user.surname = params.surname;
            user.email = params.email.toLowerCase();
            user.role = 'ROLE_USER';
            user.image = null;

            // COMPROBAR SI YA EXISTE

            User.findOne({ email: user.email }, (err, issetUser) => {
                if (err) {
                    return res.status(500).send({
                        message: 'Error al comprobar la duplicidad del usuario.',
                    });
                }

                if (!issetUser) {
                    // CIFRAR LA CONTRASEÑA
                    bcrypt.hash(params.password, null, null, (err, hash) => {
                        user.password = hash;

                        // GUARDARLO

                        user.save((err, userStored) => {
                            if (err) {
                                return res.status(500).send({
                                    message: 'Error al guardar el usuario',
                                });
                            }

                            if (!userStored) {
                                return res.status(500).send({
                                    message: 'Error al guardar el usuario',
                                });
                            }

                            // DEVOLVER RESPUESTA
                            return res.status(200).send({
                                status: 'success',
                                user: userStored
                            });
                        });


                    });


                } else {
                    return res.status(500).send({
                        message: 'El usuario ya existe en la base de datos.',
                    });
                }
            });


        } else {
            return res.status(200).send({
                message: 'Hay algunos datos que no son válidos.',
            });
        }


    },

    login: function (req, res) {
        // RECOGER PARAMETROS DE LA PETICION

        var params = req.body;

        // VALIDAR DATOS

        try {
            var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
            var validate_password = !validator.isEmpty(params.email);
        } catch (err) {
            return res.status(400).send({
                message: 'Introduce todos los datos'
            });
        }

        if (!validate_email || !validate_password) {
            return res.status(400).send({
                message: 'Introduce los datos correctamente'
            });
        }

        // BUSCAR USUARIO EN LA BASE DE DATOS

        User.findOne({ email: params.email.toLowerCase() }, (err, user) => {
            if (err) {
                return res.status(500).send({
                    message: 'No se ha podido comprobar si existe el usuario en la base de datos.'
                });
            }

            if (!user) {
                return res.status(404).send({
                    message: 'No existe el usuario. Por favor, regístrate.'
                });
            }
            // COMPROBAR CONTRASEÑA

            bcrypt.compare(params.password, user.password, (err, check) => {
                if (err) {
                    return res.status(500).send({
                        message: 'No se ha podido comprobar las credenciales de acceso.'
                    });
                }
                if (!check) {
                    return res.status(200).send({
                        message: 'La contraseña no es correcta.'
                    });
                } else {
                    // LIMPIAR USUARIO
                    user.password = undefined;
                    // GENERAR TOKEN Y DEVOLVERLO
                    if (params.getToken) {
                        return res.status(200).send({
                            message: 'success',
                            token: jwt.createToken(user)
                        });
                    } else {
                        // DEVOLVER LOS DATOS
                        return res.status(200).send({
                            message: 'success',
                            user
                        });
                    }

                }
            });


        });



    },

    update: function (req, res) {
        // RECOGER LOS DATOS DEL USUARIO DE LA REQUEST
        var params = req.body;

        // VALIDAR DATOS DEL USUARIO
        try {
            var validate_name = !validator.isEmpty(params.name);
            var validate_surname = !validator.isEmpty(params.surname);
            var validate_email = !validator.isEmpty(params.email) && validator.isEmail(params.email);
        } catch (err) {
            return res.status(200).send({
                message: 'Introduce todos los datos correctamente'
            });
        }

        if (validate_email && validate_name && validate_surname) {

            // ELIMINAR PROPIEDADES INNECESARIAS

            delete params.password;
            // COMPROBAR SI EL EMAIL ES UNICO

            if (req.user.email != params.email) {
                User.findOne({ email: params.email.toLowerCase() }, (err, user) => {
                    if (err) {
                        return res.status(500).send({
                            message: 'No se ha podido comprobar si existe el usuario en la base de datos.'
                        });
                    }

                    if (user && user.email == params.email) {
                        return res.status(200).send({
                            message: 'El email no puede ser modificado'
                        });
                    } else {
                        // BUSCAR Y ACTUALIZAR EL DOCUMENTO DE LA BASE DE DATOS

                        var userId = req.user.sub;
                        User.findOneAndUpdate({ _id: userId }, params, { new: true }, (err, userUpdated) => {
                            if (err) {
                                return res.status(500).send({
                                    status: 'error',
                                    message: 'Error al actualizar el usuario'
                                });
                            }
                            if (!userUpdated) {
                                return res.status(500).send({
                                    status: 'error',
                                    message: 'Error al actualizar el usuario'
                                });
                            }

                            // DEVOLVER RESPUESTA CON LOS DATOS ACTUALIZADOS
                            return res.status(200).send({
                                status: 'success',
                                user: userUpdated
                            });
                        });
                    }
                });
            } else {
                // BUSCAR Y ACTUALIZAR EL DOCUMENTO DE LA BASE DE DATOS

                var userId = req.user.sub;
                User.findOneAndUpdate({ _id: userId }, params, { new: true }, (err, userUpdated) => {
                    if (err) {
                        return res.status(500).send({
                            status: 'error',
                            message: 'Error al actualizar el usuario'
                        });
                    }
                    if (!userUpdated) {
                        return res.status(500).send({
                            status: 'error',
                            message: 'Error al actualizar el usuario'
                        });
                    }

                    // DEVOLVER RESPUESTA CON LOS DATOS ACTUALIZADOS
                    return res.status(200).send({
                        status: 'success',
                        user: userUpdated
                    });
                });

            }


        } else {
            return res.status(400).send({
                status: 'error',
                message: 'Los datos no son válidos.'
            });
        }
    },

    uploadAvatar: function (req, res) {
        // CONFIGURAR EL MODULO CONNECT-MULTIPARTY

        // RECOGER EL FICHERO DE LA PETICION
        var file_name = 'Avatar no subido...';

        if (!req.files) {
            return res.status(404).send({
                status: 'error',
                message: 'Sube una imagen'
            })
        }
        // CONSEGUIR EL NOMBRE Y LA EXTENSION DEL ARCHIVO SUBIDO

        var filePath = req.files.file0.path;
        var fileSplit = filePath.split('\\');
        // CONSEGUIR NOMBRE DEL ARCHIVO
        var fileName = fileSplit[2];
        // CONSEGUIR EXTENSION DEL ARCHIVO
        var file_ext = fileName.split('\.');
        var file_ext = file_ext[1];

        // COMPROBAR EXTENSION, SOLO IMAGENES. SI NO ES VALIDA, BORRAR FICHERO

        if (file_ext != 'png' && file_ext != 'jpg' && file_ext != 'jpeg' & file_ext != 'gif') {
            fs.unlink(filePath, (err) => {
                return res.status(200).send({
                    status: 'error',
                    message: 'El tipo de archivo no es válido. Solo estan permitidos ficheros png, jpg, jpeg o gif.',
                });
            })
        } else {
            // SACAR ID DEL USUARIO IDENTIFICADO
            var userId = req.user.sub;

            // ACTUALIZAR OBJETO EN LA BASE DE DATOS
            User.findOneAndUpdate({ _id: userId }, { image: fileName }, { new: true }, (err, userUpdated) => {
                if (err || !userUpdated) {
                    return res.status(500).send({
                        status: 'error',
                        message: 'Error al actualizar el usuario',
                    });
                }
                // DEVOLVER RESPUESTA
                return res.status(200).send({
                    message: 'Metodo uploadAvatar.',
                    user: userUpdated
                });
            });
        }
    },
    avatar: function (req, res) {
        var fileName = req.params.fileName;
        var pathFile = './uploads/users/' + fileName;

        fs.exists(pathFile, (exists) => {
            if (exists) {
                return res.sendFile(path.resolve(pathFile));
            } else {
                return res.status(404).send({ message: 'La imagen no existe.' });
            }
        })
    },

    getUsers: function (req, res) {
        User.find().exec((err, users) => {
            if (err | !users) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay usuarios para mostrar'
                });
            } else {
                return res.status(200).send({
                    status: 'success',
                    users
                })
            }
        });
    },

    getUser: function (req, res) {
        var userId = req.params.id;

        User.findById(userId).exec((err, user) => {
            if (err | !user) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha encontrado el usuario especificado'
                });
            } else {
                return res.status(200).send({
                    status: 'success',
                    user
                });
            }
        });
    }
}

module.exports = controller;