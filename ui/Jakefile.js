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
var rimraf = require("./lib/rimraf/rimraf");
var jshint = require("./lib/jshint").JSHINT;
var _ = require("./lib/underscore.js");

utils.builddir = process.env.builddir || "build";
console.info("Build path: " + utils.builddir);

function pad (n) { return n < 10 ? "0" + n : n; }
var t = utils.startTime;
var version = (process.env.version || "7.0.0") + "." + t.getUTCFullYear() +
    pad(t.getUTCMonth()) + pad(t.getUTCDate()) + "." +
    pad(t.getUTCHours()) + pad(t.getUTCMinutes()) +
    pad(t.getUTCSeconds());
console.info("Build version: " + version);

function jsFilter (data) {
    data = hint.call(this, data);
    if (process.env.debug) {
        return data;
    } else {
        // UglifyJS
        var ast = jsp.parse(data);
        ast = pro.ast_lift_variables(ast);
        ast = pro.ast_mangle(ast);
        ast = pro.ast_squeeze(ast);
        return pro.gen_code(ast);
    }
}

var core_head = fs.readFileSync("html/core_head.html", "utf8"),
    core_body = fs.readFileSync("html/core_body.html", "utf8");

function htmlFilter (data) {
    return data
        .replace(/@\s?core_head\s?@/, core_head)
        .replace(/@\s?core_body\s?@/, core_body)
        .replace(/@\s?version\s?@/g, version)
        .replace(/@base@/g, "v=" + version);
}

var jshintOptions = {
    bitwise: false,
    nomen: false,
    onevar: false,
    plusplus: false,
    regexp: false,
    white: false,
    browser: true,
    devel: true,
    evil: true,
    forin: false,
    undef: true,
    eqeqeq: true,
    immed: true,
    predef: ["$", "_", "Modernizr", "define", "require", "ox"]
};

function hint (data) {
    if (jshint(data, jshintOptions)) return data;
    console.error(jshint.errors.length + " Errors:");
    for (var i = 0; i < jshint.errors.length; i++) {
        var e = jshint.errors[i];
        if (e) {
            console.error(this.name + ":" + (e.line) + ":" +
                    (e.character + 1) + ": " + e.reason);
            console.error(e.evidence);
            console.error(Array(e.character).join(" ") + "^");
        } else {
            console.error("Fatal error");
        }
    }
    fail("JSHint error");
}

// default task

desc("Builds the GUI");
utils.topLevelTask("default", [], utils.summary);

utils.copy(utils.list([".htaccess", "blank.html", "favicon.ico", "src/"]));

// html

utils.concat("core", ["html/index.html"], { filter: htmlFilter });
utils.concat("signin", ["html/signin.html"], { filter: htmlFilter });
utils.concat("core.appcache", ["core.appcache"], { filter: htmlFilter });
utils.concat("signin.appcache", ["signin.appcache"], { filter: htmlFilter });

task("force");
file(utils.dest("core"), ["force"]);
file(utils.dest("signin"), ["force"]);
file(utils.dest("core.appcache"), ["force"]);
file(utils.dest("signin.appcache"), ["force"]);

// js

utils.concat("boot.js", ["src/util.js", "src/boot.js"],
    { to: "tmp", filter: jsFilter });

utils.concat("boot.js", ["lib/jquery.min.js", "lib/jquery-ui.min.js",
        "lib/require.js", "lib/modernizr.js", "lib/underscore.js", "lib/jquery.plugins.js",
        "tmp/boot.js"]);

utils.concat("pre-core.js",
    utils.list("apps/io.ox/core", [
        "event.js", "extensions.js", "cache.js", "http.js",
        "config.js", "session.js",
        "desktop.js", "main.js"
    ]), { filter: jsFilter }
);

var apps = _.groupBy(utils.list("apps/"),
    function (f) { return /\.js$/.test(f) ? "js" : "rest"; });
utils.copy(apps.js, { filter: jsFilter });
utils.copy(apps.rest);

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
docFile("external", "External Libs");
docFile("features", "Features");
docFile("vgrid", "VGrid");

var indexFiles = ["lib/header.html", "index.html",
    { getData: function() { return titles.join("\n"); } }, "lib/footer.html"];
indexFiles.dir = "doc";
utils.concat("doc/index.html", indexFiles);

utils.copy(utils.list("doc/lib", ["prettify.*", "default.css"]),
           { to: utils.dest("doc") });
utils.copyFile("lib/jquery.min.js", utils.dest("doc/jquery.min.js"));

// clean task

task("clean", [], function() {
    rimraf("tmp", function() { rimraf(utils.builddir, complete); });
}, true);
