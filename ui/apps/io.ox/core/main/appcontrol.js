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
    'io.ox/core/main/icons',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (http, upsell, windowview, appAPI, ext, icons, settings, gt) {

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
            this.$svg.find('tspan:last').text(moment().format('ddd'));
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
            var quicklaunch = settings.get('quicklaunch') ? settings.get('quicklaunch').split(',') : null;
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
        id: 'default',
        index: 100,
        draw: function () {
            $('#io-ox-appcontrol').show();

            var banner = $('#io-ox-appcontrol');
            var taskbar, logo, search;
            var launchers = window.launchers = new LaunchersView({ collection: ox.ui.apps.where({ hasLauncher: true }) });
            var quicklaunchers = window.quicklaunchers = new QuickLaunchersView();
            banner.append(
                launchers.render().$el,
                quicklaunchers.render().$el,
                search = $('<div id="io-ox-topsearch">'),
                $('<div id="io-ox-toprightbar">').append(
                    taskbar = $('<ul class="taskbar list-unstyled">')
                ),
                logo = $('<div id="io-ox-top-logo-small" class="hidden-xs">')
            );

            $('#io-ox-core').append(
                $('<div id="io-ox-launchgrid-overlay">').on('click', toggleOverlay)
            );

            ext.point('io.ox/core/appcontrol/right').invoke('draw', taskbar);
            ext.point('io.ox/core/appcontrol/search').invoke('draw', search);
            ext.point('io.ox/core/appcontrol/logo').invoke('draw', logo);

            initRefreshAnimation();

            ox.ui.apps.on('add', function (model) {
                if (model.get('title') === undefined) return;
                if (model.get('floating')) return;

                var closable = model.get('closable') && !_.device('smartphone');

                if (closable) {
                    windowview.addNonFloatingApp(model);
                    return;
                }
            });

            ox.ui.apps.on('launch resume', function (model) {
                $('#io-ox-launchgrid').find('.lcell[data-app-id="' + model.get('name') + '"]').addClass('active').siblings().removeClass('active');
                _.defer(function () {
                    $(document).trigger('resize');
                });
            });
        }
    });

    ext.point('io.ox/core/appcontrol/search').extend({
        id: 'search',
        index: 10000,
        draw: function () {
            var self = this;

            var node = $('<div class="search_inner" style="display:none">').append(
                $('<div class="input-group hidden-xs">').append(
                    $('<input type="text" class="form-control">').attr('placeholder', gt('Search')),
                    $('<span class="input-group-btn">').append(
                        $('<button type="button" class="btn btn-link">').append(
                            $('<i class="fa fa-search" aria-hidden="true">').attr('title', gt('Search'))
                        )
                    )
                )
            );

            var resizeSearchBox = function () {
                _.defer(function () {
                    var launcherWidth = $('#io-ox-launcher').width();
                    var quickLaunchWidth = $('#io-ox-quicklaunch').width();
                    var sidePanelWidth = $('.window-sidepanel:visible').width();
                    var leftsideWidth = $('.leftside:visible').width();
                    var leftMargin = sidePanelWidth - launcherWidth - quickLaunchWidth;
                    if (sidePanelWidth && leftMargin > 0) {
                        $(self).css('marginLeft', leftMargin);
                        node.css('max-width', leftsideWidth);
                    }
                    node.show();
                });
            };

            this.append(node);

            $(document).on('resize', resizeSearchBox);
            $(window).on('resize', resizeSearchBox);
        }
    });

    ext.point('io.ox/core/appcontrol/logo').extend({
        id: 'logo',
        index: 10000,
        draw: function () {
            // add small logo to top bar
            this.append(
                $('<img>').attr({
                    alt: ox.serverConfig.productName,
                    src: ox.base + '/apps/themes/' + ox.theme + '/logo-large.png'
                })
            );
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
});
