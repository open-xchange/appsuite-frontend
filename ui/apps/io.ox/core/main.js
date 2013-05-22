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
     'io.ox/core/upsell',
     'io.ox/core/capabilities',
     "settings!io.ox/core",
     "gettext!io.ox/core",
     'io.ox/core/relogin',
     "io.ox/core/bootstrap/basics"], function (desktop, session, http, appAPI, ext, Stage, date, notifications, commons, upsell, capabilities, settings, gt) {

    "use strict";

    var PATH = ox.base + "/apps/io.ox/core",
        DURATION = 250;

    var logout = function (opt) {

        opt = _.extend({
            autologout: false
        }, opt || {});

        $("#background_loader").fadeIn(DURATION, function () {

            $('#io-ox-core').hide();

            var deferreds = ext.point('io.ox/core/logout').invoke('logout').compact().value();

            $.when.apply($, deferreds).then(
                function logout() {
                    session.logout().always(function () {
                        // get logout locations
                        var location = settings.get('customLocations/logout');
                        _.url.redirect(location || (ox.logoutLocation + (opt.autologout ? '#autologout=true' : '')));
                    });
                },
                function cancel() {
                    $('#io-ox-core').show();
                    $("#background_loader").fadeOut(DURATION);
                }
            );
        });
    };

    var topbar = $('#io-ox-topbar'),
        launchers = $('.launchers', topbar),
        launcherDropdown = $('.launcher-dropdown ul', topbar);

    // whatever ...
    gt('Portal');
    gt('Mail');
    gt('Address Book');
    gt('Calendar');
    gt('Scheduling');
    gt('Tasks');
    gt('Files');
    gt('Conversations');

    function tabManager() {
        // Reset first
        launchers.children('.launcher:hidden').each(function (i, node) {
            $(node).show();
        });

        var items = launchers.children('.launcher'),
        itemsVisible = launchers.children('.launcher:visible'),
        itemsRight = topbar.children('.launcher.right'),
        itemsLeftWidth = 0,
        itemsRightWidth = $('#io-ox-top-logo-small', topbar).outerWidth(true),
        viewPortWidth = $(document).width(),
        launcherDropDownIcon = $('.launcher-dropdown', topbar),
        launcherDropDownIconWidth = launcherDropDownIcon.outerWidth(true);

        launcherDropDownIcon.hide();

        itemsRight.each(function () {
            itemsRightWidth += $(this).outerWidth(true);
        });
        itemsVisible.each(function () {
            itemsLeftWidth += $(this).outerWidth(true);
        });

        var visibleTabs,
            i = 0,
            hidden = 0;

        for (i = items.length; i > 1; i--) {
            visibleTabs = itemsVisible.length - hidden;
            if (itemsLeftWidth + itemsRightWidth <= viewPortWidth || visibleTabs <= 3) {
                break;
            } else {
                var lastVisibleItem = launchers.children('.launcher:visible').last();
                itemsLeftWidth = itemsLeftWidth - lastVisibleItem.outerWidth(true);
                lastVisibleItem.hide();
                hidden++;
                if (hidden === 1) {
                    itemsLeftWidth += launcherDropDownIconWidth;
                }
                if (visibleTabs <= 4) {
                    $('.launcher.left-corner', topbar).hide();
                }
            }
        }
        $('li', launcherDropdown).hide();
        if (hidden > 0) {
            launcherDropDownIcon.show();
            for (i = hidden; i > 0; i--) {
                $('li', launcherDropdown).eq(-i).show();
            }
        }
    }

    // add launcher
    var addLauncher = function (side, label, fn) {
        var node = $('<div class="launcher">'),
            sideTags = side.split(' '),
            wrap = false;

        if (sideTags.length > 1) {//only wrap uses 2 tags
            wrap = true;
            if (sideTags[0] === 'wrap') {//to make order unimportant
                side = sideTags[1];
            } else {
                side = sideTags[0];
            }
        }
        node.hover(
                function () { if (!Modernizr.touch) { $(this).addClass('hover'); } },
                function () { if (!Modernizr.touch) { $(this).removeClass('hover'); } }
            )
            .on('click', function (e) {
                e.preventDefault();
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

        if (wrap) {//wrap means the label should be wrapped instead of appended to keep positioning
            node.addClass(side);
            //add wrapper
            label.wrap(node);
        } else {
            //construct
            node.append(
                _.isString(label) ? $('<a href="#">').text(gt(label)) :  label
            );
        }
        // just add if not wrapped
        if (!wrap) {
            if (side === 'left') {
                node.appendTo(launchers);
            } else {
                node.addClass('right').appendTo(topbar);
            }
        }
        return node;
    };

    function initRefreshAnimation() {

        var count = 0,
            timer = null,
            useSpinner = _.device('webkit || firefox'),
            duration = useSpinner ? 500 : 1500;

        function off() {
            if (count === 0 && timer === null) {
                if (useSpinner) {
                    $('#io-ox-refresh-icon').find('i').addClass('icon-spin-paused').removeClass('icon-spin');
                } else {
                    $('#io-ox-refresh-icon').removeClass('io-ox-progress');
                }
            }
        }

        http.on('start', function () {
            if (count === 0) {
                if (timer === null) {
                    if (useSpinner) {
                        $('#io-ox-refresh-icon').find('i').addClass('icon-spin').removeClass('icon-spin-paused');
                    } else {
                        $('#io-ox-refresh-icon').addClass('io-ox-progress');
                    }
                }
                clearTimeout(timer);
                timer = setTimeout(function () {
                    timer = null;
                    off();
                }, duration);
            }
            count++;
        });

        http.on('stop', function () {
            count = Math.max(0, count - 1);
            off();
        });
    }

    var refresh;

    (function () {

        var interval = parseInt(settings.get('refreshInterval', 300000), 10),
            next = _.now() + interval;

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


    (function () {

        var CHECKINTERVAL = 10,     // check only in this interval to optimize script performance
            WARNINGSTART = 30,      // threshold for warning dialog in sconds
            interval = 0,           // init logout interval
            timeout = null,         // main timeout reference
            checker = null,         // checker timeout reference
            timeoutStart,           // remember timeout init
            dialog = null,          // init warning dialog
            changed = false;

        var getTimeLeft = function () {
            return Math.ceil((timeoutStart + interval - _.now()) / 1000);
        };

        var getInterval = function () {
            return parseInt(settings.get('autoLogout', 0), 10);
        };

        // clear current timeout and reset activity status
        var resetTimeout = function () {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                logout({autologout: true});
            }, interval);
            timeoutStart = _.now();
            changed = false;
        };

        // check activity status
        var check = function () {
            if (changed && dialog === null) {
                resetTimeout();
            } else {
                var timeLeft = getTimeLeft();

                if (timeLeft <= WARNINGSTART && dialog === null) {
                    // show warnig dialog
                    require(['io.ox/core/tk/dialogs'], function (dialogs) {

                        var countdown = timeLeft,
                            getString = function (sec) {
                                return gt.format(
                                    gt.ngettext(
                                        'You will be automatically logged out in %1$d Second',
                                        'You will be automatically logged out in %1$d Seconds', sec
                                    ), gt.noI18n(sec)
                                );
                            },
                            node = $('<span>').text(getString(countdown)),
                            countdownTimer = setInterval(function () {
                                countdown--;
                                node.text(getString(countdown));
                            }, 1000);

                        dialog = new dialogs.ModalDialog()
                            .header($('<h4>').text(gt('Automatic logout')))
                            .append(node)
                            .topmost()
                            .addPrimaryButton('cancel', gt('Cancel'))
                            .addAlternativeButton('force', gt('Logout now'))
                            .setUnderlayStyle({
                                backgroundColor: 'white',
                                opacity: 0.90
                            })
                            .show()
                            .done(function (action) {
                                if (action === 'cancel') {
                                    resetTimeout();
                                    clearInterval(countdownTimer);
                                    dialog = null;
                                }
                                if (action === 'force') {
                                    logout();
                                }
                            });

                    });
                }
            }
        };

        var change = function () {
            changed = true;
        };

        var start = function () {

            interval = getInterval();

            if (interval > 0 && timeout === null) {

                // bind mouse, keyboard and touch events to monitor user activity
                $(document).on('mousedown mousemove scroll touchstart touchmove keydown', change);
                // start timeout
                resetTimeout();
                // check every x seconds to reduce setTimeout operations
                checker = setInterval(check, 1000 * CHECKINTERVAL);
            }

        };

        var stop = function () {
            if (checker && timeout) {
                clearTimeout(timeout);
                clearInterval(checker);
                timeout = checker = null;
                $(document).off('mousedown mousemove scroll touchstart touchmove keydown', change);
            }
        };

        var restart = function () {
            stop();
            start();
        };

        ox.autoLogoutRestart = restart;

        start();

        ox.autoLogoutRestartDebug = function () {
            CHECKINTERVAL = 1;
            WARNINGSTART = 10;
            getInterval = function () { return 12000; };
            restart();
        };

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
                if (!upsell.has(model.get('requires'))) {
                    node.addClass('upsell').children('a').first().prepend(
                        $('<i class="icon-lock">')
                    );
                }
            } else {
                placeholder = container.children('.placeholder[data-app-name="' + $.escape(model.get('name')) + '"]');
                if (placeholder.length) {
                    node.insertBefore(placeholder);
                }
                placeholder.remove();
            }
        }

        function addUserContent(model, launcher) {
            if (model.get('userContent')) {
                var cls = model.get('userContentClass') || '',
                    icon = model.get('userContentIcon') || 'icon-pencil';
                launcher.addClass('user-content').addClass(cls).prepend($('<span>').append($('<i class="' + icon + '">')));
            }
        }

        ox.ui.apps.on('add', function (model, collection, e) {

            if (model.get('title') === undefined) return;

            // create topbar launcher
            var node = addLauncher('left', model.get('title'), function () { model.launch(); }),
                title = model.get('title'),
                name;

            add(node, launchers, model);

            // call extensions to customize
            name = model.get('name') || model.id;
            ext.point('io.ox/core/topbar/launcher').invoke('draw', node, ext.Baton({ model: model, name: name }));

            // is user-content?
            addUserContent(model, node);

            // add list item
            node = $('<li>').append(
                $('<a>', {
                    href: '#',
                    'data-app-name': name,
                    'data-app-guid': model.guid
                })
                .text(gt(title))
            );
            launcherDropdown.append(
                node.on('click', function (e) {
                    e.preventDefault();
                    model.launch();
                })
            );
            add(node, launcherDropdown, model);
            tabManager();
        });

        ox.ui.apps.on('remove', function (model, collection, e) {
            launchers.children('[data-app-guid="' + model.guid + '"]').remove();
            launcherDropdown.children('[data-app-guid="' + model.guid + '"]').remove();
            tabManager();
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
            addUserContent(model, node);
            launcherDropdown.find('a[data-app-guid="' + model.guid + '"]').text(value);
            tabManager();
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
                var el = $('<span class="badge">').hide();
                this.append(el);
                // we don't need this right from the start,
                // so let's delay this for responsiveness
                setTimeout(function () {
                    if (ox.online) {
                        notifications.attach(el, addLauncher);
                        tabManager();
                    }
                }, 5000);
            }
        });

        ext.point('io.ox/core/topbar/right').extend({
            id: 'refresh',
            index: 2000,
            draw: function () {
                this.append(
                    addLauncher("right", $('<i class="icon-refresh">'), function () {
                        refresh();
                        return $.when();
                    })
                    .attr("id", "io-ox-refresh-icon")
                );
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
                    .on('click', function (e) {
                        e.preventDefault();
                        ox.launch('io.ox/settings/main');
                    })
                );
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'help',
            index: 200,
            draw: function () {
                var helpLink = 'help/' + ox.language + '/index.html';
                this.append(
                    $('<li>').append(
                        $('<a>', { href: helpLink, target: '_blank' }).text(gt('Help'))
                    )
                );
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'fullscreen',
            index: 200,
            draw: function () {
                if (BigScreen.enabled) {
                    var fullscreenButton;
                    BigScreen.onenter = function () {
                        fullscreenButton.text(gt('Exit Fullscreen'));
                    };
                    BigScreen.onexit = function () {
                        fullscreenButton.text(gt('Fullscreen'));
                    };
                    this.append(
                        $('<li>').append(
                            fullscreenButton = $('<a href="#" data-action="fullscreen">').text(gt('Fullscreen'))
                        )
                        .on('click', function (e) {
                            e.preventDefault();
                            BigScreen.toggle();
                        })
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
                    .on('click', function (e) {
                        e.preventDefault();
                        require(['io.ox/core/about/about'], function (about) {
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
                    .on('click', function (e) {
                        e.preventDefault();
                        logout();
                    })
                );
            }
        });

        ext.point('io.ox/core/topbar/right').extend({
            id: 'dropdown',
            index: 1000,
            draw: function () {
                var div, a, ul;
                this.append(
                    div = $('<div class="launcher right dropdown">').append(
                        a = $('<a class="dropdown-toggle" data-toggle="dropdown" href="#">').append(
                            $('<i class="icon-cog icon-white">')
                        ),
                        ul = $('<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">')
                    )
                );
                if (!Modernizr.touch) {
                    div.hover(
                        function () { $(this).addClass('hover'); },
                        function () { $(this).removeClass('hover'); }
                    );
                }
                ext.point('io.ox/core/topbar/right/dropdown').invoke('draw', ul);
                a.dropdown();
            }
        });

        // launchpad
        ext.point('io.ox/core/topbar/launchpad').extend({
            id: 'default',
            draw: function () {
                if (capabilities.has('launchpad')) {
                    addLauncher("left", $('<i class="icon-th icon-white">'), function () {
                        return require(["io.ox/launchpad/main"], function (m) {
                            launchers.children().removeClass('active-app');
                            launcherDropdown.children().removeClass('active-app');
                            launchers.children().first().addClass('active-app');
                            m.show();
                        });
                    })
                    .addClass('left-corner'); // to match dimensions of side navigation
                } else {
                    // add placeholder
                    addLauncher('left', $('<span>&nbsp;</span>')).addClass('left-corner');
                }
            }
        });

        // favorites
        ext.point('io.ox/core/topbar/favorites').extend({
            id: 'default',
            draw: function () {
                var favorites = appAPI.getFavorites();
                favorites.sort(function (a, b) {
                    return ext.indexSorter(a, b);
                });
                _(favorites).each(function (obj) {
                    if (upsell.visible(obj.requires)) {
                        ox.ui.apps.add(new ox.ui.AppPlaceholder({
                            id: obj.id,
                            title: obj.title,
                            requires: obj.requires
                        }));
                    }
                });
            }
        });

        ext.point('io.ox/core/topbar').extend({
            id: 'default',
            draw: function () {

                // right side
                ext.point('io.ox/core/topbar/right').invoke('draw', topbar);

                // refresh animation
                initRefreshAnimation();

                ext.point('io.ox/core/topbar/launchpad').invoke('draw');
                ext.point('io.ox/core/topbar/favorites').invoke('draw');

                $(window).resize(tabManager);
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

        // add some senseless characters to avoid unwanted scrolling
        if (location.hash === '') {
            location.hash = '#!';
        }

        var autoLaunchArray = function () {
            var autoStart = [];
            if (settings.get('autoStart') === 'none') {
                autoStart = [];
            } else {
                autoStart = _([].concat(settings.get('autoStart'))).filter(function (o) { return !_.isUndefined(o) && !_.isNull(o); });
            }
            if (_.isEmpty(autoStart)) {
                autoStart.push("io.ox/mail");
            }

            return autoStart;
        };

        // checks url which app to launch, needed to handle direct links
        function appCheck() {
            if (_.url.hash('m')) {
                //direkt link
                switch (_.url.hash('m')) {
                case 'task':
                    _.url.hash({ app: 'io.ox/tasks' });
                    break;
                case 'calendar':
                    // only list perspective can handle ids
                    _.url.hash({ app: 'io.ox/calendar', perspective: 'week:week' });
                    break;
                case 'infostore':
                    // only list perspective can handle ids
                    _.url.hash({ app: 'io.ox/files', perspective: 'list' });
                    break;
                case 'contact':
                    _.url.hash({ app: 'io.ox/contacts' });
                    break;
                }
                // fill id and folder, then clean up
                _.url.hash({
                    folder: _.url.hash('f'),
                    id: _.url.hash('f') + '.' + _.url.hash('i'),
                    m: null,
                    f: null,
                    i: null
                });
            }
            return _.url.hash('app') ? _.url.hash('app').split(/,/) : autoLaunchArray();
        }

        var baton = ext.Baton({
            block: $.Deferred(),
            autoLaunch: appCheck()
        });

        var getAutoLaunchDetails = function (str) {
            var pair = str.split(/:/), app = pair[0], method = pair[1] || '';
            return { app: (/\/main$/).test(app) ? app : app + '/main', method: method };
        };

        baton.autoLaunchApps = _(baton.autoLaunch)
        .chain()
        .map(function (m) {
            return getAutoLaunchDetails(m).app;
        })
        .filter(function (m) {
            return !!ox.manifests.apps[m];
        })
        .compact()
        .value();

        var drawDesktop = function () {
            ext.point("io.ox/core/desktop").invoke("draw", $("#io-ox-desktop"), {});
            drawDesktop = $.noop;
        };

        ox.ui.windowManager.on("empty", function (e, isEmpty, win) {
            if (isEmpty) {
                drawDesktop();
                ox.ui.screens.show('desktop');
                ox.launch(getAutoLaunchDetails(win || settings.get('autoStart', 'io.ox/mail/main')).app);
            } else {
                ox.ui.screens.show('windowmanager');
            }
        });

        // start loading stuff
        baton.loaded = $.when(
            baton.block,
            ext.loadPlugins(),
            require(baton.autoLaunchApps),
            require(['io.ox/core/api/account']).pipe(function (api) {
                var def = $.Deferred();
                api.all().always(def.resolve);
                return def;
            })
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
                        ox.ui.App.removeRestorePoint($(this).data('id')).done(function (list) {
                            // continue if list is empty
                            if (list.length === 0) def.resolve();
                        });
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

                        if (!ox.manifests.apps[details.app]) {
                            ox.launch(settings.get('autoStart'));
                            return;
                        }
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
        logout: logout,
        launch: launch,
        addLauncher: addLauncher
    };
});
