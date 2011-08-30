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
var jsp = require("./lib/uglify-js/uglify-js").parser;
var pro = require("./lib/uglify-js/uglify-js").uglify;

utils.builddir = process.env.builddir || "build";
console.log("Build path: " + utils.builddir);

function pad(n) { return n < 10 ? "0" + n : n; }
var t = utils.startTime;
var version = (process.env.version || "7.0.0") + "." + t.getUTCFullYear() +
    pad(t.getUTCMonth()) + pad(t.getUTCDate()) + "." +
    pad(t.getUTCHours()) + pad(t.getUTCMinutes()) +
    pad(t.getUTCSeconds());
console.log("Build version: " + version);

function jsFilter(data) {
    if (process.env.debug) {
        return data;
    } else {
        var ast = jsp.parse(data);
//        ast = pro.ast_lift_variables(ast);
        ast = pro.ast_mangle(ast);
        ast = pro.ast_squeeze(ast, { dead_code: false });
        return pro.gen_code(ast);
    }
}

// default task

desc("Builds the GUI");
utils.topLevelTask("default", [], utils.summary);

utils.copy(["index.html"], {
    filter: function(data) { return data.replace(/@ version @/g, version); }
});

task("force");
file(utils.dest("index.html"), ["force"]);

utils.concat("login.js", ["lib/jquery.min.js", "lib/jquery-ui.min.js",
        "lib/jquery.plugins.js", "lib/require.js", "lib/modernizr.js",
        "lib/underscore.js", "src/util.js",
        "src/login.js"], { filter: jsFilter });

utils.concat("pre-core.js",
    utils.list("apps/io.ox/core", [
        "event.js", "extensions.js", "cache.js", "http.js",
        "config.js", "session.js",
        "desktop.js", "main.js"
    ]), { filter: jsFilter }
);

utils.copy(utils.list([".htaccess", "favicon.ico", "src/", "apps/"]));

utils.copyFile("lib/css.js", utils.dest("apps/css.js"), jsFilter);

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
