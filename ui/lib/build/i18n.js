/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 * 
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * 
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com 
 * 
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

var fs = require("fs");
var path = require("path");
var utils = require("./fileutils");
var jsp = require("../uglify-js/uglify-js").parser;
var pro = require("../uglify-js/uglify-js").uglify;
var ast = require("./ast");
var rimraf = require("../rimraf/rimraf");
var jshint = require("../jshint").JSHINT;
var _ = require("../underscore.js");

var potHeader = 'msgid ""\nmsgstr ""\n' +
    '"Project-Id-Version: Open-Xchange 7\\n"\n' +
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
exports.potFiles = {};

function formatLocations(locations) {
    var lines = [], current = "#:";
    for (var i = 0; i < locations.length; i++) {
        var loc = " " + locations[i].name + ":" + locations[i].line;
        if (current.length + loc.length > 80) {
            lines.push(current);
            current = "#:";
        }
        current += loc;
    }
    if (current.length > 2) lines.push(current);
    return lines;
}

function generateComment(msg) {
    return msg.comments.concat(formatLocations(msg.locations)).join("\n");
}

function addMsg(map, key, msg) {
    msg.locations.sort(cmp);
    function cmp(a, b) {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : a.line - b.line;
    }
    if (key in map) {
        if (!_.isEqual(map[key].comments, msg.comments)) {
            var comments = map[key].comments;
            addSeparator(comments);
            addSeparator(msg.comments);
            if (comments.join('\n').indexOf(msg.comments.join('\n')) < 0) {
                comments.push.apply(comments, msg.comments);
            }
        }
        map[key].locations =
            utils.mergeArrays(map[key].locations, msg.locations, cmp);
    } else {
        map[key] = msg;
    }
}

function addSeparator(comments) {
    if (comments[0] ===   '#. #-#-#-#-#-#-#-#-#-#') return;
    comments.splice(0, 0, '#. #-#-#-#-#-#-#-#-#-#');
}

exports.addMessage = function(msg, filename) {
    if (!msg.comments) msg.comments = [];
    if (!msg.locations) msg.locations = [];
    var key = msg.msgid;
    if (msg.msgid_plural) key += "\x01" + msg.msgid_plural;
    if (msg.msgctxt) key = msg.msgctxt + "\0" + key;
    addMsg(pot, key, msg);
    if (filename) {
        var file = exports.potFiles[filename];
        if (!file) file = exports.potFiles[filename] = {};
        file[key] = pot[key];
    }
};

function warn(message, src) {
    console.warn(
        ["WARNING: ", message, "\n  at ", src.name, ":", src.line].join(""));
}

function addMessage(filename, node, method, getSrc) {
    var src = getSrc(node[0].start.line + 1);
    var args = node[2];
    if (method.length > 1 && args.length != method.length) {
        return warn("Invalid number of arguments to i18n function", src);
    }
    var msg = {
        comments: _(node[0].start.comments_before).chain()
            .map(function(c) { return c.value.split(/\r?\n|\r/g); }).flatten()
            .filter(function(s) { return s.charAt(0) === "#"; }).value(),
        locations: [src]
    };
    for (var i = 0; i < method.length; i++) {
        if (!method[i]) continue;
        if (!pro.when_constant(args[i], addArg)) return pro.MAP.skip;
    }
    function addArg(ast, val) {
        msg[method[i]] = val;
        return true;
    }
    
    exports.addMessage(msg, filename);
    return pro.MAP.skip;
}

exports.languages = function () {
    if (!exports.languages.value) {
        exports.languages.value = _.map(utils.list("i18n/*.po"), function(s) {
            return s.replace(/^i18n[\\\/](.*)\.po$/, "$1");
        });
    }
    return exports.languages.value;
};

function poFiles() {
    if (!poFiles.value) {
        poFiles.value = {};
        _.each(exports.languages(), function(lang) {
            poFiles.value[lang] = exports.parsePO(
                fs.readFileSync("i18n/" + lang + ".po", "utf8"));
        });
    }
    return poFiles.value;
}

// gtModules :: { target basename: {
//     "name": string,
//     "files": { source file: [string] }
// } }
// modifiedModules :: { target basename: 1 }
// TODO: language distinction in modifiedModules
var gtModules = {}, modifiedModules = {}, gtModulesFilename;

function langFile(name, lang) {
    return name.replace(/@lang@/g, lang.toLowerCase().replace('_', '-')) +
        '.' + lang + '.js';
}

function writeModule(target) {
    var pofiles = poFiles();
    for (var lang in pofiles) {
        var po = pofiles[lang], dict = {};
        _.each(gtModules[target].files, function(file) {
            _.each(file, function(key) { dict[key] = po.dictionary[key]; });
        });
        var js = JSON.stringify({
            nplurals: po.nplurals,
            plural: po.plural,
            dictionary: dict
        }, null, process.env.debug ? 4 : 0);
        var name = gtModules[target].name;
        var destName = langFile(target, lang);
        mkdirsSync(path.dirname(destName));
        fs.writeFileSync(destName,
            'define("' + name + "." + lang +
            '",["io.ox/core/gettext"],function(g){return g("' + name + '",' +
            js + ');});');
    }
}

// Recursive mkdir from https://gist.github.com/319051
// mkdirsSync(path, [mode=(0777^umask)]) -> pathsCreated
function mkdirsSync(dirname, mode) {
    if (mode === undefined) mode = 0x1ff ^ process.umask();
    var pathsCreated = [], pathsFound = [];
    var fn = dirname;
    while (true) {
        try {
            var stats = fs.statSync(fn);
            if (stats.isDirectory())
                break;
            throw new Error('Unable to create directory at '+fn);
        }
        catch (e) {
            if (e.code === 'ENOENT') {
                pathsFound.push(fn);
                fn = path.dirname(fn);
            }
            else {
                throw e;
            }
        }
    }
    for (var i=pathsFound.length-1; i>-1; i--) {
        var fn = pathsFound[i];
        fs.mkdirSync(fn, mode);
        pathsCreated.push(fn);
    }
    return pathsCreated;
};

exports.modules = {
    load: function(filename) {
        gtModulesFilename = filename;
        if (path.existsSync(filename)) {
            gtModules = JSON.parse(fs.readFileSync(filename, "utf8"));
        }
    },
    add: function(moduleName, source, target) {
        var dest = path.join(process.env.l10nDir || utils.builddir,
                             'apps', moduleName);
        var module = gtModules[dest];
        if (!module) module = gtModules[dest] = { name: moduleName, files: {} };
        module.files[source] = _.keys(exports.potFiles[target] || {});
        modifiedModules[dest] = true;
        _.each(exports.languages(), function(lang) {
            var destName = langFile(dest, lang);
            utils.includes.set(destName, ['i18n/' + lang + '.po'], 'lang.js');
        });
    },
    save: function() {
        for (var target in gtModules) {
            if (modifiedModules[target]) writeModule(target);
        }
        modifiedModules = {};
        fs.writeFileSync(gtModulesFilename, JSON.stringify(gtModules, null, 4));
    }
};

exports.potScanner = function(name, deps, f) {
    var self = this;
    
    // find gettext dependency
    var apiName, moduleName;
    var depNames = _.pluck(deps[1], 1);
    for (var i = 0; i < depNames.length; i++) {
        if (depNames[i].substring(0, 8) === "gettext!") {
            apiName = f[2][i];
            moduleName = depNames[i].substring(8);
            break;
        }
    }
    if (!apiName) return;
    
    // find gettext calls
    // results are stored in pot and exports.potFiles
    var gtScope = f[3].scope;
    ast.scanner(ast.walker.call, function(scope) {
        if (ast.getter.call(this) !== apiName) return;
        if (scope.refs[apiName] !== gtScope) return;
        return addMessage(self.task.name, this, gtMethods.gettext, self.getSrc);
    }).scanner(ast.walker.method, function(scope) {
        if (ast.getter.methodObj(this) !== apiName) return;
        if (scope.refs[apiName] !== gtScope) return;
        var method = gtMethods[ast.getter.methodName(this)];
        if (!method) return;
        return addMessage(self.task.name, this, method, self.getSrc);
    }).scan(f);
    
    exports.modules.add(moduleName, this.getSrc(name[0].start.line + 1).name,
                        this.task.name);
};

utils.fileType("lang.js").addHook("handler", function(name) {
    var m = /^(.*)\.([^\.]*)\.js$/.exec(name), dest = m[1], lang = m[2];
    file(name, [], function() { modifiedModules[dest] = true; });
});

exports.potHandler = function(filename) {
    var dest = "tmp/pot/" +
        filename.replace(/\+/g, "++").replace(/[\\\/]/g, "+-");
    file("ox.pot", [dest]);
    file(dest, ["tmp/pot", filename], function() {
        var data = JSON.stringify(exports.potFiles[filename] || {});
        fs.writeFileSync(this.name, data);
    });
};

function escapePO(s) {
    return s.replace(/[\x00-\x1f\\"]/g, function(c) {
        var n = Number(c.charCodeAt(0)).toString(8);
        return "\\000".slice(0, -n.length) + n;
    });
}

exports.generatePOT = function(files) {
    _.each(files, function(file) {
        orig = file.slice(8).replace(/\+-/g, "/").replace(/\+\+/g, "+");
        if (!(orig in exports.potFiles) && path.existsSync(file)) {
            var loaded = JSON.parse(fs.readFileSync(file, "utf8"));
            exports.potFiles[orig] = loaded;
            for (var i in loaded) addMsg(pot, i, loaded[i]);
        }
    });
    var f = [potHeader];
    for (var i in pot) {
        msg = pot[i];
        var comment = generateComment(msg);
        if (comment) f.push(comment);
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
};

var poTokenizer = new RegExp(
    '^(#.*|[ \\t\\v\\f]+)$' +                  // comment or empty line
    '|(\\r\\n|\\r|\\n)' +                      // linebreak (for line numbering)
    '|^(msg[\\[\\]\\w]+)(?:$|[ \\t\\v\\f]+)' + // keyword
    '|[ \\t\\v\\f]*("[^\r\n]*")\\s*$' +        // string
    '|(.)',                                    // anything else is an error
    "gm");

var headerRegExp = new RegExp(
    '^Plural-Forms:\\s*nplurals\\s*=\\s*([0-9]+)\\s*;' + // nplurals
                  '\\s*plural\\s*=\\s*([^;]*);$',        // plural
    "m");

function format(string, params) {
    var index = 0;
    return String(string).replace(/%(([0-9]+)\$)?[A-Za-z]/g,
        function(match, pos, n) {
            if (pos) index = n - 1;
            return params[index++];
        }).replace(/%%/, "%");
}

exports.parsePO = function(file) {
    
    var po = { nplurals: 1, plural: 0, dictionary: {} };
    
    // empty PO file?
    if (/^\s*$/.test(file)) {
        return po;
    }
    
    poTokenizer.lastIndex = 0;
    var line_no = 1;
    
    function next() {
        while (poTokenizer.lastIndex < file.length) {
            var t = poTokenizer.exec(file);
            if (t[1]) continue;
            if (t[2]) {
                line_no++;
                continue;
            }
            if (t[3]) return t[3];
            if (t[4]) return t[4];
            if (t[5]) throw new Error(format(
                "Invalid character in line %s.", [line_no]));
        }
    }

    var lookahead = next();

    function clause(name, optional) {
        if (lookahead == name) {
            lookahead = next();
            var parts = [];
            while (lookahead && lookahead.charAt(0) == '"') {
                parts.push((new Function("return " + lookahead))());
                lookahead = next();
            }
            return parts.join("");
        } else if (!optional) {
            throw new Error(format(
                "Unexpected '%1$s' in line %3$s, expected '%2$s'.",
                [lookahead, name, line_no]));
        }
    }
    
    if (clause("msgid") != "") throw new Error("Missing PO file header");
    var header = clause("msgstr");
    var pluralForms = headerRegExp.exec(header);
    if (pluralForms) {
        po = { nplurals: Number(pluralForms[1]), plural: pluralForms[2],
               dictionary: {} };
    }
    
    while (lookahead) {
        var ctx = clause("msgctxt", true);
        var id = clause("msgid");
        var id_plural = clause("msgid_plural", true);
        var str;
        if (id_plural !== undefined) {
            id = id += "\x01" + id_plural;
            str = {};
            for (var i = 0; i < po.nplurals; i++) {
                str[i] = clause("msgstr[" + i + "]");
            }
        } else {
            str = clause("msgstr");
        }
        if (ctx) id = ctx + "\0" + id;
        po.dictionary[id] = str;
    }
    return po;
};
