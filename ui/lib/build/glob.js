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

exports.globSync = function(dir, pattern) {
    var multiDir = {};
    if (pattern.slice(-1) == "/") pattern += "**";
    // an escaped slash is still a slash:  \\?
    // repeated slashes are ignored:       (?: )+
    var segments = pattern.split(/(?:\\?\/)+/);
    for (var i = 0; i < segments.length; i++) {
        if (segments[i] == "**") {
            segments[i] = multiDir;
        } else {
            var expand = false;
            var simple = "";
            var re = segments[i].replace(
                /(\*+)|(\?)|(\\.)|([|^$\\+()[\]{}])|([^\*\?|^$\\+()[\]{}]+)/g,
                function(m, many, one, esc, reSpecial, rest) {
                    if (esc) {
                        simple += esc.slice(1);
                        return esc;
                    }
                    if (rest) {
                        simple += rest;
                        return rest;
                    }
                    expand = true;
                    if (many) return ".*";
                    if (one) return ".";
                    if (reSpecial) return "\\" + reSpecial;
                });
            segments[i] = expand ? new RegExp("^" + re + "$") : simple;
        }
    }

    var found = {};
    match("", 0);
    var retval = [];
    for (var name in found) if (found[name]) retval.push(name);
    return retval;
    
    function match(name, index) {
        var fullname = path.join(dir, name);
        if (index >= segments.length) {
            if (!(name in found)) {
                found[name] = false;
                try {
                    var stats = fs.statSync(fullname);
                    if (stats.isFile()) found[name] = true;
                } catch (e) {}
            }
            return;
        }
        var segment = segments[index];
        if (segment === multiDir) {
            match(name, index + 1);
            try {
                var files = fs.readdirSync(fullname);
                for (var i = 0; i < files.length; i++) {
                    match(path.join(name, files[i]), index);
                }
            } catch (e) {}
        } else if (typeof segment == "string") {
            match(path.join(name, segment), index + 1);
        } else { // RegExp
            try {
                var files = fs.readdirSync(fullname);
                for (var i = 0; i < files.length; i++) {
                    if (segment.test(files[i])) {
                        match(path.join(name, files[i]), index + 1);
                    }
                }
            } catch (e) {}
        }
    }
};
