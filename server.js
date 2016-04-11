// set up
// get all the tools we need
const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const mongoose = require('mongoose')
const passport = require('passport')
const flash = require('connect-flash')

const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')

const configDB = require('./db/database.js')

// configuration
mongoose.connect(configDB.url) // connect to database
// mongoose status
mongoose.connection.on('connected', () => {
  console.log('mongoose connected')})
mongoose.connection.on('error', (err) => {
  console.log('mongoose error', err)})
mongoose.connection.on('disconnected', () => {
  console.log('mongoose disconnected')})

require('./app/passport')(passport) // pass passport for configuration

// set up for express app
app.use(morgan('dev')) // log every request to console
app.use(cookieParser()) // read cookies for auth
app.use(bodyParser.urlencoded({extended: true})) // get information for html forms
// app.use(bodyParser())

app.set('view engine', 'ejs') // set up ejs for templating

// required for passport
app.use(session({secret: process.env.PASSPORT_SECRET, cookie: {maxAge: process.env.PASSPORT_COOKIE_MAX_AGE}, resave: process.env.PASSPORT_SESSION_CONFIG, saveUninitialized: process.env.PASSPORT_SESSION_CONFIG})) // session secret
app.use(passport.initialize())
app.use(passport.session()) // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use('/static', express.static('static'));

// routes
require('./app/routes.js')(app, passport) // load our routes and pass in our app and fully configured passport

// launch
app.listen(port)
console.log('listening on port' + port)
