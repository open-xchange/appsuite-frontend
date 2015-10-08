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

    // needs to be reviewed: "force websql for mobile" (July 2013)
    // plus: don't know why Safari is explicitly excluded as it doesn't support indexedDB at all
    // for example, IDBVersionChangeEvent is always undefined for Safari
    if (Modernizr.indexeddb && window.indexedDB && _.device('desktop && !safari') && window.IDBVersionChangeEvent !== undefined) {

        // IndexedDB
        (function () {

            var initialization = $.Deferred();

            var request = window.indexedDB.open('appsuite.filecache', 1);
            var db = null;

            function fail(e) {
                if (ox.debug) {
                    console.warn('Failed to initialize IndexedDB file cache', e);
                }
                window.indexedDB.deleteDatabase('appsuite.filecache'); // delete, so maybe this works next time
                fileCache = dummyFileCache;
                initialization.reject();
            }

            request.onupgradeneeded = function (e) {
                db = e.target.result;
                db.createObjectStore('filecache', { keyPath: 'name' });
                db.createObjectStore('version', { keyPath: 'name' });
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
                                console.warn('FileCache: Clearing persistent file cache due to UI update (IndexedDB)');
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
                fileCache = dummyFileCache;
                initialization.reject();
            };

            fileCache.retrieve = function (name) {
                var def = $.Deferred();
                initialization.then(
                    function success() {
                        var tx = db.transaction('filecache', 'readonly');
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
                    var tx = db.transaction('filecache', 'readwrite');
                    tx.objectStore('filecache').put({ name: name, contents: contents, version: ox.version });
                });
            };

            ox.clearFileCache = function () {
                initialization.done(function () {
                    try {
                        var tx = db.transaction('filecache', 'readwrite');
                        tx.objectStore('filecache').clear();
                    } catch (e) {
                        console.error('clearFileCache', e.message, e);
                    }
                });
            };

        })();
    } else if (Modernizr.websqldatabase && _.device('!android')) {

        // Web SQL
        (function () {

            var initialization = $.Deferred(),
                quotaExceeded = false,
                // initial size - we start with less than 5MB to avoid the prompt
                size = 4 * 1024 * 1024,
                db;

            try {
                db = openDatabase('filecache', '1.0', 'caches files for OX', size);
            } catch (e) {
                console.warn('Access to localstorage forbidden. Disabling cache.');
                fileCache = dummyFileCache;
                initialization.reject();
                return;
            }

            function reset(tx) {
                try {
                    tx.executeSql('DROP TABLE IF EXISTS files');
                    tx.executeSql('CREATE TABLE files (name TEXT unique, contents TEXT, version TEXT)');
                    tx.executeSql('DELETE FROM version');
                    tx.executeSql('INSERT INTO version VALUES (?)', [ox.version]);
                } catch (e) {
                    if (ox.debug) console.error('Failed to reset WebSQL file cache', e);
                }
            }

            function initializationFail(e) {
                if (ox.debug) console.error('Failed to initialize WebSQL file cache', e);
                initialization.reject();
            }

            db.transaction(
                function success(tx) {
                    try {
                        tx.executeSql('CREATE TABLE IF NOT EXISTS version (version TEXT)');
                        tx.executeSql('SELECT 1 FROM version WHERE version = ?', [ox.version], function (tx, result) {
                            if (result.rows.length === 0) {
                                reset(tx);
                                if (ox.debug === true) {
                                    console.warn('FileCache: Clearing persistent file cache due to UI update (WebSQL)');
                                }
                            }
                            initialization.resolve();
                        });
                    } catch (e) {
                        initializationFail(e);
                    }
                },
                function fail(e) {
                    initializationFail(e);
                }
            );

            fileCache.retrieve = function (name) {
                var def = $.Deferred();
                initialization.then(function () {
                    db.transaction(
                        function fetch(tx) {
                            tx.executeSql(
                                'SELECT contents FROM files WHERE name = ? and version = ?', [name, ox.version],
                                function fetchSuccess(tx, result) {
                                    if (result.rows.length === 0) {
                                        def.reject();
                                    } else {
                                        def.resolve(result.rows.item(0).contents);
                                    }
                                },
                                function fetchFail() {
                                    def.reject();
                                }
                            );
                        },
                        function transactionFail(e) {
                            def.reject();
                        }
                    );
                }, def.reject);
                return def;
            };

            fileCache.cache = function (name, contents) {
                initialization.done(function () {
                    if (quotaExceeded) return;
                    db.transaction(
                        function update(tx) {
                            if (quotaExceeded) return; // yep, check again; not sure if this could be queued alredy
                            tx.executeSql('INSERT OR REPLACE INTO files (name, contents, version) VALUES (?,?,?) ', [name, contents, ox.version]);
                        },
                        function fail(e) {
                            // this might be called if current quota is exceeded
                            // and the user denies more quota
                            if (e && e.code === 4) {
                                quotaExceeded = true;
                                if (ox.debug) console.error('WebSQL quota exceeded', e);
                                catchException(e);
                            }
                        }
                    )
                });
            };

            ox.clearFileCache = function () {
                initialization.done(function () {
                    db.transaction(
                        reset,
                        function fail(e) {
                            console.error('Failed to clear WebSQL file cache', e);
                        }
                    );
                });
            };

        })();

    } else if (_.device('android') && Modernizr.localstorage) {

        // use localstorage on android as this is still the fastest storage
        (function () {

            var storage = window.localStorage,
                fileToc = [];

            // simple test first
            try {
                storage.setItem('access-test', 1);
                storage.removeItem('access-test');
            } catch (e) {
                console.warn('Access to localstorage forbidden. Disabling cache.');
                fileCache = dummyFileCache;
                return;
            }

            // if we've got an old version clear the cache and create a new one
            var ui = JSON.parse(storage.getItem('appsuite-ui'));
            if (ui && ui.version != ox.version) {

                if (ox.debug) console.warn('New UI Version - clearing storage');

                // clear all the caches
                var cacheList = JSON.parse(storage.getItem('file-toc'));
                _(cacheList).each(function (key) {
                    storage.removeItem(key);
                });
            }

            fileCache.cache = function (name, contents) {
                fileToc.push(name);
                try {
                    storage.setItem(name, contents);
                    storage.setItem('file-toc', JSON.stringify(fileToc));
                } catch (e) {
                    // quota exceeded
                    if (e.name === 'QUOTA_EXCEEDED_ERR' || e.name === 'QuotaExceededError') {
                        console.warn('localStorage quota exceeded.');
                    } else {
                        console.warn('Failed writing to localStorage. ')
                    }
                    return;
                }
            };

            fileCache.retrieve = function (name) {
                var def = $.Deferred();
                var result = storage.getItem(name);
                if (result) {
                    def.resolve(result);
                } else {
                    def.reject()
                }
                return def;
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

    function insert(name, css, selector, node) {
        if (node) return node.text(css);
        return $('<style type="text/css">').text(css)
            .attr('data-require-src', name)
            .insertBefore(selector);
    }

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
            } else if (modulename.slice(0, 7) === 'static/') {
                fileCache.retrieve(modulename).then(
                    function hit(contents) {
                        if (_.url.hash('debug-filecache')) console.log('FileCache: Cache HIT for static file: ', modulename);
                        runCode(modulename, contents);
                        context.completeLoad(modulename);
                    },
                    function miss() {
                        url = url + '?' + ox.base;
                        // get the file via ajax as text, run it and store it later
                        $.ajax({
                            url: url,
                            type: 'get',
                            dataType: 'text'
                        }).done(function (sourceText) {
                            if (_.url.hash('debug-filecache')) console.log('FileCache: Cache MISS for static file: ', modulename);
                            runCode(modulename, sourceText);
                            if (_.url.hash('debug-filecache')) console.log('FileCache: Caching static file: ', modulename);
                            fileCache.cache(modulename, sourceText);
                            context.completeLoad(modulename);
                        });
                    });
                return $.Deferred().resolve();

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

            // call nextTick to delay bulk loading to have some time for cache lookup
            if (queue.length) req.delayTick();
            // now try file cache
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

    // LessCSS files of the current theme.
    var themeCommon = { name: 'common', selector: '#theme' },
        themeStyle = { name: 'style', selector: '#custom' },
        // List of LessCSS files to update for theme changes.
        lessFiles = [themeCommon, themeStyle];

    function insertLess(file) {
        return require(['text!themes/' + ox.theme + '/' + file.name + '.css'], function (css) {
            file.node = insert(file.path, css, file.selector, file.node);
        });
    }

    define('less', {
        load: function (name, parentRequire, load, config) {
            name = name.replace(/\.less$/, '');
            var file = {
                path: config.baseUrl + name,
                name: name,
                selector: '#css'
            };
            lessFiles.push(file);
            if (ox.theme) {
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
            ox.theme = name;
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
                $('head #' + i).attr({ href: path + icons[i] }).detach().appendTo('head');
            }
            if (name !== 'login') {
                themeCommon.path = path + 'common';
                themeStyle.path = path + 'style';
                return $.when.apply($, _.map(lessFiles, insertLess));
            } else {
                return $.when();
            }
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
                for (var i in f) {
                    f3(i);
                }
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

(function () {

    'use strict';

    define('withPluginsFor', {
        load: function (name, parentRequire, loaded) {
            parentRequire(ox.withPluginsFor(name, []), loaded);
        }
    });

    define('wait', {
        load: function (name, parentRequire, loaded) {
            var interval = parseInt(name, 10);
            setTimeout(loaded, interval);
        }
    });

}());
