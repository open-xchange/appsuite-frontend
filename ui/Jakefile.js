/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 * 
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * 
 * Copyright (C) Open-Xchange Inc., 2011 Mail: info@open-xchange.com
 * 
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

var fs = require("fs");
var path = require("path");
var utils = require("./lib/build/fileutils");

utils.builddir = process.env.builddir || "build";
console.log("Build path: " + utils.builddir);

function pad(n) { return n < 10 ? "0" + n : n; }
var t = utils.startTime;
var version = (process.env.version || "7.0.0") + "." + t.getUTCFullYear() +
    pad(t.getUTCMonth()) + pad(t.getUTCDate()) + "." +
    pad(t.getUTCHours()) + pad(t.getUTCMinutes()) +
    pad(t.getUTCSeconds());
console.log("Build version: " + version);

// default task

desc("Builds the GUI");
utils.topLevelTask("default", [], utils.summary);

utils.concat("login.js", ["lib/jquery.min.js", "lib/jquery-ui.min.js",
        "lib/jquery.plugins.js", "lib/require.js", "lib/modernizr.js",
        "src/tk/grid.js", "src/tk/selection.js", "src/login.js"]);

utils.concat("pre-core.js", utils.list("apps/io.ox/core", ["config.js",
        "base.js", "http.js", "event.js", "extensions.js", "cache.js",
        "main.js"]));

utils.copy(utils.list([".htaccess", "src/", "apps/"]));

utils.copy(["index.html"], {
    filter: function(data) { return data.replace("@ version @", version); }
});

utils.copyFile("lib/css.js", utils.dest("apps/css.js"));

// doc task

desc("Developer documentation");
utils.topLevelTask("doc", [], utils.summary);

var titles = [];
function docFile(file, title) {
    filename = "doc/" + file + ".html";
    utils.concat(filename, ["doc/lib/header.html", filename,
                            "doc/lib/footer.html"]);
    titles.push('<a href="' + file +'.html">' + title + '</a><br/>');
}

docFile("apache", "Apache Configuration");
docFile("extensions", "Extension Points");
docFile("features", "Features");
docFile("vgrid", "VGrid");

var indexFiles = ["lib/header.html", "index.html",
    { getData: function() { return titles.join("\n"); } }, "lib/footer.html"];
indexFiles.dir = "doc";
utils.concat("doc/index.html", indexFiles);

utils.copy(utils.list("doc/lib", ["prettify.*", "default.css"]),
           { to: utils.dest("doc") });
utils.copyFile("lib/jquery.min.js", utils.dest("doc/jquery.min.js"));
