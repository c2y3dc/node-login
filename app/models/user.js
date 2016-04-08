//load things
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

//define schema for user model
var userSchema = mongoose.Schema({
  local: {
    email: String,
    password: String
  },
  facebook: {
    id: String,
    token: String,
    email: String,
    name: String
  },
  twitter: {
    id: String,
    token: String,
    email: String,
    name: String
  }
});

//methods
//generate hash
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//password check
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.local.password);
};

//create the model for users and export
module.exports = mongoose.model('User', userSchema);
