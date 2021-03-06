const { Client } = require("pg"); // include the Client constructor from the pg module

// make a new instance of the Client constructor and specify which db to connect to using the connectionString key
const client = new Client({
    connectionString: "Ivan://ivan_:dime@localhost/node-bcrypt"
});

// connect!
client.connect();

module.exports = client;