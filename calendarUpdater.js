var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
let colorService = require('./services/googleCalendarColorService')
let scraper = require('./services/scraper.js');
let MongoClient = require('mongodb').MongoClient;
let programmeCodeService = require('./services/programmeCodeService')
let clientSecret = JSON.parse(process.env.client_secret)
let url = process.env.dburl || "mongodb://localhost:27017/ieee-raspored";
module.exports.url = url
let SCOPES = ['https://www.googleapis.com/auth/calendar'];
module.exports.SCOPES = SCOPES

function loadSecrets() {

    authorize(clientSecret, updateCalendars);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  callback(oauth2Client)
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    approval_prompt: 'force',
    scope: SCOPES
  });

  return authUrl;
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function (code) {
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function (err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming 10 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
      }
    }
  });
}

function addEventsToCalendar(auth, events) {
  var calendar = google.calendar('v3');
  console.log('Adding events to a calendar');
  events.forEach((event) => {
    calendar.events.insert({
      auth: auth,
      calendarId: 'primary',
      resource: event,
    }, function (err, event) {
      if (err) {
        console.log('There was an error contacting the Calendar service: ' + err);
        return;
      }
      console.log('%s: Event created: %s', (new Date()).toISOString(), event.htmlLink);
    });

  });
}
module.exports.addEventsToCalendar = addEventsToCalendar

function updateCalendars(oauth2Client) {
  let programmeCodes = Object.values(programmeCodeService).filter(function (item, pos, self) {
    return self.indexOf(item) == pos;
  });

  programmeCodes.forEach(function (programmeCode) {
    numberOfYears = (programmeCode.length == 1 || programmeCode == programmeCodeService.komunikacije) ? 3 : 2;
    for (let i = 1; i <= numberOfYears; i++) {
      query =
        {
          "programme": programmeCode,
          "studentYear": String(i)
        }
      // console.log(query)
      Promise.all([getStudentsFromDBAsync(query).catch(), scraper.scrapeEventsAsync(query.studentYear, query.programme)])
        .then((vals) => {
          let students = vals[0];
          let events = vals[1];

          students.forEach(student => {
            if (student.tokens === undefined) return;
            oauth2Client.credentials = student.tokens;
            oauth2Client.refreshAccessToken((err, tokens) => { });
            addEventsToCalendar(oauth2Client, events);
          })

        })
        .catch(err => console.error(err))
    }

  });

  //todo:: cleanup??? lines up to second closing brace??
  oauth2Client.refreshAccessToken(function (err, tokens) { });

  let testStudnet = {
    "programme": "21",
    "studentYear": "3",
    "tokens": { "access_token": "ya29.GlvsBAxUwBTa0Fwt_bLsv0iTjZZx653DAJhewZO5xaRAo6VUBgHxB-AuITJLGAVv-_TIdDGbaptrg-pK904_qKaeHh3FflIfFSJHHwFNga_3UhFBvno8h2VZkzPe", "refresh_token": "1/pPNfj8MpU_az-RSqzVzhMBvYjBuu59G-Rga_XddG3MA", "token_type": "Bearer", "expiry_date": 1508701153745 }
  }


}

function getStudentsFromDBAsync(query) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url,
      (err, db) => {
        if (err) reject(err);
        db.collection("students").find(query)
          .toArray((err, students) => {
            if (err) reject(err);
            return resolve(students);
            db.close();
          });
      });
  });
}
