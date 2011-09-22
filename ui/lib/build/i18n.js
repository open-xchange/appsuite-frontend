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

var defineWalker = ast("define").asCall().walker();
var gtWalker = ast("gt").any("gt").asCall().walker();
var gtMethodWalker = ast("gt.gt").any("gt").asCall().walker();
var getGt = ast("gt").asCall().getter("gt");
var getMethod = ast("gt.gt").asCall().getter("gt");
var getStr = ast("'str'").getter("str");

var potHeader = 'msgid ""\nmsgstr ""\n' +
    '"Project-Id-Version: Open-Xchange 7\\n"\n' +
    '"POT-Creation-Date: ' + utils.startTime + '\\n"\n' +
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

function addMsg(map, key, msg) {
    if (key in map) {
        if (!_.isEqual(map[key].comments, msg.comments)) {
            throw new Error("Different comments for the same text");
        }
    } else {
        map[key] = msg;
    }
}

exports.addMessage = function(msg, filename) {
    if (!msg.comments) msg.comments = [];
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

function addMessage(filename, node, method) {
    var args = node[2];
    if (args.length != method.length) return;
    var msg = { comments: _.pluck(node[0].start.comments_before, "value") };
    for (var i = 0; i < method.length; i++) if (method[i]) {
        msg[method[i]] = getStr(args[i]);
    }
    
    exports.addMessage(msg, filename);
    return pro.MAP.skip;
}

exports.potScan = function(filename, tree) {
    ast.scanner(defineWalker, function(scope) {
        if (scope.refs.define !== undefined) return;
        var args = this[2];
        var deps = _.detect(args, ast.is("array"));
        var f = _.detect(args, ast.is("function"));
        if (!deps || !f) return;
        var gtIndex = _.indexOf(_.pluck(deps[1], 1), "io.ox/core/gettext");
        if (gtIndex < 0) return;
        var gtName = f[2][gtIndex];
        var gtScope = f[3].scope;
        ast.scanner(gtWalker, function(scope) {
            if (getGt(this) != gtName) return;
            if (scope.refs[gtName] != gtScope) return;
            return addMessage(filename, this, gtMethods.gettext);
        }).scanner(gtMethodWalker, function(scope) {
            if (getMethod[0](this) != gtName) return;
            if (scope.refs[gtName] != gtScope) return;
            var method = gtMethods[getMethod[1](this)];
            if (!method) return;
            return addMessage(filename, this, method);
        }).scan(f);
        return pro.MAP.skip;
    }).scan(pro.ast_add_scope(tree));
};

function escapePO(s) {
    return s.replace(/[\x00-\x1f\\"]/g, function(c) {
        var n = Number(c.charCodeAt(0)).toString(16);
        return "\\u00" + (n.length < 2 ? "0" + n : n);
    });
}

exports.generatePOT = function(files) {
    _.each(files, function(file) {
        orig = file.slice(8).replace(/\+-/g, "/").replace(/\+\+/g, "+");
        if (!(orig in exports.potFiles)&& path.existsSync(file)) {
            var loaded = JSON.parse(fs.readFileSync(file, "utf8"));
            exports.potFiles[orig] = loaded;
            for (var i in loaded) addMsg(pot, i, loaded[i]);
        }
    });
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
                "Invalid character in line %s.", line_no));
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
                lookahead, name, line_no));
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
