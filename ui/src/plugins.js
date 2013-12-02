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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

/**
 * LESS is distributed under the terms of the Apache License, Version 2.0
 */

(function () {

    // File Caching
    var fileCache, dummyFileCache = {
        retrieve: function () {
            return $.Deferred().reject();
        },
        cache: function () {
            return;
        }
    };

    fileCache = dummyFileCache;

    function runCode(name, code) {
        eval('//@ sourceURL=' + name + '.js\n' + code);
    }

    if (_.device('desktop') && !_.device('Safari') && window.IDBVersionChangeEvent !== undefined && Modernizr.indexeddb && window.indexedDB) {
        // IndexedDB
        (function () {

            var initialization = $.Deferred();

            var request = window.indexedDB.open('appsuite.filecache', 1);
            var db = null;

            function fail(e) {
                if (ox.debug) {
                    console.warn('Failed to initiliaze IndexedDB file cache', e);
                }
                window.indexedDB.deleteDatabase('appsuite.filecache'); // delete, so maybe this works next time
                fileCache = dummyFileCache;
                initialization.reject();
            }

            request.onupgradeneeded = function (e) {
                db = e.target.result;
                db.createObjectStore('filecache', {keyPath: 'name'});
                db.createObjectStore('version', {keyPath: 'name'});
            };

            request.onsuccess = function (e) {
                var tx, request;
                db = e.target.result;
                try {
                    tx = db.transaction(['filecache', 'version'], 'readwrite');
                    request = tx.objectStore('version').get('version');
                    request.onerror = fail;
                    request.onsuccess = function (e) {
                        // check version
                        if (!e.target.result || e.target.result.version !== ox.version) {
                            // Clear the filecache
                            tx.objectStore('filecache').clear().onsuccess = initialization.resolve;
                            if (ox.debug === true) {
                                console.warn('FileCache: Clearing persistent file cache due to UI update');
                            }
                            // Save the new version number
                            tx.objectStore('version').put({ name: 'version', version: ox.version });
                            if (request.transaction) {
                                request.transaction.oncomplete = initialization.resolve;
                            }
                        } else {
                            initialization.resolve();
                        }
                    };

                } catch (e) {
                    fail(e);
                }
            };

            request.onerror = function () {
                // fallback
                // console.log('request error outerlevel', e);
                fileCache = dummyFileCache;
                initialization.reject();
            };

            fileCache.retrieve = function (name) {
                var def = $.Deferred();
                initialization.then(
                    function success() {
                        var tx = db.transaction(['filecache'], 'readonly');
                        var request = tx.objectStore('filecache').get(name);
                        request.onsuccess = function (e) {
                            if (!e.target.result) {
                                def.reject();
                                return;
                            }
                            if (e.target.result.version !== ox.version) {
                                def.reject();
                                return;
                            }
                            def.resolve(e.target.result.contents);
                        };
                    },
                    function fail() {
                        def.reject();
                    }
                );
                return def;
            };

            fileCache.cache = function (name, contents) {
                initialization.done(function () {
                    var tx = db.transaction(['filecache'], 'readwrite');
                    tx.objectStore('filecache').put({name: name, contents: contents, version: ox.version});
                });
            };

        })();
    } /*else if (Modernizr.localstorage && !_.device('desktop')) {
        (function () {
            var queue = null;
            fileCache.retrieve = function (name) {
                var found = localStorage.getItem(name);
                if (found && found.version === ox.version) {
                    return $.Deferred().resolve(found.text);
                }
            };
            fileCache.cache = function (name, contents) {
                if (queue) {
                    queue.items.push({k: name, c: {text: contents, version: ox.version}});
                } else {
                    queue = {
                        items: []
                    };
                    setTimeout(function () {
                        _(queue.items).each(function (e) {
                            localStorage.setItem(e.k, e.c);
                        });
                        queue = null;
                    }, 5000);
                }
            };
        }());
    }*/ else if (Modernizr.websqldatabase && ! _.device('Safari && desktop') && (_.browser.ios < 7)) {
        // Web SQL
        (function () {
            var initialization = $.Deferred();
            var db = openDatabase('filecache', '1.0', 'caches files for OX', 4 * 1024 * 1024);
            db.transaction(function (tx) {
                tx.executeSql('CREATE TABLE IF NOT EXISTS version (version TEXT)');
                tx.executeSql('SELECT 1 FROM version WHERE version = ?', [ox.version], function (tx, result) {
                    if (result.rows.length === 0) {
                        tx.executeSql('DROP TABLE IF EXISTS files');
                        tx.executeSql('CREATE TABLE files (name TEXT unique, contents TEXT, version TEXT)');
                        tx.executeSql('DELETE FROM version');
                        tx.executeSql('INSERT INTO version VALUES (?)', [ox.version]);
                    }
                    initialization.resolve();

                });
            });
            fileCache.retrieve = function (name) {
                var def = $.Deferred();
                initialization.done(function () {
                    db.transaction(function (tx) {
                        tx.executeSql('SELECT contents FROM files WHERE name = ? and version = ?', [name, ox.version], function (tx, result) {
                            if (result.rows.length === 0) {
                                def.reject();
                            } else {
                                def.resolve(result.rows.item(0).contents);
                            }
                        }, function () {
                            console.error(arguments);
                            def.reject();
                        });
                    });
                });
                return def;
            };

            fileCache.cache = function (name, contents) {
                initialization.done(function () {
                    db.transaction(function (tx) {
                        tx.executeSql('INSERT OR REPLACE INTO files (name, contents, version) VALUES (?,?,?) ', [name, contents, ox.version]);
                    });
                });
            };
        })();
    }

    function badSource(source) {
        return (/throw new Error\("Could not read/).test(source);
    }

    function dirname(filename) {
        return filename.replace(/(?:^|(\/))[^\/]+$/, '$1');
    }

    function relativeCSS(path, css) {
        return css.replace(/url\((\s*["']?)(?!\/|[A-Za-z][A-Za-z0-9+.-]*\:)/g,
                           'url($1' + path);
    }

    var concatCSS = {}, nodes = {};

    function insertCommon(name, css, selector, node) {
        if (node) return node.text(css);
        return $('<style type="text/css">').text(css)
            .attr('data-require-src', name)
            .insertBefore(selector);
    }

    function insertIE9(name, css, selector, node) {
        if (node) return node.text(css);
        // need new node?
        if (!nodes[selector]) nodes[selector] = $('<style type="text/css">').insertBefore(selector);
        if (!concatCSS[selector]) concatCSS[selector] = '';
        // append css
        concatCSS[selector] += '/* ' + name + ' */\n\n' + css + '\n\n';
        // update
        return nodes[selector].text(concatCSS[selector]);
    }

    var insert = _.device('IE === 9') ? insertIE9 : insertCommon;

    // Replace the load function of RequireJS with our own, which fetches
    // dynamically concatenated files.
    (function () {
        var req = require, oldload = req.load;
        var queue = [];
        var deps = window.dependencies;
        window.dependencies = undefined;
        req.load = function (context, modulename, url) {
            var prefix = context.config.baseUrl;
            if (modulename.slice(0, 5) === 'apps/') {
                url = ox.apiRoot + '/apps/load/' + ox.version + ',' + url.slice(5);
                return oldload.apply(this, arguments);
            } else if (modulename.charAt(0) !== '/') {
                if (url.slice(0, prefix.length) !== prefix) {
                    return oldload.apply(this, arguments);
                }
                url = url.slice(prefix.length);
            } else if (modulename.indexOf('/base/spec/') === 0) {
                return oldload.apply(this, arguments);
            }

            function loaded() {
                var q = queue;
                queue = [];
                load(q.join(), modulename);
                _.each(q, function (module) {
                    $(window).trigger('require:load', module);
                });

                if (queue.length) console.error('recursive require', queue);
            }
            if (_.url.hash('debug-js')) {
                oldload(context, modulename,
                    [ox.apiRoot, '/apps/load/', ox.version, ',', url].join(''));
                return;
            }

            function handleCacheMiss() {
                // Append and load in bulk
                req.nextTick(null, loaded);
                var next = deps[modulename];
                if (next && next.length) context.require(next);
                queue.push(url);
            }

            // Try file cache
            fileCache.retrieve(modulename).then(
                function hit(contents) {
                    // bad?
                    if (badSource(contents)) {
                        if (_.url.hash('debug-filecache')) console.warn('FileCache: Ignoring ' + modulename);
                        handleCacheMiss();
                        return $.Deferred().reject();
                    }
                    runCode(modulename, contents);
                    context.completeLoad(modulename);
                    if (_.url.hash('debug-filecache')) {
                        console.log('FileCache: Cache HIT! ' + modulename);
                    }
                },
                function miss() {
                    if (_.url.hash('debug-filecache')) {
                        console.log('FileCache: Cache MISS! ' + modulename);
                    }
                    handleCacheMiss();
                }
            );

            function load(module, modulename) {
                $.ajax({ url: [ox.apiRoot, '/apps/load/', ox.version, ',', module].join(''), dataType: 'text' })
                    .done(function (concatenatedText) {
                    runCode([ox.apiRoot, '/apps/load/', ox.version, ',', module].join(''), concatenatedText);
                    context.completeLoad(modulename);
                    // Chop up the concatenated modules and put them into file cache
                    _(concatenatedText.split('/*:oxsep:*/')).each(function (moduleText) {
                        (function () {
                            var name = null;
                            var match = moduleText.match(/define(\.async)?\(([^,]+),/);
                            if (match) {
                                name = match[2].substr(1, match[2].length - 2);
                            }
                            if (name) {
                                // cache file?
                                if (badSource(moduleText)) {
                                    if (_.url.hash('debug-filecache')) console.warn('FileCache: NOT Caching ' + name);
                                    return;
                                }
                                if (_.url.hash('debug-filecache')) console.log('FileCache: Caching ' + name);
                                fileCache.cache(name, moduleText);
                            } else if (_.url.hash('debug-filecache')) {
                                console.log('FileCache: Could not determine name for ' + moduleText);
                            }
                        })();
                    });
                });
            }
        };

        define('text', { load: function (name, parentRequire, load) {
            req(['/text;' + name], load, load.error);
        } });
        define('raw', { load: function (name, parentRequire, load) {
            req(['/raw;' + name], load, load.error);
        } });
    }());

    // css plugin
    define('css', {
        load: function (name, parentRequire, load, config) {
            require(['text!' + name], function (css) {
                var path = config.baseUrl + name;
                load(insert(path, relativeCSS(dirname(path), css), '#css'));
            });
        }
    });

        // Name of the current theme, or falsy before a theme is set.
    var theme = '',
        // LessCSS files of the current theme.
        themeCommon = { name: 'common', selector: '#theme' },
        themeStyle = { name: 'style', selector: '#custom' },
        // List of LessCSS files to update for theme changes.
        lessFiles = [themeCommon, themeStyle];

    function insertLess(file) {
        return require(['text!themes/' + theme + '/' + file.name + '.css'], function (css) {
                file.node = insert(file.path, css, file.selector, file.node);
            });
    }

    define('less', {
        load: function (name, parentRequire, load, config) {
            var file = {
                path: config.baseUrl + name,
                name: name,
                selector: '#css'
            };
            lessFiles.push(file);
            if (theme) {
                insertLess(file).then(load, load.error);
            } else {
                load();
            }
        }
    });

    // themes module
    define('themes', {
        /**
         * Loads a new theme.
         * @param {String} name The name of the new theme.
         * @type Promise
         * @returns A promise which gets fulfilled when the theme finishes
         * loading. Please ignore the value of the promise.
         */
        set: function (name) {
            if (ox.offline) {
                name = 'default'; // FIXME: App Cache manifest may have to be generated by backend
            }
            theme = name;
            var path = ox.base + '/apps/themes/' + name + '/',
            icons = {
                favicon: 'favicon.ico',
                icon57: 'icon57.png',
                icon72: 'icon72.png',
                icon76: 'icon76.png',
                icon114: 'icon114.png',
                icon120: 'icon120.png',
                icon144: 'icon144.png',
                icon152: 'icon152.png',
                splash460: 'splashscreen_460.jpg',
                splash920: 'splashscreen_920.jpg',
                splash1096: 'splashscreen_1096.jpg',
                win8Icon: 'icon144_win.png'
            };
            for (var i in icons) {
                $('head #' + i).attr({ href: path + icons[i] })
                               .detach().appendTo('head');
            }
            if (name !== 'login') {
                themeCommon.path = path + 'common';
                themeStyle.path = path + 'style';
                return $.when.apply($, _.map(lessFiles, insertLess));
            } else {
                return $.when();
            }
        },

        //FIXME: this function might be broken. Not sure, what it is doing!
        //only used by theme-maker, as far as I can see
        getDefinitions: function () {
            return (this.currentTheme || '').replace(/:/g, ': ');
        }
    });
}());

(function () {
    var callbacks = {}, lang = null, langDef = $.Deferred();
    define('gettext', {
        /**
         * Switches the language.
         * Only the signin page is allowed to call this multiple times.
         * @param {String} language The new language ID.
         * @returns A promise which gets resolved when all known gettext
         * modules have loaded their replacements.
         * @private
         */
        setLanguage: function (language) {
            assert(ox.signin || !this.language, 'Multiple setLanguage calls');
            lang = language;
            langDef.resolve();
            if (!ox.signin) {
                require(['io.ox/core/gettext'], function (gettext) {
                    gettext.setLanguage(lang);
                });
            }
            if (_.isEmpty(callbacks)) return $.when();
            var names = _.keys(callbacks);
            var files = _.map(names, function (n) { return n + '.' + lang; });
            return require(files, function () {
                var args = _.toArray(arguments);
                _.each(names, function (n, i) { callbacks[n](args[i]); });
            });
        },
        enable: function () {
            require(['io.ox/core/gettext'], function (gt) { gt.enable(); });
        },
        load: function (name, parentRequire, load) {
            assert(langDef.state !== 'pending', _.printf(
                'Invalid gettext dependency on %s (before login).', name));
            langDef.done(function () {
                // use specific language?
                // example: gettext!io.ox/core!ja_JP
                var index = name.indexOf('!'), language = lang;
                if (index !== -1) {
                    language = name.substr(index + 1);
                    name = name.substr(0, index);
                }
                parentRequire([name + '.' + language], ox.signin ? wrap : load, error);
            });
            function wrap(f) {
                var f2 = function () { return f.apply(this, arguments); };
                // _.each by foot to avoid capturing members of f in closures
                var f3 = function (i) {
                    f2[i] = function () { f[i].apply(f, arguments); };
                };
                for (var i in f) f3(i);
                callbacks[name] = function (newF) { f = newF; };
                load(f2);
            }
            function error() {
                require(['io.ox/core/gettext'], function (gt) {
                    load(gt(name, {
                        nplurals: 2,
                        plural: 'n != 1',
                        dictionary: {}
                    }));
                });
            }
        }
    });
}());

/*
 * dot.js template loader
 */
(function () {

    'use strict';

    var defaultTemplateSettings = {
        evaluate:    /\{\{([\s\S]+?)\}\}/g,
        interpolate: /\{\{=([\s\S]+?)\}\}/g,
        encode:      /\{\{!([\s\S]+?)\}\}/g,
        use:         /\{\{#([\s\S]+?)\}\}/g,
        define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
        conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
        iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
        varname: 'it',
        strip: true,
        append: true,
        selfcontained: false
    };

    /*
     * Inner Template Abstraction - offers: render(id, [data, [node]])
     */
    function Template(ext) {

        var parts = {},
            plain = {},
            createDraw = function (id, extensionId, tmpl) {
                return function (context) {
                    var node = $(tmpl(context.data || context)).appendTo(this);
                    ext.point(id + '/' + extensionId).invoke('draw', node, context);
                };
            };

        // parts might be plain HTML or contain extensions
        this.addPart = function (id, html) {
            // look for extensions
            var fragment = $(html).filter(function () { return this.nodeType === 1; }),
                extensions = fragment.filter('extension');
            if (extensions.length > 0) {
                // create extensions
                extensions.each(function (index) {
                    var node = $(this), html = node.html(), extensionId = node.attr('id') || 'default';
                    ext.point(id).extend({
                        id: extensionId,
                        index: (index + 1) * 100,
                        draw: createDraw(id, extensionId, doT.template(html, defaultTemplateSettings))
                    });
                });
            } else {
                // just plain template
                plain[id] = true;
                parts[id] = doT.template(html, defaultTemplateSettings);
            }
        };

        // render part
        this.render = function (id, data, node) {
            data = data !== undefined ? data : {};
            if (plain[id]) {
                return id in parts ? $(parts[id](data)) : $();
            } else {
                node = node || $('<div>');
                ext.point(id).invoke('draw', node, data);
                return node;
            }
        };
    }

    define('dot', {
        load: function (name, parentRequire, loaded) {
            parentRequire(['text!' + name, 'io.ox/core/extensions'], function (html, ext) {
                // get template fragment - just elements, no comments, no text nodes
                var fragment = $(html).filter(function () { return this.nodeType === 1; }),
                    parts = fragment.filter('part'),
                    tmpl = new Template(ext);

                // just consider parts
                parts.each(function () {
                    var node = $(this), html = node.html(), id = node.attr('id') || 'default';
                    tmpl.addPart(id, html);
                });
                // done
                loaded(tmpl);
            });
        }
    });

    define('withPluginsFor', {
        load: function (name, parentRequire, loaded) {
            parentRequire(ox.withPluginsFor(name, []), loaded);
        }
    });

}());
