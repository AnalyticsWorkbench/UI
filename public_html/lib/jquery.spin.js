/**
 * Created with IntelliJ IDEA.
 * User: verheyen
 * Date: 23.02.13
 * Time: 20:39
 * To change this template use File | Settings | File Templates.
 */
//from http://fgnass.github.com/spin.js/    (MIT Licence)
$.fn.spin = function (opts) {
    this.each(function () {
        var $this = $(this),
            data = $this.data();
        if (data.spinner) {
            data.spinner.stop();
            delete data.spinner;
        }
        if (opts !== false) {
            data.spinner = new Spinner($.extend({color: $this.css('color')}, opts)).spin(this);
        }
    });
    return this;
};