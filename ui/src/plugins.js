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

(function() {

    function dirname(filename) {
        return filename.replace(/(?:^|(\/))[^\/]+$/, "$1");
    }

    function relativeCSS(path, css) {
        return css.replace(/url\((\s*["']?)(?!\/|[A-Za-z][A-Za-z0-9+.-]*\:)/g,
                           "url($1" + path);
    }

    function insert(name, css, selector, node) {
        if (node) return node.text(css);
        return $('<style type="text/css">' + css + '</style>')
            .attr("data-require-src", name)
            .insertAfter(selector);
    }

    // Replace the load function of RequireJS with our own, which fetches
    // dynamically concatenated files.
    (function () {
        function defaultImpl(name, parentRequire, load, config) {
            $.ajax({ url: config.baseUrl + name, dataType: "text" })
                .done(load).fail(load.error);
        };
        var req = require, oldload = req.load;
        var queue = [];
        var deps = window.dependencies;
        window.dependencies = undefined;
        req.load = function (context, modulename, url) {
            var prefix = context.config.baseUrl;
            if (modulename.charAt(0) !== '/') {
                if (url.slice(0, prefix.length) !== prefix) {
                    return oldload.apply(this, arguments);
                }
                url = url.slice(prefix.length);
            } else if (modulename.indexOf('/base/spec/') === 0) {
                return oldload.apply(this, arguments);
            }
            req.nextTick(null, loaded);
            var next = deps[modulename];
            if (next && next.length) context.require(next);
            queue.push(url);

            function loaded() {
                var q = queue;
                queue = [];
                if (_.url.hash('debug-js')) {
                    _.each(q, load);
                } else {
                    load(q.join(), modulename);
                }
                if (queue.length) console.error('recursive require', queue);
            }

            function load(module, modulename) {
                oldload(context, modulename || module,
                    [ox.apiRoot, '/apps/load/', ox.base, ',', module].join(''));
            }
        };

        define('text', { load: function (name, parentRequire, load, config) {
            req(['/text;' + name], load, load.error);
        } });
        define('raw', { load: function (name, parentRequire, load, config) {
            req(['/raw;' + name], load, load.error);
        } });
    }());

    // css plugin
    define("css", {
        load: function (name, parentRequire, load, config) {
            require(["text!" + name]).done(function (css) {
                var path = config.baseUrl + name; 
                load(insert(path, relativeCSS(dirname(path), css), "#css"));
            });
        }
    });

        // Name of the current theme, or falsy before a theme is set.
    var theme = '',
        // LessCSS files of the current theme.
        themeCommon = { name: 'common.css', selector: '#theme' },
        themeStyle = { name: 'style.css', selector: '#custom' },
        // List of LessCSS files to update for theme changes.
        lessFiles = [themeCommon, themeStyle];

    if (!ox.signin) {
        lessFiles.push({
            path: ox.base + '/io.ox/core/bootstrap/css/bootstrap.less',
            name: 'io.ox/core/bootstrap/css/bootstrap.less',
            selector: '#bootstrap'
        });
    }

    function insertLess(file) {
        return require(['text!themes/' + theme + '/less/' + file.name])
            .done(function (css) {
                file.node = insert(file.path, css, file.selector, file.node);
            });
    }

    define("less", {
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
    define("themes", {
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
                icon114: 'icon114.png',
                icon144: 'icon144.png',
                splash460: 'splashscreen_460.jpg',
                splash920: 'splashscreen_920.jpg',
                splash1096: 'splashscreen_1096.jpg',
                win8Icon: 'icon144_win.png'
            };
            for (var i in icons) {
                var t = $('head #' + i).attr({ href: path + icons[i] })
                               .detach().appendTo('head');
            }
            if (name !== 'login') {
                themeCommon.path = path + 'common.css';
                themeStyle.path = path + 'style.css';
                return $.when.apply($, _.map(lessFiles, insertLess));
            } else {
                return $.when();
            }
        },

        getDefinitions: function () {
            return (currentTheme || '').replace(/:/g, ': ');
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
                require(['io.ox/core/gettext']).done(function (gettext) {
                    gettext.setLanguage(lang);
                });
            }
            if (_.isEmpty(callbacks)) return $.when();
            var names = _.keys(callbacks);
            var files = _.map(names, function (n) { return n + '.' + lang; });
            return require(files).done(function () {
                var args = _.toArray(arguments);
                _.each(names, function (n, i) { callbacks[n](args[i]); });
            });
        },
        enable: function () {
            require(['io.ox/core/gettext']).done(function (gt) { gt.enable(); });
        },
        load: function (name, parentRequire, load, config) {
            assert(langDef.state !== 'pending', _.printf(
                'Invalid gettext dependency on %s (before login).', name));
            langDef.done(function () {
                parentRequire([name + '.' + lang], ox.signin ? wrap : load, error);
            });
            function wrap(f) {
                var f2 = function () { return f.apply(this, arguments); };
                // _.each by foot to avoid capturing members of f in closures
                for (var i in f) (function (i) {
                    f2[i] = function () { f[i].apply(f, arguments); };
                }(i));
                callbacks[name] = function (newF) { f = newF; };
                load(f2);
            }
            function error() {
                require(['io.ox/core/gettext']).done(function () {
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
        load: function (name, parentRequire, loaded, config) {
            parentRequire(["text!" + name, 'io.ox/core/extensions'], function (html, ext) {
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
        load: function (name, parentRequire, loaded, config) {
            parentRequire(ox.withPluginsFor(name, []), loaded);
        }
    });

}());
