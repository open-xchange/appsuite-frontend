var _ = require('../underscore');
var jsdom = require("../jsdom");
var fs = require('fs');
var utils = require("./fileutils");
var util = require("util");

var numberOfFilesRead = 0, expectedNumberOfFilesRead = 0;
var doc2ox, doc2html;

/** Merges the maps of gui ids, documentation ids and documentation text so that a gui id points to a documentation text snippet */
var merge = function (doc2ox, doc2html) {
    var merged = {};
    _(_(doc2html).keys()).each( function (key) {
        var oxId = doc2ox[key];
        if (oxId) {
            var htmlSnippet = doc2html[key];
            merged[oxId] = htmlSnippet;
        }
    });
    return merged;
}

/** Reads all help file names from a directory */
var getFiles = function (directory) {
    var files = fs.readdirSync(directory);
    var filtered = _(files).filter(function (filename) { return filename.length > 10 && filename.substring(filename.length-5) === '.html' && filename.substring(0,2) === 'ox';});
    expectedNumberOfFilesRead = filtered.length;
    return filtered.map( function (shortname) {
        return directory + shortname;
    })    
    
};

/** Prints the text of an extension point for documentation popups */
var buildExtension = function () {
    if(!doc2ox || numberOfFilesRead != expectedNumberOfFilesRead) {
        return;
    }
    var nodes = merge(doc2ox, doc2html);
    var extension = '/**\n' +
        '* All content on this website (including text, images, source\n' +
        '* code and any other original works), unless otherwise noted,\n' +
        '* is licensed under a Creative Commons License.\n' +
        '*\n' +
        '* http://creativecommons.org/licenses/by-nc-sa/2.5/\n' +
        '*\n' +
        '* Copyright (C) Open-Xchange Inc., 2006-2012\n' +
        '* Mail: info@open-xchange.com\n' +
        '*\n' +
        '* @author document.js build task\n' +
        '*/\n' +
        'define("io.ox/help/core_doc",  ["io.ox/core/extensions"], function (ext) {\n' +
        '    "use strict";\n' +
        '    var help = ' + JSON.stringify(nodes, null, 8).replace(/\}$/,"    }") + ';\n' +
        '    ext.point("io.ox/help/helper").extend({\n'+
        '        id: "Core documentation",\n'+
        '        get: function (id) {\n'+
        '            if (help[id]) {\n'+
        '                return help[id];\n'+
        '            }\n'+
        '            return;\n'+
        '        },\n'+
        '        has: function (id) {\n'+
        '            return help.hasOwnProperty(id);\n'+
        '        }\n'+
        '    });\n'+
        '});\n';
    console.log(extension);
};

/** Reads document snippets from a list of files */
var getDocumentation = function (files) {
    doc2html = {};
    _(files).each(function (help_loc) {
        var fileContent =  fs.readFileSync(help_loc, 'ascii');
        jsdom.env(fileContent, ['http://code.jquery.com/jquery-1.5.min.js'], function(errors, window) {
            if (errors) {
                console.log("[Get documentation]", errors);
                process.exit(1);
            }
            var $ = window.$;

            _($.find('a[name]')).each(function (elem) {
                $elem = $(elem);
                if($elem.attr('name').indexOf('ox') == 0) {
                    var id = $elem.attr('name');
                    var content = $(elem).parent().html().trim();
                    doc2html[id] = content;
                }
            });
            numberOfFilesRead++;
            buildExtension();
        });
    });
};

/** Reads id mappings from Harry's csv */
var getMapping = function () {
    doc2ox = {};
    var data = fs.readFileSync('/Users/tobiasprinz/dev/ox7-map-dataref-ids.csv', 'ascii');
    var lines = data.split("\n");
    _(lines).each(function (line) {
        cols = line.split(";");
        if(cols.length === 3) {
            var key = cols[2].substring(1, cols[2].length-1);
            var value = cols[1].substring(1, cols[1].length-1);
            doc2ox[key] = value;
        }
    });
    buildExtension();
};


getDocumentation (getFiles ('/Users/tobiasprinz/dev/admin-manual/guides-ox7/trunk/de/html/OX7-User-Guide-German/'));
getMapping();