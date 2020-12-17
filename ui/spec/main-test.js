// clear localstorage here before everything starts
// seems like phantom has problems with a non cleared localstorage
localStorage.clear();

var tests = [];
for (var file in window.__karma__.files) {
    if (Object.prototype.hasOwnProperty.call(window.__karma__.files, file)) {
        if (/spec\.js$/.test(file)) {
            tests.push(file);
        }
    }
}

//console.log('-----[ running ' + tests.length + ' test files ]-----');

_.extend(ox, Backbone.Events);

require([
    'io.ox/core/extPatterns/stage',
    'io.ox/core/extensions',
    'io.ox/core/boot/login/auto'
], function (Stage, ext) {

    'use strict';

    ox.testUtils.stubAppsuiteBody();
    var server = ox.fakeServer.create();
    server.respondWith('GET', /api\/account\?action=all/, function (xhr) {
        xhr.respond('[]');
    });
    server.respondWith('GET', /api\/login\?action=autologin/, function (xhr) {
        var session = {
            context_id: 0,
            locale: 'de_DE',
            random: '44444444444444444444444444444444',
            session: '13371337133713371337133713371337',
            user: 'jan.doe',
            user_id: 1337
        };
        xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(session));
    });

    server.autoRespond = true;

    $('body').prepend('<div id="background-loader">');

    ext.point('io.ox/core/boot/rampup').disable('compositionSpaces');

    new Stage('io.ox/core/stages', {
        id: 'basic_settings',
        index: 1,
        run: function () {
            return require(['settings!io.ox/core', 'settings!io.ox/mail']).then(function (settings, mailSettings) {
                settings.set('autoStart', 'none');
                moment.tz.setDefault('Europe/Berlin');
                mailSettings.set('whitelist', {
                    'allowedTags': ['a', 'area', 'b', 'basefont', 'bdo', 'blockquote', 'body', 'br', 'button', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'dir', 'div', 'dl', 'dt', 'em', 'font', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'hr', 'html', 'i', 'img', 'ins', 'label', 'legend', 'li', 'map', 'ol', 'optgroup', 'option', 'p', 'pre', 's', 'select', 'span', 'strike', 'strong', 'style', 'sub', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'tt', 'u', 'ul', 'wbr'],
                    'allowedAttributes': ['abbr', 'align', 'alink', 'alt', 'axis', 'background', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'char', 'charoff', 'clear', 'color', 'cols', 'colspan', 'compact', 'coords', 'datetime', 'dir', 'disabled', 'face', 'for', 'frame', 'headers', 'height', 'href', 'hspace', 'ismap', 'label', 'link', 'media', 'multiple', 'name', 'nohref', 'noshade', 'nowrap', 'readonly', 'rows', 'rowspan', 'rules', 'scope', 'selected', 'shape', 'size', 'span', 'src', 'start', 'summary', 'tabindex', 'target', 'text', 'type', 'usemap', 'valign', 'value', 'version', 'vlink', 'vspace', 'width', 'xmlns']
                });
            });
        }
    });
    new Stage('io.ox/core/stages', {
        id: 'run_tests',
        index: 99999,
        run: function () {
            requirejs.config({
                // Karma serves files from '/base/apps'
                baseUrl: '/base/apps',

                // ask Require.js to load these files (all our tests)
                deps: tests,

                // start test run, once Require.js is done
                callback: function () {
                    server.restore();
                    server = null;
                    window.__karma__.start();
                }
            });
        }
    });
});

if (sinon) {
    ox.testUtils.modules = (function () {

        'use strict';

        var modules = {}, usedby = {}, tree = {},
            traverse, getConsumers, self;

        /**
         * remember loaded modules/dependencies
         */
        require.onResourceLoad = function (context, module, dependencies) {
            if (module.name && !(module.name in modules)) {
                modules[module.name] = _.pluck(dependencies, 'id');
                //inversed dependency
                _.each(_.pluck(dependencies, 'id'), function (dep) {
                    usedby[dep] = usedby[dep] || [];
                    usedby[dep].push(module.name);
                });
            }
        };

        /**
         * build dependency tree
         * @param  {string}  module id
         * @param  {object}  target
         * @param  {numeric} level level of recursion
         * @return { object}  root target
         */
        traverse = function (module, target, level) {
            //reset when called without target
            target = target || (tree = {});
            level = level || 0;

            var current = {},
                children = usedby[module] || [];

            if (children.length) {
                //add
                target[module] = tree[module] = current;
                //recursion
                _.each(children, function (id) {
                    if (typeof tree[id] !== 'undefined') {
                        //reuse already visited modules
                        current[id] = tree[id];
                    } else {
                        traverse(id, current, level + 1);
                    }
                });
            } else if (level !== 0) {
                //resolve
                return current;
            } else {
                //return root target
                return target;
            }
        };

        /**
         * ids of (directly/indirectly) consuming modules
         * @param  {string} module id
         * @param  {object} hash
         * @return { object} hash
         */
        getConsumers = function (module, hash) {
            var children = Object.keys(tree[module] || {});
            //ignore root module
            if (!hash) {
                hash = {};
            } else {
                hash[module] = true;
            }
            //recursion
            _.each(children, function (id) {
                getConsumers(id, hash);
            });
            return Object.keys(hash);
        };

        self = {
            /**
             * list consumers
             * @param  {string} module id
             * @return { string} deep
             */
            list: function (id, deep) {
                traverse(id);
                return deep ? getConsumers(id) : usedby[id];
            },
            /**
             * list consumer tree
             * @param  {string} module id
             */
            tree: function (id) {
                traverse(id);
                return tree[id];
            },
            /**
             * reload modules consuming specified module
             */
            reload: function (id) {
                var def = $.Deferred(),
                    consumers;
                //build dependency tree
                traverse(id);
                //get affected consumers
                consumers = getConsumers(id);
                //undefine
                _.each(consumers, function (id) {
                    requirejs.undef(id);
                });
                //define again
                requirejs(consumers, function () {
                    var args = arguments,
                        data = {};
                    //return fresh ones
                    _.each(consumers, function (id, index) {
                        data[id] = args[index];
                    });
                    def.resolve(data);
                });
                return def;
            }
        };
        return self;
    })();
}
