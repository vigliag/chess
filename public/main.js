/*global Chess, ChessBoard, $, io, roomId */

//NOTE: roomId is global
var socket = io.connect("/?gameRoom=" + roomId, {'connect timeout': 400});
var game = new Chess();

var clientState = {
  localplayers : {} //dictionary name -> true of local players
};

function sendMove(){
    if (socket) {
        var gameHistory = game.history();
        var lastmove = gameHistory[gameHistory.length -1];
        socket.emit('playerMove', lastmove);
        console.log("playerMove emitted");
    }
}

//GUI
var board =  new ChessBoard('board', {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
});

var $statusEl = $('#status');

var $playerStatuses = $('#playerStatuses');

function registra(playerColor) {
    socket.emit("registerAs", playerColor, 123);
    console.log("sending registration request as " + playerColor);
}

function updatePlayerStatusesGui(receivedUserInfo){
    var user = receivedUserInfo;
    var isSpectator = Object.keys(clientState.localplayers).length === 0;

    var playerText = isSpectator === true ? 'Spectator' :  Object.keys(clientState.localplayers).join(" ");
    var wbutton = '<button type="button" id="enterWhite" class="btn btn-default">Join as white</button>';
    var bbutton = '<button type="button" id="enterBlack" class="btn btn-default">Join as black</button>';

    $playerStatuses.html('<div id="white">white: ' + (user.w === null ? wbutton : "connected") +
                         '</div><div id="black">black: '+  (user.b === null ? bbutton : "connected") +
                         '</div><p>Connected As '+ playerText +
                         '</p>');

    $('#enterWhite').one('click', function(){
        registra('w');
    });

    $('#enterBlack').one('click', function(){
        registra('b');
    });
}

//status updates
socket.on('publicGameState', function (fen) {
    console.log("received fen", fen);
    game.load(fen);
    board.position(game.fen());
    updateGui();
});

socket.on('users', function (users, room) {
    console.log('users', users);
    updatePlayerStatusesGui(users);
});

socket.on('approved', function (msg) {
    console.log("Approved:", msg);
    clientState.localplayers[msg.color] = true;

    if ( msg.color == 'w') {
        board.orientation('white');
    } else {
        board.orientation('black');
    }
});


/********************
* Player GUI
*********************/

function updateGui(){
    var status;
    var moveColor = game.turn() === 'b' ? 'Black' : 'White';
    if (game.in_checkmate() === true) {
        status = 'Game over, ' + moveColor + ' is in checkmate.';
    } else if (game.in_draw() === true) {
        status = 'Game over, drawn position';
    } else {
        status = moveColor + ' to move';
        // check?
        if (game.in_check() === true) {
            status += ', ' + moveColor + ' is in check';
        }
    }
    $statusEl.html(status);
}

function onDragStart(source, piece, position, orientation) {
    //prevents dragging if one of the following conditions holds true
    if ( !(game.turn() in clientState.localplayers) ||
         game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)  )
    {
        return false;
    }
}

function onDrop(source, target) {
    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    console.log(move);

    // illegal move
    if (move === null) return 'snapback';

    updateGui();
    sendMove();
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
    board.position(game.fen());
}

updateGui();
