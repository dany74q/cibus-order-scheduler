var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const uuidv4 = require('uuid/v4');
const uuidValidate = require('uuid-validate');

var db = undefined;
var app = express();


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.post('/schedule', function(req, res) {
	// Verify
	var userCollections = db.collection('users');
	collection.insertOne(req.body);
});

app.post('/register', function(req, res) {
	// Verify
	var collection = db.collection('users');
	var form = req.body;
	form.timestamp = new Date();
	form.token = uuidv4().toString();
	collection.insertOne(form, function(err, insertRes) {
    	if (err !== null) {
    		res.sendStatus(500);
    	} else {
			res.send('success');
    	}
	});
});

app.post('/login', function(req, res) {
	// Verify
	var form = req.body;
	var collection = db.collection('users');
	collection.findOne(form, function(err, doc) {
		if (err !== null) {
			res.sendStatus(500);
		} else {
			res.send({token: doc.token});
		}
	});
});

app.post('/schedules', function(req, res) {
	// Get schedules from DB
	var collection = db.collection('schedules');
	collection.find({token: req.body.token}).toArray(function(err, docs) {
		if (err !== null) {
			res.sendStatus(500);
		} else {
			res.send(JSON.stringify(docs));	
		}
	});
});


// Connection URL
var url = process.env.MONGO_DB_CONN_STR || 'mongodb://localhost:27017';

// Use connect method to connect to the server
MongoClient.connect(url, function(err, got_db) {
  assert.equal(null, err);
  console.log("Connected successfully to mongo");
  db = got_db;
  var port = process.env.PORT || 1337;
  app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
  })
});