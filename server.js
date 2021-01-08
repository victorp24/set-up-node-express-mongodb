const path = require('path');
const fs = require('fs');
const Database = require("./Database.js");
const express = require('express');

var db = new Database('mongodb+srv://admin:admin@cluster0.8jxdu.mongodb.net/testdb?retryWrites=true&w=majority', 'testdb');

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

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


// TODO: Do some filtering so that the password fields don't get returned
app.route('/users')
	.get(function(req, res, next) {
		db.getUsers().then(function(allUsers) {
			res.json(allUsers);
		})
	})
	.post(function (req, res, next) {
		var jsonBody = req.body;
		// TODO: add some checks to make sure the JSON body has all the required fields that are defined in our user schema
		db.createNewUser(jsonBody).then(function(newUser) {
			res.json(newUser);
		}, function(err) {
			res.status(400).send(err.message);
		});
	});

app.get('/users/email/:email', function (req, res) {
	db.getUserByEmail(req.params.email).then(function(user) {
		if(user != null) {
			res.json(user);
		} else {
			res.status(404).send("No user with the specified email was found");
		}
	})
})

app.get('/users/id/:id', function (req, res) {
	db.getUserById(req.params.id).then(function(user) {
		if(user != null) {
			res.json(user);
		} else {
			res.status(404).send("No User with the specified ID was found");
		}
	})
})