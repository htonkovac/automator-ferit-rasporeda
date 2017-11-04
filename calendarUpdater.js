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
  console.log('updating calendars ...')
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

      Promise.all([getStudentsFromDBAsync(query).catch(), scraper.scrapeEventsAsync(query.studentYear, query.programme)])
        .then((vals) => {
          let students = vals[0];
          let events = vals[1];

          students.forEach(student => {
            if (student.tokens === undefined) return;
            oauth2Client.credentials = student.tokens;
            oauth2Client.refreshAccessToken((err, tokens) => { });
            addEventsToCalendarWithExponentialBackoff(oauth2Client, events);
          })

        })
        .catch(err => console.error(err))
    }

  });
}
module.exports.updateCalendars = updateCalendars

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


function addEventsToCalendarWithExponentialBackoff(auth, events) {
  var calendar = google.calendar('v3');
  console.log('Adding events to a calendar');
  events.forEach((event) => {
    calendar.events.insert({
      auth: auth,
      calendarId: 'primary',
      resource: event,
    }, (err, event) => {exponentialBackoff(err, event, calendar, auth)})
  })

}


function exponentialBackoff(err, event, calendar, auth, delay = 1) {
  if (err == null || err == undefined) {
    console.log('%s: Event created: %s', (new Date()).toISOString(), event.htmlLink);    
    return;
  }
  console.error(err)
  
  if (err.error.code = 403 && delay < 20) {
    delay = delay + 1;
    setTimeout(calendar.events.insert({
      auth: auth,
      calendarId: 'primary',
      resource: event,
    }, exponentialBackoff(err, event, calendar, auth, delay)), 1000 * delay)
    return;
  }

  if (err) {
    console.log('There was an error contacting the Calendar service: ' + err);
    return;
  }
}