var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

app.listen(3000);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function(socket){
	
  socket.on('chatmessage', function(msg,room){
     socket.broadcast.to(room).emit('chatmessage', msg);
  });
  

   socket.on('fen', function(msg){
     io.emit('fen', msg);
  });
});


var stanze= new Array();
var users=[];
io.sockets.on('connection', function(socket){

socket.emit('id', socket.id);
console.log(socket.id);	




  

   
  socket.on('create', function() { 
	var newroom=Math.floor((Math.random() * 1000) + 1);
	var a = stanze.indexOf(newroom);
	if(a==-1){
		
	stanze.push(newroom);
	console.log(stanze);
    //socket.join(newroom);
	socket.emit('room',newroom); 
	socket.broadcast.emit('stanze',stanze);//dico a tutti le stanze
	
	}else{
	socket.to(socket.id).emit('room',"errore");	
		}


	
   });
    
    socket.on('lista',function(){
    
    socket.emit('stanze',stanze);//dico le stanze a chi le ha chieste
    	
    });
    
    
    socket.on('refresh',function(room){
    
    socket.broadcast.to(room).emit('users', users[room],room);
    
    });
  
  
  	socket.on('subscribe', function(room) { 
  	console.log(stanze);
	if (stanze.indexOf(room) > -1){ //se esiste stanza
			
		if(Object.size(users[room])==0){ //se primo utente
    	socket.join(room);//entra
    	socket.emit("stato", "approvato");
    	users[room]={ID1:socket.id};//è bianco	
    	console.log(users[room]) ;
    	console.log("size:"+Object.size(users[room]) );
    	}
		else if (Object.size(users[room])==1){ //se secondo
				console.log("joinato secondo")
    			socket.join(room);	//entra
    			users[room]["ID2"]=socket.id;//nero
    			console.log(users[room]);
    			console.log("size:"+Object.size(users[room]) );
    			socket.emit("stato", "approvato");
    			stanze.splice(users[room],1); //rimuovo la stanza dato che sono 2
    			console.log("rimossa")
    			socket.broadcast.emit('stanze',stanze);//dico a tutti le stanze
    			console.log(users[room]);
   				}else{
   				socket.emit('message', "stanza piena");
   				console.log("stanza piena");
 
   				}
	
	}else{
   //socket.emit('message', "errore");
   socket.to(socket.id).emit("stato", "errore");
	}

   socket.broadcast.to(room).emit('users', users[room],room);	//comunica array w/b
	
   });//socket subscribe
 
  
  
   
  
	

  
  
  
  
});//io connection


//size object
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};