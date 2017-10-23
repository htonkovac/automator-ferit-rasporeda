let CronJob = require('cron').CronJob;
const express = require('express')
const app = express()


let job = new CronJob({
  cronTime: '10 * * * * *',
  onTick: function() {
    console.log('cron running',(new Date()).toLocaleString());
  },
  start: false,
  timeZone: 'America/Los_Angeles'
});
job.start();



app.get('/', function (req, res) {
  res.send('Hello World!')
  console.log('someone hit our site!')
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

