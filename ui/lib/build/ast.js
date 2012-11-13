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

var jsp = require("../uglify-js/uglify-js").parser;
var pro = require("../uglify-js/uglify-js").uglify;
var _ = require("../underscore");

// discards ["toplevel", [["stat", *]]]
function ast(source) { return new AST(jsp.parse(source)[1][0][1]); }

ast.is = function(type) { return function(node) { return node[0] == type; }; };

ast.treeMap = function(tree, f) {
    var val = f(tree);
    if (val != null) return val;
    if (!_.isArray(tree)) return tree;
    return _.map(tree, function(n) { return ast.treeMap(n, f); });
};

ast.leafMap = function(tree, f) {
    return _.map(tree, function(n) {
        if (_.isArray(n)) return ast.leafMap(n, f);
        var val = f(n);
        return val == null ? n : val;
    });
};

ast.matcher = function(tree) {
    if (_.isFunction(tree)) return tree;
    if (tree instanceof AST) tree = tree.tree;
    if (!_.isArray(tree)) return function(n) { return n == tree; };
    var matchers = _.map(tree, ast.matcher);
    return function(n) {
        if (n.length != matchers.length) return false;
        for (var i = 0; i < n.length; i++) if (!matchers[i](n[i])) return false;
        return true;
    };
};

function AST(tree) { this.tree = tree; }

AST.prototype.replace = function(tree, value) {
    var matcher = ast.matcher(tree);
    this.tree = ast.treeMap(this.tree, function(n) {
        if (matcher(n)) return value;
    });
    return this;
};

AST.prototype.any = function(tree) {
    return this.replace(tree, function() { return true; });
};

AST.prototype.asCall = function() {
    this.tree = ["call", this.tree, function() { return true; }];
    return this;
};

AST.prototype.getter = function(placeholder) {
    var matcher = ast.matcher(placeholder);
    var getters = [];
    scan("return n", this.tree);
    function scan(body, tree) {
        if (matcher(tree)) getters.push(Function("n", body));
        if (_.isArray(tree)) {
            for (var i = 0; i < tree.length; i++) {
                scan(body + "[" + i + "]", tree[i]);
            }
        }
    }
    return getters.length == 1 ? getters[0] : getters;
};

AST.prototype.walker = function() {
    return {
        name: String(_.first(this.tree)),
        matcher: ast.matcher(this.tree)
    };
};

ast.scanner = function(walker, callback) {
    return new Scanner(walker, callback);
};

function Scanner(walker, callback) {
    this.scanners = [{ walker: walker, callback: callback }];
}

Scanner.prototype.scanner = function(walker, callback) {
    this.scanners.push({ walker: walker, callback: callback });
    return this;
};

Scanner.prototype.scan = function(tree) {
    var w = pro.ast_walker();
    var scope = tree.scope;

    function newScope(name, args, body) {
        var oldScope = scope;
        scope = body.scope;
        var val = [this[0], name, args.slice(), pro.MAP(body, w.walk)];
        scope = oldScope;
        return val;
    }

    var walkers = _.reduce(this.scanners, function(walkers, scanner) {
        var oldWalker = walkers[scanner.walker.name];
        walkers[scanner.walker.name] = function() {
            if (scanner.walker.matcher(this)) {
                var val = scanner.callback.call(this, scope);
                if (val != null) return val;
            }
            if (oldWalker) return oldWalker.apply(this, arguments);
        };
        return walkers;
    }, { "function": newScope, defun: newScope });
    return w.with_walkers(walkers, function() { return w.walk(tree); });
};

ast.walker = {
    call: ast('f').any('f').asCall().walker(),
    method: ast('x.x').any('x').asCall().walker()
};

ast.getter = {
    call: ast('f').asCall().getter('f'),
    methodObj: ast('obj.method').asCall().getter('obj'),
    methodName: ast('obj.method').asCall().getter('method'),
    string: ast('"str"').getter('str')
};

module.exports = ast;
