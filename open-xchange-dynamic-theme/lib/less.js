/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2014
 * Mail: info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

var _ = require("underscore");
var less = require("less");

// Traversal mixins

function noChildren() { return []; }
["Anonymous", "Color", "Combinator", "Comment", "JavaScript",
 "Keyword", "Quoted", "RulesetCall", "UnicodeDescriptor", "Unit",
 "Variable"].forEach(function(name) {
    less.tree[name].prototype.getChildren = noChildren;
});
less.tree.Alpha.prototype.getChildren =
    less.tree.Assignment.prototype.getChildren =
    less.tree.Negative.prototype.getChildren =
    less.tree.Paren.prototype.getChildren = function() { return [this.value]; };
less.tree.Call.prototype.getChildren = function() { return this.args; };
less.tree.Condition.prototype.getChildren =
    function() { return [this.lvalue, this.rvalue]; };
less.tree.DetachedRuleset.prototype.getChildren =
    function() { return [this.ruleset]; };
less.tree.Dimension.prototype.getChildren =
    function() { return [this.unit]; };
less.tree.Directive.prototype.getChildren =
    function() { return [this.rules, this.value]; };
less.tree.Element.prototype.getChildren =
    function() { return [this.combinator, this.value]; };
less.tree.Expression.prototype.getChildren =
    less.tree.Value.prototype.getChildren = function() { return this.value; };
less.tree.Extend.prototype.getChildren = function() { return [this.selector]; };
less.tree.Import.prototype.getChildren =
    function() { return [this.path, this.features, this.root]; };
less.tree.Media.prototype.getChildren =
    function() { return [].concat(this.features, this.rules); };
less.tree.mixin.Call.prototype.getChildren = function() {
    return [].concat(this.selector, _.pluck(this.arguments, "value"));
};
less.tree.mixin.Definition.prototype.getChildren = function() {
    return this.selectors.concat(_.compact(_.pluck(this.params, "value")),
                                 this.rules, this.condition);
};
less.tree.Operation.prototype.getChildren =
    function() { return this.operands; };
less.tree.Rule.prototype.getChildren =
    function() { return [].concat(this.name, this.value); };
less.tree.Ruleset.prototype.getChildren =
    function() { return [].concat(this.paths, this.selectors, this.rules); };
less.tree.Selector.prototype.getChildren = function() {
    return [].concat(this.elements, this.extendList, this.condition);
};
less.tree.URL.prototype.getChildren =
    function() { return this.attrs ? [] : [this.value]; };

// Cloning mixins

function callClone(o) { return o.clone(); }
(function(defs) {
    var code = [];
    for (var i in defs) {
        code.push("less.tree." + i +
            ".prototype.clone = function() { return new less.tree." + i + "(" +
            _.map(defs[i], function(field) {
                switch (field.charAt(0)) {
                case "!":
                    return ("this.#.clone ? this.#.clone() : console.error(" +
                        "JSON.stringify(this.features.value, null, 2))")
                        .replace(/#/g, field.slice(1));
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
    Alpha: ["?value"],
    Anonymous: ["value", "index", "currentFileInfo", "mapLines"],
    Assignment: ["key", "?value"], Attribute: ["?key", "op", "?value"],
    Call: ["name", "[args", "index", "currentFileInfo"],
    Color: ["rgb.slice()", "alpha"], Combinator: ["value"],
    Comment: ["value", "silent", "index", "currentFileInfo"],
    Condition: ["op", "!lvalue", "!rvalue", "index", "negate"],
    DetachedRuleset: ["!ruleset", "frames"], Dimension: ["value", "!unit"],
    Directive: ["name", "?value", "?rules", "index", "currentFileInfo",
                "debugInfo"],
    Element: ["!combinator", "?value", "index", "currentFileInfo"],
    Expression: ["[value"],
    JavaScript: ["expression", "index", "escaped"], Keyword: ["value"],
    Media: ["rules[0].clone().rules", "[features.value", "index",
            "currentFileInfo"],
    Negative: ["!value"], Operation: ["op", "[operands", "isSpaced"],
    Paren: ["!value"],
    Quoted: ["quote", "value", "escaped", "index", "currentFileInfo"],
    Rule: ["name && typeof this.name === 'string' ? this.name : " +
               "_.map(this.name, callClone)",
           "!value", "important", "merge", "index", "currentFileInfo",
           "inline"],
    Ruleset: ["[selectors", "[rules", "strictImports"],
    RulesetCall: ["variable"],
    Selector: ["[elements", "[extendList", "?condition", "index",
               "currentFileInfo", "isReferenced"],
    UnicodeDescriptor: ["value"], URL: ["!value", "currentFileInfo", "isEvald"],
    Value: ["[value"], Variable: ["name", "index", "currentFileInfo"]
}));

less.tree.mixin.Call.prototype.clone = function() {
    return new less.tree.mixin.Call(this.selector.elements,
        this.arguments && this.arguments.map(function (arg) {
            return { name: arg.name, value: arg.value.clone() };
        }),
        this.index, this.currentFileInfo, this.important);
};

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
        this.variadic, this.frames);
};

// Printing mixins

exports.print = function(node) { return _.flatten([node.print()]).join(""); };

function print(n, opt) { return n && n.print ? n.print(opt) : n; }

function mapIntersperse(list, f, separator) {
    if (!list.length) return [];
    var out = [f(list[0])];
    if (separator === undefined) separator = ",";
    for (var i = 1; i < list.length; i++) out.push(separator, f(list[i]));
    return out;
}

function printList(list, separator, opt) {
    return mapIntersperse(list,
        function(n) { return n.print ? n.print(opt) : n; },
        separator);
}

function printParam(param) {
    return !param.name ? param.value.print() :
        param.value ? [param.name, ":", param.value.print()] :
        param.variadic ? [param.name, "..."] :
            param.name;
}

less.tree.Alpha.prototype.print = function() {
    return ["alpha(opacity=", print(this.value), ")"];
};
less.tree.Anonymous.prototype.print =
    less.tree.Combinator.prototype.print =
    less.tree.Comment.prototype.print =
    less.tree.UnicodeDescriptor.prototype.print =
    less.tree.Keyword.prototype.print = function() { return this.value; };
less.tree.Assignment.prototype.print =
    function() { return [this.key, "=", print(this.value)]; };
less.tree.Attribute.prototype.print = function() {
    return ["[", print(this.key, { curly: true }),
            this.op ? [this.op, print(this.value, { curly: true })] : "",
            "]"];
};
less.tree.Call.prototype.print =
    function() { return [this.name, "(", printList(this.args), ")"]; };
less.tree.Color.prototype.print = function() {
    return this.alpha == 0 ? "transparent"
         : this.alpha < 1 ? ["rgba(", this.rgb.concat(this.alpha).join(), ")"]
         : this.toRGB();
};
less.tree.Condition.prototype.print = function() {
    return [this.negate ? "not (" : "(", this.lvalue.print(), this.op,
            this.rvalue.print(), ")"];
};
less.tree.DetachedRuleset.prototype.print =
    function(opt) { return this.ruleset ? this.ruleset.print(opt) : ""; };
less.tree.Dimension.prototype.print =
    function() { return [this.value, this.unit.print()]; };
less.tree.Directive.prototype.print = function(opt) {
    return [this.name, this.value ? [" ", this.value.print(opt)] : "",
            this.rules ? ["{\n", this.rules.print({ root: true }), "}\n"]
                       : ";"];
};
less.tree.Element.prototype.print = function() {
    return [this.combinator.print(), print(this.value, { curly: true })];
};
less.tree.Expression.prototype.print =
    function(opt) { return printList(this.value, " ", opt); };
less.tree.Extend.prototype.print = function(opt) {
    return opt.block ? ["&:extend(", this.selector.print(), ");"]
                     : [":extend(", this.selector.print(), ")"];
};
less.tree.Import.prototype.print = function(opt) {
    var importOpts = [];
    if (this.options) {
        for (var i in this.options) {
            switch (i) {
                case 'less':
                    importOpts.push(this.options[i] ? 'less' : 'css');
                    break;
                case 'multiple':
                    importOpts.push(this.options[i] ? 'multiple' : 'once');
                    break;
                default:
                    importOpts.push(i);
            }
        }
    }
    return ["@import", importOpts.length ? ["(", importOpts, ")"] : "",
            this.path.print(), this.features ? printList(this.features) : "",
            opt && opt.block ? ";" : ""];
};
less.tree.JavaScript.prototype.print =
    function() { return [this.escaped ? "~`" : "`", this.expression, "`"]; };
less.tree.Media.prototype.print = function() {
    return ["@media ", this.features ? this.features.print() : "",
            "{", printList(this.rules, "\n", { block: true }), "}"];
};
less.tree.mixin.Call.prototype.print = function(opt) {
    return [this.selector.print(),
            !this.arguments ? "" :
                ["(", mapIntersperse(this.arguments, printParam), ")"],
            this.important ? " !important" : "",
            opt && opt.block ? ";" : ""];
};
less.tree.mixin.Definition.prototype.print = function() {
    var addVariadic = this.variadic && !_.any(_.pluck(this.params, "variadic"));
    return [this.name, "(", mapIntersperse(this.params, printParam),
            addVariadic ? ", ...)" : ")",
            this.condition ? [" when ", this.condition.print()] : "",
            "{\n", printList(this.rules, "\n", { block: true }), "}\n"];
};
less.tree.Negative.prototype.print =
    function(opt) { return ["-(", this.value.print(opt), ")"]; };
less.tree.Operation.prototype.print = function(opt) {
    var op = this.isSpaced ? " " + this.op + " " : this.op;
    return this.op === "*" || this.op === "/" ?
        printList(this.operands, op, 1) :
        opt && opt.prec ? ["(", printList(this.operands, op), ")"] :
                                printList(this.operands, op);
};
less.tree.Paren.prototype.print =
    function() { return ["(", this.value.print(), ")"]; };
less.tree.Quoted.prototype.print = function() {
    return [this.escaped ? "~" : "", this.quote, this.value, this.quote];
};
less.tree.Rule.prototype.print = function(opt) {
    return [typeof this.name === "string" ? this.name
                : printList(this.name, "", { curly: true }),
            this.merge ? "+:" : ":", this.value.print(), this.important,
            opt && opt.block || !this.inline ? ";" : ""];
};
less.tree.Ruleset.prototype.print = function(opt) {
    return opt && opt.root || this.root ?
        printList(this.rules, "\n", { block: true }) :
        [printList(this.selectors), "{\n",
         printList(this.rules, "\n", { block: true }), "}\n"];
};
less.tree.RulesetCall.prototype.print =
    function() { return [this.variable, "();"]; };
less.tree.Selector.prototype.print = function() {
    return [printList(this.elements, ""), printList(this.extendList || [], ""),
            this.condition ? [" when ", this.condition.print()] : ""];
};
less.tree.Unit.prototype.print = function() {
    return [this.numerator[0] || this.denominator[0] || this.backupUnit];
};
less.tree.URL.prototype.print = function() {
    return this.attrs ? ["url(data:", this.attrs.mime, this.attrs.charset,
                         this.attrs.abse64, this.attrs.data] :
        ["url(", this.value.print(), ")"];
};
less.tree.Value.prototype.print =
    function() { return printList(this.value); };
less.tree.Variable.prototype.print = function(opt) {
    return opt && opt.curly ? ["@{", this.name.slice(1), "}"] : this.name;
};

/**
 * Walks over a LeSS syntax tree, calling the specified functions for matching
 * nodes. Usage:
 *     less.walk('Variable', processVar).walk('Rule', processRule).over(root);
 * For each node, multiple callbacks of the same type are called in the order of
 * their registration. Callbacks without a type are called in order of their
 * registration before all type-specific callbacks. Postfix callbacks are called
 * in the reverse order of the corresponding prefix callbacks (including
 * type-free callbacks being called last).
 * @param type {String or [String]} An optional string or array of strings
 * specifying the types of nodes for which the callbacks should be called.
 * Omit to have the callabcks called for every node.
 * @param pre {Function or null} A prefix callback which is called before
 * the child nodes are processed. The first parameter is the current node.
 * If it's the only callback and it has two parameters, then the second
 * parameter is a function which processes other callbacks and the children.
 * @param post {Function} An optional postfix callback which is called after
 * the child nodes are processed. The only parameter is the current node.
 * @return An object with methods walk() which works the same as this function,
 * and over(), which takes an AST as parameter and performs the actual walking.
 */
exports.walk = function (type, pre, post) {
    return {
        walkers: { '': [] },
        walk: walk,
        over: walkOver
    }.walk(type, pre, post);
}

function walk(type, pre, post) {
    if (typeof type === 'string') type = [type];
    else if (!_.isArray(type)) {
        post = pre;
        pre = type;
        type = [''];
    }
    var walker = (!post && pre.length >= 2) ? pre :
        function (node, next) {
            if (pre) pre(node);
            next();
            if (post) post(node);
        };
    type.forEach(function (t) {
        if (this[t]) this[t].push(walker); else this[t] = [walker];
    }, this.walkers);
    return this;
}

function walkOver(node) {
    if (!node || !node.getChildren) return;
    var walkers = this.walkers[''].concat(this.walkers[node.type] || []);
    var self = this;
    next(0)();
    function next(i) {
        return function () {
            if (i < walkers.length) {
                walkers[i](node, next(i + 1));
            } else {
                node.getChildren().forEach(walkOver, self);
            }
        };
    }
}

exports.tree = less.tree;
exports.Parser = less.Parser;
exports.formatError = less.formatError;
