var express = require('express');
var http = require('http');

var dustjs = require('adaro');

var Chess = require('./public/vendor/js/chess.js').Chess;
var gameRoom = require('./gameServer.js');
var db = require('./db.js');

//express set-up
var app = express();
app.engine('dust', dustjs.dust({cache: false}));
app.set('view engine', 'dust');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req,res){
  var randomRoom = Math.floor(Math.random() * (200 - 100)) + 100;
  res.redirect("/chess/" + randomRoom );
});

//route that displays a game room with a given id.
//If the room doesn't exist, a new room is created and assigned to the id;
app.get('/chess/:id', function (req, res) {
    var id = req.param("id");
    var game;

    var room = db.getRoom(id);
    if (!room) {
        game = new Chess();
        room = db.createRoom(id, game);
        console.log('new room created with id ' + id);
    }

    console.log("rendering page for ", room, " game: chess");
    res.render('chess_room', {roomId: id});
});

//starts the server and socket.io
var server = http.createServer(app).listen(3000);
console.log("listening on port 3000");
gameRoom.startGameServer(server);
