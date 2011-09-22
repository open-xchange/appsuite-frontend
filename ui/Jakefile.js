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
var ast = require("./lib/build/ast");
var i18n = require("./lib/build/i18n");
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

var debug = Boolean(process.env.debug);
if (debug) console.info("Debug mode: on");

function jsFilter (data) {
    data = hint.call(this, data);
    var ast = jsp.parse(data, false, true);
    
    i18n.potScan(this.name, ast);
    
    // UglifyJS
    if (debug) return data;
    ast = pro.ast_lift_variables(ast);
    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);
    return pro.gen_code(ast);
}
utils.addFilter("source", jsFilter);

var core_head = fs.readFileSync("html/core_head.html", "utf8"),
    core_body = fs.readFileSync("html/core_body.html", "utf8");

core_body.replace(/data-i18n="([^"]*)"/g, function(match, msgid) {
    i18n.addMessage({ msgid: msgid });
});


function htmlFilter (data) {
    return data
        .replace(/@\s?core_head\s?@/, core_head)
        .replace(/@\s?core_body\s?@/, core_body)
        .replace(/@\s?version\s?@/g, version)
        .replace(/@base@/g, "v=" + version);
}

var jshintOptions = {
    bitwise: false,
    browser: true,
    devel: true,
    eqeqeq: true,
    evil: true,
    forin: false,
    immed: true,
    nomen: false,
    onevar: false,
    plusplus: false,
    regexp: false,
    trailing: true,
    undef: true,
    white: false,
    predef: ["$", "_", "Modernizr", "define", "require", "ox", "initializeAndDefine"]
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
utils.topLevelTask("default", ["i18n/ox.pot"], utils.summary);

utils.copy(utils.list("html", [".htaccess", "blank.html", "favicon.ico"]));
utils.copy(utils.list("src/"));

// i18n

directory("i18n");
file("i18n/ox.pot", ["i18n", "Jakefile.js"], function() {
    fs.writeFile(this.name, i18n.generatePOT(this.prereqs.slice(2)));
});

directory("tmp/pot");
utils.addHandler("source", function(filename) {
    var dest = "tmp/pot/" + filename.replace(/\+/g, "++").replace(/\//g, "+-");
    file("i18n/ox.pot", [dest]);
    file(dest, ["tmp/pot", filename], function() {
        if (filename in i18n.potFiles) {
            var data = JSON.stringify(i18n.potFiles[filename] || {});
            fs.writeFileSync(this.name, data);
        }
    });
});

// l10n

utils.copy(utils.list("i18n", "*.po"), {
    to: utils.dest("l10n"),
    filter: function(data) { return JSON.stringify(i18n.parsePO(data)); },
    mapper: function(name) { return name.replace(/\.po$/, ".json"); }
});

// html

utils.concat("core", ["html/index.html"], { filter: htmlFilter });
utils.concat("signin", ["html/signin.html"], { filter: htmlFilter });
utils.concat("core.appcache", ["html/core.appcache"], { filter: htmlFilter });
utils.concat("signin.appcache", ["html/signin.appcache"], { filter: htmlFilter });

task("force");
file(utils.dest("core"), ["force"]);
file(utils.dest("signin"), ["force"]);
file(utils.dest("core.appcache"), ["force"]);
file(utils.dest("signin.appcache"), ["force"]);

// js

utils.concat("boot.js", ["lib/jquery.plugins.js", "src/util.js", "src/boot.js"],
    { to: "tmp", type: "source" });

utils.concat("boot.js", ["lib/jquery.min.js", "lib/jquery-ui.min.js",
        "lib/require.js", "lib/modernizr.js", "lib/underscore.js",
        "tmp/boot.js"]);

utils.concat("pre-core.js",
    utils.list("apps/io.ox/core", [
        "event.js", "extensions.js", "cache.js", "http.js",
        "config.js", "session.js", "gettext.js",
        "desktop.js", "main.js"
    ]), { type: "source" }
);

var apps = _.groupBy(utils.list("apps/"),
    function (f) { return /\.js$/.test(f) ? "js" : "rest"; });
utils.copy(apps.js, { type: "source" });
utils.copy(apps.rest);

utils.copyFile("lib/css.js", utils.dest("apps/css.js"), { type: "source" });

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
docFile("libs", "External Libs");
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

desc("Removes all generated files");
task("clean", [], function() {
    if (path.existsSync("i18n/ox.pot")) fs.unlinkSync("i18n/ox.pot");
    rimraf("tmp", function() { rimraf(utils.builddir, complete); });
}, true);

// msgmerge task

desc("Updates all .po files with the generated ox.pot");
task("merge", ["i18n/ox.pot"], function() {
    var files = _.without(utils.list("i18n/*.po"), "i18n/en_US.po");
    var count = files.length;
    for (var i = 0; i < files.length; i++) {
        utils.exec("msgmerge",
            ["-Us", "--backup=none", files[i], "i18n/ox.pot"],
            function() { if (!--count) complete(); });
    }
}, true);
