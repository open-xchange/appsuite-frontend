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

define('io.ox/core/main', [
    'io.ox/core/desktop',
    'io.ox/core/session',
    'io.ox/core/http',
    'io.ox/core/api/apps',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/stage',
    'io.ox/core/notifications',
    'io.ox/backbone/mini-views/help',
    // defines jQuery plugin
    'io.ox/core/commons',
    'io.ox/core/upsell',
    'io.ox/backbone/mini-views/upsell',
    'io.ox/core/capabilities',
    'io.ox/core/ping',
    'io.ox/core/folder/api',
    'settings!io.ox/core',
    'gettext!io.ox/core',
    'io.ox/core/relogin',
    'io.ox/core/links',
    'io.ox/core/http_errors',
    'io.ox/backbone/disposable'
], function (desktop, session, http, appAPI, ext, Stage, notifications, HelpView, commons, upsell, UpsellView, capabilities, ping, folderAPI, settings, gt) {

    'use strict';

    var DURATION = 250;

    // enable special logging to investigate why boot fails
    var debug = $.noop;

    if (/\bcore/.test(_.url.hash('debug'))) {
        debug = function () {
            var args = _(arguments).toArray(), t = _.now() - ox.t0;
            args.unshift('core (' + (t / 1000).toFixed(1) + 's): ');
            console.log.apply(console, args);
        };
    }

    debug('core: Loaded');
    ox.trigger('core:load');

    _.stepwiseInvoke = function (list, method, context) {
        if (!_.isArray(list)) return $.when();
        var args = Array.prototype.slice.call(arguments, 3), done = $.Deferred(), tmp = [];
        function store(result) {
            tmp.push(result);
        }
        function tick() {
            // are we done now?
            if (list.length === 0) return done.resolve(tmp);
            // get next item
            var item = list.shift();
            // has method?
            if (item && _.isFunction(item[method])) {
                // call method and expect a deferred object
                var ret = item[method].apply(context, args);
                if (ret && ret.promise) return ret.done(store).then(tick, done.reject);
            }
            tick();
        }
        tick();
        return done.promise();
    };

    var logout = function (opt) {

        opt = _.extend({
            autologout: false
        }, opt || {});

        $('#background-loader').fadeIn(DURATION, function () {

            $('#io-ox-core').hide();
            var extensions = ext.point('io.ox/core/logout').list();
            _.stepwiseInvoke(extensions, 'logout', this, new ext.Baton(opt)).then(
                function logout() {
                    session.logout().always(function () {
                        // get logout locations
                        var location = (capabilities.has('guest') && ox.serverConfig.guestLogoutLocation) ? ox.serverConfig.guestLogoutLocation : settings.get('customLocations/logout'),
                            fallback = ox.serverConfig.logoutLocation || ox.logoutLocation,
                            logoutLocation = location || (fallback + (opt.autologout ? '#autologout=true' : ''));
                        // Substitute some variables
                        // [hostname], [login]
                        logoutLocation = logoutLocation.replace('[hostname]', window.location.hostname);
                        _.url.redirect(logoutLocation);
                    });
                },
                function cancel() {
                    $('#io-ox-core').show();
                    $('#background-loader').fadeOut(DURATION);
                }
            );
        });
    };

    // trigger all apps to save restorepoints
    ext.point('io.ox/core/logout').extend({
        id: 'saveRestorePoint',
        index: 1,
        logout: function (baton) {
            http.pause();
            var def = $.Deferred();
            if (baton.autologout || ox.online) {
                // TODO: add http pause / resume
                $.when.apply($,
                    ox.ui.apps.map(function (app) {
                        return app.saveRestorePoint();
                    })
                ).always(def.resolve);
            } else {
                ox.ui.App.canRestore().then(function (canRestore) {
                    if (canRestore) {
                        $('#io-ox-core').show();
                        $('#background-loader').hide();
                        require(['io.ox/core/tk/dialogs'], function (dialogs) {
                            new dialogs.ModalDialog()
                                .text(gt('Unsaved documents will be lost. Do you want to sign out now?'))
                                .addPrimaryButton('Yes', gt('Yes'))
                                .addButton('No', gt('No'))
                                .show()
                                .then(function (action) {
                                    if (action === 'No') {
                                        def.reject();
                                    } else {
                                        $('#io-ox-core').hide();
                                        $('#background-loader').show();
                                        def.resolve();
                                    }
                                });
                        });
                    } else {
                        def.resolve();
                    }
                });
            }
            // save core settings
            settings.save();
            http.resume();
            return def;
        }
    });

    // clear all caches
    ext.point('io.ox/core/logout').extend({
        id: 'clearCache',
        logout: function () {
            return ox.cache.clear();
        }
    });

    // wait for all pending settings
    ext.point('io.ox/core/logout').extend({
        id: 'savePendingSettings',
        index: 1000000000000,
        logout: function () {
            // force save requests for all pending settings
            http.pause();
            $.when.apply($,
                _(settings.getAllPendingSettings()).map(function (set) {
                    return set.save(undefined, { force: true });
                })
            );
            return http.resume();
        }
    });

    //
    // handle online/offline mode
    //
    function showIndicator(text) {
        $('#io-ox-offline').text(text).stop().show().animate({ bottom: '0px' }, 200);
        notifications.yell('screenreader', text);
    }

    function hideIndicator() {
        $('#io-ox-offline').stop().animate({ bottom: '-41px' }, 200, function () { $(this).hide(); });
    }

    ox.on({
        'connection:online': function () {
            hideIndicator();
            ox.online = true;
        },
        'connection:offline': function () {
            showIndicator(gt('Offline'));
            ox.online = false;
        },
        'connection:up': function () {
            if (ox.online) hideIndicator();
        },
        'connection:down': function () {
            if (ox.online) showIndicator(gt('Server unreachable'));
        }
    });

    if (!ox.online) {
        $(window).trigger('offline');
    }

    var topbar = $('#io-ox-topbar'),
        launchers = $('.launchers', topbar),
        launcherDropdown = $('.launcher-dropdown ul', topbar);

    topbar
        .attr({
            'aria-label': gt('Applications'),
            'role': 'banner'
        })
        // prevent dragging links
        .on('dragstart', false)
        // make system drop-down accessible
        .find('a.dropdown-toggle').attr({
            'aria-label': gt('Launcher dropdown. Press [enter] to jump to the dropdown.'),
            'role': 'button',
            'aria-haspopup': 'true'
        })
        .end()
        .find('i.fa-bars').removeClass('fa-bars').addClass('fa-angle-double-right ');

    // whatever ...
    gt.pgettext('app', 'Portal');
    gt.pgettext('app', 'Mail');
    gt.pgettext('app', 'Address Book');
    gt.pgettext('app', 'Calendar');
    gt.pgettext('app', 'Scheduling');
    gt.pgettext('app', 'Tasks');
    gt.pgettext('app', 'Drive');
    gt.pgettext('app', 'Conversations');

    var tabManager = _.debounce(function () {
        var items = launchers.children('.launcher'),
            launcherDropDownIcon = $('.launcher-dropdown', topbar),
            forceDesktopLaunchers = settings.get('forceDesktopLaunchers', false);

        // we don't show any launcher in top-bar on small devices
        if (_.device('smartphone') && !forceDesktopLaunchers) {
            items.hide();
            launcherDropDownIcon.show();
            return;
        }

        var itemsLeftWidth = launchers.offset().left;

        // Reset first
        launchers.children('.launcher:hidden').each(function (i, node) {
            $(node).show();
        });

        var itemsVisible = launchers.children('.launcher:visible'),
            itemsRightWidth = topbar.find('.launchers-secondary').outerWidth(true),
            viewPortWidth = $(document).width(),
            launcherDropDownIconWidth = launcherDropDownIcon.outerWidth(true);

        launcherDropDownIcon.hide();

        itemsVisible.each(function () {
            itemsLeftWidth += $(this).outerWidth(true);
        });

        var visibleTabs,
            i = 0,
            hidden = 0;
        for (i = items.length; i > 1; i--) {
            visibleTabs = itemsVisible.length - hidden;
            if (itemsLeftWidth + itemsRightWidth <= viewPortWidth) {
                break;
            } else {
                var lastVisibleItem = launchers.children('.launcher:visible').last();
                itemsLeftWidth = itemsLeftWidth - lastVisibleItem.outerWidth(true);
                lastVisibleItem.hide();
                hidden++;
                if (hidden === 1) {
                    itemsLeftWidth += launcherDropDownIconWidth;
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
    }, 100);

    // add launcher
    var addLauncher = function (side, label, fn, arialabel) {
        var node = $('<li class="launcher">');

        if (fn) {
            node.on('click', function (e) {
                e.preventDefault();
                var self = $(this), content,
                    focus = $(document.activeElement);
                // set fixed width, hide label, be busy
                content = self.contents().detach();
                self.css('width', self.width() + 'px').text('\u00A0').busy();
                // call launcher
                (fn.call(this) || $.when()).done(function () {
                    // revert visual changes
                    self.idle().empty().append(content).css('width', '');
                    //detaching results in lost focus, which is bad for keyboard support.
                    //so we need to restore it, if it was not set manually in the mean time.
                    if ($(document.activeElement).filter('body').length > 0) {
                        focus.focus();
                    }
                });
            });
        }

        //construct
        node.append(function () {
            if (_.isString(label)) {
                return $('<a href="#" class="apptitle" tabindex="1" role="menuitem">').text(/*#, dynamic*/gt.pgettext('app', label));
            } else if (label[0].tagName === 'I') {
                return $('<a>', {
                    href: '#',
                    'class': 'apptitle',
                    tabindex: 1,
                    role: 'button',
                    'aria-label': arialabel ? _.escape(arialabel) : null
                }).append(label);
            } else {
                return label;
            }
        });

        return node.appendTo(side === 'left' ? launchers : topbar);
    };

    function initRefreshAnimation() {

        var count = 0,
            timer = null,
            useSpinner = _.device('webkit || firefox || ie > 9'),
            duration = useSpinner ? 500 : 1500,
            refreshIcon = null;

        function off() {
            if (count === 0 && timer === null) {
                $('#io-ox-refresh-icon .apptitle').attr('aria-label', gt('Refresh'));

                if (useSpinner) {
                    refreshIcon = refreshIcon || $('#io-ox-refresh-icon').find('i');
                    if (refreshIcon.hasClass('fa-spin')) {
                        refreshIcon.addClass('fa-spin-paused').removeClass('fa-spin');
                    }
                } else {
                    $('#io-ox-refresh-icon').removeClass('io-ox-progress');
                }
            }
        }

        http.on('start', function (e, xhr, options) {
            if (count === 0) {
                if (timer === null) {
                    if (!options.silent) {
                        $('#io-ox-refresh-icon .apptitle').attr('aria-label', gt('Currently refreshing'));

                        if (useSpinner) {
                            refreshIcon = refreshIcon || $('#io-ox-refresh-icon').find('i');
                            if (!refreshIcon.hasClass('fa-spin')) {
                                refreshIcon.addClass('fa-spin').removeClass('fa-spin-paused');
                            }
                        } else {
                            $('#io-ox-refresh-icon').addClass('io-ox-progress');
                        }
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

        var next = _.now(),
            // only trigger every 10 seconds
            REFRESH_THROTTLE = 10000;

        ext.point('io.ox/core/refresh').extend({
            action: _.throttle(function () {
                if (ox.online && ox.session !== '') {
                    try {
                        // trigger global event
                        ox.trigger('refresh^');
                    } catch (e) {
                        console.error('io.ox/core/refresh:default', e.message, e);
                    }
                }
            }, REFRESH_THROTTLE),
            reset: function () {
                next = _.now() + parseInt(settings.get('refreshInterval', 300000), 10);
            }
        });

        function check() {
            if (_.now() > next) {
                ext.point('io.ox/core/refresh').invoke('action');
                ext.point('io.ox/core/refresh').invoke('reset');
            }
        }

        refresh = function () {
            ext.point('io.ox/core/refresh').invoke('action');
            ext.point('io.ox/core/refresh').invoke('reset');
        };
        settings.on('change:refreshInterval', function () {
            ext.point('io.ox/core/refresh').invoke('reset');
        });

        ext.point('io.ox/core/refresh').invoke('reset');
        // check every 10 seconds
        setInterval(check, 10000);
    }());

    (function () {

        // check only in this interval to optimize script performance
        var CHECKINTERVAL = 10,
            // threshold for warning dialog in sconds
            WARNINGSTART = 30,
            // init logout interval
            interval = 0,
            // main timeout reference
            timeout = null,
            // checker timeout reference
            checker = null,
            // remember timeout init
            timeoutStart,
            // init warning dialog
            dialog = null,
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
                logout({ autologout: true });
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
                                        'You will be automatically signed out in %1$d second',
                                        'You will be automatically signed out in %1$d seconds', sec
                                    ), gt.noI18n(sec)
                                );
                            },
                            node = $('<span>').text(getString(countdown)),
                            countdownTimer = setInterval(function () {
                                if (countdown <= 0) {
                                    logout({ autologout: true });
                                } else {
                                    countdown--;
                                    node.text(getString(countdown));
                                }
                            }, 1000);

                        clearTimeout(timeout);

                        dialog = new dialogs.ModalDialog({ easyOut: false })
                            .header($('<h4>').text(gt('Automatic sign out')))
                            .append(node)
                            .topmost()
                            .addPrimaryButton('cancel', gt('Cancel'))
                            .addAlternativeButton('force', gt('Sign out now'))
                            .setUnderlayStyle({
                                backgroundColor: 'white',
                                opacity: 0.90
                            })
                            .show()
                            .done(function (action) {
                                resetTimeout();
                                clearInterval(countdownTimer);
                                dialog = null;
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

        var debug = function () {
            CHECKINTERVAL = 1;
            WARNINGSTART = 10;
            getInterval = function () { return 12000; };
            restart();
        };

        ox.autoLogout = {
            start: start,
            stop: stop,
            restart: restart,
            debug: debug
        };

        start();

    }());

    //
    // Connection metrics
    //

    function launch() {

        debug('Launching ...');

        /**
         * Listen to events on apps collection
         */

        function add(node, container, model) {
            var placeholder;
            node.attr({
                'data-app-name': model.get('name') || model.id,
                'data-app-guid': model.guid
            });
            // is launcher?
            if (model instanceof ox.ui.AppPlaceholder) {
                node.addClass('placeholder');
                if (!upsell.has(model.get('requires')) && upsell.enabled(model.get('requires'))) {
                    node.addClass('upsell').children('a').first().prepend(
                        _(settings.get('upsell/defaultIcon', 'fa-star').split(/ /)).map(function (icon) {
                            return $('<i class="fa">').addClass(icon);
                        })
                    );
                }
            } else {
                placeholder = container.children('.placeholder[data-app-name="' + $.escape(model.get('name')) + '"]');
                if (placeholder.length) {
                    node.insertBefore(placeholder);
                    //if the placeholder had a badge, move it to the new node
                    if (placeholder.find('.topbar-launcherbadge').length) {
                        node.find('.apptitle').append(placeholder.find('.topbar-launcherbadge')[0]);
                    }
                }
                placeholder.remove();
            }
        }

        function quit(model) {
            var ariaBasicLabel =
                    //#. %1$s is app title/name
                    _.escape(gt('close for %1$s', model.get('title'))),
                quitApp = $('<a href="#" class="closelink" tabindex="1" role="button" aria-label="' + ariaBasicLabel + '">')
                    .append($('<i class="fa fa-times">'))
                    .on('click', function (e) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        model.getWindow().app.quit();
                    })
                    .on('focus', function () {
                        quitApp.attr('aria-label', ariaBasicLabel);
                    });
            return quitApp;
        }

        function addUserContent(model, launcher, first) {
            if (model.get('closable')) {
                launcher.addClass('closable');
                if (first) {
                    launcher.find('a').after(quit(model));
                }
            }

            if (model.get('userContent')) {
                var cls = model.get('userContentClass') || '',
                    icon = model.get('userContentIcon') || '';
                launcher.addClass('user-content').addClass(cls).children().first().prepend(
                    $('<i class="' + icon + '">')
                );
            }
        }

        function getHelp() {
            var currentApp = ox.ui.App.getCurrentApp(),
                currentType = currentApp && currentApp.getName(),
                manifest = _.defaults(
                    ox.manifests.apps[currentType] || {},
                    ox.manifests.apps[currentType + '/main'] || {},
                    {
                        help: {
                            base: 'help',
                            target: 'index.html'
                        }
                    }
                ).help;

            return currentApp && currentApp.getContextualHelp ? currentApp.getContextualHelp() : manifest.target;
        }

        ox.ui.apps.on('add', function (model) {

            if (model.get('title') === undefined) return;

            // create topbar launcher
            var node = addLauncher('left', model.get('title'), function () { model.launch(); }),
                title = model.get('title'),
                closable = model.get('closable') && !_.device('smartphone'),
                name;

            model.set('topbarNode', node);
            add(node, launchers, model);

            // call extensions to customize
            name = model.get('name') || model.id;
            ext.point('io.ox/core/topbar/launcher').invoke('draw', node, ext.Baton({ model: model, name: name }));

            // is user-content?
            addUserContent(model, node, true);

            // add list item
            node = $('<li>').append(
                $('<a>', {
                    href: '#',
                    'data-app-name': name,
                    'data-app-guid': model.guid,
                    tabindex: 1,
                    'role': 'menuitem'
                })
                .addClass(closable ? 'closable' : '')
                .text(/*#, dynamic*/gt.pgettext('app', title))
            );

            if (closable) {
                //add close button
                node.append(
                    quit(model)
                );
            }

            launcherDropdown.append(
                node.on('click', function (e) {
                    e.preventDefault();
                    model.launch();
                })
            );
            add(node, launcherDropdown, model);
            tabManager();
        });

        ox.ui.apps.on('remove', function (model) {
            launchers.children('[data-app-guid="' + model.guid + '"]').remove();
            launcherDropdown.children('[data-app-guid="' + model.guid + '"]').remove();
            tabManager();
        });

        ox.ui.apps.on('launch resume', function (model) {
            // mark last active app
            if (_.device('smartphone')) {
                if (!settings.get('forceDesktopLaunchers', false)) {
                    launchers.hide();
                }
            }
            launchers.children().removeClass('active-app')
                .filter('[data-app-guid="' + model.guid + '"]').addClass('active-app');
            launcherDropdown.children().removeClass('active-app')
                .filter('[data-app-guid="' + model.guid + '"]').addClass('active-app');
        });

        ox.ui.apps.on('change:title', function (model, value) {
            var node = $('[data-app-guid="' + model.guid + '"]', launchers);
            $('a.apptitle', node).text(_.noI18n(value));
            addUserContent(model, node);
            launcherDropdown.find('a[data-app-guid="' + model.guid + '"]').text(_.noI18n(value));
            tabManager();
        });

        ext.point('io.ox/core/topbar/right').extend({
            id: 'upsell',
            index: 50,
            draw: function () {
                if (_.device('smartphone')) return;

                var view = new UpsellView({
                    tagName: 'li',
                    className: 'launcher',
                    id: 'secondary-launcher',
                    requires: 'active_sync || caldav || carddav',
                    customize: function () {
                        $('i', this.$el).addClass('launcher-icon');
                    }
                });

                if (view.visible) {
                    this.append(view.render().$el);
                }
            }
        });

        ext.point('io.ox/core/topbar/right').extend({
            id: 'notifications',
            index: 100,
            draw: function () {
                var self = this;
                if (ox.online) {
                    // we don't need this right from the start,
                    // so let's delay this for responsiveness!
                    // only requests are delayed by 2s, the badge is drawn normally
                    self.append(notifications.attach(addLauncher, 2000));
                    tabManager();
                } else {
                    //lets wait till we are online
                    ox.once('connection:online', function () {
                        self.append(notifications.attach(addLauncher, 2000));
                        tabManager();
                    });
                }
            }
        });

        ext.point('io.ox/core/topbar/right').extend({
            id: 'search-mobile',
            index: 150,
            draw: function () {
                if (capabilities.has('search') && _.device('smartphone')) {
                    this.append(
                        addLauncher('right', $('<i class="fa fa-search launcher-icon">').attr('aria-hidden', 'true'), function () {
                                require(['io.ox/search/main'], function (searchapp) {
                                    searchapp.run({ reset: true });
                                });
                            },  gt('Search'))
                        .attr('id', 'io-ox-search-topbar-icon')
                    );
                }
            }
        });

        ext.point('io.ox/core/topbar/right').extend({
            id: 'refresh',
            index: 200,
            draw: function () {
                this.append(
                    addLauncher('right', $('<i class="fa fa-refresh launcher-icon">').attr('aria-hidden', 'true'), function () {
                        refresh();
                        return $.when();
                    }, gt('Refresh'))
                    .attr('id', 'io-ox-refresh-icon')
                );
            }
        });

        ext.point('io.ox/core/topbar/right').extend({
            id: 'help',
            index: 300,
            draw: function () {
                if (_.device('smartphone')) return;

                this.append(
                    addLauncher('right', new HelpView({
                        iconClass: 'launcher-icon',
                        tabindex: '-1',
                        href: getHelp
                    }).render().$el)
                );
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'upsell',
            index: 50,
            draw: function () {
                var view = new UpsellView({
                    tagName: 'li',
                    id: 'topbar-dropdown',
                    requires: 'active_sync || caldav || carddav',
                    title: 'Upgrade your account',
                    customize: function () {
                        this.$el.attr({
                            'role': 'presentation'
                        });

                        $('i', this.$el).css({ 'width': 'auto' });
                    }
                });

                if (view.visible) {
                    this.append(
                        view.render().$el,
                        $('<li class="divider" aria-hidden="true" role="presentation">')
                    );
                }
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'settings',
            index: 100,
            draw: function () {
                this.append(
                    $('<li role="presentation">').append(
                        $('<a href="#" data-app-name="io.ox/settings" data-action="settings" role="menuitem" tabindex="-1">').text(gt('Settings'))
                    )
                    .on('click', function (e) {
                        e.preventDefault();
                        ox.launch('io.ox/settings/main');
                    })
                );
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'change-user-data',
            index: 150,
            draw: function () {

                // check if users can edit their own data (see bug 34617)
                if (settings.get('user/internalUserEdit', true) === false) return;

                this.append(
                    $('<li role="presentation">').append(
                        $('<a href="#" data-app-name="io.ox/settings" data-action="my-contact-data" role="menuitem" tabindex="-1">')
                        .text(gt('My contact data'))
                    )
                    .on('click', function (e) {
                        e.preventDefault();
                        require(['io.ox/core/settings/user'], function (userSettings) {
                            userSettings.openModalDialog();
                        });
                    })
                );
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'change-user-password',
            index: 175,
            draw: function () {

                if (!capabilities.has('edit_password && guest')) return;

                this.append(
                    $('<li role="presentation">').append(
                        $('<a href="#" data-app-name="io.ox/settings" data-action="password" role="menuitem" tabindex="-1">')
                        .text(gt('Change password'))
                    )
                    .on('click', function (e) {
                        e.preventDefault();
                        require(['plugins/portal/userSettings/register'], function (userSettings) {
                            userSettings.changePassword();
                        });
                    })
                );
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'app-specific-help',
            index: 200,
            draw: function () {
                //replaced by module
                var node = this;
                node.append(
                    $('<li class="divider" aria-hidden="true" role="presentation"></li>'),
                    $('<li role="presentation">', { 'class': 'io-ox-specificHelp' }).append(
                        new HelpView({
                            tabindex: '-1',
                            content: gt('Help'),
                            href: getHelp
                        }).render().$el
                    )
                );
            }
        });

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'divider-before-fullscreen',
            index: 290,
            draw: function () {
                this.append(
                    $('<li class="divider" aria-hidden="true" role="presentation">')
                );
            }
        });

        // fullscreen doesn't work for safari (see )
        if (_.device('!safari')) {
            ext.point('io.ox/core/topbar/right/dropdown').extend({
                id: 'fullscreen',
                index: 300,
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
                            $('<li role="presentation">').append(
                                fullscreenButton = $('<a href="#" data-action="fullscreen" role="menuitem" tabindex="-1">').text(gt('Fullscreen'))
                            )
                            .on('click', function (e) {
                                e.preventDefault();
                                BigScreen.toggle();
                            })
                        );
                    }
                }
            });
        }

        ext.point('io.ox/core/topbar/right/dropdown').extend({
            id: 'about',
            index: 400,
            draw: function () {
                this.append(
                    $('<li role="presentation">').append(
                        $('<a href="#" data-action="about" role="menuitem" tabindex="-1">').text(gt('About'))
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

        var dedicatedLogoutButton = settings.get('features/dedicatedLogoutButton', false) === true && _.device('!smartphone');
        if (!dedicatedLogoutButton) {
            ext.point('io.ox/core/topbar/right/dropdown').extend({
                id: 'logout',
                index: 1000,
                draw: function () {
                    this.append(
                        $('<li class="divider" aria-hidden="true" role="presentation"></li>'),
                        $('<li role="presentation">').append(
                            $('<a href="#" data-action="logout" role="menuitem" tabindex="-1">').text(gt('Sign out'))
                        )
                        .on('click', function (e) {
                            e.preventDefault();
                            logout();
                        })
                    );
                }
            });
        }

        ext.point('io.ox/core/topbar/right').extend({
            id: 'dropdown',
            index: 1000,
            draw: function () {
                var ul, a;
                this.append(
                    $('<li id="io-ox-topbar-dropdown-icon" class="launcher dropdown" role="presentation">').append(
                        a = $('<a href="#" role="button" class="dropdown-toggle f6-target" data-toggle="dropdown" tabindex="1">')
                        .append(
                            $('<i class="fa fa-bars launcher-icon" aria-hidden="true">'),
                            $('<span class="sr-only">').text(gt('Settings'))
                        ),
                        ul = $('<ul id="topbar-settings-dropdown" class="dropdown-menu" role="menu">')
                    )
                );
                ext.point('io.ox/core/topbar/right/dropdown').invoke('draw', ul);
                a.dropdown();
            }
        });

        var dedicatedLogoutButton = settings.get('features/dedicatedLogoutButton', false) === true && _.device('!small');
        if (dedicatedLogoutButton) {
            ext.point('io.ox/core/topbar/right').extend({
                id: 'logout-button',
                index: 2000,
                draw: function () {
                    var logoutButton = addLauncher('right', $('<i class="fa fa-power-off launcher-icon">').attr('aria-hidden', 'true'), function () {
                        logout();
                    },  gt('Sign out'));
                    logoutButton.find('a').tooltip({
                        title: gt('Sign out'),
                        placement: function (tip, el) {
                            return ($(window).width() - $(el).offset().left - el.offsetWidth) < 80 ? 'left' : 'auto';
                        }
                    });
                    this.append(logoutButton);
                }
            });
        }

        ext.point('io.ox/core/topbar/right').extend({
            id: 'logo',
            index: 10000,
            draw: function () {
                // add small logo to top bar
                this.append(
                    $('<div id="io-ox-top-logo-small" aria-hidden="true">')
                );
            }
        });

        // launchpad
        ext.point('io.ox/core/topbar/launchpad').extend({
            id: 'default',
            draw: function () {
                if (capabilities.has('launchpad')) {
                    addLauncher('left', $('<i class="fa fa-th">').attr('aria-label', gt('Your Applications')), function () {
                        require(['io.ox/launchpad/main'], function (m) {
                            launchers.children().removeClass('active-app');
                            launcherDropdown.children().removeClass('active-app');
                            launchers.children().first().addClass('active-app');
                            m.show();
                        });
                    })
                    // to match dimensions of side navigation
                    .addClass('left-corner')
                    // make QA happy (launchpad is not a "real" app, so no app-name, but should be accessible, too)
                    .attr('data-app-name', 'launchpad');
                }
            }
        });

        // favorites
        ext.point('io.ox/core/topbar/favorites').extend({
            id: 'default',
            draw: function () {
                var favorites = appAPI.getAllFavorites(),
                    topbarApps = appAPI.getTopbarApps(),
                    topbar = settings.get('topbar/order'),
                    self = this,
                    hash = {};

                // use custom order?
                if (topbar) {
                    // get hash of exisiting favorites
                    _(favorites).each(function (obj) { hash[obj.id] = obj; });
                    _(topbarApps).each(function (obj) {hash[obj.id] = obj; });
                    // get proper order
                    favorites = _(topbar.split(','))
                        .chain()
                        .map(function (id) {
                            return hash[id];
                        })
                        .compact()
                        .value();
                } else {
                    if (topbarApps.length > 0) {
                        _(topbarApps).each(function (obj) {
                            if (_.where(favorites, { id: obj.id }).length === 0) favorites.push(obj);
                        });
                    }
                    // sort by index
                    favorites.sort(function (a, b) {
                        return ext.indexSorter(a, b);
                    });
                }

                _(favorites).each(function (obj) {
                    if (upsell.visible(obj.requires) && _.device(obj.device)) {
                        ox.ui.apps.add(new ox.ui.AppPlaceholder({
                            id: obj.id + '/placeholder',
                            name: obj.id,
                            title: obj.title,
                            requires: obj.requires
                        }));
                    }
                });

                //load and draw badges
                ox.manifests.loadPluginsFor('io.ox/core/notifications').done(function () {
                    ext.point('io.ox/core/notifications/badge').invoke('register', self, {});
                });
            }
        });

        ext.point('io.ox/core/topbar').extend({
            id: 'default',
            draw: function () {

                var rightbar = $('<ul class="launchers-secondary">');

                // right side
                ext.point('io.ox/core/topbar/right').invoke('draw', rightbar);

                topbar.append(rightbar);

                // refresh animation
                initRefreshAnimation();

                ext.point('io.ox/core/topbar/launchpad').invoke('draw');
                ext.point('io.ox/core/topbar/favorites').invoke('draw');

                $(window).resize(tabManager);
                ox.on('recalculate-topbarsize', tabManager);
            }
        });

        ext.point('io.ox/core/banner').extend({
            id: 'default',
            draw: function () {

                var sc = ox.serverConfig;
                if (sc.banner === false || settings.get('banner/visible') === false || _.device('!desktop')) return;

                var banner = $('#io-ox-core').addClass('show-banner');

                // set title
                banner.find('.banner-title').append(
                    sc.bannerCompany !== false ? $('<b>').text((sc.bannerCompany || 'OX') + ' ') : $(),
                    $.txt(sc.bannerProductName || 'App Suite')
                );

                // show current user
                banner.find('.banner-content').append(
                    $('<label>').text(gt('Signed in as:')),
                    $.txt(' '), $.txt(ox.user),
                    $('<a href="#" class="banner-action" data-action="logout" role="button" tabindex="1">')
                        .attr('title', gt('Sign out'))
                        .append('<i class="fa fa-power-off">')
                        .on('click', function (e) {
                            e.preventDefault();
                            logout();
                        })
                );

                // prevent logout action within top-bar drop-down
                ext.point('io.ox/core/topbar/right/dropdown').disable('logout');

                // prevent logo
                ext.point('io.ox/core/topbar/right').disable('logo');
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

        ext.point('io.ox/core/mobile').extend({
            id: 'i18n',
            draw: function () {
                // pass the translated string to the dropdown handler
                // which has no access to gt functions
                $(document).trigger('dropdown:translate', gt('Close'));
            }
        });

        ext.point('io.ox/core/banner').extend({
            id: 'metrics',
            draw: function () {
                require(['io.ox/metrics/main'], function (metrics) {
                    metrics.watch({
                            node: $('#io-ox-banner'),
                            selector: '.banner-title',
                            type: 'click'
                        }, {
                            app: 'core',
                            target: 'banner/title',
                            type: 'click',
                            action: 'noop'
                        });
                    metrics.watch({
                            node: $('#io-ox-banner'),
                            selector: '.banner-logo',
                            type: 'click'
                        }, {
                            app: 'core',
                            target: 'banner/logo',
                            type: 'click',
                            action: 'noop'
                        });
                });
            }
        });

        // add some senseless characters
        // a) to avoid unwanted scrolling
        // b) to recognize deep links
        if (location.hash === '') location.hash = '#!!';

        var autoLaunchArray = function () {
            var autoStart = [];

            if (settings.get('autoStart') === 'none') {
                autoStart = [];
            } else {
                var favoritePaths = _(appAPI.getFavorites()).pluck('path');

                autoStart = _([].concat(settings.get('autoStart'), 'io.ox/mail', favoritePaths))
                    .chain()
                    .filter(function (o) {
                        return !_.isUndefined(o) && !_.isNull(o) && favoritePaths.indexOf(/main$/.test(o) ? o : o + '/main') >= 0;
                    })
                    .first(1)
                    .value();
            }

            return autoStart;
        };

        var getAutoLaunchDetails = function (str) {
            var pair = (str || '').split(/:/), app = pair[0], method = pair[1] || '';
            return { app: (/\/main$/).test(app) ? app : app + '/main', method: method };
        };

        var mobileAutoLaunchArray = function () {
            var autoStart = _([].concat(settings.get('autoStartMobile', 'io.ox/mail'))).filter(function (o) {
                return !_.isUndefined(o) && !_.isNull(o);
            });
            // add mail as fallback
            if (autoStart[0] !== 'io.ox/mail') autoStart.push('io.ox/mail');
            return autoStart;
        };

        // checks url which app to launch, needed to handle direct links
        function appCheck(baton) {

            var hash = _.url.hash(), looksLikeDeepLink = !('!!' in hash);

            // fix old infostore
            if (hash.m === 'infostore') hash.m = 'files';

            // no id values with id collections 'folder.id,folder.id'
            // no virtual folder
            if (looksLikeDeepLink && hash.app && hash.folder && hash.id && hash.folder.indexOf('virtual/') !== 0 && hash.id.indexOf(',') < 0) {

                // new-school: app + folder + id
                var id = hash.id.indexOf('.') > -1 ? _.cid(hash.id).id : hash.id;

                _.url.hash({
                    // special treatment for files (viewer + drive app)
                    app: hash.app === 'io.ox/files' ? 'io.ox/files' : hash.app + '/detail',
                    folder: hash.folder,
                    id: id
                });

                baton.isDeepLink = true;

            } else if (hash.m && hash.f && hash.i) {

                // old-school: module + folder + id
                _.url.hash({
                    // special treatment for files (viewer + drive app)
                    app: hash.m === 'io.ox/files' ? 'io.ox/files' : hash.m + '/detail',
                    folder: hash.f,
                    id: hash.i
                });

                baton.isDeepLink = true;

            } else if (hash.m && hash.f) {

                // just folder
                _.url.hash({
                    app: 'io.ox/' + hash.m,
                    folder: hash.f
                });

                baton.isDeepLink = true;
            }

            // clean up
            _.url.hash({ m: null, f: null, i: null, '!!': undefined, '!': null });

            // always use portal on small devices!
            if (_.device('small')) mobileAutoLaunchArray();

            var appURL = _.url.hash('app'),
                manifest = appURL && ox.manifests.apps[getAutoLaunchDetails(appURL).app],
                mailto = _.url.hash('mailto') !== undefined && (appURL === ox.registry.get('mail-compose').split('/').slice(0, -1).join('/') + ':compose');

            baton.autoLaunch = (manifest && (manifest.refreshable || mailto)) ?
                appURL.split(/,/) :
                autoLaunchArray();
        }

        var baton = ext.Baton({ block: $.Deferred() });

        appCheck(baton);

        baton.autoLaunchApps = _(baton.autoLaunch)
        .chain()
        .map(function (m) {
            return getAutoLaunchDetails(m).app;
        })
        .filter(function (m) {
            //don’t autoload without manifest
            //don’t autoload disabled apps
            return ox.manifests.apps[m] !== undefined && !ox.manifests.isDisabled(m);
        })
        .compact()
        .value();

        var drawDesktop = function () {
            ext.point('io.ox/core/desktop').invoke('draw', $('#io-ox-desktop'), {});
            drawDesktop = $.noop;
        };

        ox.ui.windowManager.on('empty', function (e, isEmpty, win) {
            if (isEmpty) {
                drawDesktop();
                ox.ui.screens.show('desktop');
                var autoStart = getAutoLaunchDetails(win || settings.get('autoStart', 'io.ox/mail/main')).app;
                if (autoStart !== 'none/main') ox.launch(autoStart);
            } else {
                ox.ui.screens.show('windowmanager');
            }
        });

        function fail(type) {
            return function (e) {
                var message = (e && e.message) || '';
                console.error('core: Failed to load:', type, message, e, baton);
            };
        }

        requirejs.onError = function (e) {
            console.error('requirejs', e.message, arguments);
        };

        // start loading stuff
        baton.loaded = $.when(
            baton.block,
            ext.loadPlugins().fail(fail('loadPlugins')),
            require(baton.autoLaunchApps).fail(fail('autoLaunchApps')),
            require(['io.ox/core/api/account']).then(
                function (api) {
                    var def = $.Deferred();
                    api.all().always(def.resolve);
                    return def;
                },
                fail('account')
            )
        );

        new Stage('io.ox/core/stages', {
            id: 'first',
            index: 100,
            run: function () {
                debug('Stage "first"');
            }
        });

        // new Stage('io.ox/core/stages', {
        //     id: 'update-tasks',
        //     index: 200,
        //     run: function () {

        //         debug('Stage "update-tasks"');

        //         require(['io.ox/core/updates/updater']).then(
        //             function success(updater) {
        //                 // this is not mission-critical so continue if anything fails
        //                 return updater.runUpdates().always(function () {
        //                     return $.when();
        //                 });
        //             },
        //             function fail() {
        //                 return $.when();
        //             }
        //         );
        //     }
        // });

        new Stage('io.ox/core/stages', {
            id: 'secretCheck',
            index: 250,
            run: function () {
                if (ox.online && ox.rampup && ox.rampup.oauth) {
                    var analysis = ox.rampup.oauth.secretCheck;
                    if (analysis && !analysis.secretWorks) {
                        // Show dialog
                        require(['io.ox/keychain/secretRecoveryDialog'], function (d) { d.show(); });
                        if (ox.debug) {
                            console.error('Couldn\'t decrypt accounts: ', analysis.diagnosis);
                        }
                    }
                }
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'restore-check',
            index: 300,
            run: function (baton) {

                debug('Stage "restore-check"');

                return ox.ui.App.canRestore().done(function (canRestore) {
                    baton.canRestore = canRestore;
                });
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'restore-confirm',
            index: 400,
            run: function (baton) {

                debug('Stage "restore-confirm"');

                if (baton.canRestore) {

                    baton.restoreHash = _.url.hash();

                    var dialog,
                        def = $.Deferred().done(function () {
                            $('#background-loader').busy().fadeIn();
                            topbar.show();
                            dialog.remove();
                            dialog = null;
                        }),
                        btn1, btn2;

                    $('#io-ox-core').append(
                        dialog = $('<div class="io-ox-restore-dialog" tabindex="0">').append(
                            $('<div class="header">').append(
                                $('<h3>').text(gt('Restore applications')),
                                $('<div>').text(
                                    gt('The following applications can be restored. Just remove the restore point if you don\'t want it to be restored.')
                                )
                            ),
                            $('<ul class="list-unstyled content">'),
                            $('<div class="footer">').append(
                                btn1 = $('<button type="button" class="cancel btn btn-default">').text(gt('Cancel')),
                                btn2 = $('<button type="button" class="continue btn btn-primary">').text(gt('Continue'))
                            )
                        )
                    );

                    if (_.device('smartphone')) {
                        btn1.addClass('btn-block btn-lg');
                        btn2.addClass('btn-block btn-lg');
                    }

                    // draw savepoints to allow the user removing them
                    ox.ui.App.getSavePoints().done(function (list) {
                        _(list).each(function (item) {
                            var info = item.description || item.module,
                                versionInfo = $();
                            if (item.version !== ox.version) {
                                var version = item.version || '';
                                version = version.split('.').slice(0, -2).join('.');
                                if (version) {
                                    versionInfo = $('<span>').addClass('oldversion').text(gt.noI18n('(' + version + ')'));
                                }
                            }
                            this.append(
                                $('<li class="restore-item">').append(
                                    $('<a href="#" role="button" class="remove">').data(item).append(
                                        $('<i class="fa fa-trash-o">')
                                    ),
                                    item.icon ? $('<i class="' + item.icon + '">') : $(),
                                    $('<span>').text(gt.noI18n(info)),
                                    versionInfo
                                )
                            );
                        }, dialog.find('.content'));
                    });

                    dialog.on('click', '.footer .btn.continue', def.resolve);
                    dialog.on('click', '.footer .btn.cancel', function (e) {
                        e.preventDefault();
                        ox.ui.App.removeAllRestorePoints().done(function () {
                            _.url.hash(baton.restoreHash);
                            baton.canRestore = false;
                            def.resolve();
                        });
                    });
                    dialog.on('click', '.content .remove', function (e) {
                        e.preventDefault();
                        var node = $(this),
                            id = node.data('id');
                        // remove visually first
                        node.closest('li').remove();
                        // remove restore point
                        ox.ui.App.removeRestorePoint(id).done(function (list) {
                            // continue if list is empty
                            if (list.length === 0) {
                                _.url.hash(baton.restoreHash);
                                baton.canRestore = false;
                                def.resolve();
                            }
                        });
                    });

                    topbar.hide();
                    $('#background-loader').idle().fadeOut(function () {
                        dialog.find('.btn-primary').focus();
                    });

                    return def;
                }
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'restore',
            index: 500,
            run: function (baton) {

                debug('Stage "restore"');

                if (baton.canRestore && !baton.isDeepLink) {
                    // clear auto start stuff (just conflicts)
                    baton.autoLaunch = [];
                    baton.autoLaunchApps = [];
                }

                if (baton.autoLaunch.length === 0 && !baton.canRestore) {
                    drawDesktop();
                    return baton.block.resolve(true);
                }

                return baton.block.resolve(baton.autoLaunch.length > 0 || baton.canRestore || location.hash === '#!');
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'load',
            index: 600,
            run: function (baton) {

                debug('Stage "load"', baton);

                return baton.loaded.done(function (instantFadeOut) {

                    debug('Stage "load" > loaded.done');

                    // draw top bar now
                    ext.point('io.ox/core/banner').invoke('draw');
                    ext.point('io.ox/core/topbar').invoke('draw');
                    ext.point('io.ox/core/mobile').invoke('draw');

                    // help here
                    if (!ext.point('io.ox/core/topbar').isEnabled('default')) {
                        $('#io-ox-screens').css('top', '0px');
                        topbar.hide();
                    }
                    //draw plugins
                    ext.point('io.ox/core/plugins').invoke('draw');

                    debug('Stage "load" > autoLaunch ...');

                    // auto launch
                    _(baton.autoLaunch)
                    .chain()
                    .map(function (id) {
                        return getAutoLaunchDetails(id);
                    })
                    .filter(function (details) {
                        //don’t autoload without manifest
                        //don’t autoload disabled apps
                        return ox.manifests.apps[details.app] !== undefined && !ox.manifests.isDisabled(details.app);
                    })
                    .each(function (details, index) {
                        //only load first app on small devices
                        if (_.device('smartphone') && index > 0) return;
                        // split app/call
                        var hash = _.url.hash(), launch, method, options = _(hash).pick('folder', 'id');
                        debug('Auto launch:', details.app, options);
                        launch = ox.launch(details.app, options);
                        method = details.method;
                        // TODO: all pretty hard-wired here; looks for better solution
                        // special case: open viewer too?
                        if (hash.app === 'io.ox/files' && hash.id !== undefined) {
                            require(['io.ox/core/viewer/main', 'io.ox/files/api'], function (Viewer, api) {
                                api.get(hash).done(function (data) {
                                    new Viewer().launch({ files: [data] });
                                });
                            });
                        }
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
                })
                .fail(function () {
                    console.warn('core: Stage "load" > loaded.fail!', baton);
                });
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'curtain',
            index: 700,
            run: function (baton) {

                debug('Stage "curtain"');

                if (baton.instantFadeOut) {
                    // instant fade out
                    $('#background-loader').idle().hide();
                    return $.when();
                } else {
                    var def = $.Deferred();
                    $('#background-loader').idle().fadeOut(DURATION, def.resolve);
                    return def;
                }
            }
        });

        new Stage('io.ox/core/stages', {
            id: 'ready',
            index: 1000000000000,
            run: function () {
                debug('DONE!');
                ox.trigger('core:ready');
                baton = null;
            }
        });

        debug('core: launch > run stages');
        Stage.run('io.ox/core/stages', baton);
    }

    (function () {

        var hash = {
            'mail-compose': 'io.ox/mail/compose/main'
        };

        var custom = {};

        ox.registry = {
            set: function (id, path) {
                custom[id] = path;
            },
            get: function (id) {
                return custom[id] || settings.get('registry/' + id) || hash[id];
            },
            call: function (id, name) {
                var dep = this.get(id),
                    args = _(arguments).toArray().slice(2);
                return ox.load([dep]).then(function (m) {
                    if (m.reuse(name, args[0])) return;
                    return m.getApp().launch().then(function () {
                        return this[name].apply(this, args);
                    });
                });
            }
        };

    }());

    //
    // Visual response to hidden folders
    //
    folderAPI.on('warn:hidden', function (folder) {
        if (folder) {
            notifications.yell('info',
               //#. %1$s is the filename
               gt('Folder with name "%1$s" will be hidden. Enable setting "Show hidden files and folders" to access this folder again.', folder.title)
            );
        }
    });

    //
    // Respond to special http error codes (see bug 32836)
    //

    ox.on('http:error', function (error) {
        switch (error.code) {
            // IMAP-specific: 'Relogin required'
            case 'MSG-1000':
            case 'MSG-1001':
            // INUSE (see bug 37218)
            case 'MSG-1031':
                notifications.yell(error);
                break;
            case 'LGI-0016':
                // redirect based on error message; who had the brilliant idea to name the message of the error object 'error'?
                location.href = error.error;
                break;
        }
    });

    return {
        logout: logout,
        launch: launch,
        addLauncher: addLauncher
    };
});
