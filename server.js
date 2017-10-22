

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
let colorService = require('./services/googleCalendarColorService')
let scraper = require('./services/scraper.js');
let LinkGenerator = require('./services/linkGeneratorService');
let MongoClient = require('mongodb').MongoClient;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }

  // Authorize a client with the loaded credentials, then call the
  // Google Calendar API.
  authorize(JSON.parse(content), testLinks);
});

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

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      

      //this should be correct
      //callback(oauth2Client);

      callback(oauth2Client)
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
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
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
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
    timeMin: (new Date()).toISOString (),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
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

function addEventToCalendar(auth) {
var currentDate = new Date();
var tommorowDate = new Date();
tommorowDate.setDate(tommorowDate.getDate() + 1);


var calendar = google.calendar('v3');

scraper.scrapeEvents((events) => {
  
  events.forEach((event) => {

  calendar.events.insert({
  auth: auth,
  calendarId: 'primary',
  resource: event,
}, function(err, event) {
  if (err) {
    console.log('There was an error contacting the Calendar service: ' + err);
    return;
  }
  console.log('%s: Event created: %s',(new Date()).toISOString(), event.htmlLink);
});

  });
 /* for testing 
var event = events[0];


  calendar.events.insert({
  auth: auth,
  calendarId: 'primary',
  resource: event,
}, function(err, event) {
  if (err) {
    console.log('There was an error contacting the Calendar service: ' + err);
    return;
  }
  console.log('%s: Event created: %s',(new Date()).toISOString(), event.htmlLink);
});*/

  });

 }

function testLinks(oauth2Client) {


///new
oauth2Client.refreshAccessToken(function(err, tokens) {});

///
//let linkGenerator = new LinkGenerator(1,'komunikacije');
  //console.log(linkGenerator.getLink())

  var url = "mongodb://localhost:27017/ieee-raspored";
  let testStudnet = {
    "email":"marko",
    "smjer":"komunikacije",
    "godina":"1",
    "tokens":{"access_token":"ya29.GlvsBAxUwBTa0Fwt_bLsv0iTjZZx653DAJhewZO5xaRAo6VUBgHxB-AuITJLGAVv-_TIdDGbaptrg-pK904_qKaeHh3FflIfFSJHHwFNga_3UhFBvno8h2VZkzPe","refresh_token":"1/pPNfj8MpU_az-RSqzVzhMBvYjBuu59G-Rga_XddG3MA","token_type":"Bearer","expiry_date":1508701153745}
  }
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var query = {};
  db.collection("students").find(query).toArray(function(err, students) {
    if (err) throw err;
students.forEach( ()=> {

})




    db.close();
  });
});

}

