//load stuff
var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/models/user');

//export
module.exports = function(passport) {
  //passport persistent session setup
  //serialize user
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  //deserialize
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  //local signup
  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true //pass back req to cb
  },
	function(req, email, password, done) {
  //async
  //User.findOne won't run until data is sent back
  process.nextTick(function() {
    //check if user already logged in
    //find user with email same as form email
    User.findOne({'local.email': email}, function(err, user) {
      if (err) {
        return done(err);
      }
      //check if user with same email exists
      if (user) {
        return done(null, false, req.flash('signupMessage', 'Email taken'));
      }else {
        //if email available create user
        var newUser = new User();

        //set local credentials
        newUser.local.email = email;
        newUser.local.password = newUser.generateHash(password);

        //save user
        newUser.save(function(err) {
          if (err) {
            throw errr;
          }
          return done(null, newUser);
        });
      }
    });
  });
	}));
};
