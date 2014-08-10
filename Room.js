function Room() {
    this.users = {
        w: null, //{secret:null, socketId: null},
        b: null
    };
}

Room.prototype.register = function (color, socketId, secret) {
	var existingUser = this.users[color];

    if (!existingUser){
        var newUser = this.users[color] = {
            secret : secret,
            socketId : socketId,
            connected : true
        };
        return newUser;
    }

    //user already exists
	//check if a secret has been sent and it is correct for the existing user
    if(secret && existingUser.secret == secret){
    	//update user connection infos
        existingUser.connected = true;
        existingUser.socketId = socketId;
        return existingUser;
    }

    //registration failed
    return false;
};

Room.prototype.setDisconnected = function(socketId){
    for(var color in this.users){
        if(this.users[color] && this.users[color].socketId == socketId){
            this.users[color].connected = false;
            return true;
        }
    }
    return false;
};

//returns an object with {color: connected}
Room.prototype.userStatuses = function(){
  var response = {};
  for(var color in this.users){
    if(!this.users[color]){
      response[color] = null;
    } else {
      response[color] = this.users[color].connected;
    }
  }
  return response;
};

module.exports = Room;