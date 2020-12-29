const User = require('../models/user');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
dotenv.config();

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    try {
        const hashPassword = await bcrypt.hash(password, 12)
        const user = new User( {
            email: email,
            password: hashPassword,
            name: name
        });
        let result = await user.save();
        res.status(201).json({
            message: 'Created User',
            userId: result._id
        })
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); //handled in app.js error handling
    }
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    try {
        const user = await User.findOne({email: email});
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 401;
            throw error;
        }
        loadedUser = user;
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Invalid credentials');
            error.statusCode = 401;
            throw error;
        }
        const token = 
            jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id.toString()
            }, 
            process.env.JWT_SECRET, 
            { 
                expiresIn: '1h'
            });
        res.status(200).json({ token: token, userId: loadedUser._id.toString() });
        return;
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); //handled in app.js error handling
        return err;
    }
};