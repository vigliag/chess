var express = require('express');
var http = require('http');

var dustjs = require('adaro');
var Room = require('./Room');

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
        room = rooms[id] = new Room();
        console.log('new room created with id ' + id);
    }
    res.render('room', {roomid: id, room: room, white: false, black: false});
})

//starts the server and socket.io
var server = http.createServer(app).listen(3000);
console.log("listening on port 3000");
var io = require('socket.io')(server);

//listens for connections
io.on('connection', function (socket) {
    console.log('client connected to url ' + socket.request.url);

    //obtains the room for the request url
    var urlMatches = /gameRoom=(\w+)/.exec(socket.request.url);
    if (!urlMatches) {
        console.log("unspecified room");
        socket.emit('error', 'unspecified room');
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
        console.log("room doesn't exist");
        //io.to(socket.id).emit('error', "room doesn't exist");
        return;
    }

    //shorthand for emitting into the room
    var roomio = socket.to(gameRoomId);

    //handles chat
    socket.on('chatmessage', function (msg) {
        roomio.emit('chatmessage', msg);
    });

    //handles game updates
    socket.on('fen', function (msg) {



        //if user is a registerd one
        if (room.users.white && room.users.black) {// sennò crasha in quanto non esistono gli attributi socketId

            if (socket.id == room.users.white.socketId || socket.id == room.users.black.socketId) { //ho aggiunto .socketId perchè è l'attributo dell'oggetto che ci interessa
                roomio.emit('fen', msg);
                console.log("never enter");
            } else {
                console.log("enter always here");
                socket.to(socket.id).emit('error', 'not a registered player')
            }
        }
    });

    //handles disconnection
    socket.on('disconnect', function () {
        room.setDisconnected(socket.id);
        console.log('user disconnected');
        socket.to(gameRoomId).emit('users', room.userStatuses());
    });

    //registers a user as a player
    socket.on('registerAs', function (color, secret) {
        //if there's already a registered and connected user
        var existingUser = room.users[color];
        if (existingUser && existingUser.connected) {
            return io.to(socket.id).emit("error", "specified user is already connected");
        }

        //if the position is free or user is disconnected
        //register the user
        var user = room.register(color, socket.id, secret); //idempotent
        if (!user) { //wrong secret?
            return io.to(socket.id).emit("error", "registration failed");
        }
        //tell the user he's been approved
        io.to(socket.id).emit("approved", {color: color, room: gameRoomId, secret: user.secret});

        //emit the new player list to everyone in the room
        roomio.emit('users', room.userStatuses());

        console.log('player registerd', {color: color, room: gameRoomId, secret: user.secret})
    });


    socket.on('error', function (error) {
        console.error('error on socket.io server:', error);
    });

});//io connection