request = require('request');
url = require('url');
colors = require('./googleCalendarColorService')
cheerio = require('cheerio');


function scrapeEvents(studentYear, programmeCode, callback) {
	time = new Date();
	time.setDate(time.getDate + 4)
	feritUrl = 'https://www.ferit.unios.hr/studenti/raspored-nastave-i-ispita/' +
		time.getFullYear() + '-' + (time.getMonth() + 1) +
		'-' + time.getDate() + '/' + studentYear + '-' + programmeCode;

	request.get(feritUrl, (error, response, body) => {
		//TODO: handle error
		const html = cheerio.load(body);
		let anchors = html('[target=_blank]')

		if (anchors == null || anchors == undefined) {
			return 'error with site';
		}

		anchors = anchors.toArray();

		anchors = anchors.reduce(
			(accumulator, currentValue) => {
				var href = currentValue.attribs.href;
				if (href.includes('calendar')) {
					var url_parts = url.parse(href, true);
					var query = url_parts.query;
					query = renameProperties(query)
					query = splitDates(query)
					query = parseColor(query)
					delete query.action;
					accumulator.push(query)

					return accumulator;
				}
				return accumulator;
			}, []);

		return callback(anchors);
	});

}


function scrapeEventsAsync(studentYear, programmeCode) {
	return new Promise((resolve, reject) => {
		time = new Date();
		time.setDate(time.getDate() + 4)
		feritUrl = 'https://www.ferit.unios.hr/studenti/raspored-nastave-i-ispita/' +
			time.getFullYear() + '-' + (time.getMonth() + 1) +
			'-' + time.getDate() + '/' + studentYear + '-' + programmeCode;

		request.get(feritUrl, (error, response, body) => {

			if (error !== null) return reject(error);
			
			const html = cheerio.load(body);
			let anchors = html("[href*='calendar']");
			if (anchors == null || anchors == undefined || anchors.length == 0) {
				if(feritUrl.endsWith('2-52')){
					return reject('automobilsko jos nema drugu godinu :p')
				}
				return reject(new Error('Site is not loading properly or design has changed, url=' +feritUrl));				
			}

			anchors = anchors.toArray();

			//use array map, not reduce,the if statement is no longer needed since we use a better query selector
			anchors = anchors.reduce(
				(accumulator, currentValue) => {
					var href = currentValue.attribs.href;
					if (href.includes('calendar')) {
						var url_parts = url.parse(href, true);
						var query = url_parts.query;
						query = renameProperties(query)
						query = splitDates(query)
						query = parseColor(query)
						delete query.action;
						accumulator.push(query)

						return accumulator;
					}
					return accumulator;
				}, []);

			return resolve(anchors);
		});

	});
}
// properties have wrong names, therefore we have to rename them
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
	//console.log(dates[0].substring(4, 6))
	//console.log(dates[1].substring(4, 6))
	startDate = new Date(dates[0].substring(0, 4), parseInt(dates[0].substring(4, 6)) - 1, dates[0].substring(6, 8), parseInt(dates[0].substring(9, 11)) + 1, dates[0].substring(11, 13), dates[0].substring(13, 15));
	endDate   = new Date(dates[1].substring(0, 4), parseInt(dates[1].substring(4, 6)) - 1, dates[1].substring(6, 8), parseInt(dates[1].substring(9, 11)) + 1, dates[1].substring(11, 13), dates[1].substring(13, 15));

	//console.log(startDate);
	query.start = { 'dateTime': startDate }
	query.end = { 'dateTime': endDate }
	delete query.dates

	return query;
}

function parseColor(query) {
	if (query.description.includes('Kontrolna zadaća')) {
		query.colorId = colors.kontrolna_zadaca;
	}

	//handle potential wrong function call order
	if (Object.prototype.hasOwnProperty.call(query, 'text')) {
		query = renameProperties(query)
	}

	if (query.summary.includes('predavanja')) {
		query.colorId = colors.predavanja;
	} else if (query.summary.includes('auditorne')) {
		query.colorId = colors.auditorne;
	} else if (query.summary.includes('laboratorijske')) {
		query.colorId = colors.laboratorijske;
	} else if (query.summary.includes('konstrukcijske')) {
		query.colorId = colors.konstrukcijske;
	} else if (query.summary.includes('ispitni rok')) {
		query.colorId = colors.ispitni_rok;
	} else if (query.summary.includes('Tjelesna')) {
		query.colorId = colors.ispitni_rok;
	}
	return query;
}

module.exports.scrapeEvents = scrapeEvents;
module.exports.scrapeEventsAsync = scrapeEventsAsync;
