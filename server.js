let CronJob = require('cron').CronJob;
let bodyParser = require('body-parser')
var fs = require('fs');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
const express = require('express')
const app = express()
let calendarUpdater = require('./calendarUpdater')
let port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


let job = new CronJob({
  cronTime: '10 * * * * *',
  onTick: function () {
    console.log('cron running', (new Date()).toLocaleString());
  },
  start: false,
  timeZone: 'America/Los_Angeles'
});
job.start();

app.use('/bootstrap', express.static('node_modules/bootstrap/dist'))
app.use('/jquery/', express.static('node_modules/jquery/dist'))


app.get('/', (req, res) => {

  fs.readFile('client_secret.json', (err, content) => {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }

    let authURL = authorize(JSON.parse(content), getAuthUrl)
    let params = {
      "title": "Automator Ferit Rasporeda",
      "authURL": authURL,
    }

    res.render('index', params)
  });
})
app.get('/authorize', function (req, res) {

  fs.readFile('client_secret.json', (err, content) => {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }

    console.log(authorize(JSON.parse(content), getAuthUrl));
  });

  res.send(req.query);


  console.log('someone hit our site!')
})


app.listen(port, function () {
  console.log('Example app listening on port '+port+'!')
})



function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  return callback(oauth2Client)
}


function getAuthUrl(oauth2Client) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    approval_prompt: 'force',
    scope: calendarUpdater.SCOPES
  });

  return authUrl;
}
