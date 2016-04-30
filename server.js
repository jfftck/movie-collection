// Import modules.
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
// Setup Express app.
var app = express();

// Setup Express to use resources and utilities.
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

// Set the default path to "/public".
app.use('/', express.static(path.join(__dirname, '/public')));

// Setup the GET request to return the JSON data.
app.get('/favorites', function(req, res){
  var data = fs.readFileSync('./data.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

// Setup the POST request to save the JSON data to the json file.
app.post('/favorites', function(req, res){
  if(!req.body.Title || !req.body.imdbID){
    res.send("Error");
    return
  }
  
  var data = JSON.parse(fs.readFileSync('./data.json'));
  data.push(req.body);
  fs.writeFile('./data.json', JSON.stringify(data));
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

// Start the server on port 3000.
app.listen(process.env.PORT || 3000, function(){
  console.log("Listening on port 3000");
});