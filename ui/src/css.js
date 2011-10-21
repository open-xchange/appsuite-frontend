//#NOJSHINT
/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/**
 * LESS is distributed under the terms of the Apache License, Version 2.0
 */

(function () {

    var plugin = function (selector, filter) {
        
        return {

            load: function (def, require, cont, config) {
                
                var file = config.baseUrl + def,
                    // get path to fix URLs
                    path = file.replace(/\/[^\/]+$/, "/");

                // fetch via XHR
                $.ajax({
                    url: file,
                    dataType: "text"
                })
                .done(function (css) {
                    if (filter) {
                        filter(css, insert);
                    } else {
                        insert(css);
                    }
                    function insert(css) {
                        var text = css.replace(/url\((?!data\:)/g,
                                               "url(" + path);
                        $('<style type="text/css">' + text + '</style>')
                            .attr("data-require-src", def)
                            .insertBefore($(selector).eq(0));
                        // continue
                        cont();
                    }
                });
            }
        };
    };
    
    // css plugin
    define("css", plugin("title"));  // append before title tag
    
    // theme plugin
    define("theme", plugin("script"));  // append before first script tag
    
    define("less", function () {
        var less = { tree: {} }, exports = less;
        function require(name) {
            return less[name.split("/")[1]];
        }
        (function () {
            var window; // pretend we're not in a browser
            //@include parser.js
        }());
        //@include tree.js
        //@include functions.js
        //@include tree/*.js
        less.Parser.importer = function (file, paths, callback) {
            var filename = paths[0] ? paths[0] + "/" + file : file;
            window.require([filename], function (data) {
                new less.Parser({
                    paths: [filename.replace(/(?:^(\/)|\/|^)[^\/]*$/, "$1")],
                    filename: filename
                }).parse(data, function (e, root) {
                    if (e) return console.error("LESS error", e);
                    callback(root);
                });
            });
        };
        return plugin("title", function (data, callback) {
            var theme = "@foreground: #000;\n@background: #fff;\n";
            new less.Parser({ paths: [""], filename: name + ".less" })
                .parse(theme + data, function (e, root) {
                    if (e) return console.error("LESS error", e);
                    callback(root.toCSS());
                });
        });
    });
    
}());

define ("gettext", ["io.ox/core/gettext"], function(gettext) {
    return {
        load: function(name, parentRequire, load, config) {
            var module = gettext.getModule(name);
            if (module) {
                parentRequire([module], load);
            } else {
                load(gettext(name));
            }
        }
    };
});
