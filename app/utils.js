require('loadenv')()
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY)

module.exports = {
  sendConfirmationEmail: (user, cb) => {
    sendgrid.send({
      to: user.email,
      from: `ervinchow@gmail.com`,
      subject: `Welcome! Activate Your Account`,
      html: `
		  	Welcome!<br/>
		  	We're glad you're here,<br/>
		  	${user.email}.<br/>
		  	<a href="${process.env.URL}/confirm/${user.confirmationHash}/">
		  	Activate Account</a>
		  `
    }, (err, json) => {
      if (err) { return console.error(err) }
      if (typeof cb === 'function') {
        return cb(err, json)
      }
    })
  },
  sendPasswordResetEmail: (user, cb) => {
    sendgrid.send({
      to: user.local.email,
      from: `ervinchow@gmail.com`,
      subject: `Password Change`,
      html: `
		  	Hi! <br/>
		  	We're received a request for a password change,<br/>
		  	${user.local.email}.<br/>
		  	<a href="${process.env.URL}/reset/${user.local.passwordResetHash}/">
		  	Reset Account</a>
		  `
    }, (err, json) => {
      if (err) { return console.error(err) }
      if (typeof cb === 'function') {
        return cb(err, json)
      }
    })
  }
}
