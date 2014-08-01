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
    res.render('room', {roomid: id, room: room, white: true});
})


var server = http.createServer(app).listen(3000);
console.log("listening on port 3000");
var io = require('socket.io')(server);

io.on('connection', function (socket) {

    socket.on('chatmessage', function (msg, room) {
        socket.broadcast.to(room).emit('chatmessage', msg);
    });

    socket.on('fen', function (msg) {
        io.emit('fen', msg);
    });
});

// Room class
function Room() {
    this.users = {
        white: null, //{cookie:null, socketId: null},
        black: null
    }
}


var nick = new Array();


Room.prototype.isFull = function () {
    return this.users.ID2 !== null || this.users.ID1 !== null;
};

Room.prototype.register = function (color, socketId) {
    if (this.users[color] === null){
        this.users[color] = {
            cookie : 123,
            socketId : socketId
        }
        return this.users[color];
    }
}

var rooms = {};

function availableRooms() {
    return Object.keys(rooms).filter(function (roomId) {
        return !rooms[roomId].isFull();
    })
}

io.sockets.on('connection', function (socket) {

    nick[socket.id] = socket.id; //assegno un nick che è l'id

    socket.emit('id', socket.id); //mando l'id ma se è gia esistente il client torna id vecchio

    console.log(socket.id);

    socket.on('create', function () {
        var roomId = Math.floor((Math.random() * 1000) + 1);
        if (rooms[roomId]) return socket.to(socket.id).emit('room', "errore");

        rooms[roomId] = new Room();

        console.log(rooms);
        //socket.join(newroom);
        socket.emit('room', roomId);
        socket.broadcast.emit('stanze', availableRooms());//dico a tutti le stanze
    });

    socket.on('settaid', function (myid) {
        nick[socket.id] = myid;
        console.log(nick[socket.id] + "=" + myid);
    });

    socket.on('disconnect', function () {
        //user[id]=null; AGGIUSTA TU
    });

    socket.on('subscribe', function (roomId, color) {
        var room = rooms[roomId];
        if (!room) { //se la stanza non esiste
            return socket.to(socket.id).emit("stato", "errore");
        }

        if(rooms.users[color])
            return socket.to(socket.id).emit("stato", "errore");

        var user = rooms.register(color, socket.id);
        socket.join(roomId);
        socket.emit("approved", {color: color});
        socket.broadcast.to(roomId).emit('users', {white: room.users.white, black: room.users.black});
    });//socket subscribe
});//io connection