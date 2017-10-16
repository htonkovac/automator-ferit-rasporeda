request = require('request');
var url = require('url');

cheerio = require('cheerio');


request.get('https://www.ferit.unios.hr/studenti/raspored-nastave-i-ispita/2017-10-16/3-21/#Pon', function (error, response, body) {
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

		accumulator.push(query)

		return accumulator;
	} 
		
		return accumulator;

}, []);


console.log(anchors)
});

module.exports = exports;