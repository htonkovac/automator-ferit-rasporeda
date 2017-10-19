programmeCodeService = require('./programmeCodeService')


class LinkGenerator extends Date{
constructor(yearOfCollege, programme) {
    super()
    this.baseLink = 'http://www.etfos.unios.hr/studenti/raspored-nastave-i-ispita/'
    this.yearOfCollege = yearOfCollege
    this.prog = programme
}
getLink(){
    return this.baseLink + this.getFormatedDate()+'/'+this.yearOfCollege +'-'+this.getProgrammeCode()
}

getFormatedDate() {
    return this.getFullYear()+'-'+(this.getMonth()+1)+'-'+this.getDate()
}

getProgrammeCode() {
    return programmeCodeService[this.prog]
}

}

module.exports = LinkGenerator