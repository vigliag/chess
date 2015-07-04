
var util = require("util");
var EventEmitter = require("events").EventEmitter;

//Wraps a connection to a game room
function RoomSocket(io, roomId){
  this.roomId = roomId;
  this.io = io;
}

RoomSocket.prototype.broadcastPublicGameState = function(gameState){
    this.io.to(this.roomId).emit('publicGameState', gameState);
};

RoomSocket.prototype.broadcastUserList = function(userStatuses){
    this.io.to(this.roomId).emit('users', userStatuses);
};

//Wraps a connection to a client
function ClientSocket(io, socket){
    this.io = io;
    this.socketId = socket.id;

    var _this = this;
    socket.on('playerMove', function(move){
        console.log('playerMove');
        _this.emit('playerMove', move);
    });

    socket.on('disconnect', function () {
        _this.emit('disconnect');
    });

    socket.on('registerAs', function (role, secret){
        console.log('registerAs');
        _this.emit('registerAs', role, secret);
    });

    socket.on('error', function (error) {
        console.error('error on socket.io server:', error);
    });
}
util.inherits(ClientSocket, EventEmitter);


ClientSocket.prototype.sendError = function(errorMsg){
    this.io.to(this.socketId).emit('error', errorMsg);
    console.log('error to client' + errorMsg);
};

ClientSocket.prototype.sendUserApproved = function(info){
    this.io.to(this.socketId).emit("approved", info);
};

module.exports = {
  ClientSocket: ClientSocket,
  RoomSocket: RoomSocket
};
