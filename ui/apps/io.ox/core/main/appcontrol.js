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
    'io.ox/backbone/views/window',
    'io.ox/core/api/apps',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'io.ox/core/main/icons',
    'settings!io.ox/core',
    'gettext!io.ox/core',
    'io.ox/core/main/autologout'
], function (http, upsell, windowview, appAPI, ext, capabilities, icons, settings, gt) {

    function toggleOverlay(force) {
        $('#io-ox-appcontrol').toggleClass('open', force);
        $('#io-ox-launchgrid-overlay, #io-ox-launchgrid-overlay-inner').toggle(force);
    }

    var LauncherView = Backbone.View.extend({
        tagName: 'button',
        className: 'btn btn-link lcell',
        attributes: {
            type: 'button'
        },
        events: {
            'click': 'onClick'
        },
        initialize: function (options) {
            this.quicklaunch = options.quicklaunch;
            this.listenTo(this.model, 'change:hasBadge', this.toggleBadge);
            this.listenTo(this.model, 'change:tooltip', this.updateTooltip);
            this.listenTo(settings, 'change:coloredIcons', this.render);
        },
        onClick: function () {
            ox.launch(this.model.get('path') || this.model.get('name') + '/main');
        },
        drawDate: function () {
            this.$svg.find('tspan:first').text(moment().format('D'));
        },
        drawIcon: function () {
            var svg = this.model.get('svg'),
                id = this.model.get('id'),
                title = this.model.get('title'),
                firstLetter = _.isString(title) ? title[0] : '?';

            this.$svg = svg ? $(svg) : $(icons.fallback).find('text > tspan').text(firstLetter).end();

            if (settings.get('coloredIcons', false)) this.$svg.addClass('colored');

            if (id === 'io.ox/calendar') this.drawDate();

            var cell = $('<div class="lcell" aria-hidden="true">').append(
                this.badge = $('<div class="indicator">').toggle(this.model.get('hasBadge')),
                $('<div class="svgwrap">').append(this.$svg),
                $('<div class="title">').text(this.model.get('title'))
            );

            return cell;
        },
        toggleBadge: function () {
            this.badge.toggle(this.model.get('hasBadge'));
        },
        updateTooltip: function () {
            var tooltipAttribute = this.quicklaunch ? 'title' : 'aria-label';
            var tooltip = this.model.get('tooltip') ? ' (' + this.model.get('tooltip') + ')' : '';
            this.$el.attr(tooltipAttribute, this.model.get('title') + tooltip);
        },
        render: function () {
            this.$el.empty().attr({
                'data-app-id': this.model.get('name')
            }).append(this.icon = this.drawIcon());
            this.updateTooltip();
            return this;
        }
    });

    var QuickLaunchersCollection = Backbone.Collection.extend({
        initialize: function () {
            var self = this;
            this.reset(this.fetch());
            settings.on('change:quicklaunch', function () { self.reset(self.fetch()); });
        },
        fetch: function () {
            var quicklaunch = settings.get('quicklaunch') ? settings.get('quicklaunch').split(',') : [];
            return _(quicklaunch.map(function (o) {
                return ox.ui.apps.findWhere({ path: o, hasLauncher: true });
            })).compact();
        }
    });

    var QuickLaunchersView = Backbone.View.extend({
        attributes: {
            'id': 'io-ox-quicklaunch'
        },
        events: {
            'click button': 'onClick'
        },
        initialize: function () {
            this.collection = new QuickLaunchersCollection();
            this.listenTo(this.collection, { 'reset': this.render });
        },
        onClick: function () {
            toggleOverlay(false);
        },
        render: function () {
            this.$el.empty().append(
                this.collection.map(function (model) {
                    return new LauncherView({ model: model, quicklaunch: true }).render().$el;
                })
            );
            return this;
        }
    });

    var LaunchersView = Backbone.View.extend({
        attributes: {
            id: 'io-ox-launcher'
        },
        events: {
            'click button': 'onClick',
            'click #io-ox-launchgrid-overlay-inner': 'onClick'
        },
        onClick: function (force) {
            toggleOverlay(force);
        },
        render: function () {
            this.$el.append(
                $('<button type="button" class="launcher-btn btn btn-link" aria-haspopup="true" aria-expanded="false" aria-label="Navigate to:">').append(icons.launcher),
                $('<div id="io-ox-launchgrid">').append(
                    $('<div class="cflex">').append(
                        this.collection.map(function (model) {
                            return new LauncherView({ model: model }).render().$el;
                        })
                    )
                ),
                $('<div id="io-ox-launchgrid-overlay-inner">')
            );
            return this;
        }
    });

    ox.manifests.loadPluginsFor('io.ox/core/notifications').done(function () {
        ext.point('io.ox/core/notifications/badge').invoke('register', self, {});
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'init',
        index: 100,
        draw: function () {
            $('#io-ox-core').append(
                $('<div id="io-ox-launchgrid-overlay">').on('click', toggleOverlay)
            );

            initRefreshAnimation();

            ox.ui.apps.on('launch resume', function (model) {
                $('#io-ox-launchgrid').find('.lcell[data-app-id="' + model.get('name') + '"]').addClass('active').siblings().removeClass('active');
                _.defer(function () {
                    $(document).trigger('resize');
                });
            });
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'logo',
        index: 200,
        draw: function () {
            this.append(
                $('<div id="io-ox-top-logo">').append(
                    $('<img>').attr({
                        alt: ox.serverConfig.productName,
                        src: ox.base + '/apps/themes/' + ox.theme + '/logo.png'
                    }).on('click', function (e) {
                        e.preventDefault();
                        ox.triger('logo-topbar:click');
                    })
                )
            );
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'launcher',
        index: 300,
        draw: function () {
            var launchers = window.launchers = new LaunchersView({
                collection: ox.ui.apps.where({ hasLauncher: true })
            });
            this.append(launchers.render().$el);
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'quicklauncher',
        index: 400,
        draw: function () {
            var quicklaunchers = window.quicklaunchers = new QuickLaunchersView();
            this.append(quicklaunchers.render().$el);
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'search',
        index: 500,
        draw: function () {
            var search = $('<div id="io-ox-topsearch">');
            this.append(search);
            ext.point('io.ox/core/appcontrol/search').invoke('draw', search);
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'right',
        index: 600,
        draw: function () {
            var taskbar = $('<ul class="taskbar list-unstyled">');
            this.append($('<div id="io-ox-toprightbar">').append(taskbar));
            ext.point('io.ox/core/appcontrol/right').invoke('draw', taskbar);
        }
    });

    ext.point('io.ox/core/appcontrol').extend({
        id: 'show',
        index: 10000,
        draw: function () {
            this.show();
        }
    });

    ext.point('io.ox/core/appcontrol/search').extend({
        id: 'default',
        index: 100,
        draw: function () {
            // on mobile via ext 'io.ox/core/appcontrol/right'
            if (!capabilities.has('search') || _.device('smartphone')) return;

            // append hidden node to container node
            ox.ui.apps.on('launch', function append(app) {
                if (!app.isFindSupported()) return;

                var label = gt('Search'),
                    id = _.uniqueId('search-field'),
                    guid = _.uniqueId('form-control-description-');

                this.append(
                    $('<div class="io-ox-find initial" role="search" style="display:none">').attr('data-app', app.id).append(
                        $('<div class="sr-only arialive" role="status" aria-live="polite">'),
                        // box
                        $('<form class="search-box">').append(
                            // group
                            $('<div class="form-group">').append(
                                $('<input type="text" class="form-control search-field tokenfield-placeholder f6-target">').attr({
                                    'id': id,
                                    'placeholder': label + '...',
                                    'aria-describedby': guid
                                }),
                                // search
                                $('<button type="button" class="dropdown-toggle btn btn-link form-control-feedback action action-options" data-toggle="tooltip" data-placement="bottom" data-animation="false" data-container="body">')
                                    .attr({
                                        'data-original-title': gt('Options'),
                                        'aria-label': gt('Options')
                                    }).append($('<i class="fa fa-caret-down" aria-hidden="true">'))
                                    .tooltip(),
                                $('<form class="dropdown" autocomplete="off">'),
                                // cancel/reset
                                $('<button type="button" class="btn btn-link form-control-feedback action action-cancel" data-toggle="tooltip" data-placement="bottom" data-animation="false" data-container="body">')
                                    .attr({
                                        'data-original-title': gt('Cancel search'),
                                        'aria-label': gt('Cancel search')
                                    }).append($('<i class="fa fa-times" aria-hidden="true">'))
                                    .tooltip(),
                                // sr label
                                $('<label class="sr-only">')
                                    .attr('for', id)
                                    .text(label),
                                // sr description
                                $('<p class="sr-only sr-description">').attr({ id: guid })
                                    //#. search feature help text for screenreaders
                                    .text(gt('Search results page lists all active facets to allow them to be easly adjustable/removable. Below theses common facets additonal advanced facets are listed. To narrow down search result please adjust active facets or add new ones'))
                            )
                        )
                    )
                );
                app.initFind();
            }.bind(this));
        }
    });

    ext.point('io.ox/core/appcontrol/search').extend({
        id: 'resize',
        index: 10000,
        draw: function () {
            // on mobile via ext 'io.ox/core/appcontrol/right'
            if (!capabilities.has('search') || _.device('smartphone')) return;
            var container = this,
                MINWIDTH = 350,
                MAXWIDTH = _.device('desktop') ? 750 : 550;

            // hide inactive
            function hidePaused() {
                var app = ox.ui.App.getCurrentApp();
                if (!app || !app.id) return;
                container.children().not('[data-app="' + app.id + '"]').css('display', 'none');
            }

            function setVisibility() {
                var app = ox.ui.App.getCurrentApp();
                if (!app || !app.id) return;
                // show field for current app
                hidePaused();
                container.find('[data-app="' + app.id + '"]').css('display', 'block');
            }

            var delay = 0;
            ox.ui.windowManager.on('window.open', function () { delay = 100; });
            ox.ui.windowManager.on('window.show', function () {
                hidePaused();
                if (!delay) return setVisibility();
                // delay on first start
                _.delay(function () {
                    delay = 0;
                    setVisibility();
                }, delay);
            });

            // search is active (at least one token)
            ox.ui.apps.on('change:search', function (name, app) {
                if (!/^(running|paused)$/.test(name)) return;
                var node = app.view.$el,
                    isReset = name === 'paused';

                node.toggleClass('has-tokens', !isReset)
                    .css({
                        // limit height to prevent jumping
                        'height': isReset ? 'initial' : '32px',
                        // expand field or restore min-width value
                        'max-width': isReset ? MINWIDTH + 'px' : MAXWIDTH + 'px'
                    });

            });
        }
    });

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

    return {
        LauncherView: LauncherView,
        LaunchersView: LaunchersView,
        QuickLaunchersView: QuickLaunchersView
    };
});
