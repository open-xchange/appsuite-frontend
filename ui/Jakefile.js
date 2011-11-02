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
var _ = require("./lib/underscore.js");
var jsp = require("./lib/uglify-js/uglify-js").parser;
var pro = require("./lib/uglify-js/uglify-js").uglify;
var ast = require("./lib/build/ast");
var i18n = require("./lib/build/i18n");
var rimraf = require("./lib/rimraf/rimraf");
var jshint = require("./lib/jshint").JSHINT;
var less = require("./lib/less.js/lib/less/index");
var myless = require("./lib/build/less");

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

var defineWalker = ast("define").asCall().walker();
function jsFilter (data) {
    var self = this;
    
    if (data.substr(0, 11) !== "//#NOJSHINT") {
        data = hint.call(this, data, this.getSrc);
    }
    
    var tree = jsp.parse(data, false, true);
    var defineHooks = this.type.getHooks("define");
    tree = ast.scanner(defineWalker, function(scope) {
        if (scope.refs.define !== undefined) return;
        var args = this[2];
        var name = _.detect(args, ast.is("string"));
        var deps = _.detect(args, ast.is("array"));
        var f = _.detect(args, ast.is("function"));
        if (!name || !deps || !f) return;
        for (var i = 0; i < defineHooks.length; i++) {
            defineHooks[i].call(self, name, deps, f);
        }
    }).scan(pro.ast_add_scope(tree));
    
    // UglifyJS
    if (debug) return data;
    tree = pro.ast_lift_variables(tree);
    tree = pro.ast_mangle(tree);
    tree = pro.ast_squeeze(tree);
    // use split_lines
    return pro.split_lines(pro.gen_code(tree), 500);
}
utils.fileType("source").addHook("filter", jsFilter)
    .addHook("define", i18n.potScanner);

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
    browser: true,
    debug: true,
    devel: true,
    eqeqeq: true,
    evil: true,
    forin: false,
    immed: true,
    nomen: false,
    onevar: false,
    plusplus: false,
    regexp: false,
    strict: true,
    trailing: true,
    undef: true,
    white: !debug,
    loopfunc: false,
    predef: ["$", "_", "Modernizr", "define", "require", "ox", "initializeAndDefine"]
};

function hint (data, getSrc) {
    if (jshint(data, jshintOptions)) return data;
    console.error(jshint.errors.length + " Errors:");
    for (var i = 0; i < jshint.errors.length; i++) {
        var e = jshint.errors[i];
        if (e) {
            var src = getSrc(e.line);
            console.error(src.name + ":" + (src.line) + ":" +
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
utils.topLevelTask("default", ["ox.pot"], function() {
    utils.includes.save();
    i18n.modules.save();
    utils.summary();
});

i18n.modules.load("tmp/i18n.json");
utils.includes.load("tmp/includes.json");

utils.copy(utils.list("html", [".htaccess", "blank.html", "favicon.ico"]));
utils.copy(utils.list("src/"));

// i18n

file("ox.pot", ["Jakefile.js"], function() {
    fs.writeFile(this.name, i18n.generatePOT(this.prereqs.slice(1)));
});

directory("tmp/pot");
utils.fileType("source").addHook("handler", i18n.potHandler);
utils.fileType("module").addHook("handler", i18n.potHandler);

(function() {
    var body_lines = core_body.split(/\r?\n|\r/);
    for (var i = 0; i < body_lines.length; i++) {
        body_lines[i].replace(/data-i18n="([^"]*)"/g, function(match, msgid) {
            i18n.addMessage({
                msgid: msgid,
                locations: [{ name: "html/core_body.html", line: i + 1 }]
            }, "html/core_body.html");
        });
    }
    i18n.modules.add("io.ox/core/login", "html/core_body.html",
                     "html/core_body.html");
})();

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

utils.concat("boot.js", ["lib/jquery.plugins.js", "lib/jquery.tokeninput.js", "src/util.js", "src/boot.js"],
    { to: "tmp", type: "source" });

utils.copy(utils.list("src", "css.js"), {
    to: "tmp", type: "source", filter: function(data) {
        var dest = this.task.name;
        utils.includes.set(dest, []);
        var dir = "lib/less.js/lib/less";
        return data.replace(/\/\/@include\s+(.*)$/gm, function(m, name) {
            return utils.list(dir, name).map(function(file) {
                var include = path.join(dir, file);
                utils.includes.add(dest, include);
                return fs.readFileSync(include, "utf8");
            }).join("\n");
        });
    }
});

utils.concat("boot.js", ["lib/jquery.min.js",
        "lib/require.js", "lib/modernizr.js", "lib/underscore.js",
        "tmp/css.js", utils.string("\n"), "tmp/boot.js"]);

utils.concat("pre-core.js",
    utils.list("apps/io.ox/core", [
        "event.js", "extensions.js", "cache.js", "http.js",
        "config.js", "session.js", "gettext.js", "i18n.js",
        "api/factory.js", "api/user.js", "api/resource.js", "api/group.js",
        "api/folder.js", "collection.js", "desktop.js", "main.js"
    ]), { type: "source" }
);

// module dependencies

var moduleDeps = {};
var depsPath = utils.dest("dependencies.json");

utils.fileType("module").addHook("filter", jsFilter)
    .addHook("define", i18n.potScanner)
    .addHook("define", function(name, deps, f) {
        moduleDeps[name] = _.pluck(deps[1], 1);
    })
    .addHook("handler", function(name) { file(depsPath, [name]); });

utils.concat("dependencies.json", [{
    getData: function() {
        if (path.existsSync(depsPath)) {
            var oldFile = fs.readFileSync(depsPath, "utf8");
            if (oldFile) {
                var oldDeps = JSON.parse(oldFile);
                for (var i in oldDeps) {
                    if (!(i in moduleDeps) &&
                        path.existsSync(path.join("apps", i + ".js")))
                    {
                        moduleDeps[i] = oldDeps[i];
                    }
                }
            }
        }
        return JSON.stringify(moduleDeps);
    }
}], { filter: _.identity }); // prevents binary mode, which erases target before calling getData

// apps

var apps = _.groupBy(utils.list("apps/"), function (f) {
    var match = /\.(js)$/.exec(f);
    return match && match[1] || "rest";
});
if (apps.js) utils.copy(apps.js, { type: "module" });
if (apps.rest) utils.copy(apps.rest);

// precompute themes

_.each(utils.list("apps/themes/*/dynamic.less"), function(theme) {
    utils.concat(theme.replace(/\.less$/, ".css"),
        [theme.replace(/\/dynamic\.less$/, "/definitions.less"), theme],
        { type: "less" });
});

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
docFile("demo", "Demo Steps");
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
task("merge", ["ox.pot"], function() {
    var files = _.without(utils.list("i18n/*.po"), "i18n/en_US.po");
    var count = files.length;
    for (var i = 0; i < files.length; i++) {
        utils.exec("msgmerge",
            ["-Us", "--backup=none", files[i], "ox.pot"],
            function() { if (!--count) complete(); });
    }
}, true);
