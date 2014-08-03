var express = require('express');
var http = require('http');
var app = express();
var dustjs = require('adaro');

app.engine('dust', dustjs.dust({cache: false}));
app.set('view engine', 'dust');

app.use(express.static(__dirname + '/public'));

app.get('/chess/:id', function (req, res) {
    var id = req.param("id");
    var room = rooms[id];
    res.render('room', {roomid: id, room: room, white: false, black: false});
})

// Room class
function Room() {
    this.users = {
        white: null, //{secret:null, socketId: null},
        black: null
    }
}





Room.prototype.isFull = function () {
    return this.users.ID2 !== null || this.users.ID1 !== null;
};

Room.prototype.register = function (color, socketId, secret) {
    if (this.users[color] === null){
        this.users[color] = {
            secret : 123,
            socketId : socketId,
            connected : true
        }
        return this.users[color];
    } else {
        var user = this.users[color];
        if(secret && user.secret == secret){
            user.connected = true;
            return user;
        } else {
            return false;
        }
        
    }
}

Room.prototype.setDisconnected = function(socketId){
    for(var color in this.users){
        if(this.users[color].socketId = socketId){
            this.users[color].connected = false;
            return true;
        }
    }
    return false;
}

//returns an object with {color: connected}
Room.prototype.userStatuses = function(){
  var response = {}
  for(var color in this.users){
    if(!this.users[color]){
      response[color] = null;
    } else {
      response[color] = !this.users[color].connected;
    }
  }
  return response;
}

var rooms = {};

function availableRooms() {
    return Object.keys(rooms).filter(function (roomId) {
        return !rooms[roomId].isFull();
    })
}

var server = http.createServer(app).listen(3000);
console.log("listening on port 3000");
var io = require('socket.io')(server);

io.on('connection', function (socket) {
    console.log(socket.request.url);
    var urlMatches = /\gameRoom=(\w+)/.exec(socket.request.url);

    if(!urlMatches){
      console.log("unspecified room");
      socket.emit('error', 'unspecified room');
      return;
    }

    var gameRoomId = urlMatches[1];
    console.log("gameRoomId:"+gameRoomId);
    socket.join(gameRoomId);
    console.log('socket connected to room: ' + gameRoomId);

    var room = rooms[gameRoomId];
    if(!room){
      console.log(room);
      console.log("room doesn't exist");
      io.to(socket.id).emit('error', "room doesn't exist");
      return;
    }

    var roomio = socket.to(gameRoomId);

    socket.on('chatmessage', function (msg) {
        roomio.emit('chatmessage', msg);
    });

    socket.on('fen', function (msg) {
        if(socket.id == room.users.white || socket.id == room.users.white ){
          roomio.emit('fen', msg);
        } else{
          socket.to(socket.id).emit('error', 'not a registered player')
        }
    });

    socket.on('disconnect', function() {
        room.setDisconnected(socket.id);
        console.log('user disconnected');
        socket.to(gameRoomId).emit('users', room.userStatuses());
    });

    socket.on('registerAs', function (color, secret) {
        if(room.users[color])
            return socket.to(socket.id).emit("stato", "errore");

        var user = room.register(color, socket.id, secret);
        if(!user){
          return socket.to(socket.id).emit("stato", "errore");
        }
        socket.to(socket.id).emit("approved", {color:color, room: gameRoomId, secret: user.secret});
        socket.broadcast.to(gameRoomId).emit('users', room.userStatuses());
    });//socket subscribe
});//io connection