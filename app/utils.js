require('loadenv')();
const sendgrid = require('sendgrid')(process.env.SENDGRID_API_KEY);

module.exports = {
	sendConfirmationEmail: function (user, cb) {
		sendgrid.send({
		  to:       user.email,
		  from:     `ervinchow@gmail.com`,
		  subject:  `Welcome! Activate Your Account`,
		  html: 		`
		  	Welcome!<br/>
		  	We're glad you're here,<br/>
		  	${user.email}.<br/>
		  	<a href="http://localhost:8080/confirm/${user.confirmationHash}/">
		  	<button type="button">Activate Account</button></a>
		  	<a href="http://localhost:8080/reset/${user.confirmationHash}/">
		  	<button type="button">Reset Account</button></a>
		  `
		}, function(err, json) {
		  if (err) { return console.error(err); }
		  console.log(json);
		  if (typeof cb === 'function') {
			  return cb(err, json);
		  }
		});
	}
}