console.log('Server-side code running');

const express = require('express');
const app = express();

const MongoClient = require('mongodb').MongoClient;

const { ExpressPeerServer } = require('peer');
app.use(express.urlencoded());

srv = app.listen(9000)
app.use('/peerjs',
  require('peer').ExpressPeerServer(srv, {
    debug: true
  }))


// serve files from the public directory
app.use(express.static('public'));


// connect to the db and start the express server
let db;

// ***Replace the URL below with the URL for your database***
const url = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.r2saf.mongodb.net/hackattack`;

MongoClient.connect(url, (err, database) => {
  if(err) {
    return console.log(err);
  }
  db = database;
  // start the express web server listening on 8080
  app.listen(8080, () => {
    console.log('listening on 8080');
  });
});

// serve the homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/home.html');
});

// add a document to the DB collection
app.post('/people', (req, res) => {
  console.log(req.body);
  var dbo = db.db("hackattack");
  dbo.collection("people").insertOne(req.body, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
  })
  res.sendStatus(201);
});


// Clear the DB if requested
app.post('/clear', (req, res) => {
  var dbo = db.db("hackattack");
  
  dbo.collection("people").drop(function (err, result) {
        if (err) throw err;
        if (result) console.log("Collection successfully deleted.");
    });
  res.sendStatus(201);
});

// get the data from the database
app.get('/people', (req, res) => {

  var dbo = db.db("hackattack");

  dbo.collection('people').find().toArray((err, result) => {
    if (err) return console.log(err);
    res.send(result);
  });
});