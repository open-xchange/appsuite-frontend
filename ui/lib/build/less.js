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

// Iteration mixins

function noChildren() { return []; }
["Anonymous", "Color", "Combinator", "Comment", "Dimension", "JavaScript",
 "Keyword", "Quoted", "Variable"].forEach(function(name) {
    less.tree[name].prototype.getChildren = noChildren;
});
less.tree.Alpha.prototype.getChildren =
    less.tree.Rule.prototype.getChildren = function() { return [this.value]; };
less.tree.Call.prototype.getChildren = function() { return this.args; };
less.tree.Directive.prototype.getChildren =
    function() { return [this.ruleset || this.value]; };
less.tree.Element.prototype.getChildren =
    function() { return [this.combinator]; };
less.tree.Expression.prototype.getChildren =
    less.tree.Value.prototype.getChildren = function() { return this.value; };
less.tree.Import.prototype.getChildren = function() { return [this._path]; };
less.tree.mixin.Call.prototype.getChildren =
    function() { return [].concat(this.selector, this.args); };
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

// Synchronous importer (a modified copy of the original in less/index.js)

less.Parser.importer = function (file, paths, callback) {
    var pathname = null;
    
    paths.unshift('.');
    
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

utils.addFilter("less", function(lessfile, getSrc) {
    var result = "";
    var src = getSrc(1).name, dest = this.name;
    utils.setIncludes(dest, []);
    new less.Parser({ filename: src, paths: [path.dirname(src)] }).parse(
        lessfile,
        function(e, tree) {
            exports.iterate(tree, less.tree.URL, function(url) {
                if (!url.value || !/\.png$/.test(url.value.value)) return;
                var filename = path.join(path.dirname(getSrc(1).name),
                                         url.value.value);
                var buf = fs.readFileSync(filename);
                if (buf.length > 24558) return; // IE8 size limit
                url.attrs = { mime: "image/png", charset: "", base64: ";base64",
                              data: "," + buf.toString("base64") };
                delete url.value;
                utils.addInclude(dest, filename);
            });
            exports.iterate(tree, less.tree.Import, function(import_) {
                utils.addInclude(dest,
                                 path.join(path.dirname(src), import_.path));
            });
            result = tree.toCSS({ compress: !process.env.debug });
        });
    return result;
});
