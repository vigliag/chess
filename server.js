var express = require('express');
var http = require('http');

var dustjs = require('adaro');
var Chess = require('./public/vendor/js/chess.js').Chess;
var Room = require('./Room');
var Comm = require('./Comm');

//express set-up
var app = express();
app.engine('dust', dustjs.dust({cache: false}));
app.set('view engine', 'dust');
app.use(express.static(__dirname + '/public'));

//global room dictionary
var rooms = {};

//route that displays a game room with a given id.
//If the room doesn't exist, a new room is created and assigned to the id;
app.get('/chess/:id', function (req, res) {
    var id = req.param("id");
    var room = rooms[id];
    if (!room) {
        var game = new Chess();
        room = rooms[id] = new Room(game);
        console.log('new room created with id ' + id);
    }
    console.log(room);
    res.render('room', {roomId: id, room: room});
});

//starts the server and socket.io
var server = http.createServer(app).listen(3000);
console.log("listening on port 3000");
var io = require('socket.io')(server);

//listens for connections
io.on('connection', acceptClientIntoRoom);

function acceptClientIntoRoom(socket) {
    
    function clientError(errorMsg){ //TODO REFACTOR OUT
        io.to(socket.id).emit('error', errorMsg);
        console.log('error to client' + errorMsg);
    }
    
    console.log('client connected to url ' + socket.request.url);

    //obtains the room for the request url
    var urlMatches = /gameRoom=(\w+)/.exec(socket.request.url);
    if (!urlMatches) {
        clientError('unspecified room');
        return;
    }
    var gameRoomId = urlMatches[1];
    console.log("gameRoomId:" + gameRoomId);

    //joins the client into the room
    socket.join(gameRoomId);
    console.log('socket connected to room: ' + gameRoomId);

    //grabs a reference to the room (it must already exist)
    var room = rooms[gameRoomId];
    if (!room) {
        clientError("room doesn't exist");
        return;
    }
    
    //TODO: CREATE COMM OBJECT HERE AND PASS IT TO THE ROOM INSTEAD OF SOCKET AND GAMEROOMID
    var comm = new Comm(io, socket, gameRoomId);

    socket.on('chatmessage', function (msg) {
        socket.to(gameRoomId).emit('chatmessage', msg);
    });
    
    startServingClient(comm, room, socket.id, gameRoomId);
}


function startServingClient(comm, room, socketId, gameRoomId){

    var game = room.game;
    var playerRole;
    var broadcastPublicGameState = function(){
        comm.broadcastPublicGameState(game.fen());
    };
    
    var broadcastUserList = function(){
        comm.broadcastUserList(room.userStatuses() );
    };
    
    broadcastPublicGameState();
    broadcastUserList();
    
    //handles game updates
    comm.on('playerMove', function (msg) {
        console.log('playerMove ', msg, ' from ', socketId, "with ", room.users);

        if(game.turn() === playerRole){
            var moveWasApplied = game.move(msg) !== null;
            if(!moveWasApplied){
                comm.clientError("invalid move " + msg);
            }
        } else {
            console.log("unexpected player move");
            comm.clientError('error, unexpected player move');
        }
        broadcastPublicGameState();
    });

    //handles disconnection
    comm.on('disconnect', function () {
        room.setDisconnected(socketId);
        console.log('user disconnected');
        broadcastUserList();
    });

    //registers a user as a player
    comm.on('registerAs', function (role, secret) {
        console.log('registerAs received', role, secret);
        var user = room.register(role, socketId, secret); //idempotent
        if (!user) { //wrong secret?
            comm.clientError("registration failed");
            broadcastUserList();
            return;
        }
        
        playerRole = role;
        
        comm.sendUserApproved({color: role, room: gameRoomId, secret: user.secret});
        broadcastUserList();
        console.log('player registered', {color: role, room: gameRoomId, secret: user.secret});
    });

}