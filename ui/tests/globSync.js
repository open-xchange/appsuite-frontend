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
var vows = require("vows");
var assert = require("assert");

var globSync = require("../lib/glob").globSync;

function stub(dir, tree) {
    function getFile(path) {
        if (path.slice(0, dir.length) != dir) return;
        var segments = path.slice(dir.length).split("/");
        var file = tree;
        for (var i = 1; i < segments.length; i++) {
            file = file[segments[i]];
            if (!file) return;
        }
        return file;
    }
    fs.statSync = function(path) {
        var file = getFile(path);
        if (file === undefined) {
            throw new Error("File not found: " + path);
        } else {
            var isDir = typeof file == "object";
            return {
                isDirectory: function() { return isDir; },
                isFile: function() { return !isDir; }
            };
        }
    };
    fs.readdirSync = function(path) {
        var file = getFile(path);
        if (typeof file == "object") {
            var files = [];
            for (var i in file) files.push(i);
            return files;
        } else {
            throw new Error("Not a directory: " + path);
        }
    };
}

var stat, readdir;

vows.describe("Glob").addBatch({
    "stubbed": {
        topic: function() {
            stat = fs.stat;
            readdir = fs.readdir;
            stub("top", { a: 1, b: 1, c: { x: 1, y: 1, z: 1 }, d: {
                ac: 1, abc: 1, abbc: 1, abbcd: 1, a: { a: 1 }
            } });
            return true;
        },
        teardown: function() {
            fs.stat = stat;
            fs.readdir = readdir;
        },
        "statSync": {
            "outside of the toplevel directory": {
                topic: function() {
                    try {
                        return fs.statSync("outside");
                    } catch (e) {
                        this.callback(e);
                    }
                },
                "should fail": function(err, stats) { assert.ok(err); }
            },
            "of an unknown file": {
                topic: function() {
                    try {
                        return fs.statSync("top/unknown");
                    } catch (e) {
                        this.callback(e);
                    }
                },
                "should fail": function(err, stats) { assert.ok(err); }
            },
            "of a file": {
                topic: function() { return fs.statSync("top/a"); },
                "should be a file":
                    function(stats) { assert.ok(stats.isFile()); },
                "should not be a directory":
                    function(stats) { assert.ok(!stats.isDirectory()); }
            },
            "of a directory": {
                topic: function() { return fs.statSync("top/c"); },
                "should not be a file":
                    function(err, stats) { assert.ok(!stats.isFile()); },
                "should be a directory":
                    function(err, stats) { assert.ok(stats.isDirectory()); }
            },
            "of the toplevel directory": {
                topic: function() { return fs.statSync("top"); },
                "should not be a file":
                    function(err, stats) { assert.ok(!stats.isFile()); },
                "should be a directory":
                    function(err, stats) { assert.ok(stats.isDirectory()); }
            }
        },
        "readdirSync": {
            "outside of the toplevel directory": {
                topic: function() {
                    try {
                        return fs.readdirSync("outside");
                    } catch (e) {
                        this.callback(e);
                    }
                },
                "should fail": function(err, files) { assert.ok(err); }
            },
            "of an unknown directory": {
                topic: function() {
                    try {
                        return fs.readdirSync("top/unknown");
                    } catch (e) {
                        this.callback(e);
                    }
                },
                "should fail": function(err, files) { assert.ok(err); }
            },
            "of the toplevel directory": {
                topic: function() { return fs.readdirSync("top"); },
                "should return a, b, c, d": function(files) {
                    assert.deepEqual(files, ["a", "b", "c", "d"]);
                }
            },
            "of c": {
                topic: function() { return fs.readdirSync("top/c"); },
                "should return x, y, z":
                    function(files) { assert.deepEqual(files, ["x", "y", "z"]); }
            }
        },
        "glob": {
            "unknown files": {
                topic: function() { return globSync("top", "x"); },
                "should be empty": function(files) { assert.isEmpty(files); }
            },
            "a simple filename": {
                topic: function() { return globSync("top", "a"); },
                "should return one file":
                    function(files) { assert.deepEqual(files, ["a"]); }
            },
            "in a subdirectory": {
                topic: function() { return globSync("top", "c/x"); },
                "should return one file":
                    function(files) { assert.deepEqual(files, ["c/x"]); }
            },
            "with a ?": {
                topic: function() { return globSync("top", "d/a?c"); },
                "should expand to a single character":
                    function(files) { assert.deepEqual(files, ["d/abc"]); }
            },
            "with a *": {
                topic: function() { return globSync("top", "d/a*c"); },
                "should expand to 0 or more characters": function(files) {
                    assert.deepEqual(files, ["d/ac", "d/abc", "d/abbc"]);
                }
            },
            "with a **": {
                topic: function() { return globSync("top", "**/a"); },
                "should search 0 or more subdirectories": function(files) {
                    assert.deepEqual(files, ["a", "d/a/a"]);
                }
            }
        }
    }
}).export(module);