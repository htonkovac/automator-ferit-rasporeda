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