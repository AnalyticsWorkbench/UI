module.exports = util = {

    parseDate: function (dateString) {
        var year = Number(dateString.substring(0,4));
        var month = Number(dateString.substring(4,6)) - 1;
        var day = Number(dateString.substring(6,8));
        var hours = Number(dateString.substring(8,10));
        var minutes = Number(dateString.substring(10,12));
        var seconds = Number(dateString.substring(12,14));
        var date = new Date();
        date.setUTCFullYear(year);
        date.setUTCMonth(month);
        date.setUTCDate(day);
        date.setUTCHours(hours);
        date.setUTCMinutes(minutes);
        date.setUTCSeconds(seconds);
        return date;
    }

}
