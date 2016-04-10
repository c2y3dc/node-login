//load things
const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');
const uuid = require('uuid');

//define schema for user model
const userSchema = mongoose.Schema({
  local: {
    email: String,
    password: String,
    confirmationHash: String,
    confirmed: Boolean
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
userSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.confirmationHash = () => {
  return uuid();
}

//password check
userSchema.methods.validPassword = (password) => {
  return bcrypt.compareSync(password, this.local.password);
};

userSchema.statics.markUserAsConfirmed = (confirmationHash, cb) => {
  return this.update(
    { 'local.confirmationHash': confirmationHash }, 
    { 'local.confirmed': true },
    (err, res) => {
      if (err) return cb(err)
      if (res.nModified === 0) return cb(new Error('No user found for this confirmation has.'))
      return cb(null, res);
    }
  );
};

userSchema.statics.passwordChange = (confirmationHash, newPassword, cb) => {
  return this.update(
    { 'local.confirmationHash': confirmationHash }, 
    { 'local.password': newPassword },
    (err, res) => {
      if (err) return cb(err)
      if (res.nModified === 0) return cb(new Error('Password Changed Successfully!'))
      return cb(null, res);
    }
  );
};

//create the model for users and export
module.exports = mongoose.model('User', userSchema);
