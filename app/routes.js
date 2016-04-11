const User = require('./models/user')
const utils = require('../app/utils')

module.exports = (app, passport) => {
  // Home page
  app.get('/', (req, res) => {
    res.render('index.ejs')
  })

  // login
  app.get('/login', (req, res) => {
    // render the page and pass in any flash data if it exits
    res.render('login.ejs', {message: req.flash('loginMessage')})
  })

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redir to loggedIn interface
    failureRedirect: '/login', // redir to login if error
    failureFlash: true // allow flash message
  }))

  // sign up
  app.get('/signup', (req, res) => {
    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', {message: req.flash('signupMessage')})
  })

  // progess the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redir to loggedIn interface
    failureRedirect: '/signup', // redir to signup if error
    failureFlash: true // allow flash message
  }))

  // forgot pw
  app.get('/forgot', (req, res) => {
    res.render('forgot.ejs', {
      message: req.flash('forgotMessage'),
    })
  })

  app.post('/forgot', (req, res) => {
    // grab email to check for account existence
    User.hasUser(req.body.email, (err, user) => {
      console.log('user', user)
      if (err || !user) return res.end(`User does not exist!`)
      // create passwordResetHash
      // send email to req.body.email with pwrh
      User.createPasswordResetHash(user, (err) => {
        console.log('user', user, err)
        if (err) res.end('Could not reset your password')
        utils.sendPasswordResetEmail(user, (err, sres) => {
          if (err) res.end('Could not reset your password')
          res.end(`Check your inbox`)
        })
      })
    })
  })

  // activate account
  app.get('/confirm/:confirmationHash', (req, res) => {
    User.markUserAsConfirmed(req.params.confirmationHash, (err) => {
      if (err) return res.end(`Your account could not be confirmed.`)
      res.end(`Your email has been confirmed`)
    })
  })

  // password reset
  app.get('/reset/:confirmationHash', (req, res) => {
    res.render('reset.ejs', {
      message: req.flash('passwordMessage'),
      confirmationHash: req.params.confirmationHash
    })
  })
  app.post('/reset', (req, res) => {
    User.passwordChange(req.body.confirmationHash, req.body.password, (err, sres) => {
      if (err) return res.end(`Your password could not be changed.`)
      res.end(`Your password was changed successfully`)
    })
  })

  // profile section
  // protected loggedIn to visit
  // use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile.ejs', {
      user: req.user // get the user out of session and pass to template
    })
  })

  // logout
  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  // Facebook routes
  // facebook auth and login
  app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}))

  // handle cb after user auths with fb
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }))

  // Twitter routes
  app.get('/auth/twitter', passport.authenticate('twitter'))

  // handle cb after auth with twitter
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }))

  // Authorize - already signed in / connect other social accounts
  // local----
  app.get('/connect/local', (req, res) => {
    res.render('connect-local.ejs', {message: req.flash('loginMessage')})
  })

  app.post('/connect/local', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/connect/local',
    failureFlash: true
  }))

  // facebook----
  // send to fb for authorization
  app.get('/connect/facebook', passport.authorize('facebook', { scope: 'email' }))

  // handle cb after fb authorization
  app.get('/connect/facebook/callback',
    passport.authorize('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }))

  // twitter----
  // send to twitter for authorization
  app.get('/connect/twitter', passport.authorize('twitter', { scope: 'email'}))

  // handle cb after twitter authorization
  app.get('/connect/twitter/callback',
    passport.authorize('twitter', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }))

  // Unlink==== 
  // local
  app.get('/unlink/local', (req, res) => {
    const user = req.user
    user.local.email = undefined
    user.local.password = undefined
    user.save((err) => {
      res.redirect('/profile')
    })
  })

  // facebook
  app.get('/unlink/facebook', (req, res) => {
    const user = req.user
    user.facebook.token = undefined
    user.save((err) => {
      res.redirect('/profile')
    })
  })

  // twitter 
  app.get('/unlink/twitter', (req, res) => {
    const user = req.user
    user.twitter.token = undefined
    user.save((err) => {
      res.redirect('/profile')
    })
  })
}

// middleware to make sure a user is logged in
function isLoggedIn (req, res, next) {
  // if user is authenticated in the session, proceed
  if (req.isAuthenticated())
    return next()

  // if not redirect to the home page
  res.redirect('/')
}
