/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/print',
    ['io.ox/core/http',
     'io.ox/core/notifications',
     'gettext!io.ox/core'], function (http, notifications, gt) {

    'use strict';

    var fallbackTemplate = 'default.tmpl',

        defaultTemplates = {
            mail: 'super-mail-template.tmpl',
            contacts: 'super-contacts-template.tmpl',
            tasks: 'super-tasks-template.tmpl'
        },

        callbacks = {};

    function addCallback(options, it) {

        var id = 'print_' + _.now();

        window[id] = function (document) {
            try {
                //probably some naming conflict in ie within templates
                //do not use 'item' as doT variable name for current element
                var selector = options.selector || 'script',
                    template = $(document.body).find('[type="text/template"]').filter(selector).html(),
                    compiled = doT.template(template);
                $(document.body).html(compiled(it));
                document.title = ox.serverConfig.pageTitle + ' ' + gt('Printout');
            } catch (e) {
                console.error(e);
            }
        };

        return id;
    }

    function removeCallbacks() {
        for (var id in callbacks) {
            if (callbacks[id].closed) {
                delete callbacks[id];
                delete window[id];
            }
        }
    }

    var that = {

        request: function (manager, selection) {

            var win;

            function cont() {
                require([manager]).then(
                    function success(m) {
                        if (_.isFunction(m.open)) {
                            m.open(selection, win);
                        } else {
                            console.error('Missing function "open" in:', manager, m);
                        }
                    },
                    function fail() {
                        console.error('Failed to load print manager');
                    }
                );
            }

            if (_.device('desktop')) {

                cont();

                win = this.openURL(ox.base + '/busy.html');

            } else {
                // use iframe in modal dialog on mobile devices
                ox.load(['io.ox/core/tk/dialogs']).done(function (dialogs) {

                    var iframe = $('<iframe>', { src: ox.base + '/busy.html', frameborder: 0 }).css({
                        width: '100%',
                        height: '100%'
                    });

                    // create new dialog
                    var dHeight = window.innerHeight * 0.9,
                        dialog = new dialogs.ModalDialog({
                            width: window.innerWidth * 0.9,
                            height: dHeight
                        })
                        .addPrimaryButton("print", gt('Print'), null, {
                            click: function () {
                                win.print();
                            }
                        })
                        .addButton("cancel", gt("Cancel"));
                    dHeight -= 100;
                    dialog.getBody().css({
                        height: dHeight,
                        maxHeight: dHeight
                    });

                    dialog
                        .append(iframe)
                        .show()
                        .done(function (action) {
                            if (action === 'print') {
                                win.print();
                            }
                        });

                    // set win for callbacks
                    win = iframe[0].contentWindow;

                    cont();
                });

            }

            return win;
        },

        smart: function (options) {

            options = _.extend({
                get: $.noop,
                selection: [],
                i18n: {},
                file: ox.base + '/print.html'
            }, options);

            options.selection = _.chain(options.selection).toArray().compact();
            http.pause();

            $.when.apply($,
                _.chain(options.selection)
                .map(function getCID(obj) {
                    return _.isString(obj) ? obj : _.cid(obj);
                })
                .uniq()
                .map(function getData(cid, index) {
                    return options.get(_.cid(cid)).pipe(function (obj) {
                        return options.process ? options.process(obj, index, options) : obj;
                    });
                })
                .value()
            )
            .done(function () {
                var args = _.chain(arguments).toArray(), all = args.value().length;
                // filter?
                if (options.filter) {
                    args = args.filter(options.filter);
                }
                // sort?
                if (options.sortBy) {
                    args = args.sortBy(options.sortBy);
                }
                // stop chaining
                args = args.value();
                // create new callback & open print window
                var id = addCallback(options, { data: args, i18n: options.i18n, length: args.length, filtered: all - args.length  }),
                    url = options.file + '?' + id;
                if (options.window) {
                    options.window.location = url;
                    callbacks[id] = options.window;
                } else {
                    callbacks[id] = that.openURL(url);
                }
                // remove old callbacks
                removeCallbacks();
            })
            .fail(function () {
                if (options.window) {
                    options.window.close();
                }
                notifications.yell({
                    type: 'error',
                    headline: gt('Error'),
                    message: gt.ngettext('Cannot print this item', 'Cannot print these items', options.selection.length)
                });
            });

            http.resume();
        },

        getWindowOptions: function (url) {
            var o = { width: 750, height: Math.min(screen.availHeight - 100, 1050), top: 40 };
            o.left = (screen.availWidth - o.width) / 2 >> 0;
            o.string = 'width=' + o.width + ',height=' + o.height + ',left=' + o.left + ',top=' + o.top + ',menubar=no,toolbar=no,location=no,scrollbars=yes,status=no';
            return o;
        },

        getWindow: function (url) {
            var name = 'print_' + _.now(), // avoid bugs about non-opening windows
                options = this.getWindowOptions(url),
                win = window.open(url, name, options.string);
            return win;
        },

        // module and data are mandatory;
        // use options to overwrite default request params
        open: function (module, data, options) {

            var params = {action: 'get'}, url;

            // workaround for old printcalendar
            if (module === 'printCalendar') {
                delete params.action;
            }

            if (_.isArray(data)) {
                params.data = JSON.stringify(data);
            } else if (_.isObject(data)) {
                params.folder = data.folder_id || data.folder;
                params.id = data.id;
            }

            params.format = 'template';
            params.template = defaultTemplates[module] || fallbackTemplate;
            params.session = ox.session;

            url = ox.apiRoot + '/' + module + '?' + $.param(_.extend(params, options));

            return this.getWindow(url);
        },

        openURL: function (url) {
            return this.getWindow(url || (ox.base + '/blank.html'));
        },

        interim: function (url) {
            console.warn('Temporary solution; replace by open()', url);
            return this.openURL(url);
        }
    };

    return that;
});
