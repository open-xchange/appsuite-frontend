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

define("io.ox/core/main",
    ["io.ox/core/desktop",
     "io.ox/core/session",
     "io.ox/core/http",
     "io.ox/core/api/apps",
     "io.ox/core/extensions",
     "io.ox/core/extPatterns/stage",
     "io.ox/core/date",
     'io.ox/core/notifications',
     'io.ox/core/commons', // defines jQuery plugin
     "settings!io.ox/core",
     "gettext!io.ox/core",
     "io.ox/core/bootstrap/basics"], function (desktop, session, http, appAPI, ext, Stage, date, notifications, commons, settings, gt) {

    "use strict";

    var PATH = ox.base + "/apps/io.ox/core",
        DURATION = 250;

    var logout = function () {
        return session.logout()
            .always(function () {
                $("#background_loader").fadeIn(DURATION, function () {
                    $("#io-ox-core").hide();
                    _.url.redirect("signin");
                });
            });
    };

    var topbar = $('#io-ox-topbar'),
        launchers = topbar.find('.launchers'),
        launcherDropdown = topbar.find('.launcher-dropdown ul');

    // whatever ...
    gt('Address Book');
    gt('Calendar');
    gt('Tasks');
    gt('Files');
    gt('Conversations');

    // add launcher
    var addLauncher = function (side, label, fn, tooltip) {
        // construct
        var node = $('<div class="launcher">')
            .append(_.isString(label) ? $.txt(gt(label)) : label)
            .hover(
                function () { if (!Modernizr.touch) { $(this).addClass('hover'); } },
                function () { if (!Modernizr.touch) { $(this).removeClass('hover'); } }
            )
            .on('click', function () {
                var self = $(this), content;
                // set fixed width, hide label, be busy
                content = self.contents();
                self.css('width', self.width() + 'px').text('\u00A0').busy();
                // call launcher
                (fn.call(this) || $.when()).done(function () {
                    // revert visual changes
                    self.idle().empty().append(content).css('width', '');
                });
            });

        // tooltip
        if (tooltip && !Modernizr.touch) {
            node.tooltip({ title: tooltip, placement: 'bottom', animation: false });
        }

        // just add
        if (side === 'left') {
            node.appendTo(launchers);
        } else {
            node.addClass('right').appendTo(topbar);
        }

        return node;
    };

    function initRefreshAnimation() {

        var count = 0, timer = null;

        function off() {
            if (count === 0 && timer === null) {
                $("#io-ox-refresh-icon").removeClass("io-ox-progress");
            }
        }

        http.on("start", function () {
            if (count === 0) {
                if (timer === null) {
                    $("#io-ox-refresh-icon").addClass("io-ox-progress");
                }
                clearTimeout(timer);
                timer = setTimeout(function () {
                    timer = null;
                    off();
                }, 1500);
            }
            count++;
        });

        http.on("stop", function () {
            count = Math.max(0, count - 1);
            off();
        });
    }

    var refresh;

    (function () {

        var interval = settings.get('refreshInterval', 300000), next = _.now() + interval;

        ext.point('io.ox/core/refresh').extend({
            action: function () {
                if (ox.online && ox.session !== '') {
                    try {
                        // trigger global event
                        ox.trigger('refresh^');
                    } catch (e) {
                        console.error('io.ox/core/refresh:default', e.message, e);
                    }
                }
            }
        });

        refresh = function () {
            next = _.now() + interval;
            ext.point('io.ox/core/refresh').invoke('action');
        };

        function check() {
            if (_.now() > next) { refresh(); }
        }

        setInterval(check, 10000); // check every 10 seconds

    }());

    function launch() {

        /**
         * Listen to events on apps collection
         */

        function add(node, container, model) {
            var placeholder;
            node.attr('data-app-name', model.get('name') || model.id)
                .attr('data-app-guid', model.guid);
            // is launcher?
            if (model instanceof ox.ui.AppPlaceholder) {
                node.addClass('placeholder');
            } else {
                placeholder = container.children('.placeholder[data-app-name="' + $.escape(model.get('name')) + '"]');
                if (placeholder.length) {
                    node.insertBefore(placeholder);
                }
                placeholder.remove();
            }
        }

        ox.ui.apps.on('add', function (model, collection, e) {
            // create topbar launcher
            var node = addLauncher('left', model.get('title'), function () { model.launch(); }),
                title = model.get('title');
            add(node, launchers, model);
            // is user-content?
            if (model.get('userContent')) {
                node.addClass('user-content').prepend($('<i class="icon-pencil">'));
            }
            // add list item
            node = $('<li>').append(
                $('<a>', {
                    href: '#',
                    'data-app-name': model.get('name') || model.id,
                    'data-app-guid': model.guid
                })
                .text(gt(title))
            );
            node.on('click', function () { model.launch(); }).appendTo(launcherDropdown);
            add(node, launcherDropdown, model);
        });

        ox.ui.apps.on('remove', function (model, collection, e) {
            launchers.children('[data-app-guid="' + model.guid + '"]').remove();
            launcherDropdown.children('[data-app-guid="' + model.guid + '"]').remove();
        });

        ox.ui.apps.on('launch resume', function (model, collection, e) {
            // mark last active app
            launchers.children().removeClass('active-app')
                .filter('[data-app-guid="' + model.guid + '"]').addClass('active-app');
            launcherDropdown.children().removeClass('active-app')
                .filter('[data-app-guid="' + model.guid + '"]').addClass('active-app');
        });

        ox.ui.apps.on('change:title', function (model, value) {
            var node = launchers.children('[data-app-guid="' + model.guid + '"]').text(value);
            if (model.get('userContent')) {
                node.prepend($('<i class="icon-pencil">'));
            }
            launcherDropdown.children('[data-app-guid="' + model.guid + '"] a').text(value);
        });

        /**
         * Extenions
         */

        ext.point('io.ox/core/topbar/right').extend({
            id: 'logo',
            index: 100,
            draw: function () {
                // add small logo to top bar
                this.append(
                    $('<div>', { id: 'io-ox-top-logo-small' })
                );
            }
        });

        ext.point('io.ox/core/topbar/right').extend({
            id: 'notifications',
            index: 10000,
            draw: function () {
                // we don't need this right from the start,
                // so let's delay this for responsiveness
                setTimeout(function () {
                    if (ox.online) {
                        notifications.attach(addLauncher);
                    }
                }, 5000);
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'settings',
            index: 100,
            draw: function () {
                this.append(
                    $('<li>').append(
                        $('<a href="#" data-app-name="io.ox/settings">').text(gt('Settings'))
                    )
                    .on('click', function () {
                        ox.launch('io.ox/settings/main');
                    })
                );
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'help',
            index: 200,
            draw: function () {
                var helpLink = "help/" + ox.language + "/index.html";
                this.append(
                    $('<li>').append(
                        $('<a target="_blank">').attr({href: helpLink}).text(gt('Help'))
                    )
                );
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'fullscreen',
            index: 200,
            draw: function () {
                if (BigScreen.enabled) {
                    this.append(
                        $('<li>').append(
                            $('<a href="#" data-action="fullscreen">').text(gt('Fullscreen'))
                        )
                        .on('click', function () { BigScreen.toggle(); })
                    );
                }
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'about',
            index: 300,
            draw: function () {
                this.append(
                    $('<li>').append(
                        $('<a href="#" data-action="about">').text(gt('About'))
                    )
                    .on('click', function () {
                        require(['io.ox/core/about'], function (about) {
                            about.show();
                        });
                    })
                );
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'logout',
            index: 1000,
            draw: function () {
                this.append(
                    $('<li class="divider"></li>'),
                    $('<li>').append(
                        $('<a href="#" data-action="logout">').text(gt('Sign out'))
                    )
                    .on('click', logout)
                );
            }
        });

        ext.point('io.ox/core/topbar/right').extend({
            id: 'dropdown',
            index: 1000,
            draw: function () {
                var a, ul;
                this.append(
                    $('<div class="launcher right dropdown">').append(
                        a = $('<a class="dropdown-toggle" data-toggle="dropdown" href="#">').append(
                            $('<i class="icon-cog icon-white">')
                        ),
                        ul = $('<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">')
                    )
                );
                ext.point('io.ox/core/topbar/right/dropdown').invoke('draw', ul);
                a.dropdown();
            }
        });

        // launchpad
        ext.point('io.ox/core/topbar/launchpad').extend({
            id: 'default',
            draw: function () {
                addLauncher("left", $('<i class="icon-th icon-white">'), function () {
                    return require(["io.ox/launchpad/main"], function (m) {
                        launchers.children().removeClass('active-app');
                        launcherDropdown.children().removeClass('active-app');
                        launchers.children().first().addClass('active-app');
                        m.show();
                    });
                })
                .addClass('left-corner'); // to match dimensions of side navigation
            }
        });

        // favorites
        ext.point('io.ox/core/topbar/favorites').extend({
            id: 'default',
            draw: function () {
                _(appAPI.getFavorites()).each(function (obj) {
                    ox.ui.apps.add(new ox.ui.AppPlaceholder({ id: obj.id, title: obj.title }));
                });
            }
        });

        ext.point('io.ox/core/topbar').extend({
            id: 'default',
            draw: function () {

                // right side
                ext.point('io.ox/core/topbar/right').invoke('draw', topbar);

                // refresh
                addLauncher("right", $('<i class="icon-refresh icon-white">'), function () {
                    refresh();
                    return $.when();
                }, gt('Refresh')).attr("id", "io-ox-refresh-icon");

                // refresh animation
                initRefreshAnimation();

                ext.point('io.ox/core/topbar/launchpad').invoke('draw');
                ext.point('io.ox/core/topbar/favorites').invoke('draw');
            }
        });

        ext.point('io.ox/core/relogin').extend({
            draw: function () {
                this.append(
                    gt('Your session is expired'), $.txt(_.noI18n('.')), $('<br>'),
                    $('<small>').text(gt('Please sign in again to continue'))
                );
            }
        });

        var drawDesktop = function () {
            ext.point("io.ox/core/desktop").invoke("draw", $("#io-ox-desktop"), {});
            drawDesktop = $.noop;
        };

        ox.ui.windowManager.on("empty", function (e, isEmpty) {
            if (isEmpty) {
                drawDesktop();
            }
            if (isEmpty) {
                ox.ui.screens.show('desktop');
            } else {
                ox.ui.screens.show('windowmanager');
            }
        });

        // add some senseless characters to avoid unwanted scrolling
        if (location.hash === '') {
            location.hash = '#!';
        }

        var autoLaunchArray = function () {
            if (settings.get('autoStart') === 'none') {
                return [];
            } else {
                return [].concat(settings.get('autoStart'));
            }
        };

        var baton = ext.Baton({
            block: $.Deferred(),
            autoLaunch: _.url.hash("app") ? _.url.hash("app").split(/,/) : autoLaunchArray()
        });

        var getAutoLaunchDetails = function (str) {
            var pair = str.split(/:/), app = pair[0], method = pair[1] || '';
            return { app: (/\/main$/).test(app) ? app : app + '/main', method: method };
        };

        baton.autoLaunchApps = _(baton.autoLaunch).map(function (m) {
            return getAutoLaunchDetails(m).app;
        });

        // start loading stuff
        baton.loaded = $.when(
            baton.block,
            ext.loadPlugins(),
            require(baton.autoLaunchApps),
            require(['io.ox/core/api/account']).pipe(function (api) { return api.all(); })
        );

        new Stage('io.ox/core/stages', {
            id: 'first',
            index: 100,
            run: function () {
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'update-tasks',
            index: 200,
            run: function () {
                if (ox.online) {
                    var def = $.Deferred();
                    require(['io.ox/core/updates/updater'], function (updater) {
                        updater.runUpdates().done(def.resolve).fail(def.reject);
                    }).fail(def.reject);

                    return def;
                }
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'restore-check',
            index: 300,
            run: function (baton) {
                return ox.ui.App.canRestore().done(function (canRestore) {
                    baton.canRestore = canRestore;
                });
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'restore-confirm',
            index: 400,
            run: function (baton) {

                if (baton.canRestore) {

                    var dialog,
                        def = $.Deferred().done(function () {
                            $("#background_loader").busy().fadeIn();
                            topbar.show();
                            dialog.remove();
                            dialog = null;
                        });

                    $('#io-ox-core').append(
                        dialog = $('<div class="core-boot-dialog">').append(
                            $('<div class="header">').append(
                                $('<h3>').text(gt('Restore applications')),
                                $('<div>').text(
                                    gt("The following applications can be restored. Just remove the restore point if you don't want it to be restored.")
                                )
                            ),
                            $('<div class="content">'),
                            $('<div class="footer">').append($('<button class="btn btn-primary">').text(gt('Continue')))
                        )
                    );

                    // draw savepoints to allow the user removing them
                    ox.ui.App.getSavePoints().done(function (list) {
                        _(list).each(function (item) {
                            this.append(
                                $('<div class="alert alert-info alert-block">').append(
                                    $('<button type="button" class="close" data-dismiss="alert">&times;</button>').data(item),
                                    $.txt(item.description || item.module)
                                )
                            );
                        }, dialog.find('.content'));
                    });

                    dialog.on('click', '.footer .btn', def.resolve);
                    dialog.on('click', '.content .close', function (e) {
                        ox.ui.App.removeRestorePoint($(this).data('id'));
                    });

                    topbar.hide();
                    $("#background_loader").idle().fadeOut();

                    return def;
                }
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'restore',
            index: 500,
            run: function (baton) {
                if (baton.canRestore) {
                    // clear auto start stuff (just conflicts)
                    baton.autoLaunch = [];
                    baton.autoLaunchApps = [];
                }
                if (baton.autoLaunch.length === 0 && !baton.canRestore) {
                    drawDesktop();
                    return baton.block.resolve(true);
                }
                return baton.block.resolve(baton.autoLaunch.length || baton.canRestore || location.hash === '#!');
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'load',
            index: 600,
            run: function (baton) {

                return baton.loaded.done(function (instantFadeOut) {

                    // draw top bar now
                    ext.point('io.ox/core/topbar').invoke('draw');

                    // help here
                    if (!ext.point('io.ox/core/topbar').isEnabled('default')) {
                        $('#io-ox-screens').css('top', '0px');
                        topbar.hide();
                    }

                    // auto launch
                    _(baton.autoLaunch).each(function (id) {
                        // split app/call
                        var details = getAutoLaunchDetails(id), launch, method;
                        launch = require(details.app).getApp().launch();
                        method = details.method;
                        // explicit call?
                        if (method) {
                            launch.done(function () {
                                if (_.isFunction(this[method])) {
                                    this[method]();
                                }
                            });
                        }
                    });
                    // restore apps
                    ox.ui.App.restore();

                    baton.instantFadeOut = instantFadeOut;
                });
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'curtain',
            index: 700,
            run: function (baton) {
                if (baton.instantFadeOut) {
                    // instant fade out
                    $("#background_loader").idle().hide();
                    return $.when();
                } else {
                    var def = $.Deferred();
                    $("#background_loader").idle().fadeOut(DURATION, def.resolve);
                    return def;
                }
            }
        });

        Stage.run('io.ox/core/stages', baton);
    }

    return {
        launch: launch,
        addLauncher: addLauncher
    };
});
