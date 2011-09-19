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

var defineWalker = ast("define").asCall().walker();
var gtWalker = ast("gt").any("gt").asCall().walker();
var gtMethodWalker = ast("gt.gt").any("gt").asCall().walker();
var getGt = ast("gt").asCall().getter("gt");
var getMethod = ast("gt.gt").asCall().getter("gt");
var getStr = ast("'str'").getter("str");

var potHeader = 'msgid ""\nmsgstr ""\n' +
    '"Project-Id-Version: Open-Xchange 6\\n"\n' +
    '"POT-Creation-Date: DATE\\n"\n' +
    '"PO-Revision-Date: DATE\\n"\n' +
    '"Last-Translator: NAME <EMAIL>\\n"\n' +
    '"Language-Team: NAME <EMAIL>\\n"\n' +
    '"MIME-Version: 1.0\\n"\n' +
    '"Content-Type: text/plain; charset=UTF-8\\n"\n' +
    '"Content-Transfer-Encoding: 8bit\\n"\n' +
    '"Plural-Forms: nplurals=INTEGER; plural=EXPRESSION;\\n"\n';

var gtMethods = {
       gettext: ["msgid"],
      pgettext: ["msgctxt", "msgid"],
     dpgettext: [, "msgctxt", "msgid"],
      ngettext: ["msgid", "msgid_plural", , ],
     npgettext: ["msgctxt", "msgid", "msgid_plural", , ],
    dnpgettext: [, "msgctxt", "msgid", "msgid_plural", , ]
};

var pot = {};

function addMessage(node, method) {
    var args = node[2];
    if (args.length != method.length) return;
    var msg = { comments: _.pluck(node[0].start.comments_before, "value") };
    for (var i = 0; i < method.length; i++) if (method[i]) {
        msg[method[i]] = getStr(args[i]);
    }
    
    var key = msg.msgid;
    if (msg.msgid_plural) key += "\x01" + msg.msgid_plural;
    if (msg.msgctxt) key = msg.msgctxt + "\0" + key;
    
    if (key in pot) {
        if (!deepEqual(pot[key].comments, msg.comments)) {
            throw new Error("Different comments for the same text");
        }
    } else {
        pot[key] = msg;
    }
    return pro.MAP.skip;
}

function potScan(tree) {
    ast.scanner(defineWalker, function(scope) {
        if (scope.refs.define !== undefined) return;
        var args = this[2];
        var deps = _.detect(args, ast.is("array"));
        var f = _.detect(args, ast.is("function"));
        if (!deps || !f) return;
        var gtIndex = _.indexOf(_.pluck(deps[1], 1), "gettext");
        if (gtIndex < 0) return;
        var gtName = f[2][gtIndex];
        var gtScope = f[3].scope;
        ast.scanner(gtWalker, function(scope) {
            if (getGt(this) != gtName) return;
            if (scope.refs[gtName] != gtScope) return;
            return addMessage(this, gtMethods.gettext);
        }).scanner(gtMethodWalker, function(scope) {
            if (getMethod[0](this) != gtName) return;
            if (scope.refs[gtName] != gtScope) return;
            var method = gtMethods[getMethod[1](this)];
            if (!method) return;
            return addMessage(this, method);
        }).scan(f);
        return pro.MAP.skip;
    }).scan(pro.ast_add_scope(tree));
}

function escapePO(s) {
    return s.replace(/[\x00-\x1f\\"]/g, function(c) {
        var n = Number(c.charCodeAt(0)).toString(16);
        return "\\u00" + (n.length < 2 ? "0" + n : n);
    });
}

function generatePOT() {
    var f = [potHeader];
    for (var i in pot) {
        msg = pot[i];
        for (var j = 0; j < msg.comments.length; j++) {
            f.push(_.map(msg.comments[j].split("\n"),
                         function(s) { return "#" + s; }));
        }
        if (msg.msgctxt) f.push('msgctxt "' + escapePO(msg.msgctxt) + '"');
        f.push('msgid "' + escapePO(msg.msgid) + '"');
        if (msg.msgid_plural) {
            f.push('msgid_plural "' + escapePO(msg.msgid_plural) + '"');
            f.push('msgstr[0] ""\nmsgstr[1] ""\n');
        } else {
            f.push('msgstr ""\n');
        }
    }
    return f.join("\n");
}

function jsFilter (data) {
    data = hint.call(this, data);
    if (process.env.debug || true) {
        return data;
    } else {
        // UglifyJS
        var ast = jsp.parse(data, false, true);
        potScan(ast);
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
utils.topLevelTask("default", [], function() {
    fs.writeFile("ox.pot", generatePOT());
    utils.summary();
});

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
