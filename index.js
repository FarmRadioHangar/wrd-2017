'use strict';

const http = require('http');
const express = require('express');
const { urlencoded } = require('body-parser');
const twilio = require('twilio');

var errorhandler = require('errorhandler');
var morgan  = require('morgan');

var dumpExceptions = errorhandler({ dumpExceptions: true, showStack: true });

let app = express();
app.use(express.static(__dirname + '/public'));
app.use(urlencoded({ extended: false }));
app.use(dumpExceptions);
app.use(morgan('combined'));

// Generate a Twilio Client capability token
app.get('/token', (request, response) => {
  var callerId = request.query.callerId; 
  let capability = new twilio.Capability(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  capability.allowClientOutgoing(process.env.TWILIO_TWIML_APP_SID, {callerId:callerId});
  let token = capability.generate();

  // Include token in a JSON response
  response.send({
    token: token
  });
});

// Create TwiML for outbound calls
app.post('/voice', (request, response) => {
  console.log(request.body);
  let twiml = new twilio.TwimlResponse();
  twiml.dial(request.body.number, {
    callerId: request.body.callerId
  });
  response.type('text/xml');
  response.send(twiml.toString());
});

let server = http.createServer(app);
let port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Express Server listening on *:${port}`);
});

module.exports = app;
