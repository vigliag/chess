function Room(game) {
    this.game = game;
    this.roles = {
        w: null,
        b: null
    };
}

Room.prototype.getUserWithRole = function(role){
  return this.roles[role];
};

Room.prototype.getRolesForUser = function(userId){
  var uroles = {};

  for(var i in this.roles){
    if (this.roles[i] == userId) {
      uroles[i] = true;
    }
  }

  return uroles;
};

Room.prototype.setUserRole = function(userId, role){
  this.roles[role] = userId;
};

Room.prototype.setDisconnected = function(userId){
    for(var role in this.roles){
        if(this.users[role].userId == userId){
            this.users[role] = null;
        }
    }
};

//returns an object with {role: connected}
Room.prototype.userStatuses = function(){
  var response = {};
  for(var role in this.roles){
      response[role] = this.roles[role] ? true :  null;
  }
  return response;
};

module.exports = Room;
