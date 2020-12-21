const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    Post.find().countDocuments()
        .then(count => {
            totalItems = count;
            return Post.find()
                .skip((currentPage - 1) * perPage)
                .limit(perPage);
        })
        .then(results => {
            res.status(200)
                .json({
                    message: 'Fetched successfully',
                    posts: results,
                    totalItems: totalItems
                });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); //handled in app.js error handling
        });
};

exports.postPost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }
    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path;
    let creator;
    
    const post = new Post({
        title: title,
        content: content,
        creator: req.userId,
        imageUrl: imageUrl
    });

    post.save()
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            creator = user;
            user.posts.push(post)
            user.save();
            
        })
        .then(() => {
            res.status(201)
                .json({
                    message: 'Post created successfully',
                    post: post,
                    creator: {
                        _id: creator._id,
                        name: creator.name
                    }
                });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); //handled in app.js error handling
        });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({ message: 'Post fetched', post: post })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); //handled in app.js error handling
        });
};

exports.updatePost = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;

    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('No file picked');
        error.statusCode = 422;
        throw error;
    }

    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorized');
                error.statusCode = 403;
                throw error;
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            return post.save();
        })
        .then(result => {
            res.status(200).json({ message: 'Post updated', post: result })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); //handled in app.js error handling
        })
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) {
                const error = new Error('Not authorized');
                error.statusCode = 403;
                throw error;
            }
            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        })
        .then(() => {
            return User.findById(req.userId);
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save()
        })
        .then(() => {
            res.status(200).json({ message: 'Post deleted' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); //handled in app.js error handling
        })
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}