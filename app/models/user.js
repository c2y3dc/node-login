'use strict'

// load things
const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')
const uuid = require('uuid')

// define schema for user model
const userSchema = mongoose.Schema({
  local: {
    email: String,
    password: String,
    confirmationHash: String,
    confirmed: Boolean,
    passwordResetHash: String
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
})

// methods
// generate hash
userSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

userSchema.methods.confirmationHash = () => {
  return uuid()
}
// password reset hash
userSchema.methods.passwordResetHash = () => {
  return uuid()
}

// password check
userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.local.password)
}

userSchema.statics.hasUser = function (email, cb) {
  return this.findOne({'local.email': email}, {}, cb)
}

userSchema.statics.createPasswordResetHash = function (user, cb) {
  const passwordHash = user.passwordResetHash()
  return this.update(
    { 'local.email': user.local.email },
    { 'local.passwordResetHash': passwordHash },
    (err, res) => {
      if (err) return cb(err)
      if (res.nModified === 0) return cb(new Error('No user found for this email'))
      user.local.passwordResetHash = passwordHash
      return cb(null, passwordHash, res)
    }
  )
}

userSchema.statics.markUserAsConfirmed = function (confirmationHash, cb) {
  return this.update(
    { 'local.confirmationHash': confirmationHash },
    { 'local.confirmed': true },
    (err, res) => {
      if (err) return cb(err)
      if (res.nModified === 0) return cb(new Error('No user found for this confirmation hash.'))
      return cb(null, res)
    }
  )
}

userSchema.methods.isActivated = function () {
  return this.local.confirmed
}

userSchema.statics.passwordChange = function (passwordResetHash, newPassword, cb) {
  this.findOne({ 'local.passwordResetHash': passwordResetHash }, function (err, user) {
    if (err) return cb(err)
    return user.update({
      'local.password': user.generateHash(newPassword)
    }, (err, res) => {
      if (err) return cb(err)
      if (res.nModified === 0) return cb(new Error('no fields changed'), res)
      return cb(null, res)
    })
  })
}

module.exports = mongoose.model('User', userSchema)
