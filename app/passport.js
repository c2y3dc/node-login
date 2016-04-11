require('loadenv')()
const LocalStrategy = require('passport-local').Strategy
const FacebookStrategy = require('passport-facebook').Strategy
const TwitterStrategy = require('passport-twitter').Strategy

const User = require('../app/models/user')
const utils = require('../app/utils')

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user)
    })
  })

  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // pass back req to cb
  },
    (req, email, password, done) => {
      process.nextTick(() => {
        // check if user already logged in
        // find user with email same as form email
        if (!req.user) {
          User.findOne({'local.email': email}, (err, user) => {
            if (err) return done(err)
            // check if user with same email exists
            if (user) return done(null, false, req.flash('signupMessage', 'Email taken.'))

            // if email available create user
            const newUser = new User()

            // set local credentials
            Object.assign(newUser.local, {
              email: email,
              password: newUser.generateHash(password),
              confirmationHash: newUser.confirmationHash(),
              confirmed: false
            })
            // save user
            newUser.save((err) => {
              if (err) {
                throw err
              }
              utils.sendConfirmationEmail(newUser.local)
              return done(null, false, req.flash('signupMessage', 'Thanks for signing up! Please check your email for activation instructions.'), newUser)
            })
          })
        } else if (!req.user.local.email) {
          // user is trying to connect a local account
          // check if the email used to connect a local account is being used by another user
          User.findOne({ 'local.email': email }, (err, user) => {
            if (err) {
              return done(err)
            }
            if (user) {
              return done(null, false, req.flash('loginMessage', 'That email is already taken.'))
            } else {
              const user = req.user
              user.local.email = email
              user.local.password = user.generateHash(password)
              user.save((err) => {
                if (err) {
                  return done(err)
                }

                return done(null, user)
              })
            }
          })
        } else {
          // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
          return done(null, req.user)
        }
      })
    }))

  // local login
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true // pass back req to cb
  },
    // cb with email and pw from form
    (req, email, password, done) => {
      // check to see if user exists
      // find email that matches form email
      User.findOne({'local.email': email}, (err, user) => {
        if (err) {
          return done(err)
        }
        // if no user display error message using connect-flash
        if (!user) {
          return done(null, false, req.flash('loginMessage', 'User not found.'))
        }
        // if user exist and password is wrong display error message
        if (!user.validPassword(password)) {
          return done(null, false, req.flash('loginMessage', "The email and password you entered don't match."))
        }
        if (!user.isActivated()) {
          return done(null, false, req.flash('loginMessage', 'Oops looks like you have not activated your account yet! Please check your email'))
        }
        // if user exists and password is correct
        return done(null, user)
      })
    }))

  // FACEBOOK

  passport.use(new FacebookStrategy({
    clientID: process.env.FB_CLIENT_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: process.env.URL + '/auth/facebook/callback',
    profileFields: ['emails', 'displayName', 'name'],
    passReqToCallback: true // pass in req from route to check if user is logged in
  },

    // fb will send token and profile
    (req, token, refreshToken, profile, done) => {
      // async
      process.nextTick(() => {
        if (!req.user) {
          User.findOne({'facebook.id': profile.id}, (err, user) => {
            if (err) {
              return done(err)
            }
            // if user found log in
            if (user) {
              // if there is a user id already but no token (user was linked at one point and then removed)
              if (!user.facebook.token) {
                user.facebook.token = token
                user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName
                user.facebook.email = profile.emails[0].value

                user.save((err) => {
                  if (err) {
                    throw err
                  }
                  return done(null, user)
                })
              }
              return done(null, user) // user found return user
            } else {
              // if no user found with facebook id, create
              const newUser = new User()

              // set facebook info in user model
              newUser.facebook.id = profile.id
              newUser.facebook.token = token
              newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName
              newUser.facebook.email = profile.emails[0].value

              // save new user to db
              newUser.save((err) => {
                if (err) {
                  throw err
                }
                // if success return new user
                return done(null, newUser)
              })
            }
          })
        } else {
          // user already exists and logged in
          // link accounts
          const user = req.user // reference to user from session

          // update current fb user credentials
          user.facebook.id = profile.id
          user.facebook.token = token
          user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName
          user.facebook.email = profile.emails[0].value

          // save user
          user.save((err) => {
            if (err) {
              throw err
            }
            return done(null, user)
          })
        }
      })
    }))

  // Twitter
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_KEY,
    consumerSecret: process.env.TWITTER_SECRET,
    callbackURL: process.env.URL + '/auth/twitter/callback',
    profileFields: ['displayName', 'name'],
    passReqToCallback: true
  },
    (req, token, tokenSecret, profile, done) => {
      // make async
      process.nextTick(() => {
        if (!req.user) {
          User.findOne({ 'twitter.id': profile.id }, (err, user) => {
            // halt on err
            if (err) {
              return done(err)
            }
            // log in if user exists
            if (user) {
              // if there is a user id already but no token (user was linked at one point and then removed)
              if (!user.twitter.token) {
                user.twitter.token = token
                user.twitter.name = profile.username
                user.twitter.displayName = profile.displayName

                user.save((err) => {
                  if (err) {
                    throw err
                  }
                  return done(null, user)
                })
              }
              return done(null, user) // user found return user
            } else {
              // else create user
              const newUser = new User()
              // set user data
              newUser.twitter.id = profile.id
              newUser.twitter.token = token
              newUser.twitter.name = profile.username
              newUser.twitter.email = profile.displayName

              // save user to db
              newUser.save((err) => {
                if (err) {
                  throw err
                }
                return done(null, newUser)
              })
            }
          })
        } else {
          // else create user
          const user = req.user // ref to user from session
          // set user data
          user.twitter.id = profile.id
          user.twitter.token = token
          user.twitter.name = profile.username
          user.twitter.email = profile.displayName

          // save user to db
          user.save((err) => {
            if (err) {
              throw err
            }
            return done(null, user)
          })
        }
      })
    }))
}
