var express = require('express');
var http = require('http');
var app = express();
app.use(express.static(__dirname + '/public'));
var server = http.createServer(app).listen(3000);
var io = require('socket.io')(server);

io.on('connection', function(socket){
	
  socket.on('chatmessage', function(msg,room){
     socket.broadcast.to(room).emit('chatmessage', msg);
  });
  
   socket.on('fen', function(msg){
     io.emit('fen', msg);
  });
});

// Room class
function Room(){
  this.users = {
      ID1: null,
      ID2: null
  } 
}

Room.prototype.isFull = function() {
  return this.users.ID2 !== null;
};

Room.prototype.join = function(socketId) {
  if(this.users.ID1 === null)
    return this.users.ID1 = socketId; //è bianco 
  if(this.users.ID2 === null)
    return this.users.ID2 = socketId;
  throw new Error('room Full');
}

var rooms = {};

function availableRooms(){
  return Object.keys(rooms).filter(function(roomId){
      return !rooms[roomId].isFull();
  })
}

io.sockets.on('connection', function(socket){

socket.emit('id', socket.id);
console.log(socket.id);	

  socket.on('create', function() { 
	var roomId = Math.floor((Math.random() * 1000) + 1);
	if(rooms[roomId]) return socket.to(socket.id).emit('room',"errore");

	rooms[roomId] = new Room();

	console.log(rooms);
    //socket.join(newroom);
	socket.emit('room',roomId); 
	socket.broadcast.emit('stanze', availableRooms());//dico a tutti le stanze
});
    
socket.on('lista',function(){
    socket.emit('stanze', availableRooms());//dico le stanze a chi le ha chieste
});
    
socket.on('refresh',function(roomId){
  socket.broadcast.to(roomId).emit('users', rooms[roomId].users, roomId);
});
  
  
socket.on('subscribe', function(roomId) { 
    var room = rooms[roomId]
	  if (!room){ //se la stanza non esiste
      socket.to(socket.id).emit("stato", "errore");
    } else {
      if(room.isFull()){
        socket.emit('message', "stanza piena");
      } else {
        room.join(socket.id);
        socket.join(roomId);
        socket.emit("stato", "approvato");
      }
    }

   socket.broadcast.emit('stanze',availableRooms());//dico a tutti le stanze
   socket.broadcast.to(roomId).emit('users', room.users ,roomId);	//comunica array w/b
});//socket subscribe  
});//io connection