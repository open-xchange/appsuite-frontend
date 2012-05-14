// NOJSHINT
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

    function dirname(filename) {
        return filename.replace(/(?:^|(\/))[^\/]+$/, "$1");
    }

    function relativeCSS(path, css) {
        return css.replace(/url\((?!\/|[A-Za-z][A-Za-z0-9+.-]*\:)/g,
                           "url(" + path);
    }

    function insert(name, css, selector) {
        return $('<style type="text/css">' + relativeCSS(dirname(name), css) +
                 '</style>')
            .attr("data-require-src", name).insertBefore($(selector).first());
    }

    define("text", { load: function(name, parentRequire, load, config) {
        $.ajax({ url: config.baseUrl + name, dataType: "text" }).done(load);
    } });

    // css plugin
    define("css", {
        load: function (name, parentRequire, load, config) {
            require(["text!" + name]).done(function(css) {
                load(insert(config.baseUrl + name, css, "title"));
            });
        }
    });

    var currentTheme = "";
    var themeLess = {}, lessFiles = [themeLess];
    var themeCSS;

    var less = (function () {
        var less = { tree: {} }, exports = less;
        function require (name) {
            return less[name.split("/")[1]];
        }
        (function () {
            var window; // pretend we're not in a browser
            //@include ../lib/less.js/lib/less/parser.js
        }());
        //@include ../lib/less.js/lib/less/tree.js
        //@include ../lib/less.js/lib/less/colors.js
        //@include ../lib/less.js/lib/less/functions.js
        //@include ../lib/less.js/lib/less/tree/*.js
        less.Parser.importer = function (file, paths, callback) {
            var filename = paths[0] ? paths[0] + "/" + file : file;
            window.require(["text!" + filename], function (data) {
                new less.Parser({
                    paths: [filename.replace(/(?:^(\/)|\/|^)[^\/]*$/, "$1")],
                    filename: filename
                }).parse(data, function (e, root) {
                    if (e) return console.error("LESS error", e);
                    callback(root);
                });
            });
        };
        return function (data) {
            var def = new $.Deferred();
            try {
                new less.Parser({ paths: [""] }).parse(currentTheme + data,
                    function (e, root) {
                        if (e) def.reject(e); else {
                            try {
                                def.resolve(root.toCSS());
                            } catch (e2) {
                                console.error("LESS error", e2);
                            }
                        }
                    });
            } catch (e) {
                console.error("LESS error", e);
            }
            return def.promise();
        };
    }());

    define("less", {
        load: function (name, parentRequire, load, config) {
            require(["text!" + name]).pipe(function (data) {
                if (currentTheme) {
                    return less(data).pipe(function (css) {
                        return { less: data, css: css };
                    });
                } else {
                    return { less: data };
                }
            }).done(function (data) {
                var file = {
                    name: config.baseUrl + name,
                    source: data.less,
                };
                if (data.css) file.node = insert(file.name, data.css, "script");
                lessFiles.push(file);
                load();
            }).fail(function (e) {
                console.error("LESS error", e);
                load();
            });
        }
    });

    function setTheme(theme) {
        currentTheme = theme;
        return $.when.apply($, _.map(lessFiles, function (file) {
            return less(file.source).done(function(css) {
                if (file.node) {
                    file.node.text(relativeCSS(file.path, css));
                } else {
                    file.node = insert(file.name, css, "script");
                };
            });
        }));
    }

    // themes module
    define("themes", {
        /**
         * Loads a new theme.
         * @param {String} name The name of the new theme.
         * @type Promise
         * @returns A promise which gets fulfilled when the theme finishes
         * loading. Please ignore the value of the promise.
         */
        set: function (name, customTheme) {
            var list;
            if (name) {
                list = ["text!themes/" + name + "/definitions.less", "text!themes/" + name + "/style.less", "text!themes/" + name + "/style.css"];
            } else {
                list = ["text!themes/default/definitions.less", "text!themes/style.less"];
                name = 'default';
            }
            return require(list)
                .pipe(function(theme, less, css) {
                    var path = ox.base + "/apps/themes/" + name + "/";
                    css = css || "";
                    if (themeCSS) {
                        themeCSS.text(relativeCSS(path, css));
                    } else {
                        themeCSS = insert(path + "static.css", css, "script");
                    }
                    themeLess.path = path;
                    themeLess.name = path + "dynamic.less";
                    themeLess.source = less;
                    return setTheme(customTheme || theme);
                });
        },
        /**
         * Alters the current theme.
         * @param {Object} definitions An object with a property for every
         * theme variable definition to change.
         * @example
         * require(["themes"]).done(function(themes) {
         *     themes.alter({
         *         "menu-background": "hsl(" + 360 * Math.random() + ",1,0.5);"
         *     });
         * });
         * @type Promise
         * @returns A promise which gets fulfilled when the theme finishes
         * loading. Please ignore the value of the promise.
         */
        alter: function (definitions) {
            return this.set(
                    '',
                    currentTheme.replace(/^\s*@([\w-]+)\s*:.*$/gm,
                        function (match, name) {
                            return name in definitions ?
                                "@" + name + ":" + definitions[name] + ";" :
                                match;
                        }
                    )
                );
        },

        getDefinitions: function () {
            return (currentTheme || '').replace(/:/g, ': ');
        }
    });

}());

define("gettext", function (gettext) {
    return {
        load: function (name, parentRequire, load, config) {
            require(["io.ox/core/gettext"]).pipe(function (gettext) {
                return gettext.language;
            }).done(function (language) {
                parentRequire([name + "." + language], load);
            });
        }
    };
});


//just the text! plugin > wanna try to use external templates for common things
//so this could be shared all over the place.... plz. remove if this fails


/**
 * @license RequireJS text 1.0.8 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint regexp: true, plusplus: true, sloppy: true */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false,
  define: false, window: false, process: false, Packages: false,
  java: false, location: false */

(function () {
    var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = [];

    define('text', function () {
        var text, fs;

        text = {
            version: '1.0.8',

            strip: function (content) {
                //Strips <?xml ...?> declarations so that external SVG and XML
                //documents can be added to a document without worry. Also, if the string
                //is an HTML document, only the part inside the body tag is returned.
                if (content) {
                    content = content.replace(xmlRegExp, "");
                    var matches = content.match(bodyRegExp);
                    if (matches) {
                        content = matches[1];
                    }
                } else {
                    content = "";
                }
                return content;
            },

            jsEscape: function (content) {
                return content.replace(/(['\\])/g, '\\$1')
                    .replace(/[\f]/g, "\\f")
                    .replace(/[\b]/g, "\\b")
                    .replace(/[\n]/g, "\\n")
                    .replace(/[\t]/g, "\\t")
                    .replace(/[\r]/g, "\\r");
            },

            createXhr: function () {
                //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
                var xhr, i, progId;
                if (typeof XMLHttpRequest !== "undefined") {
                    return new XMLHttpRequest();
                } else if (typeof ActiveXObject !== "undefined") {
                    for (i = 0; i < 3; i++) {
                        progId = progIds[i];
                        try {
                            xhr = new ActiveXObject(progId);
                        } catch (e) {}

                        if (xhr) {
                            progIds = [progId];  // so faster next time
                            break;
                        }
                    }
                }

                return xhr;
            },

            /**
             * Parses a resource name into its component parts. Resource names
             * look like: module/name.ext!strip, where the !strip part is
             * optional.
             * @param {String} name the resource name
             * @returns {Object} with properties "moduleName", "ext" and "strip"
             * where strip is a boolean.
             */
            parseName: function (name) {
                var strip = false, index = name.indexOf("."),
                    modName = name.substring(0, index),
                    ext = name.substring(index + 1, name.length);

                index = ext.indexOf("!");
                if (index !== -1) {
                    //Pull off the strip arg.
                    strip = ext.substring(index + 1, ext.length);
                    strip = strip === "strip";
                    ext = ext.substring(0, index);
                }

                return {
                    moduleName: modName,
                    ext: ext,
                    strip: strip
                };
            },

            xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

            /**
             * Is an URL on another domain. Only works for browser use, returns
             * false in non-browser environments. Only used to know if an
             * optimized .js version of a text resource should be loaded
             * instead.
             * @param {String} url
             * @returns Boolean
             */
            useXhr: function (url, protocol, hostname, port) {
                var match = text.xdRegExp.exec(url),
                    uProtocol, uHostName, uPort;
                if (!match) {
                    return true;
                }
                uProtocol = match[2];
                uHostName = match[3];

                uHostName = uHostName.split(':');
                uPort = uHostName[1];
                uHostName = uHostName[0];

                return (!uProtocol || uProtocol === protocol) &&
                       (!uHostName || uHostName === hostname) &&
                       ((!uPort && !uHostName) || uPort === port);
            },

            finishLoad: function (name, strip, content, onLoad, config) {
                content = strip ? text.strip(content) : content;
                if (config.isBuild) {
                    buildMap[name] = content;
                }
                onLoad(content);
            },

            load: function (name, req, onLoad, config) {
                //Name has format: some.module.filext!strip
                //The strip part is optional.
                //if strip is present, then that means only get the string contents
                //inside a body tag in an HTML string. For XML/SVG content it means
                //removing the <?xml ...?> declarations so the content can be inserted
                //into the current doc without problems.

                // Do not bother with the work if a build and text will
                // not be inlined.
                if (config.isBuild && !config.inlineText) {
                    onLoad();
                    return;
                }

                var parsed = text.parseName(name),
                    nonStripName = parsed.moduleName + '.' + parsed.ext,
                    url = req.toUrl(nonStripName),
                    useXhr = (config && config.text && config.text.useXhr) ||
                             text.useXhr;

                //Load the text. Use XHR if possible and in a browser.
                if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                    text.get(url, function (content) {
                        text.finishLoad(name, parsed.strip, content, onLoad, config);
                    });
                } else {
                    //Need to fetch the resource across domains. Assume
                    //the resource has been optimized into a JS module. Fetch
                    //by the module name + extension, but do not include the
                    //!strip part to avoid file system issues.
                    req([nonStripName], function (content) {
                        text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                        parsed.strip, content, onLoad, config);
                    });
                }
            },

            write: function (pluginName, moduleName, write, config) {
                if (buildMap.hasOwnProperty(moduleName)) {
                    var content = text.jsEscape(buildMap[moduleName]);
                    write.asModule(pluginName + "!" + moduleName,
                                   "define(function () { return '" +
                                       content +
                                   "';});\n");
                }
            },

            writeFile: function (pluginName, moduleName, req, write, config) {
                var parsed = text.parseName(moduleName),
                    nonStripName = parsed.moduleName + '.' + parsed.ext,
                    //Use a '.js' file name so that it indicates it is a
                    //script that can be loaded across domains.
                    fileName = req.toUrl(parsed.moduleName + '.' +
                                         parsed.ext) + '.js';

                //Leverage own load() method to load plugin value, but only
                //write out values that do not have the strip argument,
                //to avoid any potential issues with ! in file names.
                text.load(nonStripName, req, function (value) {
                    //Use own write() method to construct full module value.
                    //But need to create shell that translates writeFile's
                    //write() to the right interface.
                    var textWrite = function (contents) {
                        return write(fileName, contents);
                    };
                    textWrite.asModule = function (moduleName, contents) {
                        return write.asModule(moduleName, fileName, contents);
                    };

                    text.write(pluginName, nonStripName, textWrite, config);
                }, config);
            }
        };

        if (text.createXhr()) {
            text.get = function (url, callback) {
                var xhr = text.createXhr();
                xhr.open('GET', url, true);
                xhr.onreadystatechange = function (evt) {
                    //Do not explicitly handle errors, those should be
                    //visible via console output in the browser.
                    if (xhr.readyState === 4) {
                        callback(xhr.responseText);
                    }
                };
                xhr.send(null);
            };
        } else if (typeof process !== "undefined" &&
                 process.versions &&
                 !!process.versions.node) {
            //Using special require.nodeRequire, something added by r.js.
            fs = require.nodeRequire('fs');

            text.get = function (url, callback) {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file.indexOf('\uFEFF') === 0) {
                    file = file.substring(1);
                }
                callback(file);
            };
        } else if (typeof Packages !== 'undefined') {
            //Why Java, why is this so awkward?
            text.get = function (url, callback) {
                var encoding = "utf-8",
                    file = new java.io.File(url),
                    lineSeparator = java.lang.System.getProperty("line.separator"),
                    input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                    stringBuffer, line,
                    content = '';
                try {
                    stringBuffer = new java.lang.StringBuffer();
                    line = input.readLine();

                    // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                    // http://www.unicode.org/faq/utf_bom.html

                    // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                    // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                    if (line && line.length() && line.charAt(0) === 0xfeff) {
                        // Eat the BOM, since we've already found the encoding on this file,
                        // and we plan to concatenating this buffer with others; the BOM should
                        // only appear at the top of a file.
                        line = line.substring(1);
                    }

                    stringBuffer.append(line);

                    while ((line = input.readLine()) !== null) {
                        stringBuffer.append(lineSeparator);
                        stringBuffer.append(line);
                    }
                    //Make sure we return a JavaScript string and not a Java string.
                    content = String(stringBuffer.toString()); //String
                } finally {
                    input.close();
                }
                callback(content);
            };
        }

        return text;
    });
}());

