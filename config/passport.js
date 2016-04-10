//load stuff
require('loadenv')();
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;

// console.log('env', process.env)

//load user model
var User = require('../app/models/user');

//load auth stuff
var utils = require('../app/utils');

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
    if(!req.user){
    	User.findOne({'local.email': email}, function(err, user) {
      if (err) {
        return done(err);
      }
      //check if user with same email exists
      if (user) {
        return done(null, false, req.flash('signupMessage', 'Email taken.'));
      } else {
        //if email available create user
        var newUser = new User();

        //set local credentials
        Object.assign(newUser.local, {
          email: email,
          password: newUser.generateHash(password),
          confirmationHash: newUser.confirmationHash(),
          confirmed: false
        })
        //save user
        newUser.save(function(err) {
          if (err) {
            throw errr;
          }
          utils.sendConfirmationEmail(newUser.local);
          return done(null, newUser);
        });
      }
    });
    } else if ( !req.user.local.email ) {
      // ...presumably they're trying to connect a local account
      // BUT let's check if the email used to connect a local account is being used by another user
      User.findOne({ 'local.email' :  email }, function(err, user) {
	      if (err)
          return done(err);
	      if (user) {
          return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
	        // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
	      } else {
          var user = req.user;
          user.local.email = email;
          user.local.password = user.generateHash(password);
          user.save(function (err) {
            if (err){
	            return done(err);
            }
            
            return done(null,user);
          });
	      }
      });
    } else {
        // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
        return done(null, req.user);
    }
  });
	}));

  //local login
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true //pass back req to cb
  },
  //cb with email and pw from form
	function(req, email, password, done) {
  //check to see if user exists
  //find email that matches form email
  User.findOne({'local.email': email}, function(err, user) {
    if (err) {
      return done(err);
    }
    //if no user display error message using connect-flash
    if (!user) {
      return done(null, false, req.flash('loginMessage', 'User not found.'));
    }
    //if user exist and password is wrong display error message
    if (!user.validPassword(password)) {
      return done(null, false, req.flash('loginMessage', 'The email and password you entered don\'t match.'));
    }
    //if user exists and password is correct
    return done(null, user);
  });
	}));

  //FACEBOOK

  passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: process.env.URL + '/auth/facebook/callback',
    profileFields: ["emails", "displayName", "name"],
    passReqToCallback: true //pass in req from route to check if user is logged in
  },

  //fb will send token and profile
	function(req, token, refreshToken, profile, done) {
	//async
  process.nextTick(function() {
  	if(!req.user){
	    User.findOne({'facebook.id': profile.id}, function(err, user) {

      if (err) {
        return done(err);
      }
      //if user found log in
      if (user) {
        // if there is a user id already but no token (user was linked at one point and then removed)
        if (!user.facebook.token) {
            user.facebook.token = token;
            user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
            user.facebook.email = profile.emails[0].value;

            user.save(function(err) {
                if (err)
                    throw err;
                return done(null, user);
            });
        }
        return done(null, user); //user found return user
      }else {
        //if no user found with facebook id, create
        var newUser = new User();

        //set facebook info in user model
        newUser.facebook.id = profile.id;
        newUser.facebook.token = token;
        newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
        newUser.facebook.email = profile.emails[0].value;

        //save new user to db
        newUser.save(function(err) {
          if (err) {
            throw err;
          }
          //if success return new user
          return done(null, newUser);
        });
      }
    	});
    }else{
    	//user already exists and logged in
    	//link accounts
    	var user = req.user; //reference to user from session

    	//update current fb user credentials
    	user.facebook.id = profile.id;
    	user.facebook.token = token;
    	user.facebook.name = profile.name.givenName + " " + profile.name.familyName;
    	user.facebook.email = profile.emails[0].value;

    	//save user
    	user.save(function(err){
    		if(err){
    			throw err;
    		}
    		return done(null, user);
    	})
    }
  });
	}));

  //Twitter
  passport.use(new TwitterStrategy({
  	consumerKey: process.env.TWITTER_KEY,
  	consumerSecret: process.env.TWITTER_SECRET,
  	callbackURL: process.env.URL + '/auth/twitter/callback',
    profileFields: ["displayName", "name"],
    passReqToCallback: true //pass in req from route to check if user is logged in    
  },
  function(req, token, tokenSecret, profile, done){
  	//make async
  	process.nextTick(function(){
  		if(!req.user){
  			User.findOne({ 'twitter.id': profile.id }, function(err, user){
  			//halt on err
  			if(err){
  				return done(err);
  			}
  			//log in if user exists
  			if(user){
					// if there is a user id already but no token (user was linked at one point and then removed)
					if (!user.twitter.token) {
            user.twitter.token       = token;
            user.twitter.name    = profile.username;
            user.twitter.displayName = profile.displayName;

            user.save(function(err) {
                if (err)
                    throw err;
                return done(null, user);
            });
          }
  				return done(null, user); //user found return user
  			}else{
  				//else create user
  				var newUser = new User();
  				//set user data
  				newUser.twitter.id = profile.id;
  				newUser.twitter.token = token;
  				newUser.twitter.name = profile.username;
  				newUser.twitter.email = profile.displayName;

  				//save user to db
  				newUser.save(function(err){
  					if(err){
  						throw err;
  					}
  					return done(null, newUser);
  				})
  			}
  			})
  		}else{
  				//else create user
  				var user = req.user; //ref to user from session
  				//set user data
  				user.twitter.id = profile.id;
  				user.twitter.token = token;
  				user.twitter.name = profile.username;
  				user.twitter.email = profile.displayName;

  				//save user to db
  				user.save(function(err){
  					if(err){
  						throw err;
  					}
  					return done(null, user);
  				})
  			}
  	})
  }))
};
