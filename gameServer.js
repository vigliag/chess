var db = require('./db.js');
var socketio = require('socket.io');
var connections = require('./connections.js');

var io; //socket.io server

exports.startGameServer = function startGameServer(webServerInstance){
  io = socketio(webServerInstance);
  io.on('connection', acceptClientIntoRoom);
};

function gameRoomFromURL(url){
  var urlMatches = /gameRoom=(\w+)/.exec(url);
  return urlMatches[1];
}

function acceptClientIntoRoom(socket) {

    console.log('connection to: ' + socket.request.url);
    var clientSocket = new connections.ClientSocket(io, socket);

    //joins the client into the room
    var roomId = gameRoomFromURL(socket.request.url);
    if (!roomId) {
      clientSocket.sendError("no room specified");
      return;
    }

    //grabs a reference to the room (it must exist already)
    var room = db.getRoom(roomId);
    if (!room) {
      clientSocket.sendError("room doesn't exist");
      return;
    }

    socket.join(roomId);
    console.log('socket connected to room: ' + roomId);


    // socket.on('chatmessage', function (msg) {
    //     socket.to(roomId).emit('chatmessage', msg);
    // });

    var roomSocket = new connections.RoomSocket(io, roomId);

    startServingClient(room, clientSocket, roomSocket);
}


function startServingClient(room, clientSocket, roomSocket){

    var game = room.game;
    var playerId = clientSocket.socketId;

    var broadcastPublicGameState = function(){
        roomSocket.broadcastPublicGameState(game.fen());
    };

    var broadcastUserList = function(){
      roomSocket.broadcastUserList(room.userStatuses() );
    };

    broadcastPublicGameState();
    broadcastUserList();

    //handles game updates
    clientSocket.on('playerMove', function (msg) {

        var playerRoles = room.getRolesForUser(playerId);
        var currentTurn = game.turn(); //b or w, like the roles

        if ( !(currentTurn in playerRoles) ){
          clientSocket.sendError('error, unexpected player move');
          return;
        }

        if(!game.move(msg)){
          clientSocket.sendError("invalid move " + msg);
        }

        broadcastPublicGameState();

    });

    //handles disconnection
    clientSocket.on('disconnect', function () {
        room.setDisconnected(playerId);
        console.log('user ' + playerId + ' disconnected');
        broadcastUserList();
    });

    //registers a user as a player
    clientSocket.on('registerAs', function (role, secret) {
        console.log('registerAs received', role, secret);
        room.setUserRole(playerId, role);
        clientSocket.sendUserApproved({color: role, room: roomSocket.roomId});
        broadcastUserList();
        console.log('player registered', {color: role, room: roomSocket.roomId});
    });

}
