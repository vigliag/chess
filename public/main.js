/*global Chess, ChessBoard, $ */

var sessione;
var dati = new Array();
//NOTE: roomId is global
var roomId = 123;
var socket = io.connect("http://localhost:3000/?gameRoom=" + roomId, {'connect timeout': 400});//nn ho capito questa parte
var mystato;
var color;
var players = {};

//GUI
var $enterWhite = $('#enterWhite');
var $enterBlack = $('#enterBlack');

$enterWhite.on('click', function(){
    console.log('sending registration request as white');
    registra('white');
});

$enterBlack.on('click', function(){
    console.log('sending registration request as black');
    registra('black');
});



//status updates
socket.on('fen', function (fen) {
    console.log("fen", fen);
    game.load(fen);
    board.position(game.fen());
    if ((game.turn() == "w" && color == "black") || (game.turn() == "b" && color == "white")) {
        cfg.draggable = false;
    } else {
        cfg.draggable = true;
    }
});

socket.on('users', function (users, room) {
    console.log('users', users);
    if (users.white && users.black) {
        console.log("starts");
        if (color == "white")
            cfg.draggable = true;
    }
});


/*********Nuove Funzioni************/

/*STEP:
 1) va sulla pagina
 2) clicca su w/b e si "registra"
 3)socket manda approvazione
 4)on approved gira la scacchiera
 */

function registra(color) {
    socket.emit("registerAs", color, 123);
}


socket.on('approved', function (msg) {
    console.log("Approved:", msg);
    color = msg.color;

    if (color == 'white') {
        board.orientation('white');
    } else {
        board.orientation('black');
    }
});


/********************/


var board,
    game = new Chess(),
    $statusEl = $('#status'),
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

    var moveColor = game.turn() === 'b' ? 'Black' : 'White';
    
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
    
    $statusEl.html(status);
    
    if (socket) {
        socket.emit('fen', game.fen());
        console.log("fen emitted");
    }

};

var cfg = {
    draggable: false,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};
board = new ChessBoard('board', cfg);

updateStatus();




