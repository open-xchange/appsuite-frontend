/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/main/appcontrol', [
    'io.ox/core/http',
    'io.ox/core/upsell',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/core/main/icons',
    'io.ox/backbone/mini-views/dropdown',
    'settings!io.ox/core',
    'gettext!io.ox/core',
    'io.ox/core/main/autologout'
], function (http, upsell, ext, capabilities, icons, Dropdown, settings, gt) {

    function toggleOverlay(force) {
        $('#io-ox-appcontrol').toggleClass('open', force);
        $('#io-ox-launchgrid-overlay, #io-ox-launchgrid-overlay-inner').toggle(force);
    }

    var extensions = {
        launcher: function () {
            var launchers = window.launchers = new LaunchersView({
                collection: ox.ui.apps,
                dontProcessOnMobile: true
            });
            this.append(launchers.render().$el);
        }
    };

    var LauncherView = Backbone.View.extend({
        tagName: 'a',
        className: 'btn btn-link lcell',
        attributes: {
            href: '#',
            role: 'menuitem',
            tabindex: -1
        },
        events: {
            'click': 'onClick',
            'click .closer': 'quitApp'
        },
        initialize: function (options) {
            this.pos = options.pos;
            this.quicklaunch = options.quicklaunch;
            this.listenTo(this.model, 'change:hasBadge', this.toggleBadge);
            this.listenTo(this.model, 'change:tooltip', this.updateTooltip);
            this.listenTo(this.model, 'change:title', this.updateTitle);
            this.listenTo(settings, 'change:coloredIcons', this.render);
        },
        addAccessKey: function () {
            if (this.pos <= 9 && this.pos !== 0) this.$el.attr('accesskey', this.pos);
        },
        checkUpsell: function () {
            var requires = this.model.get('requires');
            return !upsell.has(requires);
        },
        drawUpsellIcon: function (elem) {
            if (this.checkUpsell()) {
                elem.addClass('upsell').append(
                    _(settings.get('upsell/defaultIcon', 'fa-star').split(/ /)).map(function (icon) {
                        return $('<i class="fa" aria-hidden="true">').addClass(icon);
                    })
                );
            }
        },
        onClick: function () {
            if (!this.checkUpsell()) {
                // used on mobile
                if (this.model.get('state') === 'running' && this.model.get('closable')) {
                    this.model.launch();
                    return;
                }
                if (ox.tabHandlingEnabled && this.model.get('openInTab')) {
                    // we must stay synchronous to prevent popup-blocker
                    // we can be sure that 'io.ox/core/api/tab' is cached when 'ox.tabHandlingEnabled' is true
                    var tabAPI = require('io.ox/core/api/tab');
                    tabAPI.openChildTab(this.model.get('tabUrl'));
                    return;
                }

                // if there is a custom quicklaunch function for this app, use it. Else just use the default launch function
                if (this.quicklaunch && this.model.quickLaunch) this.model.quickLaunch();
                else ox.launch(this.model.get('path'));
            } else {
                var requires = this.model.get('requires');
                upsell.trigger({ type: 'app', id: this.model.get('id'), missing: upsell.missing(requires) });
            }
        },
        quitApp: function (e) {
            // used on mobile
            e.preventDefault();
            e.stopPropagation();
            this.model.quit();
        },
        drawCloser: function () {
            var close = $('<a href="#" type="button" class="btn btn-link closer">').append(
                $('<i class="fa fa-times" aria-hidden="true">'));
            this.$el.append(close);
            this.closer = close;
        },
        drawDate: function () {
            this.$icon.find('tspan:first').text(moment().format('D'));
        },
        drawIcon: function () {
            var icon = this.model.get('icon'),
                id = this.model.get('id'),
                title = this.model.get('title'),
                firstLetter = _.isString(title) ? title[0] : '?';

            // expect icon to look like HTML
            icon = /^<.*>$/.test(icon) ? icon : '';
            // check for compose apps
            if (this.model.get('closable') && _.device('smartphone')) {
                icon = ox.ui.appIcons[this.model.options.name];
                // some apps have icons for the taskbar, better than using the fallback
                if (!icon && this.model.options.userContentIcon) {
                    icon = '<i class="' + this.model.options.userContentIcon + '">';
                }
            }

            this.$icon = icon ? $(icon) : $(icons.fallback).find('text > tspan').text(firstLetter).end();

            this.$icon.attr('aria-hidden', true);

            // reverted for 7.10
            if (settings.get('coloredIcons', false)) this.$icon.addClass('colored');

            if (id === 'io.ox/calendar' || /calendar/.test(this.model.getName())) this.drawDate();

            this.$cell = $('<div class="lcell">').append(
                // important: do not add circle element via append (https://stackoverflow.com/a/3642265)
                this.badge = $('<svg height="8" width="8" class="indicator" focusable="false"><circle cx="4" cy="4" r="4"></svg>')
                    .toggleClass('hidden', !this.model.get('hasBadge')),
                $('<div class="icon">').append(this.$icon),
                $('<div class="title">').text(this.model.get('title'))
            );
            // checks for upsell and append an icon if needed
            this.drawUpsellIcon(this.$cell.find('.title'));
            return this.$cell;
        },
        toggleBadge: function () {
            this.badge.toggleClass('hidden', !this.model.get('hasBadge'));
        },
        updateTooltip: function () {
            if (!this.quicklaunch) return;
            var tooltip = this.model.get('tooltip'),
                title = this.model.get('title');
            tooltip = title + (tooltip ? ' (' + tooltip + ')' : '');
            this.$el.attr('aria-label', tooltip);
            this.$cell.attr({ 'aria-hidden': true, 'title': tooltip });
        },
        updateTitle: function (model, newTitle) {
            var $title = this.icon.find('.title');
            $title.text(newTitle);
            this.drawUpsellIcon($title);
        },
        render: function () {
            this.$el.empty().attr({
                'data-id': this.model.get('id'),
                'data-app-name': this.model.get('name')
            }).toggleClass('active', ox.ui.App.isCurrent(this)).append(this.icon = this.drawIcon());
            this.updateTooltip();
            this.addAccessKey();
            // used on mobile, reverted for 7.10
            // if (this.model.get('closable') && _.device('smartphone')) this.drawCloser();
            return this;
        }
    });

    var api = {
        quickLaunchLimit: 5,
        getQuickLauncherCount: function () {
            var n = settings.get('apps/quickLaunchCount', 3);
            if (!_.isNumber(n)) return 0;
            return Math.min(this.quickLaunchLimit, ox.ui.apps.forLauncher().length, n);
        },
        getQuickLauncherDefaults: function () {
            return 'io.ox/mail/main,io.ox/calendar/main,io.ox/files/main';

        },
        getQuickLauncherItems: function () {
            var count = this.getQuickLauncherCount(),
                list = String(settings.get('apps/quickLaunch', this.getQuickLauncherDefaults())).trim().split(/,\s*/),
                str = _.chain(list).filter(function (o) {
                    return ox.ui.apps.get(o.replace(/\/main$/, ''));
                }).value().join(',');
            // We fill up the list with 'none' in case we have more slots than defaults
            return ((str || 'none') + new Array(count).join(',none')).split(',').slice(0, count);
        }
    };

    // reverted for 7.10
    var QuickLaunchersCollection = Backbone.Collection.extend({
        initialize: function () {
            this.reload();
            settings.on('change:apps/quickLaunch change:apps/quickLaunchCount', this.reload.bind(this));
            this.listenTo(ox.ui.apps, 'add reset', this.reload);
        },
        reload: function () {
            this.reset(this.fetch());
        },
        fetch: function () {
            var apps = api.getQuickLauncherItems().map(function (o) {
                return ox.ui.apps.get(o.replace(/\/main$/, ''));
            });
            return _(apps).compact();
        }
    });

    // reverted for 7.10
    var QuickLaunchersView = Backbone.View.extend({
        attributes: {
            'id': 'io-ox-quicklaunch',
            'role': 'toolbar'
        },
        events: {
            'click button': 'onClick',
            'contextmenu': 'onContextmenu'
        },
        initialize: function () {
            this.collection = new QuickLaunchersCollection();
            this.listenTo(this.collection, { 'reset': this.render });
        },
        onClick: function () {
            toggleOverlay(false);
        },
        onContextmenu: function (e) {
            e.preventDefault();
            if (settings.isConfigurable('apps/quickLaunch') && api.getQuickLauncherCount() !== 0 && !_.device('smartphone')) {
                require(['io.ox/core/settings/dialogs/quickLauncherDialog'], function (quickLauncherDialog) {
                    quickLauncherDialog.openDialog();
                });
            }
        },
        render: function () {
            this.$el.empty().append(
                this.collection.map(function (model) {
                    return new LauncherView({
                        tagName: 'button',
                        attributes: { tabindex: -1, type: 'button' },
                        model: model,
                        quicklaunch: true
                    }).render().$el.attr('tabindex', -1);
                })
            );
            this.$el.find('button').first().removeAttr('tabindex');
            return this;
        }
    });

    // hint: shared node references so multiple view instances won't work
    var LaunchersView = Dropdown.extend({
        attributes: { role: 'presentation', dontprocessonmobile: 'true' },
        tagName: 'li',
        options: { dontProcessOnMobile: true },
        className: 'launcher dropdown',
        id: 'io-ox-launcher',
        $ul: $('<ul class="launcher-dropdown dropdown-menu dropdown-menu-right" role="menu">'),
        // this should be a link. Otherwise, this can cause strange focus issues on iOS when having the cursor inside an iframe before clicking this (see Bug 63441)
        $toggle: $('<a href="#" class="launcher-btn btn btn-link dropdown-toggle" tabindex="0" dontprocessonmobile="true">').attr('aria-label', gt('Navigate to:')).append($(icons.launcher).attr('title', gt('All Applications'))),
        initialize: function () {
            Dropdown.prototype.initialize.apply(this, arguments);
            this.listenTo(this.collection, 'add remove launcher:update launcher:sort', this.update);
            this.update();
        },
        update: function () {
            this.$ul.empty();
            this.collection.forLauncher().forEach(function (model, i) {
                this.append(
                    new LauncherView({ model: model, pos: i + 1 }).render().$el
                );
            }.bind(this));
            if (_.device('smartphone')) {
                this.collection.where({ closable: true }).forEach(function (model) {
                    this.append(
                        new LauncherView({ model: model }).render().$el
                    );
                }.bind(this));
            }
        }
    });

    ox.once('core:load', function () {
        ox.manifests.loadPluginsFor('io.ox/core/notifications').done(function () {
            ext.point('io.ox/core/notifications/badge').invoke('register', self, {});
        });
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'init',
        index: 100,
        draw: function () {
            var overlay;
            $('#io-ox-core').append(
                overlay = $('<div id="io-ox-launchgrid-overlay">').on('click', toggleOverlay)
            );
            if (_.device('smartphone')) {
                overlay.on('touchstart', function (e) {
                    e.preventDefault();
                    toggleOverlay();
                });
            }
            initRefreshAnimation();

            ox.ui.apps.on('launch resume', function (model) {
                if (model.get('floating')) return;

                $('.launcher-dropdown').find('.lcell[data-app-name]')
                    .removeClass('active').end()
                    .find('.lcell[data-app-name="' + model.get('name') + '"]').addClass('active');

                $('#io-ox-quicklaunch').find('.lcell[data-id]')
                    .removeClass('active').end()
                    .find('.lcell[data-id="' + model.get('name') + '"]').addClass('active');

                _.defer(function () {
                    $(document).trigger('resize');
                });
            });
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'skiplinks',
        index: 150,
        draw: function () {
            this.append(
                $('<a class="skip-links sr-only sr-only-focusable" href="#">').append(
                    $('<span>').text(gt('Skip to main content'))
                )
            );
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'logo',
        index: 300,
        draw: function () {
            var logo,
                logoFileName = settings.get('logoFileName', 'logo.png'),
                action = settings.get('logoAction', false),
                updateLogo = function () {
                    // prevent multiple button wrappings of the logo, also removes the button when there is no action anymore
                    if (logo.parent().hasClass('logo-btn')) {
                        logo.parent().replaceWith(logo);
                    }
                    if ((/^https?:/).test(action)) {
                        logo.wrap(
                            $('<a class="btn btn-link logo-btn">').attr({
                                href: action,
                                target: '_blank'
                            })
                        );
                    } else if (ox.tabHandlingEnabled && (/^io\.ox\/office\/portal/).test(action)) {
                        var tabAPI = require('io.ox/core/api/tab'),
                            appType = action.substring(0, 'io.ox/office/portal/'.length),
                            tabUrl =  tabAPI.createUrl({ app: action }, { exclude: 'folder', suffix: 'office?app=' + appType });
                        logo.wrap(
                            $('<a class="btn btn-link logo-btn">').attr({
                                href: tabUrl,
                                target: '_blank'
                            })
                        );
                    } else if (action) {
                        var autoStart = settings.get('autoStart');
                        if (action === 'autoStart') {
                            if (autoStart === 'none') return;
                        }
                        logo.wrap(
                            $('<button type="button" class="logo-btn btn btn-link">').on('click', function () {
                                // works like a generic capability/requirement check, if this returns true then the app can be launched (similar to how quicklaunchers handle this)
                                if (!ox.ui.apps.get(autoStart.replace(/\/main$/, ''))) return;
                                ox.launch(autoStart);
                            })
                        );
                    }
                };

            this.append(
                logo = $('<div id="io-ox-top-logo">').append(
                    $('<img>').attr({
                        alt: ox.serverConfig.productName,
                        src: ox.base + '/apps/themes/' + ox.theme + '/' + logoFileName
                    })
                )
            );

            if (ox.openedInBrowserTab || (ox.tabHandlingEnabled && _.url.hash('app') === 'io.ox/files/detail')) return;

            updateLogo();

            settings.on('change:logoAction change:autoStart', updateLogo);
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'left',
        index: 350,
        draw: function () {
            if (_.device('smartphone')) return;
            var taskbar = $('<ul class="taskbar list-unstyled" role="toolbar">');
            this.append($('<div id="io-ox-topleftbar">').append(taskbar));
            ext.point('io.ox/core/appcontrol/left').invoke('draw', taskbar);
        }
    });

    // reverted for 7.10
    ext.point('io.ox/core/appcontrol').extend({
        id: 'quicklauncher',
        index: 400,
        draw: function () {
            if (_.device('smartphone')) return;
            var quicklaunchers = window.quicklaunchers = new QuickLaunchersView();
            this.append(quicklaunchers.render().$el);
        }
    });

    ext.point('io.ox/core/appcontrol/right').extend({
        id: 'launcher',
        index: 120,
        draw: function () {
            if (!_.device('smartphone')) return;
            extensions.launcher.call(this);
        }
    });

    // deactivated since 7.10.0
    ext.point('io.ox/core/appcontrol').extend({
        id: 'search',
        index: 500,
        draw: function () {
            var search = $('<div id="io-ox-topsearch">');
            this.append(search);
            //ext.point('io.ox/core/appcontrol/search').invoke('draw', search);
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'right',
        index: 600,
        draw: function () {
            var taskbar = $('<ul class="taskbar list-unstyled" role="toolbar">');
            this.append($('<div id="io-ox-toprightbar">').append(taskbar));
            ext.point('io.ox/core/appcontrol/right').invoke('draw', taskbar);
            _.defer(function () { taskbar.find('.dropdown-toggle:visible:first').removeAttr('tabindex'); });
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'show',
        index: 10000,
        draw: function () {
            this.attr('role', 'banner').show();
        }
    });

    ext.point('io.ox/core/appcontrol/left').extend({
        id: 'launcher',
        index: 100,
        draw: function () {
            if (_.device('smartphone')) return;
            extensions.launcher.call(this);
        }
    });

    // ext.point('io.ox/core/appcontrol/search').extend({
    //     id: 'default',
    //     index: 100,
    //     draw: function () {
    //         // on mobile via ext 'io.ox/core/appcontrol/right'
    //         if (!capabilities.has('search') || _.device('smartphone')) return;

    //         // append hidden node to container node
    //         ox.ui.apps.on('launch', function append(app) {
    //             if (!app.isFindSupported()) return;

    //             var label = gt('Search'),
    //                 id = _.uniqueId('search-field'),
    //                 guid = _.uniqueId('form-control-description-');

    //             this.append(
    //                 $('<div class="io-ox-find initial" role="search" style="display:none">').attr('data-app', app.id).append(
    //                     $('<div class="sr-only arialive" role="status" aria-live="polite">'),
    //                     // box
    //                     $('<form class="search-box">').append(
    //                         // group
    //                         $('<div class="form-group">').append(
    //                             $('<input type="text" class="form-control search-field tokenfield-placeholder f6-target">').attr({
    //                                 'id': id,
    //                                 'placeholder': label + '...',
    //                                 'aria-describedby': guid
    //                             }),
    //                             // search
    //                             $('<button type="button" class="dropdown-toggle btn btn-link form-control-feedback action action-options" data-toggle="tooltip" data-placement="bottom" data-animation="false" data-container="body">')
    //                                 .attr({
    //                                     'data-original-title': gt('Options'),
    //                                     'aria-label': gt('Options')
    //                                 }).append($('<i class="fa fa-caret-down" aria-hidden="true">'))
    //                                 .tooltip(),
    //                             $('<form class="dropdown" autocomplete="off">'),
    //                             // cancel/reset
    //                             $('<button type="button" class="btn btn-link form-control-feedback action action-cancel" data-toggle="tooltip" data-placement="bottom" data-animation="false" data-container="body">')
    //                                 .attr({
    //                                     'data-original-title': gt('Cancel search'),
    //                                     'aria-label': gt('Cancel search')
    //                                 }).append($('<i class="fa fa-times" aria-hidden="true">'))
    //                                 .tooltip(),
    //                             // sr label
    //                             $('<label class="sr-only">')
    //                                 .attr('for', id)
    //                                 .text(label),
    //                             // sr description
    //                             $('<p class="sr-only sr-description">').attr({ id: guid })
    //                                 //#. search feature help text for screenreaders
    //                                 .text(gt('Search results page lists all active facets to allow them to be easly adjustable/removable. Below theses common facets additonal advanced facets are listed. To narrow down search result please adjust active facets or add new ones'))
    //                         )
    //                     )
    //                 )
    //             );
    //             app.initFind();
    //         }.bind(this));
    //     }
    // });

    // ext.point('io.ox/core/appcontrol/search').extend({
    //     id: 'resize',
    //     index: 10000,
    //     draw: function () {
    //         // on mobile via ext 'io.ox/core/appcontrol/right'
    //         if (!capabilities.has('search') || _.device('smartphone')) return;
    //         var container = this,
    //             MINWIDTH = 350,
    //             MAXWIDTH = _.device('desktop') ? 750 : 550;

    //         // hide inactive
    //         function hidePaused() {
    //             var app = ox.ui.App.getCurrentApp();
    //             if (!app || !app.id) return;
    //             container.children().not('[data-app="' + app.id + '"]').css('display', 'none');
    //         }

    //         function setVisibility() {
    //             var app = ox.ui.App.getCurrentApp();
    //             if (!app || !app.id) return;
    //             // show field for current app
    //             hidePaused();
    //             container.find('[data-app="' + app.id + '"]').css('display', 'block');
    //         }

    //         var delay = 0;
    //         ox.ui.windowManager.on('window.open', function () { delay = 100; });
    //         ox.ui.windowManager.on('window.show', function () {
    //             hidePaused();
    //             if (!delay) return setVisibility();
    //             // delay on first start
    //             _.delay(function () {
    //                 delay = 0;
    //                 setVisibility();
    //             }, delay);
    //         });

    //         // search is active (at least one token)
    //         ox.ui.apps.on('change:search', function (name, app) {
    //             if (!/^(running|paused)$/.test(name)) return;
    //             var node = app.view.$el,
    //                 isReset = name === 'paused';

    //             node.toggleClass('has-tokens', !isReset)
    //                 .css({
    //                     // limit height to prevent jumping
    //                     'height': isReset ? 'initial' : '32px',
    //                     // expand field or restore min-width value
    //                     'max-width': isReset ? MINWIDTH + 'px' : MAXWIDTH + 'px'
    //                 });

    //         });
    //     }
    // });

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
                        refreshIcon.addClass('fa-spin-paused');
                        var done = false;
                        setTimeout(function () { done = true; }, 2546);
                        refreshIcon.on('animationiteration', function (event) {
                            if (done) $(event.target).removeClass('fa-spin');
                        });
                    }
                } else {
                    $('#io-ox-refresh-icon').removeClass('io-ox-progress');
                }
            }
        }

        http.on('start', function (e, xhr, options) {
            if (count === 0) {
                if (timer === null && !options.silent) {
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

    return _.extend(api, {
        LauncherView: LauncherView,
        LaunchersView: LaunchersView
    });
});
