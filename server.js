var express = require('express');
var mongoose = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

const JWT_SECERET = 'jwt-pass';

var db = null;
var postsCollection = null;
var usersCollection = null;
mongoose.connect("mongodb://localhost:27017/basicpostingapp1", function (err, dbconn) {
    if (!err) {
        db = dbconn;
        postsCollection = db.collection('posts');
        usersCollection = db.collection('users');

        console.log("We are connected");
    }
    else {
        console.log(err);
    }
});

// Listen for post requests to /users (for creating new users)
app.post('/users', function (req, res, next) {
    // Check if user is already in the db:
    usersCollection.find({ username: req.body.username }).limit(1).toArray(function (err, output) {
        // If user is not already found:
        if (output[0] === undefined) {
            console.log("Creating new user...");
            var newUser = {
                username: req.body.username,
                password: null
            };

            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(req.body.password, salt, function (err, hash) {
                    newUser.password = hash;
                    usersCollection.insert(newUser, function (err) {
                        if (err) throw err;
                        console.log("User added to db");
                        res.status(201).send();
                    });
                });
            });
        }
        else {
            console.log("409 error");
            res.status(409).send();
        }
    });
});

// Listen for post requests to /login (for logging in):
app.post('/login', function (req, res, next) {
    // Find user in collection:
    usersCollection.findOne({ username: req.body.username }, function (err, login) {
        // Compare password to hash returned from db:
        bcrypt.compare(req.body.password, login.password, function (err, result) {
            if (result) {
                // Login successful
                var token = jwt.encode(login, JWT_SECERET); // Generate login token.
                return res.json({token: token}); 
            } else {
                return res.status(400).send(); // Login failed
            }
        });
    });
});

// Listen for get requests to /users
app.get('/users', function (req, res, next) {
    usersCollection.find({}).toArray(function (err, output) {
        if (err) throw err;
        res.json(output);
    });
});

// Listen for get requests to /posts
app.get('/posts', function (req, res, next) {
    postsCollection.find({}).toArray(function (err, output) {
        if (err) throw err;
        res.json(output);
    });
});

// Listen for post requests to /posts
app.post('/posts', function (req, res, next) {
    var token = req.headers.authorization;
    var decodedUser = jwt.decode(token, JWT_SECERET);

    var post = {
        userId: ObjectId(decodedUser._id),
        username: decodedUser.username,
        text: req.body.newPost
    };

    postsCollection.insert(post, {w:1}, function (err) {
        if (err) throw err;
        res.send();
    });
});

// Listen for put requests to /posts/remove
app.put('/posts/remove', function (req, res, next) {
    var token = req.headers.authorization;
    var decodedUser = jwt.decode(token, JWT_SECERET);

    postsCollection.remove({ _id: ObjectId(req.body.id), userId: ObjectId(decodedUser._id) }, {w: 1}, function (err) {
        if (err) throw err;
        res.send();
    });
});

app.listen(3000);