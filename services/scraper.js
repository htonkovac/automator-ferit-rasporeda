request = require('request');
url = require('url');
colors = require('./googleCalendarColorService')
cheerio = require('cheerio');


function scrapeEvents(callback)	 {

request.get('https://www.ferit.unios.hr/studenti/raspored-nastave-i-ispita/2017-10-17/3-21/#Uto', (error, response, body) => {
//TODO: handle error


const html = cheerio.load(body);
let anchors = html('[target=_blank]')

if(anchors == null || anchors == undefined) {

	return 'error with site';	
}

anchors = anchors.toArray();

anchors = anchors.reduce( (accumulator, currentValue) => {

	var href = currentValue.attribs.href;

	if(href.includes('calendar')) {
		var url_parts = url.parse(href, true);
		var query = url_parts.query;
		query = renameProperties(query)
		query = splitDates(query)
		query = parseColor(query)
	//	console.log(query)
		delete query.action;
		accumulator.push(query)

		return accumulator;
	} 
		
		return accumulator;

}, []);

return callback(anchors);
});

}

// properties use inconsistent names, therefore we have to rename them
function renameProperties(query) {
		Object.defineProperty(query, 'summary',
      	Object.getOwnPropertyDescriptor(query, 'text'));
   		delete query['text'];

		Object.defineProperty(query, 'description',
      	Object.getOwnPropertyDescriptor(query, 'details'));
   		delete query['details'];

   		return query;
}

function splitDates(query) {
		dates = query.dates.split("/")
console.log(dates[0].substring(4,6))
console.log(dates[1].substring(4,6))
		startDate = new Date(dates[0].substring(0,4),parseInt(dates[0].substring(4,6))-1,dates[0].substring(6,8),parseInt(dates[0].substring(9,11))+2,dates[0].substring(11,13),dates[0].substring(13,15));
		endDate = new Date(dates[1].substring(0,4),parseInt(dates[1].substring(4,6))-1,dates[1].substring(6,8),parseInt(dates[1].substring(9,11))+2,dates[1].substring(11,13),dates[1].substring(13,15));

console.log(startDate);
		query.start = {'dateTime':startDate}
		query.end = {'dateTime':endDate}
		delete query.dates

		return query;
}

function parseColor(query) {
	if(query.description.includes('Kontrolna zadaća')) {
		query.colorId = colors.kontrolna_zadaca;
	}

	//handle potential wrong function call order
	if(Object.prototype.hasOwnProperty.call(query,'text')) {
		query = renameProperties(query)
	}

	if(query.summary.includes('predavanja')) {
		query.colorId = colors.predavanja;
	} else if(query.summary.includes('auditorne')) {
		query.colorId = colors.auditorne;
	} else if(query.summary.includes('laboratorijske')) {
		query.colorId = colors.laboratorijske;
	} else if(query.summary.includes('kontstrukcijske')) {
		query.colorId = colors.kontstrukcijske;
	} else if(query.summary.includes('ispitni rok')) {
		query.colorId = colors.ispitni_rok;
	}

return query;
}

module.exports.scrapeEvents = scrapeEvents;