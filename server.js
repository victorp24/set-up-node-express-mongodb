const path = require('path');
const fs = require('fs');
const Database = require("./Database.js");
const express = require('express');

var db = new Database('mongodb+srv://admin:admin@cluster0.8jxdu.mongodb.net/testdb?retryWrites=true&w=majority', 'testdb');

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

// helper function to check if array of fields match the obj's fields
function isSchemaValid(fields, obj) {
	for(var i = 0; i < fields.length; i++) {
		if(!obj.hasOwnProperty(fields[i])) {
			return false;
		}
	}
	return true;
}

var userSchemaFields = [
	"firstName", 
	"lastName", 
	"email", 
	"password", 
	"contactNumber"
];

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});


app.route('/api/users')
	.get(function(req, res, next) {
		db.getUsers().then(function(allUsers) {
			for(var i = 0; i < allUsers.length; i++) {
				delete allUsers[i].password;
				delete allUsers[i]._id;
			}
			res.json(allUsers);
		})
	})
	.post(function (req, res, next) {
		var jsonBody = req.body;
		if(isSchemaValid(userSchemaFields, jsonBody)) {
			db.createNewUser(jsonBody).then(function(newUser) {
				res.json(newUser);
			}, function(err) {
				res.status(400).send(err.message);
			});
		} else {
			res.status(400).send("Cannot add user: user schema mismatch.");
		}
	});


app.get('/api/users/id/:id', function (req, res) {
	db.getUserById(req.params.id).then(function(user) {
		if(user != null) {
			delete user.password;
			res.json(user);
		} else {
			res.status(404).send("No User with the specified ID was found.");
		}
	})
});

app.post('/api/authenticate', function (req,res) {
	var jsonBody = req.body;
	db.getUserByEmail(jsonBody.email).then(function(user) {
		if(user != null) {
			if(jsonBody.password === user.password) {
				res.json(user);
			} else {
				res.status(401).send("Invalid email/password credentials.");
			}
		} else {
			res.status(401).send("Given email is not registered.");
		}
	})
});



