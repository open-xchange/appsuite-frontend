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

var vows = require("vows");
var assert = require("assert");
var jsp = require("../lib/uglify-js/uglify-js").parser;
var pro = require("../lib/uglify-js/uglify-js").uglify;
var _ = require("../lib/underscore/underscore");

var ast = require("../lib/build/ast");

function testTreeMap(tree) {
    var calls = [], i = 0;
    return {
        tree: ast.treeMap(tree, function(n) {
            calls.push(n);
            if (!_.isArray(n)) return ++i;
        }),
        calls: calls
    };
}

function testLeafMap(tree) {
    var calls = [], i = 0;
    return {
        tree: ast.leafMap(tree, function(n) {
            calls.push(n);
            return ++i;
        }),
        calls: calls
    };
}

function verifyMap(tree, calls) {
    return function(topic) {
        if (tree) assert.deepEqual(topic.tree, tree);
        if (calls) assert.deepEqual(topic.calls, calls);
    };
}

function verifyScan(tree, calls) {
    return function(walkers) {
        if (!_.isArray(walkers)) walkers = [walkers];
        var counter = 0;
        function callback() {
            assert.isTrue(ast.matcher(ast(calls[counter++]))(this));
        }
        var s = ast.scanner(walkers[0], callback);
        for (var i = 1; i < walkers.length; i++) s.scanner(walkers[i].callback);
        s.scan(jsp.parse(tree, false, true));
        assert.equal(counter, calls.length);
    };
}

vows.describe("UglifyJS AST manipulation").addBatch({
    "treeMap": {
        "of an empty array": {
            topic: testTreeMap([]),
            "should call the callback": verifyMap([], [[]])
        },
        "of an array": {
            topic: testTreeMap(["a", "b", "c"]),
            "should process all nodes":
                verifyMap([1, 2, 3], [["a", "b", "c"], "a", "b", "c"])
        },
        "of a nested array": {
            topic: testTreeMap(["a", ["b", "c"]]),
            "should be recursive": verifyMap([1, [2, 3]],
                    [["a", ["b", "c"]], "a", ["b", "c"], "b", "c"])
        }
    },
    "leafMap": {
        "of an empty array": {
            topic: testLeafMap([]),
            "should not call the callback": verifyMap([], [])
        },
        "of an array": {
            topic: testLeafMap(["a", "b", "c"]),
            "should process only leaf nodes":
                verifyMap([1, 2, 3], ["a", "b", "c"])
        },
        "of a nested array": {
            topic: testLeafMap(["a", ["b", "c"]]),
            "should be recursive":
                verifyMap([1, [2, 3]], ["a", "b", "c"])
        }
    },
    "matcher": {
        "for a primitive": {
            topic: function() { return ast.matcher("x"); },
            "should match the value":
                function(matcher) { assert.isTrue(matcher("x")); },
            "should not match anything else":
                function(matcher) { assert.isFalse(matcher("y")); }
        },
        "for a function": {
            topic: function() {
                return ast.matcher(function(n) { return n.calls++; });
            },
            "should return the function": function(matcher) {
                var tree = { calls: 0 };
                assert.equal(matcher(tree), 0);
                assert.equal(matcher(tree), 1);
                assert.equal(tree.calls, 2);
            }
        },
        "for an array": {
            topic: function() {
                return ast.matcher(["a", function() { return true; }]);
            },
            "should be recursive": function(matcher) {
                assert.isTrue(matcher(["a", "b"]));
                assert.isTrue(matcher(["a", "c"]));
                assert.isFalse(matcher(["a", "b", "c"]));
            }
        },
        "for a tree": {
            topic: function() { return ast.matcher(ast("x")); },
            "should match the tree": function(matcher) {
                assert.isTrue(matcher(ast("x").tree));
                assert.isFalse(matcher(ast("x")));
                assert.isFalse(matcher("x"));
            }
        }
    },
    "x": {
        topic: ast("x"),
        "should parse as (name x)":
            function(topic) { assert.deepEqual(topic.tree, ["name", "x"]); }
    },
    "x + y": {
        topic: ast("x + y"),
        "should parse as (binary + (name x) (name y))": function(topic) {
            assert.deepEqual(topic.tree,
                ["binary", "+", ["name", "x"], ["name", "y"]]);
        },
        "with y replaced by z": {
            topic: function(tree) { return tree.replace("y", "z"); },
            "should parse as (binary + (name x) (name y))": function(topic) {
                assert.deepEqual(topic.tree,
                    ["binary", "+", ["name", "x"], ["name", "z"]]);
            }
        }
    },
    "getter": {
        "for a string": {
            topic: function() { return ast("x + y").getter("y"); },
            "should return the string": function(getter) {
                assert.equal(getter(ast("a + b").tree), "b");
            }
        },
        "for a tree": {
            topic: function() { return ast("x + y").getter(ast("y")); },
            "should return the tree": function(getter) {
                assert.deepEqual(getter(ast("a + b").tree), ast("b").tree);
            }
        },
        "with multiple occurencies": {
            topic: ast("x + x").getter("x"),
            "should return each its own value": function(getters) {
                assert.equal(getters[0](ast("a + b").tree), "a");
                assert.equal(getters[1](ast("a + b").tree), "b");
            }
        }
    },
    "walker": {
        "for x": {
            topic: ast("x").walker(),
            "should match only itself": verifyScan("x + y", ["x"]),
            "should match itself multiple times":
                verifyScan("x + x", ["x", "x"])
        },
        "for a call": {
            topic: ast("f").asCall().walker(),
            "should match a function call": verifyScan("f(x)", ["f(x)"]),
            "should match a nested call": verifyScan("g(f(x))", ["f(x)"])
        }
    }
}).export(module);
