var sessione;
var dati = new Array();
var socket = io.connect("http://localhost:3000/", {'connect timeout': 400});
$('#chat').on('submit', function () {
    dati[0] = $('#user').val();
    dati[1] = $('#m').val();
    socket.emit('chatmessage', dati, sessione);
    $('#m').val('');
    return false;
});
var myid = localStorage.getItem('ID');
var myusers;
var color;
var mystato;

socket.on('connect', function () {
    socket.emit("lista");

});


socket.on('stanze', function (stanzelist) {
    var string = "";
    for (i = 0; i < stanzelist.length; i++) {
        string += "<li>" + stanzelist[i] + "</li><button onclick='entra(" + stanzelist[i] + ")'>Entra</button>";

    }
    $("#stanze").html(string).trigger('create');

});


socket.on('id', function (id) {
    if (!myid) {
        myid = id;
        localStorage.setItem('ID', id);
    } else {
        socket.emit("settaid", myid);

    }
});

socket.on('stato', function (stato) {
    mystato = stato;
});


socket.on('chatmessage', function (msg) {
    $('#messages').append('<li><h3>' + msg[0] + ':</h3>' + msg[1] + '</li>');
});

socket.on('room', function (room) {
    socket.emit("lista");
});


socket.on('fen', function (fen) {
    game.load(fen);
    board.position(game.fen());
    if ((game.turn() == "w" && color == "black") || (game.turn() == "b" && color == "white")) {
        cfg.draggable = false;
    } else {

        cfg.draggable = true;
    }
});

socket.on('users', function (users, room) {
    console.log("starts");
    myusers = users;
    if (users["ID1"] == myid) {
        board.orientation('white');
        color = "white";
        socket.emit("refresh", room);

    } else {
        board.orientation('black');
        color = "black";
    }


});


function crea() {

    socket.emit("create");
    document.getElementById("creazione").style.display = "none";
}

function entra(room) {
    socket.emit("subscribe", room);
    wait(room);
}


function join() {
    room = document.getElementById("entra").value;
    socket.emit("subscribe", room);
    wait(room);
}

function continua(room) {
    if (mystato != "errore") {
        sessione = room;
        document.getElementById("gestione").style.display = "none";
        document.getElementById("board").style.display = "block";
        document.getElementById("dx").style.display = "block";
    }
}


function wait(room) {
    setTimeout(
        function () {
            if (mystato) {
                continua(room);
                return;
            } else {

                wait();
            }

        }, 200);
}
var board,
    game = new Chess(),
    statusEl = $('#status'),
    fenEl = $('#fen'),
    pgnEl = $('#pgn');

// do not pick up pieces if the game is over
// only pick up pieces for the side to move
var onDragStart = function (source, piece, position, orientation) {
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }
};

var onDrop = function (source, target) {
    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return 'snapback';

    updateStatus();
};

// update the board position after the piece snap 
// for castling, en passant, pawn promotion
var onSnapEnd = function () {

    if ((game.turn() == "w" && color == "black") || (game.turn() == "b" && color == "white")) {
        cfg.draggable = false;
    } else {

        cfg.draggable = true;
    }

    board.position(game.fen());
};

var updateStatus = function () {
    var status = '';

    var moveColor = 'White';
    if (game.turn() === 'b') {
        moveColor = 'Black';
    }

    // checkmate?
    if (game.in_checkmate() === true) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    }

    // draw?
    else if (game.in_draw() === true) {
        status = 'Game over, drawn position';
    }

    // game still on
    else {
        status = moveColor + ' to move';

        // check?
        if (game.in_check() === true) {
            status += ', ' + moveColor + ' is in check';
        }
    }
    if (socket) {
        socket.emit('fen', game.fen());
    }

};

var cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};
board = new ChessBoard('board', cfg);

updateStatus();


function joina() {
    IDsess = document.getElementById("joina").val();
    window.location.href = "/" + IDsess;

}

$(document).ready(function () {
    var par = getUrlVars()["ID"];
    if (par) {
        entra(par);
    }
});


function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

