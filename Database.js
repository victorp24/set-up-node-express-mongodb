const { MongoClient, ObjectID, ObjectId } = require('mongodb');	// require the mongodb driver



/**
 * Uses mongodb v3.6+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/3.6/api/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen400a app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getUsers = function() {
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			// grab all users from the database
			// note: the database must have a collection named 'users' for this to work
			resolve(db.collection('users').find({}).toArray());
		})	
	)
}

Database.prototype.getUserById = function(id) {
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			// grab a specific user from the database that matches the given id
			// note: MongoDB uses '_id' as the identifier for documents in a collection
			// also, MongoDB uses an object of type 'ObjectID' for the identifier
			try {
				var object_id = new ObjectID(id);
			} catch(e) {
				// error most likely occured since id passed is not in the proper format for ObjectID creation
				var object_id = id.toString();
			}
			resolve(db.collection('users').findOne({_id: object_id}));
		})	
	)
}

Database.prototype.getUserByEmail = function(email) {
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			// grab a specific user from the database that matches the given username
			resolve(db.collection('users').findOne({email: email}));
		})	
	)
}

Database.prototype.createNewUser = function(user) {
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			if(!user.hasOwnProperty("firstName") || !user.hasOwnProperty("lastName")
				|| !user.hasOwnProperty("contactNumber") || !user.hasOwnProperty("email") || !user.hasOwnProperty("password")) {
				reject(new Error("Cannot add user: user object does not contain all required information"));
			} else {
				db.collection('users').insertOne(user, function(err, result) {
					if(err) {
						console.log(err);
					} else {
						resolve(result.ops[0]);
					}
				});
			}

		})
	)
}




Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatroom from `db`
			 * and resolve the result */
			if(typeof(room_id) == ObjectID) {
				resolve(db.collection('chatrooms').findOne({_id: room_id}));
			} else {
				try {
					var o_id = new ObjectID(room_id);
					db.collection('chatrooms').findOne({_id: o_id}, function(err, result) {
						if(err) {
							console.log(err);
						} else {
							if(result != null) {
								resolve(result);
							} else {
								resolve(db.collection('chatrooms').findOne({_id: room_id}));
							}
						}
					})
				} catch(e) {
					/* ignore e for now, e is most likely due to a failed creation of o_id (room_id not in correct format) */
					resolve(db.collection('chatrooms').findOne({_id: room_id}));
				}
			}
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
			if(!room.hasOwnProperty("name")) {
				reject(new Error("Cannot add room: missing 'name' property"));
			} else {
				db.collection('chatrooms').insertOne(room, function(err, result) {
					if(err) {
						console.log(err);
					} else {
						resolve(result.ops[0]);
					}
				});
			}

		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
			var beforeInMilliseconds = (before == undefined) ? Date.now() : before;
			var query = { timestamp: {$lt: beforeInMilliseconds}, room_id: room_id };
			db.collection('conversations').find(query).toArray(function (err, result) {
				if(err) {
					console.log(err);
				} else {
					if(result === undefined || result.length == 0) {
						resolve(null);
					} else {
						var closest = result[0];
						var timeToBeat = beforeInMilliseconds - result[0].timestamp;
						for(var i = 1; i < result.length; i++) {
							var timeDifference = beforeInMilliseconds - result[i].timestamp;
							if( timeDifference < timeToBeat ) {
								closest = result[i];
								timeToBeat = timeDifference;
							}
						}
						resolve(closest);
					}
				}
			})
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
			if(!conversation.hasOwnProperty("room_id") || !conversation.hasOwnProperty("timestamp") || !conversation.hasOwnProperty("messages") ) {
				reject(new Error("Conversation object has at least one missing property"));
			} else {
				db.collection('conversations').insertOne(conversation, function(err, result) {
					if(err) {
						console.log(err);
					} else {
						resolve(result.ops[0]);
					}
				})
			}
		})
	)
}

module.exports = Database;