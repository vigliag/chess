var Room = require('./Room.js');

var room = {};

module.exports = {

  getRoom : function(id){
    return room[id];
  },

  createRoom: function(id, data){
    room[id] = new Room(data);
    return room[id];
  }
};
