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
            //@include parser.js
        }());
        //@include tree.js
        //@include functions.js
        //@include tree/*.js
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

define ("gettext", function (gettext) {
    return {
        load: function (name, parentRequire, load, config) {
            require(["io.ox/core/gettext"]).done(function (gettext) {
               var module = gettext.getModule(name);
               if (module) {
                   parentRequire([module], load);
               } else { // no language set yet
                   load(gettext(name));
               }
            });
        }
    };
});



define("settings",['io.ox/core/http', 'io.ox/core/cache'], function (http, cache) {

    'use strict';

    var settingsWrapper = function () {
        var globalSubpath = "gui/wurst/";
        var settings = {},
            settingsCache;


        var get = function (key) {

            var parts = key.split(/\//),
              tmp = settings || {};

            _.each(parts, function (partname, index) {
                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty(partname) && typeof tmp[partname] !== 'undefined' && tmp[partname] !== null);
                if (tmpHasSubNode) {
                    tmp = tmp[partname];
                } else {
                    tmp = null;
                    return null;
                }
            });
            return tmp;
        };

        var set = function (key, value) {

            var parts = key.split(/\//),
              tmp = settings || {},
              rkey = parts.pop();

            _.each(parts, function (partname, index) {
                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty(partname) && typeof tmp[partname] !== 'undefined' && tmp[partname] !== null);
                if (tmpHasSubNode) {
                    tmp = tmp[partname];
                    if (typeof tmp !== 'object') {
                        console.error('settings.set: ' + tmp + ' is a value');
                        return false;
                    } 
                } else {
                    tmp[partname] = {};
                    tmp = tmp[partname];
                }
            });
            tmp[rkey] = value;
        };

        var contains = function (key) {
            var parts = key.split(/\//),
              tmp = settings || {};

            _.each(parts, function (partname, index) {
                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty(partname) && typeof tmp[partname] !== 'undefined' && tmp[partname] !== null);
                if (tmpHasSubNode) {
                    tmp = tmp[partname];
                } else {
                    return false;
                }
            });
            return true;
        };

        var remove = function (key) {
            var parts = key.split(/\//),
              tmp = settings || {},
              rkey = parts.pop();
            _.each(parts, function (partname, index) {
                var tmpHasSubNode = (tmp !== null && tmp.hasOwnProperty(partname) && typeof tmp[partname] !== 'undefined' && tmp[partname] !== null);
                if (tmpHasSubNode) {
                    tmp = tmp[partname];
                    if (typeof tmp !== 'object') {
                        console.error('settings.remove: ' + tmp + ' is a value');
                        return false;
                    }
                } else {
                    return false;
                }
            });

            delete [tmp[rkey]];
            return true;
        };

        var that = {
            settingsPath: null,
            get: function (path, defaultValue) {
                if (!path) { // undefined, null, ''
                    return settings;
                } else {
                    path = (globalSubpath + that.settingsPath + '/' + path);
                    console.log('getting: ' + path);
                    if (defaultValue === undefined) {
                        return get(path);
                    } else {
                        return contains(path) ? get(path) : defaultValue;
                    }
                }
            },

            set: function (path, value, permanent) {
                if (path) {
                    var orgpath = path;
                    path = (globalSubpath + that.settingsPath + '/' + path);
                    set(path, value);
                    $(that).trigger(orgpath+'.changed', value);
                    console.log('set ' +path + ':' + value);
                    if (permanent) {
                        // save settings path on server
                        settingsCache.add('settingsDefault', settings);
                        return http.PUT({
                            module: 'config/gui',
                            appendColumns: false,
                            processResponse: false,
                            data: settings
                        });
                    }
                }
            },

            remove: function (path) {
                if (path) {
                    path = (globalSubpath + mywrapper.settingsPath + '/' + path);
                    remove(path);
                }
            },

            contains: function (path) {
                path = (globalSubpath + mywrapper.settingsPath + '/' + path);
                return contains(path);
            },

            load: function () {
                // loader
                var load = function () {
                    return http.GET({
                            module: 'config/gui',
                            appendColumns: false,
                            processResponse: false
                        })
                        .done(function (data) {
                            settings = data !== undefined ? data.data : {};
                            settingsCache.add('settingsDefault', settings);
                        });
                };
                // trick to be fast: cached?
                if (!settingsCache) {
                    settingsCache = new cache.SimpleCache('settings', true);
                }
                if (settingsCache.contains('settingsDefault')) {
                    return settingsCache.get('settingsDefault').pipe(function (mycached) {
                        if(mycached !== undefined) {
                            settings = mycached;
                            load();
                            return settings;
                        } else {
                          return load();
                        }
                    });
                } else {
                    // load configuration
                    return load();
                }
            },
            save: function () {
                settingsCache.add('settingsDefault', settings);
                return http.PUT({
                    module: 'config/gui',
                    appendColumns: false,
                    processResponse: false,
                    data: settings
                });
            }
        };
        return that;
    };

    return {
      load: function (name, req, load, config) {
          var mywrapper = settingsWrapper();
          mywrapper.settingsPath = name; //encodeURIComponent(name);
          mywrapper.load()
            .done(function () {
              load(mywrapper);
            })
            .fail(function () {
              console.error('failed to load settings for:' + mywrapper.settingsPath);
            });
          
      }
    };



});
