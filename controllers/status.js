const { validationResult } = require('express-validator');
const User = require('../models/user');

exports.getStatus = (req, res, next) => {
    const userId = req.userId;
    User.findById(userId)
        .then(user => {
            if (user._id.toString() !== userId) {
                const error = new Error('Not authorized');
                error.statusCode = 403;
                throw error;
            }
            res.status(200)
                .json({
                    message: 'Status fetched successfully',
                    status: user.status
                });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); //handled in app.js error handling
        });
};

exports.putStatus = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, status is invalid');
        error.statusCode = 422;
        throw error;
    }

    const userId = req.userId;
    const updatedStatus = req.body.status;

    User.findById(userId)
        .then(user => {
            if (!user) {
                const error = new Error('Could not find user');
                error.statusCode = 404;
                throw error;
            }
            if (user._id.toString() !== userId) {
                const error = new Error('Not authorized');
                error.statusCode = 403;
                throw error;
            }
            user.status = updatedStatus;
            user.save();
        })
        .then(() => {
            res.status(200)
                .json({
                    message: 'Status updated successfully'
                });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); //handled in app.js error handling
        });
};