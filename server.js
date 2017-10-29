let CronJob = require('cron').CronJob;
let MongoClient = require('mongodb');
let bodyParser = require('body-parser')
var fs = require('fs');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
const express = require('express')
const app = express()
let favicon = require('serve-favicon')
let path = require('path')
let calendarUpdater = require('./calendarUpdater')
let port = process.env.PORT || 3000;
let url = calendarUpdater.url

app.set('view engine', 'ejs');
app.use(favicon(path.join(__dirname, 'public','images', 'favicon.ico')))
app.use(bodyParser.urlencoded({ extended: true }));


let job = new CronJob({
  cronTime: '0 0 0 * * FRI',
  onTick: function () {
    console.log('cron running', (new Date()).toLocaleString());
  },
  start: false,
  timeZone: 'America/Los_Angeles'
});
job.start();

let testjob = new CronJob({
  cronTime: '00 20 * * * *',
  onTick: function () {
    console.log('cron test test', (new Date()).toLocaleString());
  },
  start: false,
  timeZone: 'America/Los_Angeles'
});
testjob.start();

app.use('/bootstrap', express.static('node_modules/bootstrap/dist'))
app.use('/jquery', express.static('node_modules/jquery/dist'))
app.use('/font-awesome', express.static('node_modules/font-awesome'))
app.use('/images', express.static('public/images'))


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

app.get('/faq', (req, res) => {res.render('faq',{"title": "Automator Ferit Rasporeda"})});

  app.get('/authorized', (req, res) => {

  fs.readFile('client_secret.json', (err, content) => {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
  });

  let params = {
    "title": "Automator Ferit Rasporeda",
    "code": req.query.code,
    "smjer": require('./services/programmeCodeService')
  }

  res.render('authorized', params)
})

app.post('/authorized', (req, res) => {
  fs.readFile('client_secret.json', (err, content) => {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    let student = req.body
    if (student.hasOwnProperty('code')) {




      fs.readFile('client_secret.json', (err, content) => {
        if (err) {
          console.log('Error loading client secret file: ' + err);
          return;
        }

        authorize(JSON.parse(content), (oauth2Client) => {

          oauth2Client.getToken(student.code, function (err, token) {
            if (err) {
              console.log('Error while trying to retrieve access token', err);
              return;
            }

            student.tokens = token;
            student.timeOfRegistration = (new Date()).toISOString();
            storeStudentInDB(student);
          });
        })
      });
    }
    res.render('thankyou',{"title":"Automator Ferit Rasporeda"})
  });
})


app.listen(port, function () {
  console.log('Example app listening on port ' + port + '!')
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


function storeStudentInDB(student) {

  MongoClient.connect(url, function(err, db) {
    if (err) console.error(err);

    db.collection("students").insertOne(student, function(err, res) {
      if (err) console.error(err);
      console.log("1 new  student");

      insertWelcomeEvent(student);
      db.close();
    });
  });

}

function insertWelcomeEvent(student) {

  fs.readFile('client_secret.json', (err, content) => {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
      time = new Date();
      time2 = new Date()
      time2.setHours(time.getHours()+1);
    authorize(JSON.parse(content), (oauth2Client) => {

      oauth2Client.credentials = student.tokens;
      calendarUpdater.addEventsToCalendar(oauth2Client, [{
          'summary': 'Automator Ferit Rasporeda je aktiviran!',
          'description': 'Automator Ferit Rasporeda je aktiviran!',
          'start': {
            'dateTime': time.toISOString(),
            'timeZone': 'America/Los_Angeles',
          },
          'end': {
            'dateTime': time2.toISOString(),
            'timeZone': 'America/Los_Angeles',
          },
          'reminders': {
            'useDefault': true
          },
          'colorId':9                
      }])
      
    });
  });

}