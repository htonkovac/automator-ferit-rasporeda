// let scraper = require('./services/scraper.js');
// let programmeCodeService = require('./services/programmeCodeService');
// let MongoClient = require('mongodb').MongoClient;

// Promise.all([getStudentsFromDBAsync(query), scraper.scrapeEventsAsync(query.studentYear, query.programmeCode)])
//             .then((vals) => {
//                 let students = vals[0];
//                 let events = vals[1];



//             })


// function getStudentsFromDBAsync(query) {
//     return new Promise((resolve, reject) => {
//         MongoClient.connect("mongodb://localhost:27017/ieee-raspored",
//             (err, db) => {
//                 if (err) reject(err);
//                 db.collection("students").find(query).toArray((err, students) => {
//                     if (err) reject(err);
//                     return resolve(students);
//                     db.close();
//                 });
//             });
//     });
// }

// let testStudnet = {
//     "programme": "21",
//     "studentYear": "3",
//     "tokens": { "access_token": "ya29.GlvsBAxUwBTa0Fwt_bLsv0iTjZZx653DAJhewZO5xaRAo6VUBgHxB-AuITJLGAVv-_TIdDGbaptrg-pK904_qKaeHh3FflIfFSJHHwFNga_3UhFBvno8h2VZkzPe", "refresh_token": "1/pPNfj8MpU_az-RSqzVzhMBvYjBuu59G-Rga_XddG3MA", "token_type": "Bearer", "expiry_date": 1508701153745 }
//   }

// /**
//  * Lists the next 10 events on the user's primary calendar.
//  *
//  * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
//  */
// function listEvents(auth) {
//     var calendar = google.calendar('v3');
//     calendar.events.list({
//       auth: auth,
//       calendarId: 'primary',
//       timeMin: (new Date()).toISOString(),
//       maxResults: 10,
//       singleEvents: true,
//       orderBy: 'startTime'
//     }, function (err, response) {
//       if (err) {
//         console.log('The API returned an error: ' + err);
//         return;
//       }
//       var events = response.items;
//       if (events.length == 0) {
//         console.log('No upcoming events found.');
//       } else {
//         console.log('Upcoming 10 events:');
//         for (var i = 0; i < events.length; i++) {
//           var event = events[i];
//           var start = event.start.dateTime || event.start.date;
//           console.log('%s - %s', start, event.summary);
//         }
//       }
//     });
//   }