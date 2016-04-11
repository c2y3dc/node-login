require('loadenv')()
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

mongoose.connect(process.env.MONGODB)
mongoose.connection.on('connected', () => {
  console.log('mongoose connected')
})
mongoose.connection.on('error', (err) => {
  console.log('mongoose error', err)
})
mongoose.connection.on('disconnected', () => {
  console.log('mongoose disconnected')
})

require('./app/passport')(passport)

// Express
app.use(morgan('dev'))
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}))

app.set('view engine', 'ejs')

// Passport
app.use(session({
  secret: process.env.PASSPORT_SECRET,
  cookie: {
    maxAge: process.env.PASSPORT_COOKIE_MAX_AGE
  },
  resave: process.env.PASSPORT_SESSION_CONFIG,
  saveUninitialized: process.env.PASSPORT_SESSION_CONFIG
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use('/static', express.static('static'))

// Routes
require('./app/routes.js')(app, passport)

app.listen(port)
console.log('listening on port' + port)
