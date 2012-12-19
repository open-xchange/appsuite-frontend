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
var _ = require("../underscore");
var less = require("../less.js/lib/less/index");

// Traversal mixins

function noChildren() { return []; }
["Anonymous", "Color", "Combinator", "Comment", "Dimension", "JavaScript",
 "Keyword", "Quoted", "Variable"].forEach(function(name) {
    less.tree[name].prototype.getChildren = noChildren;
});
less.tree.Alpha.prototype.getChildren =
    less.tree.Assignment.prototype.getChildren =
    less.tree.Paren.prototype.getChildren =
    less.tree.Rule.prototype.getChildren = function() { return [this.value]; };
less.tree.Call.prototype.getChildren = function() { return this.args; };
less.tree.Condition.prototype.getChildren =
    function() { return [this.lvalue, this.rvalue]; };
less.tree.Directive.prototype.getChildren =
    function() { return [this.ruleset || this.value]; };
less.tree.Element.prototype.getChildren =
    function() { return [this.combinator]; };
less.tree.Expression.prototype.getChildren =
    less.tree.Value.prototype.getChildren = function() { return this.value; };
less.tree.Import.prototype.getChildren =
    function() { return [this._path, this.features]; };
less.tree.Media.prototype.getChildren =
    function() { return [this.features, this.ruleset]; };
less.tree.mixin.Call.prototype.getChildren =
    function() { return [].concat(this.selector, this.arguments); };
less.tree.mixin.Definition.prototype.getChildren = function() {
    return this.selectors.concat(_.compact(_.pluck(this.params, "value")),
                                 this.rules);
};
less.tree.Operation.prototype.getChildren =
    function() { return this.operands; };
less.tree.Ruleset.prototype.getChildren =
    function() { return this.selectors.concat(this.rules); };
less.tree.Selector.prototype.getChildren = function() { return this.elements; };
less.tree.Shorthand.prototype.getChildren =
    function() { return [this.a, this.b]; };
less.tree.URL.prototype.getChildren =
    function() { return this.attrs ? [] : [this.value]; };

// Cloning mixins

(function(defs) {
    function callClone(o) { return o.clone(); }
    var code = [];
    for (var i in defs) {
        code.push("less.tree." + i +
            ".prototype.clone = function() { return new less.tree." + i + "(" +
            _.map(defs[i], function(field) {
                switch (field.charAt(0)) {
                case "!":
                    return "this.#.clone ? this.#.clone() : console.error(JSON.stringify(this.features.value, null, 2))".replace(/#/g, field.slice(1));
                case "?":
                    return "this.# && this.#.clone ? this.#.clone() : this.#"
                        .replace(/#/g, field.slice(1));
                case "[":
                    return "this.# && _.map(this.#, callClone)"
                        .replace(/#/g, field.slice(1)); 
                default:
                    return "this." + field;
                }
            }).join(", ") + "); };");
    }
    eval(code.join("\n"));
}({
    Alpha: ["?value"], Anonymous: ["value"], Assignment: ["key", "?value"],
    Call: ["name", "[args", "index", "filename"],
    Color: ["rgb.slice()", "alpha"], Comment: ["value", "silent"],
    Condition: ["op", "!lvalue", "!rvalue", "index", "negate"],
    Combinator: ["value"], Dimension: ["value", "unit"],
    Directive: ["name",
                "ruleset ? this.ruleset.clone().rules : this.value.clone()"],
    Element: ["!combinator", "value", "index"], Expression: ["[value"],
    JavaScript: ["expression", "index", "escaped"], Keyword: ["value"],
    Media: ["ruleset.clone().rules", "[features.value"],
    "mixin.Call": ["[selector.elements", "[arguments", "index", "filename",
                   "important"],
    Operation: ["op", "[operands"], Paren: ["!value"],
    Quoted: ["quote", "value", "escaped", "index"],
    Rule: ["name", "!value", "important", "index", "inline"],
    Ruleset: ["[selectors", "[rules", "strictImports"], Selector: ["[elements"],
    Shorthand: ["!a", "!b"], URL: ["attrs || this.value.clone()", "paths"],
    Value: ["[value"], Variable: ["name", "index", "file"]
}));

less.tree.mixin.Definition.prototype.clone = function() {
    return new less.tree.mixin.Definition(this.name,
        _.map(this.params, function(param) {
            var clone = {};
            if (param.name) clone.name = param.name;
            if (param.value) clone.value = param.value.clone();
            if (param.variadic) clone.variadic = param.variadic;
            return clone;
        }),
        _.map(this.rules, function(rule) { return rule.clone(); }),
        this.condition && this.condition.clone(),
        this.variadic);
};

// Printing mixins

exports.print = function(node) { return _.flatten([node.print()]).join(""); };

function mapIntersperse(list, f, separator) {
    if (!list.length) return [];
    var out = [f(list[0])];
    if (separator === undefined) separator = ",";
    for (var i = 1; i < list.length; i++) out.push(separator, f(list[i]));
    return out;
}

function printList(list, separator, prec) {
    return mapIntersperse(list,
        function(n) { return n.print ? n.print(prec) : n; },
        separator);
}

function printParam(param) {
    return !param.name ? param.value.print() :
        param.value ? [param.name, ":", param.value.print()] :
        param.variadic ? [param.name, "..."] :
            param.name;
}

less.tree.Alpha.prototype.print = function() {
    return ["alpha(opacity=",
            this.value.print ? this.value.print() : this.value, ")"];
};
less.tree.Anonymous.prototype.print =
    less.tree.Combinator.prototype.print =
    less.tree.Comment.prototype.print =
    less.tree.Keyword.prototype.print = function() { return this.value; };
less.tree.Assignment.prototype.print = function() {
    return [this.key, "=", this.value.print ? this.value.print() : this.value];
};
less.tree.Call.prototype.print =
    function() { return [this.name, "(", printList(this.args), ")"]; };
less.tree.Color.prototype.print = less.tree.Dimension.prototype.print =
    function() { return this.toCSS(); };
less.tree.Condition.prototype.print = function() {
    return [this.negate ? "not (" : "(", this.lvalue.print(), this.op,
            this.rvalue.print(), ")"];
};
less.tree.Directive.prototype.print = function() {
    return this.ruleset ?
        [this.name, "{\n", this.ruleset.print(true), "}\n"] :
        [this.name, " ", this.valule.print()];
};
less.tree.Element.prototype.print = function() {
    return [this.combinator.print(),
            this.value.print ? this.value.print() : this.value];
};
less.tree.Expression.prototype.print =
    function(prec) { return printList(this.value, " ", prec); };
less.tree.Import.prototype.print = function() {
    return [this.once ? "@import-once " : "@import ", this._path.print(),
            this.features ? printList(this.features) : ""];
};
less.tree.JavaScript.prototype.print =
    function() { return [this.escaped ? "~`" : "`", this.expression, "`"]; };
less.tree.Media.prototype.print = function() {
    return ["@media ", this.features ? printList(this.features) : "",
            this.ruleset.print()];
};
less.tree.mixin.Call.prototype.print = function() {
    return [printList(this.elements, ""),
            this.args ? ["(", printList(this.args), ")"] : "",
            this.important ? " !important" : ""];
};
less.tree.mixin.Definition.prototype.print = function() {
    var addVariadic = this.variadic && !_.any(_.pluck(this.params, "variadic"));
    return [this.name, "(", mapIntersperse(this.params, printParam),
            addVariadic ? ", ...)" : ")",
            this.condition ? [" when ", this.condition.print()] : "",
            "{\n", printList(this.rules, "\n"), "}\n"];
};
less.tree.Operation.prototype.print = function(prec) {
    return this.op === "*" || this.op === "/" ?
        printList(this.operands, this.op, 1) :
        prec ? ["(", printList(this.operands, this.op), ")"] :
                     printList(this.operands, this.op);
};
less.tree.Paren.prototype.print =
    function() { return ["(", this.value.print(), ")"]; };
less.tree.Quoted.prototype.print = function() {
    return [this.escaped ? "~" : "", this.quote, this.value, this.quote];
};
less.tree.Rule.prototype.print = function() {
    return [this.name, ":", this.value.print(), this.important,
            this.inline ? "" : ";"];
};
less.tree.Ruleset.prototype.print = function(root) {
    return root || this.root ? printList(this.rules, "\n") :
        [printList(this.selectors), "{\n", printList(this.rules, "\n"), "}\n"];
};
less.tree.Shorthand.prototype.print =
    function() { return [this.a.print(), "/", this.b.print()]; };
less.tree.Selector.prototype.print =
    function() { return printList(this.elements, ""); };
less.tree.URL.prototype.print = function() {
    return this.attrs ? ["url(data:", this.attrs.mime, this.attrs.charset,
                         this.attrs.abse64, this.attrs.data] :
        ["url(", this.value.print(), ")"];
};
less.tree.Value.prototype.print =
    function() { return printList(this.value); };
less.tree.Variable.prototype.print = function() { return this.name; };

// Synchronous importer (a modified copy of the original in less/index.js)

less.Parser.importer = function (file, paths, callback) {
    var pathname = null;
    
    for (var i = 0; i < paths.length; i++) {
        try {
            pathname = path.join(paths[i], file);
            fs.statSync(pathname);
            break;
        } catch (e) {
            pathname = null;
        }
    }
    
    if (pathname) {
        var data = fs.readFileSync(pathname, 'utf-8');
        new(less.Parser)({
            paths: [path.dirname(pathname)],
            filename: pathname
        }).parse(data, function (e, root) {
            if (e) less.writeError(e);
            callback(root);
        });
    } else {
        require("util").error("file '" + file + "' wasn't found.\n");
        process.exit(1);
    }
};

/**
 * Iterates over a LESS syntax tree, calling a callback function for every
 * matching node. The callback is called before computing the list of child
 * nodes (prefix order).
 * @param {Object} root The root node of the syntax tree over which to iterate.
 * @param {Function} matcher An optional matcher which specifies for
 * which nodes f should be called. It can be a function or a node constructor.
 * If it is a function, it should take any node as parameter and return true if
 * the node matches. If it is a node constructor, all instances of that node
 * class will match. If omitted entirely, all nodes will match.
 * @param {Function} f A callback function which is called with a matching node
 * as parameter.
 */
exports.iterate = function(root, matcher, f) {
    if (typeof f == "undefined") {
        f = matcher;
        matcher = undefined;
    }
    if (typeof matcher != "function") {
        matcher = function() { return true; };
    } else if (matcher.prototype.getChildren) {
        var type = matcher;
        matcher = function(node) { return node instanceof type; };
    }
    iter(root);
    function iter(node) {
        if (matcher(node)) f(node);
        node.getChildren().forEach(iter);
    }
};

exports.tree = less.tree;

exports.parse = function(data, src) {
    var result;
    new less.Parser({ paths: [path.dirname(src)] }).parse(data,
        function(e, tree) { if (e) throw e; else result = tree; });
    return result;
};

exports.parseFile = function(filename) {
    return exports.parse(fs.readFileSync(filename, "utf8"), filename);
};

exports.lessFilter = function(data) {
    var self = this;
    var result = "";
    var src = this.getSrc(1).name, dest = this.task.name;
    utils.includes.set(dest, []);
    try {
        new less.Parser({ paths: [path.dirname(src)] }).parse(data, filter);
    } catch (e) {
        if (e.line) {
            var src = this.getSrc(e.line);
            console.error(src.name + ":" + src.line);
        }
        throw e;
    }
    return result;
    
    function filter(e, tree) {
        if (e) throw e;
        
        _.each(self.type.getHooks("less"), function(hook) {
            tree = hook.call(self, tree) || tree;
        });
        exports.iterate(tree, less.tree.URL, function(url) {
            if (!url.value || !/\.png$/.test(url.value.value)) return;
            var filename = path.join(path.dirname(self.getSrc(1).name),
                                     url.value.value);
            var buf = fs.readFileSync(filename);
            if (buf.length > 24558) return; // IE8 size limit
            url.attrs = { mime: "image/png", charset: "", base64: ";base64",
                          data: "," + buf.toString("base64") };
            delete url.value;
            utils.includes.add(dest, filename);
        });
        exports.iterate(tree, less.tree.Import, function(import_) {
            utils.includes.add(dest,
                             path.join(path.dirname(src), import_.path));
        });
        result = tree;
    }
};
