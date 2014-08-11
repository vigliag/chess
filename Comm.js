
var util = require("util");
var EventEmitter = require("events").EventEmitter;

function Comm(io, socket, gameRoomId){
    this.io = io;
    this.socketId = socket.id;
    this.gameRoomId = gameRoomId;
    
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
util.inherits(Comm, EventEmitter);

Comm.prototype.broadcastPublicGameState = function(gameState){
    this.io.to(this.gameRoomId).emit('publicGameState', gameState);
};

Comm.prototype.broadcastUserList = function(userStatuses){
    this.io.to(this.gameRoomId).emit('users', userStatuses);
};

Comm.prototype.clientError = function(errorMsg){
    this.io.to(this.socketId).emit('error', errorMsg);
    console.log('error to client' + errorMsg);
};

Comm.prototype.sendUserApproved = function(info){
    this.io.to(this.socketId).emit("approved", info);
};

module.exports = Comm;