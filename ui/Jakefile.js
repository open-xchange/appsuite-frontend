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
if (fs.existsSync) path.existsSync = fs.existsSync;

var http = require("http");
var readline = require('readline');
var util = require("util");
var utils = require("./lib/build/fileutils");
var _ = require("./lib/underscore.js");
var jsp = require("./lib/uglify-js/uglify-js").parser;
var pro = require("./lib/uglify-js/uglify-js").uglify;
var ast = require("./lib/build/ast");
var i18n = require("./lib/build/i18n");
var rimraf = require("./lib/rimraf/rimraf");
var jshint = require("./lib/jshint").JSHINT;
var less = require('./lib/less.js/lib/less/index.js');

console.info('Node version:', process.version);
console.info("Build path: " + utils.builddir);

var pkgName = process.env['package'];
var ver = process.env.version;
var rev = process.env.revision;

if ((!pkgName || !ver || !rev) && path.existsSync('debian/changelog')) {
    var changelogEntry = /(\S+) \((\S+)-(\d+)\)/.exec(
        fs.readFileSync('debian/changelog', 'utf8'));
    pkgName = pkgName || changelogEntry[1];
    ver = ver || changelogEntry[2];
    rev = rev || changelogEntry[3];
}

if (!pkgName) {
    console.error('Please specify the package name using package=<NAME>');
    process.exit(1);
}
ver = ver || "0.0.1";
rev = rev || "1";

function pad (n) { return n < 10 ? "0" + n : n; }
var t = utils.startTime;
version = ver + "-" + rev + "." + t.getUTCFullYear() +
    pad(t.getUTCMonth() + 1) + pad(t.getUTCDate()) + "." +
    pad(t.getUTCHours()) + pad(t.getUTCMinutes()) +
    pad(t.getUTCSeconds());
console.info("Build version: " + version);

function envBoolean(name) {
    return /^\s*(?:on|yes|true|1)/i.test(process.env[name]);
}

var debug = envBoolean('debug');
var disableStrictMode = envBoolean('disableStrictMode');

if (debug) console.info("Debug mode: on");

utils.fileType("source").addHook("filter", utils.includeFilter);
utils.fileType("module").addHook("filter", utils.includeFilter);

// In case of parse errors, the actually parsed source is stored
// in tmp/errorfile.js
function catchParseErrors(f, data, name) {
    try {
        return f(data);
    } catch (e) {
        fs.writeFileSync('tmp/errorfile.js', data, 'utf8');
        fail('Parse error in ' + name + ' at ' + e.line + ':' +
             e.col + '\n' + e.message);
    }
}

// parses a string of JavaScript
function parse(data, name) {
    return catchParseErrors(function (data) {
        return jsp.parse(data, false, true);
    }, data, name);
}

var defineWalker = ast("define").asCall().walker();
var defineAsyncWalker = ast("define.async").asCall().walker();
var assertWalker = ast("assert").asCall().walker();
function jsFilter (data) {
    var self = this;
    if (data.substr(0, 11) !== "// NOJSHINT") {
        data = hint.call(this, data, this.getSrc);
    }

    // Check for NBSPs, Eclipse doesn't like them
    if (data.indexOf('\xa0') >= 0) {
        _.each(data.split(/\r\n?|\n/), function (line, lineno) {
            var col = line.indexOf('\xa0');
            if (col < 0) return;
            var pos = self.getSrc(lineno + 1);
            console.warn('Warning: NBSP in ' + pos.name + ' at ' + pos.line +
                         ':' + (col + 1));
        });
    }

    var tree = parse(data, self.task.name);

    // Custom processing of the parsed AST

    var defineHooks = this.type.getHooks("define");
    var tree2 = ast.scanner(defineWalker, defineHandler)
                   .scanner(defineAsyncWalker, defineHandler);
    if (disableStrictMode) {
        tree2 = tree2.scanner({
            name: 'function',
            matcher: strictModeMatcher
        }, strictModeHandler).scanner({
            name: 'defun',
            matcher: strictModeMatcher
        }, strictModeHandler);
    }
    if (!debug) tree2 = tree2.scanner(assertWalker, assertHandler);
    tree = tree2.scan(pro.ast_add_scope(tree));

    function defineHandler(scope) {
        if (scope.refs.define !== undefined) return;
        var args = this[2];
        var name = _.detect(args, ast.is("string"));
        var filename = self.getSrc(this[0].start.line).name;
        var mod = filename.slice(5, -3);
        if (filename.slice(0, 5) === 'apps/' && (!name || name[1] !== mod)) {
            if (name === undefined) {
                var newName = parse('(' + JSON.stringify(mod) + ')',
                                    self.task.name)[1][0][1];
                return [this[0], this[1], [newName].concat(args)];
            } else {
                fs.writeFileSync('tmp/errorfile.js', data, 'utf8');
                fail('Invalid module name: ' + (name ? name[1] : "''") +
                    ' should be ' + mod);
            }
        }
        var deps = _.detect(args, ast.is("array"));
        if (deps) {
            _.each(deps[1], function(dep) {
                dep = dep[1];
                if (dep.slice(0, 5) !== 'less!') return;
                dep = dep.slice(5);
                if (!path.existsSync(path.join('apps', dep))) {
                    console.warn('Warning: Missing LessCSS file ' + dep +
                                 ' required by ' + mod);
                }
            });
        }
        var f = _.detect(args, ast.is("function"));
        if (!name || !deps || !f) return;
        for (var i = 0; i < defineHooks.length; i++) {
            defineHooks[i].call(self, name, deps, f);
        }
    }
    function assertHandler(scope) {
        if (scope.refs.assert === undefined) return ['num', 0];
    }
    function strictModeMatcher(tree) {
        return tree[3] && tree[3][0] && tree[3][0][0] == 'stat' &&
            tree[3][0][1] && tree[3][0][1][0] == 'string' &&
            tree[3][0][1][1] == 'use strict';
    }
    function strictModeHandler(scope, walk) {
        this[3][0][1][1] = 'no strict';
        return [this[0], this[1], this[2].slice(), pro.MAP(this[3], walk)];
    }

    // UglifyJS
    if (!disableStrictMode) {
        if (debug) return data.slice(-1) === '\n' ? data : data + '\n';
        tree = pro.ast_lift_variables(tree);
        tree = pro.ast_mangle(tree);
        tree = pro.ast_squeeze(tree, { make_seqs: false });
    }

    // use split_lines
    return catchParseErrors(function (data) {
        return pro.split_lines(data, 500);
    }, pro.gen_code(tree, { beautify: debug })) + ';';
}

utils.fileType("source").addHook("filter", jsFilter)
    .addHook("define", i18n.potScanner);

var jshintOptions = {
    bitwise: false,
    browser: true,
    debug: debug,
    devel: true,
    eqeqeq: true,
    evil: true,
    forin: false,
    immed: true,
    loopfunc: false,
    nomen: false,
    onevar: false,
    plusplus: false,
    regexp: false,
    regexdash: true,
    shadow: true,
    strict: true,
    trailing: true,
    undef: true,
    validthis: true,
    white: true, // THIS IS TURNED ON - otherwise we have too many dirty check-ins
    predef: ['$', '_', 'Modernizr', 'define', 'require', 'requirejs', 'ox', 'assert',
             'include', 'doT', 'Backbone', 'BigScreen', 'MediaElementPlayer', 'tinyMCE']
};

function hint (data, getSrc) {
    if (jshint(data, jshintOptions)) return data;
    fs.writeFileSync('tmp/errorfile.js', data, 'utf8');
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

//default task

desc('Builds the GUI');
utils.topLevelTask('default', ['buildApp'], function() {
    utils.summary('default')();
});

utils.copy(utils.list("html", [".htaccess", "blank.html", "busy.html", "print.html", "favicon.ico"]));
utils.copy(utils.list("src/"));

//html

function htmlFilter (data) {
    return data
        .replace(/@\s?version\s?@/g, version)
        .replace(/@\s?revision\s?@/g, rev)
        .replace(/@base@/g, 'v=' + version)
        .replace(/@debug@/g, debug);
}

function bodyFilter(data) {
    var body_lines = data.split(/\r?\n|\r/);
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
    return htmlFilter(data);
}

utils.copy(utils.list('html', 'core_head.html'),
    { to: 'tmp', filter: htmlFilter });
utils.copy(utils.list('html', 'core_body.html'),
    { to: 'tmp', filter: bodyFilter });
utils.concat('core', ['html/index.html'], { filter: utils.includeFilter });
utils.concat('signin', ['html/signin.html'], { filter: utils.includeFilter });
utils.concat('core.appcache', ['html/core.appcache'], { filter: htmlFilter });
utils.concat('signin.appcache', ['html/signin.appcache'], { filter: htmlFilter });

task('force');
_.each(_.map(['core', 'signin', 'core.appcache', 'signin.appcache'], utils.dest)
       .concat(['tmp/core_head.html', 'tmp/core_body.html']),
       function (name) { file(name, ['force']); });

//js

utils.concat("boot.js",
    [utils.string("// NOJSHINT\ndependencies = "), "tmp/dependencies.json",
     utils.string(';\n'), "src/plugins.js", "src/jquery.plugins.js",
     "apps/io.ox/core/gettext.js", "src/util.js", "src/boot.js"],
    { to: "tmp", type: "source" });


utils.concat("boot.js", [
        "lib/jquery.min.js",
        "lib/jquery.mobile.touch.min.js",
        "lib/underscore.js", // load this before require.js to keep global object
        "lib/require.js",
        "lib/require-fix.js",
        "lib/modernizr.js",
        "lib/bigscreen.js",
        "lib/placeholder.min.js",
        //add backbone and dot.js may be a AMD-variant would be better
        "lib/backbone.js",
        "lib/backbone.modelbinder.js",
        "lib/backbone.collectionbinder.js",
        "lib/backbone.validation.js",
        "lib/backbone.custom.js",
        "lib/doT.js",
        "tmp/boot.js"]);

// Twitter Bootstrap
utils.copy(utils.list("lib/bootstrap", ["img/*"]),
    { to: utils.dest("apps/io.ox/core/bootstrap") });

// jQuery UI
utils.copy(utils.list("lib", ["jquery-ui.min.js"]),
    { to: utils.dest("apps/io.ox/core/tk") });

// jQuery Imageloader

utils.copy(utils.list("lib", ["jquery.imageloader.js"]),
    { to: utils.dest("apps/io.ox/core/tk") });

// Mediaelement.js

utils.copy(utils.list("lib", "mediaelement/"), {to: utils.dest("apps") });

// Ace editor

utils.copy(utils.list("lib", "ace/"), {to: utils.dest("apps")});

utils.copy(utils.list("lib/node_modules/emoji/lib", ["emoji.js", "emoji.css", "emoji.png"]),
        { to: utils.dest("apps/emoji") });

//online help

if (path.existsSync('help')) {
    var helpDir = process.env.helpDir || utils.builddir;
    _.each(fs.readdirSync('help'), function (Lang) {
        if (!fs.statSync(path.join('help', Lang)).isDirectory()) return;
        var lang = Lang.toLowerCase().replace(/_/g, '-');
        utils.copy(utils.list(path.join('help', Lang + '/')), {
            to: helpDir.replace(/@lang@/g, lang)
        });
    });
    utils.copy(['help/help.css'], { to: helpDir });
}

// postinst utilities

utils.concat('update-themes.js', utils.list('lib',
    ['less.js/build/require-rhino.js',
     'less.js/build/ecma-5.js',
     'less.js/lib/less/parser.js',
     'less.js/lib/less/functions.js',
     'less.js/lib/less/colors.js',
     'less.js/lib/less/tree/*.js',
     'less.js/lib/less/tree.js',
     'build/update-themes.js']),
    { to: utils.dest('share') });
utils.copy(utils.list('lib/build', 'update-themes.sh'),
    { to: utils.dest('share') });

// external apps

desc('Builds an external app');
utils.topLevelTask('app', ['buildApp'], utils.summary('app'));

// common task for external apps and the GUI

utils.topLevelTask('buildApp', ['ox.pot'], function () {
    utils.includes.save();
    i18n.modules.save();
});

i18n.modules.load("tmp/i18n.json");
utils.includes.load("tmp/includes.json");

// i18n

file("ox.pot", [utils.source("Jakefile.js")], function() {
    fs.writeFileSync(this.name,
        i18n.generatePOT(this.prereqs.slice(skipOxPotPrereqs)));
});
if (path.existsSync('html/core_body.html')) {
    file('ox.pot', ['tmp/core_body.html']);
}
var skipOxPotPrereqs = jake.Task['ox.pot'].prereqs.length;

directory("tmp/pot");
utils.fileType("source").addHook("handler", i18n.potHandler);
utils.fileType("module").addHook("handler", i18n.potHandler);

// module dependencies

var moduleDeps = {};
var depsPath = "tmp/dependencies.json";

utils.fileType("module").addHook("filter", jsFilter)
    .addHook("define", i18n.potScanner)
    .addHook("define", function(name, deps, f) {
        moduleDeps[name[1]] = _.pluck(deps[1], 1);
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
        return JSON.stringify(moduleDeps, null, 4);
    }
}], {
    filter: _.identity, // prevents binary mode, which erases target before calling getData
    to: "tmp"
});

// apps

var apps = _.groupBy(utils.list("apps/"), function (f) {
    var match = /\.(js)$/.exec(f);
    return match && match[1] || "rest";
});
if (apps.js) utils.copy(apps.js, { type: "module" });
if (apps.rest) utils.copy(apps.rest);

// manifests

utils.merge('manifests/' + pkgName + '.json',
    utils.list('apps/**/manifest.json'),
    {
        to: process.env.manifestDir || utils.builddir,
        merge: function (manifests, names) {
            var combinedManifest = [];
            _.each(manifests, function (m, i) {
                var prefix = /^apps[\\\/](.*)[\\\/]manifest\.json$/
                             .exec(names[i])[1] + '/';
                var data = null;
                try {
                    data = new Function('return (' + m + ')')();
                } catch (e) {
                    fail('Invalid manifest ' + names[i], e);
                }
                if (!_.isArray(data)) {
                    data = [data];
                }
                _(data).each(function (entry) {
                    if (!entry.path) {
                        if (entry.namespace) {
                            // Assume Plugin
                            if (path.existsSync("apps/" + prefix +
                                                "register.js"))
                            {
                                entry.path = prefix + "register";
                            }
                        } else {
                            // Assume App
                            if (path.existsSync("apps/" + prefix + "main.js")) {
                                entry.path = prefix + "main";
                            }
                        }
                    }
                    combinedManifest.push(entry);
                });
            });
            return JSON.stringify(combinedManifest, null, debug ? 4 : null);
        }
    });

// themes

if (!envBoolean('skipLess')) compileLess();
function compileLess() {

    var coreDir = process.env.coreDir || utils.builddir;

    function core(file) { return path.join(coreDir, file); }

    var ownLess = utils.list('apps', '**/*.less'), coreLess;
    var ownThemes = utils.list('apps/themes/*/definitions.less');
    var coreThemes = utils.list(core('apps/themes'), '*/definitions.less');

    if ((ownThemes.length || ownLess.length) &&
        !path.existsSync('apps/themes/definitions.less') &&
        !path.existsSync(core('apps/themes/definitions.less')))
    {
        if (process.env.coreDir) {
            console.warn('Warning: Invalid coreDir');
        } else {
            console.warn('Warning: Themes require either coreDir or skipLess');
        }
        return;
    }

    function compile(dest, defs, defsInCore, src, srcInCore) {
        dest = core(dest);
        utils.file(dest,
            [core('apps/themes/definitions.less'),
             defsInCore ? core(defs) : defs, srcInCore ? core(src) : src],
            function () {
                var ast;
                new less.Parser({
                    paths: [coreDir],
                    syncImport: true,
                    relativeUrls: true
                }).parse('@import "apps/themes/definitions.less";\n' +
                         '@import "' + defs.replace(/\\/g, '/') + '";\n' +
                         '@import "' + src.replace(/\\/g, '/') + '";\n',
                function (e, tree) {
                    if (e) fail(JSON.stringify(e, null, 4)); else ast = tree;
                });
                fs.writeFileSync(dest, ast.toCSS({ compress: !utils.debug }));
            });
    }

    // own themes
    _.each(ownThemes, function(defs) {
        if (!coreLess) coreLess = utils.list(core('apps'), '**/*.less');
        var dir = path.dirname(defs);
        compile(path.join(dir, 'less/common.css'), defs, false,
                'apps/themes/style.less', true);
        compile(path.join(dir, 'less/style.css'), defs, false,
                path.join(dir, 'style.less'), false);
        _.each(ownLess, function (file) {
            if (/^themes[\/\\]/.test(file)) return;
            compile(path.join(dir, 'less', file), defs, false,
                    path.join('apps', file), false);
        });
        _.each(coreLess, function (file) {
            if (/^themes[\/\\]/.test(file)) return;
            compile(path.join(dir, 'less', file), defs, false,
                    path.join('apps', file), true);
        });
    });

    // core themes
    _.each(coreThemes,
        function (defs) {
            if (path.existsSync(path.join('apps/themes', defs))) return;
            var dir = path.join('apps/themes', path.dirname(defs));
            _.each(ownLess, function (file) {
                if (/^themes[\/\\]/.test(file)) return;
                compile(path.join(dir, 'less', file),
                        path.join('apps/themes', defs), true,
                        path.join('apps', file), false);
            });
        });
}

// docs task

// desc("Generates developer documentation");
utils.topLevelTask("docs", [], utils.summary("docs"));

var titles = [];
function docFile(file, title) {
    filename = "doc/" + file + ".html";
    utils.concat(filename,
        ["doc/lib/header.html", filename, "doc/lib/footer.html"]);
    titles.push('<a href="' + file +'.html">' + title + '</a><br/>');
}

docFile("gettingStarted", "Getting Started");
docFile("apache", "Apache Configuration");
docFile("extensions", "Extension Points");
docFile("libs", "External Libs");
docFile("development_guide", "UI Development Style Guide");
docFile("buildsystem", "Build System");
docFile("manifests", "Module System");
docFile("vgrid", "VGrid");
docFile("portalplugin", "Portal Plugins ");
docFile("actions_files", "Actions / Files App");
docFile("i18n", "Internationalization");
docFile("date", "Date and Time");

var indexFiles = ["lib/header.html", "index.html",
    { getData: function() { return titles.join("\n"); } }, "lib/footer.html"];
indexFiles.dir = "doc";
utils.concat("doc/index.html", indexFiles);

utils.copy(utils.list("doc/lib", ["prettify.*", "default.css", "newwin.png"]),
           { to: utils.dest("doc") });
utils.copyFile("lib/jquery.min.js", utils.dest("doc/jquery.min.js"));

// update-i18n task

require("./lib/build/cldr.js");

// msgmerge task

desc("Updates all .po files with the generated ox.pot");
task("merge", ["ox.pot"], function() {
    var files = _.without(utils.list("i18n/*.po"), "i18n/en_US.po");
    var count = files.length;
    for (var i = 0; i < files.length; i++) {
        utils.exec(["msgmerge", "-Us", "--backup=none", files[i], "ox.pot"],
            function() { if (!--count) complete(); });
    }
}, { async: true });

// module dependency visualization

function printTree(root, name, children) {
    var getName = typeof name != "string" ? name :
            function (node) { return node[name]; };
    var getChildren = typeof children != "string" ? children :
            function (node) { return node[children]; };
    print(root, "", "");
    function print(node, indent1, indent2) {
        console.log(indent1 + getName(node));
        var children = getChildren(node);
        var last = children.length - 1;
        for (var i = 0; i < last; i++) {
            print(children[i], indent2 + "├─", indent2 + "│ ");
        }
        if (last >= 0) print(children[last], indent2 + "└─", indent2 + "  ");
    }
}

desc("Prints module dependencies");
task("deps", [depsPath], function() {
    var deps = JSON.parse(fs.readFileSync(depsPath, "utf8"));
    for (var i in deps) deps[i] = { name: i, children: deps[i], parents: [] };
    _.each(deps, function(dep) {
        dep.children = _.map(dep.children, function(name) {
            var child = deps[name];
            if (!child) {
                child= deps[name] = { name: name, children: [], parents: [] };
            }
            child.parents.push(dep);
            return child;
        });
    });
    var down = "children", up = "parents";
    if (process.env.reverse) { var t = down; down = up; up = t; }
    var root = process.env.root;
    if (root) {
        console.log("");
        if (root in deps) printTree(deps[process.env.root], "name", down);
    } else {
        _.each(deps, function(root) {
            if (!root[up].length) {
                console.log("");
                printTree(root, "name", down);
            }
        });
    }
});

// initialization of packaging

desc('Initializes packaging information for a new app.');
utils.topLevelTask('init-packaging', [], function() {
    utils.summary('init-packaging');
});
(function () {
    var packagingVariables = {
        '': '',
        '@': '@',
        'package': pkgName,
        timestamp: formatDate(new Date())
    };
    function formatDate(d) {
        return [
            ['Sun,', 'Mon,', 'Tue,',
             'Wed,', 'Thu,', 'Fri,', 'Sat,'][d.getUTCDay()],
            pad(d.getUTCDate()),
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()],
            d.getUTCFullYear(),
            [pad(d.getUTCHours()),
             pad(d.getUTCMinutes()), pad(d.getUTCSeconds())].join(':'),
            '+0000'
        ].join(' ');
    }
    task('prompt-packaging', [], function () {
        var varDefs = [
            { key: 'version', prompt: 'Version', def: ver },
            { key: 'maintainer', prompt: 'Maintainer (Name <e-mail>)' },
            {
                key: 'copyright',
                prompt: 'Copyright line',
                def: '2013 Open-Xchange, Inc'
            },
            {
                key: 'licenseName',
                prompt: 'License name',
                def: 'CC-BY-NC-SA-3.0',
                handler: function (answer) {
                    var license = path.join(utils.source('lib/build/licenses'),
                        answer.toLowerCase().replace(/(\.0)*\+?$/, '.txt'));
                    if (path.existsSync(license)) {
                        packagingVariables.license = license;
                    }
                }
            },
            { key: 'license', prompt: 'License file' },
            {
                key: 'description',
                prompt: 'Short description'
            },
        ];
        var rl = readline.createInterface(process.stdin, process.stdout);
        prompt(0);
        function prompt(i) {
            if (i < varDefs.length) {
                var varDef = varDefs[i];
                if (packagingVariables[varDef.key]) {
                    prompt(i + 1);
                } else if (varDef.key in process.env) {
                    reply(process.env[varDef.key]);
                } else {
                    var question = varDef.prompt;
                    if (varDef.def) question += ' [' + varDef.def + ']';
                    rl.question(question + ': ', reply);
                }
                function reply(answer) {
                    answer = answer || varDef.def;
                    if (!answer) return prompt(i);
                    packagingVariables[varDef.key] = answer;
                    if (varDef.handler) varDef.handler(answer);
                    prompt(i + 1);
                }
            } else {
                rl.close();
                process.stdin.destroy();
                var text = fs.readFileSync(packagingVariables.license, 'utf8');
                packagingVariables.license = text.replace(/^.*$/gm,
                    function(line) {
                        return /\S/.test(line) ? ' ' + line : ' .';
                    });
                complete();
            }
        }
    }, { async: true });

    var files = utils.list(utils.source('lib/build/pkg-template'), '**/*');
    utils.copy(files, { to: '.', filter: replace, mapper: replace });
    function replace(data) {
        return data.replace(/@(\w*)@/g, function (m, key) {
            return packagingVariables[key];
        });
    }
    _.each(files, function(name) {
        file(replace(name), ['prompt-packaging']);
    });
}());
utils.topLevelTask();

// packaging

var distDest = process.env.destDir || "tmp/packaging";

directory(distDest, ["clean"]);

desc("Creates source packages");
task("dist", [distDest], function () {
    var toCopy = _.reject(fs.readdirSync("."), function(f) {
        return /^(tmp|ox\.pot|build|local\.conf)$/.test(f);
    });
    var tarName = pkgName + '-' + ver;
    var debName = pkgName + '_' + ver;
    var dest = path.join(distDest, tarName);
    fs.mkdirSync(dest);
    utils.exec(["cp", "-r"].concat(toCopy, dest), tar);
    function replaceL10n(spec, key, languages) {
        return spec.replace(
            new RegExp('## ' + key + ' ##.*\\n([\\s\\S]+?)^## end ##.*', 'gm'),
            function (m, block) {
                block = block.replace(/^#/gm, '');
                return _.map(languages, function (Lang) {
                    var lang = Lang.toLowerCase().replace(/_/g, '-');
                    return block.replace(/## ([Ll])ang ##/g, function (m, L) {
                        return L === 'L' ? Lang : lang;
                    });
                }).join('\n');
            });
    }
    function addL10n(spec) {
        spec = replaceL10n(spec, 'l10n', i18n.languages());
        if (path.existsSync('help')) {
            spec = replaceL10n(spec, 'help', fs.readdirSync('help'));
        }
        return spec;
    }
    function tar(code) {
        if (code) return fail('cp exited with code ' + code);

        var file = path.join(dest, pkgName + '.spec');
        fs.writeFileSync(file, addL10n(fs.readFileSync(file, 'utf8')
            .replace(/^(Version:\s*)\S+/gm, '$01' + ver)
            .replace(/^(%define\s+ox_release\s+)\S+/gm, '$01' + rev)));
        file = path.join(dest, 'debian/control');
        fs.writeFileSync(file, addL10n(fs.readFileSync(file, 'utf8')));

        if (path.existsSync('i18n/languagenames.json')) {
            var languageNames = _.extend(
                JSON.parse(fs.readFileSync('i18n/languagenames.json', 'utf8')),
                JSON.parse(fs.readFileSync('i18n/overrides.json', 'utf8')));
            _.each(i18n.languages(), function (Lang) {
                if (!(Lang in languageNames)) fail('Unknown language: ' + Lang);
                var lang = Lang.toLowerCase().replace(/_/g, '-');
                fs.writeFileSync(path.join(dest, 'i18n',
                        'open-xchange-appsuite-l10n-' + lang + '.properties'),
                    'io.ox/appsuite/languages/' + Lang + '=' +
                    languageNames[Lang].replace(/[^\x21-\x7e]/g, function(c) {
                        if (c === ' ') return '\\ ';
                        var hex = c.charCodeAt(0).toString(16);
                        return '\\u0000'.slice(0, -hex.length) + hex;
                    }));
            });
        }

        utils.exec(['tar', 'cjf', debName + '.orig.tar.bz2', tarName],
                   { cwd: distDest }, dpkgSource);
    }
    function dpkgSource(code) {
        if (code) return fail('tar exited with code ' + code);
        if (envBoolean('skipDeb')) return done();
        utils.exec(['dpkg-source', '-Zbzip2', '-b', tarName],
                   { cwd: distDest }, done);
    }
    function done(code) {
        if (!code) return complete();
        if (envBoolean('forceDeb')) {
            fail('dpkg-source exited with code ' + code);
        } else {
            console.warn('Warning: dpkg-source exited with code ' + code);
            console.warn('Warning: Debian package is probably not available.');
        }
    }
}, { async: true });

// clean task

desc('Removes all generated files');
task('clean', [], function() {
    if (path.existsSync('ox.pot')) fs.unlinkSync('ox.pot');
    var dirs = ['tmp', utils.builddir, distDest];
    if (process.env.l10nDir) dirs.push(process.env.l10nDir);
    if (process.env.manifestDir) dirs.push(process.env.manifestDir);
    rmdirs(dirs.length);
    function rmdirs(i) {
        if (i--) {
            rimraf(dirs[i], function () { rmdirs(i); });
        } else {
            complete();
        }
    }
}, { async: true });

// task dependencies

desc("Shows the dependency chain between two Jake tasks");
task("jakedeps", [], function() {
    if (process.env.to) {
        if (!show(process.env.from, process.env.to)) console.log("Not found");
    } else {
        printTree(process.env.from, _.identity, function (name) {
            var task = jake.Task[name];
            return task ? task.prereqs : [];
        });
    }
    function show(from, to) {
        if (from == to) {
            console.log(from);
            return true;
        }
        if (!(from in jake.Task)) return false;
        var prereqs = jake.Task[from].prereqs;
        for (var i = 0; i < prereqs.length; i++) {
            if (show(prereqs[i], to)) {
                console.log(from);
                return true;
            }
        };
        return false;
    }
});

// verify documentation

desc('Verifies that all modules are documented');
utils.topLevelTask('verify-doc');
var extPoints = {};
utils.fileType('doc-source')
    .addHook('filter', utils.includeFilter)
    .addHook('filter', verifyDoc)
    .addHook('define', checkExtensions);
utils.concat('doc/extensionpoints.html', utils.list('apps/**/*.js'), {
    type: 'doc-source'
});
function verifyDoc(data) {
    var self = this;
    this.points = {};
    var defineHooks = this.type.getHooks('define');
    ast.scanner(defineWalker, defineHandler)
        .scanner(defineAsyncWalker, defineHandler)
        .scan(pro.ast_add_scope(parse(data, self.task.name)));
    function defineHandler(scope) {
        if (scope.refs.define !== undefined) return;
        var args = this[2];
        var name = _.detect(args, ast.is('string'));
        var deps = _.detect(args, ast.is('array'));
        var f = _.detect(args, ast.is('function'));
        if (!name || !deps || !f) return;
        for (var i = 0; i < defineHooks.length; i++) {
            defineHooks[i].call(self, name, deps, f);
        }
    }
    var pointlist = [];
    for (var i in this.points) pointlist.push(i);
    pointlist.sort();
    return '<!doctype html>\n' +
        '<html><head><title>Extension points</title></head><body><ul>\n' +
        _.map(pointlist, function (id) { return '<li>' + id + '</li>'; })
            .join('\n') +
        '</ul></body></html>\n';
}
function warn(message, src) {
    console.warn(
        ["Warning: ", message, "\n  at ", src.name, ":", src.line].join(""));
}
var extWalker = _.memoize(function (apiName) {
    return ast(apiName + '.point').asCall().walker();
});
function checkExtensions(name, deps, f) {
    var extIndex = _(_(deps[1]).pluck(1)).indexOf('io.ox/core/extensions');
    if (extIndex < 0) return;
    var self = this;
    var apiName = f[2][extIndex];
    var fScope = f[3].scope;
    ast.scanner(extWalker(apiName), function (scope) {
        if (scope.refs[apiName] !== fScope) return;
        var args = this[2];
        if (args.length !== 1) {
            console.warn('Warning: extension.point should have 1 parameter');
            return;
        }
        if (!pro.when_constant(args[0], checkPoint)) {
            warn('Can\'t evaluate id of extension point',
                 self.getSrc(args[0][0].start.line + 1));
            return;
        }
    }).scan(f);
    function checkPoint(id) { return self.points[id[1]] = true; }
}
