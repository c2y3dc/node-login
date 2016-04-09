module.exports = function(app, passport) {
  //Home page
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  //login
  app.get('/login', function(req, res) {
    //render the page and pass in any flash data if it exits
    res.render('login.ejs', {message: req.flash('loginMessage')});
  });

  //process the login form
  app.post('/login', passport.authenticate('local-login',{
    successRedirect: '/profile', //redir to loggedIn interface
    failureRedirect: '/login', //redir to login if error
    failureFlash: true //allow flash message
  }));

  //sign up
  app.get('/signup', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', {message: req.flash('signupMessage')});
  });

  //progess the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', //redir to loggedIn interface
    failureRedirect: '/signup', //redir to signup if error
    failureFlash: true //allow flash message
  }));

  //profile section
  //protected loggedIn to visit
  //use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.ejs', {
      user: req.user // get the user out of session and pass to template
    });
  });

  //logout
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  //Facebook routes
  //facebook auth and login
  app.get('/auth/facebook', passport.authenticate('facebook', {scope:'email'}));

  //handle cb after user auths with fb
  app.get('/auth/facebook/callback',
  	passport.authenticate('facebook', {
  		successRedirect: '/profile',
  		failureRedirect: '/'
  	}));

  //Twitter routes
  app.get('/auth/twitter', passport.authenticate('twitter'));

  //handle cb after auth with twitter
  app.get('/auth/twitter/callback',
  	passport.authenticate('twitter', {
  		successRedirect: '/profile',
  		failureRedirect: '/'
  	}))
};

// middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  //if user is authenticated in the session, proceed
  if (req.isAuthenticated())
  return next();

  // if not redirect to the home page
  res.redirect('/');
}
