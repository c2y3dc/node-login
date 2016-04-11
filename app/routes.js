const User = require('./models/user')
const utils = require('../app/utils')

module.exports = (app, passport) => {
  app.get('/', (req, res) => {
    res.render('index.ejs')
  })

  app.get('/login', (req, res) => {
    res.render('login.ejs', {message: req.flash('loginMessage')})
  })

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }))

  app.get('/signup', (req, res) => {
    res.render('signup.ejs', {message: req.flash('signupMessage')})
  })

  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }))

  app.get('/forgot', (req, res) => {
    res.render('forgot.ejs', {
      message: req.flash('forgotMessage')
    })
  })

  app.post('/forgot', (req, res) => {
    User.hasUser(req.body.email, (err, user) => {
      if (err || !user) return res.end(`User does not exist!`)
      User.createPasswordResetHash(user, (err) => {
        if (err) res.end('Could not reset your password')
        utils.sendPasswordResetEmail(user, (err, sres) => {
          if (err) {
            return res.render('message.ejs', {
              title: 'Could not reset your password',
              message: 'Your password could not be reset'
            })
          }
          res.render('message.ejs', {
            title: 'Success',
            message: 'Please check your inbox for instructions to reset your password'
          })
        })
      })
    })
  })

  app.get('/confirm/:confirmationHash', (req, res) => {
    User.markUserAsConfirmed(req.params.confirmationHash, (err) => {
      if (err) {
        return res.render('message.ejs', {
          title: 'Account Activation Error',
          message: err.message,
        })
      }
      return res.render('message.ejs', {
        title: 'Account activated',
        message: 'Your account has been activated.',
      })
    })
  })

  app.get('/reset/:confirmationHash', (req, res) => {
    res.render('reset.ejs', {
      message: req.flash('passwordMessage'),
      confirmationHash: req.params.confirmationHash
    })
  })
  app.post('/reset', (req, res) => {
    User.passwordChange(req.body.confirmationHash, req.body.password, (err, sres) => {
      if (err) {
        return res.render('message.ejs', {
          title: 'Could not reset your password',
          message: 'Your password could not be reset'
        })
      }
      return res.render('message.ejs', {
        title: 'Success!',
        message: 'Your password was changed successfully!'
      })
    })
  })

  app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile.ejs', {
      user: req.user
    })
  })

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}))

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }))

  app.get('/auth/twitter', passport.authenticate('twitter'))

  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      successRedirect: '/profile',
      failureRedirect: '/'
    })
  )

  app.get('/connect/local', (req, res) => {
    res.render('connect-local.ejs', {message: req.flash('loginMessage')})
  })

  app.post('/connect/local', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/connect/local',
    failureFlash: true
  }))

  app.get('/connect/facebook', passport.authorize('facebook', { scope: 'email' }))

  app.get('/connect/facebook/callback',
    passport.authorize('facebook', {
      successRedirect: '/profile',
      failureRedirect: '/'
    }))

  app.get('/connect/twitter', passport.authorize('twitter', { scope: 'email' }))

  app.get('/connect/twitter/callback',
    passport.authorize('twitter', {
      successRedirect: '/profile',
      failureRedirect: '/'
    })
  )

  app.get('/unlink/local', (req, res) => {
    const user = req.user
    user.local.email = undefined
    user.local.password = undefined
    user.save((err) => {
      res.redirect('/profile')
    })
  })

  app.get('/unlink/facebook', (req, res) => {
    const user = req.user
    user.facebook.token = undefined
    user.save((err) => {
      res.redirect('/profile')
    })
  })

  app.get('/unlink/twitter', (req, res) => {
    const user = req.user
    user.twitter.token = undefined
    user.save((err) => {
      res.redirect('/profile')
    })
  })
}

function isLoggedIn (req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect('/')
}
