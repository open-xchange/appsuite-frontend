var jsdom = require("/Users/tobiasprinz/dev/jsdom");
var jq
var help_loc = '/Users/tobiasprinz/dev/admin-manual/guides-ox7/trunk/de/html/OX7-User-Guide-German/ox.ox7.user.chap.email.html';

jsdom.env("http://nodejs.org/dist/", [
  'http://code.jquery.com/jquery-1.5.min.js'
],
function(errors, window) {
  console.log("there have been", window.$("a").length, "nodejs releases!");
});


jsdom.env({
    html: help_loc,
    scripts: [
        'http://code.jquery.com/jquery-1.5.min.js'
    ],
    done: function(errors, window) {
        var $ = window.$;
        $('span[class="sect1"]/a').each(function() {
            console.log('-', $(this).val());
        });
    }
});
