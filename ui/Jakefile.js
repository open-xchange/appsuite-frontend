/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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
var _ = require("./lib/underscore/underscore");
var jsp = require("./lib/uglify-js/uglify-js").parser;
var pro = require("./lib/uglify-js/uglify-js").uglify;
var ast = require("./lib/build/ast");
var i18n = require("./lib/build/i18n");
var rimraf = require("./lib/rimraf/rimraf");
var jshint = require("./lib/jshint/jshint").JSHINT;

console.info('Node version:', process.version);
console.info("Build path: " + utils.builddir);

var pkgName = process.env['package'];
var localConfigPath = path.join(process.cwd(), './local.conf.js');
var ver = process.env.version;
var rev = process.env.revision;

if ((!pkgName || !ver || !rev) && path.existsSync('debian/changelog')) {
    var changelogEntry = /(\S+) \((\S+)-(\d+)\)/.exec(
        fs.readFileSync('debian/changelog', 'utf8'));
    pkgName = pkgName || changelogEntry[1];
    ver = ver || changelogEntry[2];
    rev = rev || changelogEntry[3];
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

var debug = utils.envBoolean('debug');
var disableStrictMode = utils.envBoolean('disableStrictMode');

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
    boss: true,
    browser: true,
    debug: debug,
    devel: true,
    eqeqeq: true,
    evil: true,
    forin: false,
    immed: true,
    loopfunc: false,
    node: true,
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
    globals: {
        "$": false,
        "_": false,
        "Modernizr": false,
        "define": false,
        "require": false,
        "requirejs": false,
        "ox": false,
        "assert": false,
        "include": false,
        "doT": false,
        "Backbone": false,
        "BigScreen": false,
        "MediaElementPlayer": false,
        "tinyMCE": false
    }
};

if (path.existsSync('./.jshintrc')) {
    jshintOptions = fs.readFileSync('./.jshintrc').toString();

    jshintOptions = jshintOptions.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\//g, "");
    jshintOptions = jshintOptions.replace(/\/\/[^\n\r]*/g, "");
    jshintOptions = JSON.parse(jshintOptions);
}

function hint (data, getSrc) {
    var options = JSON.parse(JSON.stringify(jshintOptions)),
        globals = options.globals;
    delete options.globals;
    if (jshint(data, options, globals)) return data;
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

utils.copy(utils.list("html", [".htaccess", "blank.html", "busy.html", "unsupported.html", "print.html", "favicon.ico"]));
utils.copy(utils.list("src/"));

//html

function versionFilter (data) {
    return data
        .replace(/@\s?version\s?@/g, version)
        .replace(/@\s?revision\s?@/g, rev)
        .replace(/@base@/g, 'v=' + version)
        .replace(/@debug@/g, debug);
}

var htmlFilter = _.compose(versionFilter, utils.includeFilter);

utils.concat('core', ['html/index.html'], { filter: htmlFilter });
utils.concat('signin', ['html/signin.html'], { filter: htmlFilter });
utils.concat('core.appcache', ['html/core.appcache'], { filter: versionFilter });
utils.concat('signin.appcache', ['html/signin.appcache'], { filter: versionFilter });

task('force');
_.each(['core', 'signin', 'core.appcache', 'signin.appcache'],
       function (name) { file(utils.dest(name), ['force']); });

//js

utils.concat("boot.js",
    [utils.string("// NOJSHINT\ndependencies = "), "tmp/dependencies.json",
     utils.string(';\n'),
     "lib/jquery/jquery.js",
     "lib/jquery.mobile.touch.min.js",
     "lib/underscore/underscore.js", // load this before require.js to keep global object
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
     "lib/textarea-helper.js",
     "src/util.js",
     "src/browser.js",
     "src/plugins.js",
     "src/jquery.plugins.js",
     "apps/io.ox/core/gettext.js",
     "src/boot.js"],
    { type: "source" });

// Twitter Bootstrap
utils.copy(utils.list("lib/bootstrap", ["img/*"]),
    { to: utils.dest("apps/io.ox/core/bootstrap") });

// jQuery UI
utils.copy(utils.list("lib", ["jquery-ui.min.js"]),
    { to: utils.dest("apps/io.ox/core/tk") });

//Mobiscroll
utils.concat("mobi.js", [utils.string("// NOJSHINT\n"),
                         "lib/mobiscroll/js/mobiscroll.core.js",
                         "lib/mobiscroll/js/mobiscroll.datetime.js",
                         "lib/mobiscroll/js/mobiscroll.ios7.js"],
    { to: utils.dest("apps/mobiscroll/js"), type:"source"});
utils.copy(utils.list("lib/mobiscroll", ["css/*"]),
        { to: utils.dest("apps/mobiscroll/")});

// jQuery Imageloader

utils.copy(utils.list("lib", ["jquery.imageloader.js"]),
    { to: utils.dest("apps/io.ox/core/tk") });

// Mediaelement.js

utils.copy(utils.list("lib/mediaelement/build", "*"), {to: utils.dest("apps/3rd.party/mediaelement") });

// Ace editor

utils.copy(utils.list("lib", "ace/"), {to: utils.dest("apps")});

utils.copy(utils.list("lib/node_modules/emoji/lib", ["emoji.js", "emoji.css", "emoji.png"]),
        { to: utils.dest("apps/3rd.party/emoji") });

// Frameworks for guided tours

utils.copy(utils.list("lib", "hopscotch/", ["hopscotch-0.1.js", "hopscotch-0.1.css", "sprite-*.png"]), {to: utils.dest("apps") });

// tinyMCE

utils.copy(utils.list("lib", "moxiecode/"), {to: utils.dest("apps") });

// view-qrcode

utils.copy(utils.list("lib", "view-qrcode.js"), {to: utils.dest("apps/io.ox/contacts/") });

// tk/charts

utils.copy(utils.list("lib", "charts.js"), {to: utils.dest("apps/io.ox/core/tk/") });

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
    utils.copy(['help/help.css']);
}

// postinst utilities

utils.copy(utils.list('lib',
    ['build/fileutils.js',
     'build/themes.js',
     'jake/',
     'less.js/lib/',
     'node_modules/',
     'underscore/underscore.js']),
    { to: utils.dest('share/lib') });
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
    { to: utils.dest('share'), mode: 0x1ed /* 755 octal */ });

// external apps

desc('Builds an external app');
utils.topLevelTask('app', ['buildApp'], utils.summary('app'));

// common task for external apps and the GUI

utils.topLevelTask('buildApp', ['ox.pot', 'update-themes', 'manifests'],
    function () {
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
    file('ox.pot', ['html/core_body.html']);
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

var manifestDir = path.join(process.env.manifestDir || utils.builddir,
                            'manifests');
directory(manifestDir);
task('manifests', [manifestDir], function () {
    var combinedManifests = {}, defaultPackage = pkgName || 'manifest';
    _.each(utils.list('apps/**/manifest.json'), function (name) {
        var prefix = /^apps[\\\/](.*)[\\\/]manifest\.json$/
            .exec(name)[1].replace(/\\/g, '/') + '/';
        try {
            var data = fs.readFileSync(name, 'utf8');
            data = new Function('return (' + data + ')')();
        } catch (e) {
            fail('Invalid manifest ' + name, e);
        }
        if (!_.isArray(data)) data = [data];
        _(data).each(function (entry) {
            if (!entry.path) {
                if (entry.namespace) {
                    // Assume Plugin
                    if (path.existsSync("apps/" + prefix + "register.js")) {
                        entry.path = prefix + "register";
                    }
                } else {
                    // Assume App
                    if (path.existsSync("apps/" + prefix + "main.js")) {
                        entry.path = prefix + "main";
                    }
                }
            }
            var packageName = entry['package'] || defaultPackage;
            delete entry['package'];
            var manifest = combinedManifests[packageName];
            if (!manifest) manifest = combinedManifests[packageName] = [];
            manifest.push(entry);
        });
    });
    _.each(combinedManifests, function (manifest, packageName) {
        fs.writeFileSync(path.join(manifestDir, packageName + '.json'),
            JSON.stringify(manifest, null, debug ? 4 : null));
    });
});

// update-themes task

require('./lib/build/themes.js');

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
utils.copyFile("lib/jquery/jquery.min.js", utils.dest("doc/jquery.min.js"));
utils.topLevelTask();

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
task('init-packaging', ['clean'], function() {
    var packagingVariables = {
        '': '',
        '@': '@',
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
    var licenses = _.map(fs.readdirSync(utils.source('lib/build/licenses')),
            function (s) { return s.replace(/(.*)\.txt/, '$1').toUpperCase(); })
        .join(', ');
    var list = [], width = process.stdout.columns || Infinity;
    while (licenses.length > width) {
        var pos = licenses.lastIndexOf(' ', width);
        if (pos < 0) pos = licenses.indexOf(' ', width);
        if (pos < 0) break;
        list.push(licenses.slice(0, pos));
        licenses = licenses.slice(pos + 1);
    }
    list.push(licenses);
    licenses = list.join('\n');
    var varDefs = [
        { key: 'package', prompt: 'Package name', def: pkgName },
        { key: 'version', prompt: 'Version', def: ver },
        {
            key: 'maintainer',
            prompt: 'Maintainer (Name <e-mail>)',
            handler: function (answer) {
                if (/^\S+(\s+\S+)* <\S+@\S+>$/.test(answer)) return answer;
            }
        },
        {
            key: 'copyright',
            prompt: 'Copyright line',
            def: '2013 Open-Xchange, Inc'
        },
        {
            key: 'licenseName',
            intro: '\nKnown licenses for which you don\'t need to ' +
                   'specify a file:\n' + licenses + '\n',
            prompt: 'License name',
            def: 'CC-BY-NC-SA-3.0',
            handler: function (answer) {
                var license = path.join(utils.source('lib/build/licenses'),
                    answer.toLowerCase().replace(/(\.0)*\+?$/, '.txt'));
                if (path.existsSync(license)) {
                    packagingVariables.license = license;
                }
                return answer;
            }
        },
        { key: 'license', prompt: 'License file' },
        { key: 'description', prompt: 'Short description' }
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
                if (varDef.intro) console.log(varDef.intro);
                var question = varDef.prompt;
                if (varDef.def) question += ' [' + varDef.def + ']';
                rl.question(question + ': ', reply);
            }
            function reply(answer) {
                answer = answer || varDef.def;
                if (varDef.handler) answer = varDef.handler(answer);
                if (!answer) return prompt(i);
                packagingVariables[varDef.key] = answer;
                prompt(i + 1);
            }
        } else {
            // clean up readline
            rl.close();
            process.stdin.destroy();

            // read license text
            var text = fs.readFileSync(packagingVariables.license, 'utf8');
            packagingVariables.license = text.replace(/^.*$/gm,
                function(line) { return /\S/.test(line) ? ' ' + line : ' .'; });

            // process templates
            var ff = utils.list(utils.source('lib/build/pkg-template'), '**/*');
            for (var i = 0; i < ff.length; i++) {
                var src = path.join(ff.dir, ff[i]), dest = replace(ff[i]);
                jake.mkdirP(path.dirname(dest));
                fs.writeFileSync(dest, replace(fs.readFileSync(src, 'utf8')));
                fs.chmodSync(dest, fs.statSync(src).mode);
            }
            function replace(data) {
                return data.replace(/@(\w*)@/g, function (m, key) {
                    return packagingVariables[key];
                });
            }

            complete();
        }
    }
}, { async: true });

// packaging

var distDest = process.env.destDir || "tmp/packaging";

directory(distDest, ["clean"]);

desc("Creates source packages");
task("dist", [distDest], function () {
    if (!pkgName) fail('Please specify the package name using package=<NAME>');
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
        function isDir(Lang) {
            return fs.statSync(path.join('help', Lang)).isDirectory();
        }
        if (path.existsSync('help')) {
            spec = replaceL10n(spec, 'help',
                               _.filter(fs.readdirSync('help'), isDir));
        }
        return spec;
    }
    function tar(code) {
        if (code) return fail('cp exited with code ' + code);

        var file = path.join(dest, pkgName + '.spec');
        if (path.existsSync(file)) {
            var specFile = addL10n(fs.readFileSync(file, 'utf8')
                    .replace(/^(Version:\s*)\S+/gm, '$01' + ver)
                    .replace(/^(%define\s+ox_release\s+)\S+/gm, '$01' + rev));
            fs.writeFileSync(file, specFile); // deprecated, hard to find
            fs.writeFileSync(path.join(distDest, pkgName + '.spec'), specFile);
        }
        file = path.join(dest, 'debian/control');
        if (path.existsSync(file)) {
            fs.writeFileSync(file, addL10n(fs.readFileSync(file, 'utf8')));
        }

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
                   { cwd: distDest, env: { COPYFILE_DISABLE: 'true' } },
                   dpkgSource);
    }
    function dpkgSource(code) {
        if (code) return fail('tar exited with code ' + code);
        if (utils.envBoolean('skipDeb')) return done();
        utils.exec(['dpkg-source', '-Zbzip2', '-b', tarName],
                   { cwd: distDest }, done);
    }
    function done(code) {
        if (!code) return complete();
        if (utils.envBoolean('forceDeb')) {
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

// start appserver
desc('Start the appserver');
task('appserver', [], function () {
    var customConfig = path.existsSync(localConfigPath) ? require(localConfigPath).appserver : null,
        server = require('./lib/appserver/server'),
        config = _.extend({
            prefixes: [utils.builddir + '/apps'],
            manifests: [utils.builddir + '/manifests']
        }, customConfig);

    server.create(config);
});

// run tests

desc('Do a single run of all tests');
function setupKarma(options) {
    var karma = require("karma"),
        configFile = nextGen(karma) ? path.resolve('./karma.conf.js') : null,
        customConfig = path.existsSync(localConfigPath) ? require(localConfigPath).karma : null;

    console.log('Karma version:', karma.VERSION, nextGen(karma) ? '(up-to-date)' : '(deprecated/broken!)');
    function nextGen(karma) {
        var version = {},
            tmp = karma.VERSION.split('.');

        version.major = Number(tmp[0]);
        version.minor = Number(tmp[1]);
        version.bugfix = Number(tmp[2]);

        return version.minor > 9 || version.minor === 9 && version.bugfix >= 3;
    }

    if (!configFile) {
        console.error('Karma version < 0.9.3 is not supported any longer.');
        return;
    }
    karma.server.start(_.extend({
        configFile: configFile,
        builddir: utils.builddir
    }, options, customConfig));
}
task('test', [], function () {
    setupKarma({
        singleRun: true,
        autoWatch: false
    });
});

desc('Start a karma testserver');
task('testserver', [], function () {
    setupKarma();
});
