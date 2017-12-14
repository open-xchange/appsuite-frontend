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

define('io.ox/core/main/topbar', [
    'io.ox/core/api/apps',
    'io.ox/core/main/logout',
    'io.ox/core/upsell',
    'io.ox/core/extensions',
    'io.ox/core/http',
    'io.ox/backbone/views/window',
    'io.ox/core/main/addLauncher',
    'settings!io.ox/core',
    'gettext!io.ox/core',
    'io.ox/core/desktop'
], function (appAPI, logout, upsell, ext, http, windowview, addLauncher, settings, gt) {

    var launcherDropdown,
        topbar = $('#io-ox-topbar'),
        launchers = $('.launchers', topbar),
        launcherDropdownToggle;

    var launcherDropdownTab = $('<li class="launcher-dropdown dropdown" role="presentation">').append(
        launcherDropdownToggle = $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true">').attr({
            'aria-label': gt('Launcher dropdown. Press [enter] to jump to the dropdown.')
        })
        .append(
            $('<i class="fa fa-angle-double-right" aria-hidden="true">'),
            $('<span class="sr-only">').text('Dropdown')
        ),
        launcherDropdown = $('<ul class="dropdown-menu" role="menu">')
    );

    launcherDropdownToggle.dropdown();

    // prevent dragging links
    topbar.on('dragstart', false);

    topbar.find('[role="navigation"]').attr({
        'aria-label': gt('Apps')
    });

    function tabManager() {
        launchers.append(launcherDropdownTab);

        var items = launchers.children('.launcher'),
            secondaryLauncher = topbar.find('.launchers-secondary'),
            forceDesktopLaunchers = settings.get('forceDesktopLaunchers', false);

        // we don't show any launcher in top-bar on small devices
        if (_.device('smartphone') && !forceDesktopLaunchers) {
            return;
        }
        items.show();

        var itemsLeftWidth = launchers.offset().left;

        // Reset first
        launchers.children('.launcher:hidden').each(function (i, node) {
            $(node).show();
        });

        var itemsVisible = launchers.children('.launcher:visible'),
            itemsRightWidth = secondaryLauncher.length > 0 ? secondaryLauncher[0].getBoundingClientRect().width : 0,
            viewPortWidth = topbar[0].getBoundingClientRect().width,
            launcherDropDownIcon = topbar.find('.launcher-dropdown');

        if (launcherDropDownIcon.length) viewPortWidth -= launcherDropDownIcon[0].getBoundingClientRect().width;

        itemsVisible.each(function () {
            // use native bounding client rect function to compute the width as floating point
            itemsLeftWidth += this.getBoundingClientRect().width;
        });

        var i = 0, hidden = 0;
        for (i = items.length; i > 1; i--) {
            if (itemsLeftWidth + itemsRightWidth <= viewPortWidth) {
                break;
            } else {
                var lastVisibleItem = launchers.children('.launcher:visible').last();
                itemsLeftWidth = itemsLeftWidth - lastVisibleItem[0].getBoundingClientRect().width;
                lastVisibleItem.hide();
                hidden++;
            }
        }
        $('li', launcherDropdown).attr('role', 'menuitem').hide();

        if (hidden > 0) {
            for (i = hidden; i > 0; i--) {
                $('li', launcherDropdown).eq(-i).show();
            }
        } else {
            launcherDropdownTab.detach();
        }
    }

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
                _(topbarApps).each(function (obj) { hash[obj.id] = obj; });
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

            var rightbar = $('<ul class="launchers-secondary" role="toolbar">')
                .attr('aria-label', gt('Actions'));

            // right side
            ext.point('io.ox/core/topbar/right').invoke('draw', rightbar);

            rightbar.find('> li').attr('role', 'presentation');
            rightbar.find('> li > a').attr('role', 'button');

            topbar.append(rightbar);

            // refresh animation
            initRefreshAnimation();

            ext.point('io.ox/core/topbar/favorites').invoke('draw');

            $(window).on('resize', function () {
                ox.trigger('recalculate-topbarsize');
            });
            ox.on('recalculate-topbarsize', _.throttle(function () { tabManager(); }, 100));
        }
    });

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
                        return $('<i class="fa" aria-hidden="true">').addClass(icon);
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
            var restoreFocus = placeholder.children('a')[0] === document.activeElement;
            placeholder.remove();
            if (restoreFocus) node.children('a').focus();
        }
    }

    function quit(model) {
        var quitApp = $('<a href="#" class="closelink" role="button">').attr('title', getCloseIconLabel(model.get('title')))
            .append($('<i class="fa fa-times" aria-hidden="true">'))
            .on('click', function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                model.getWindow().app.quit();
            })
            .on('focus', function () {
                quitApp.attr('title', getCloseIconLabel(model.get('title')));
            });
        return quitApp;
    }

    function addUserContent(model, launcher, first) {
        if (model.get('closable')) {
            launcher.addClass('closable');
            if (first) launcher.find('a').after(quit(model));
        }

        if (model.get('userContent')) {
            var cls = model.get('userContentClass') || '',
                icon = model.get('userContentIcon') || '';
            launcher.addClass('user-content').addClass(cls).children().first().prepend(
                $('<i aria-hidden="true">').addClass(icon)
            );
        }
    }

    function getCloseIconLabel(docTitle) {
        //#. Context: Main Top Bar. tooltip text for app close icon (mail compose for example)
        return _.escape(gt('Close for %1$s', docTitle));
    }

    ox.ui.apps.on('add', function (model) {

        if (model.get('title') === undefined) return;
        if (model.get('floating')) return;

        var closable = model.get('closable') && !_.device('smartphone');

        if (closable) {
            windowview.addNonFloatingApp(model);
            return;
        }

        // create topbar launcher
        var node = addLauncher('left', model.get('title'), function () { model.launch(); }),
            title = model.get('title'),
            name;

        model.set('topbarNode', node);
        add(node, launchers, model);
        // call extensions to customize
        name = model.get('name') || model.id;
        ext.point('io.ox/core/topbar/launcher').invoke('draw', node, ext.Baton({ model: model, name: name }));

        // is user-content?
        addUserContent(model, node, true);

        // add list item
        var launchernode = $('<li>').append(
            $('<a href="#">').addClass(closable ? 'closable' : '').attr({
                'data-app-name': name,
                'data-app-guid': model.guid
            }).text(/*#, dynamic*/gt.pgettext('app', title))
        );
        // also store dropdown node in app model
        model.set('launcherNode', launchernode);

        //add close button
        if (closable) launchernode.append(quit(model));

        launcherDropdown.append(
            launchernode.on('click', function (e) {
                e.preventDefault();
                model.launch();
            })
        );
        add(launchernode, launcherDropdown, model);

        ox.trigger('recalculate-topbarsize');
    });

    ox.ui.apps.on('remove', function (model) {
        _([launchers, launcherDropdown]).each(function (node) {
            node.children('[data-app-guid="' + model.guid + '"]').remove();
        });
        ox.trigger('recalculate-topbarsize');
    });

    ox.ui.apps.on('launch resume', function (model) {
        if (_.device('smartphone') && !settings.get('forceDesktopLaunchers', false)) launchers.children('[role="tab"]').hide();
        // mark last active app
        _([launchers, launcherDropdown]).each(function (nodes) {
            var node = nodes.children(),
                activeApp = node.filter('[data-app-guid="' + model.guid + '"]');
            node.removeClass('active-app').find('span.sr-only').remove();
            // A11y: Current app indicator for screen-readers
            if (activeApp.length) activeApp.addClass('active-app').find('a').append($('<span class="sr-only">').text(gt('(current app)')));
        });

    });

    ox.ui.apps.on('change:title', function (model, value) {
        var node = $('[data-app-guid="' + model.guid + '"]', launchers);
        $('a.apptitle', node).text(value);
        addUserContent(model, node);
        launcherDropdown.find('li[data-app-guid="' + model.guid + '"] a:first').text(value);
        $('a.closelink', node).attr('title', getCloseIconLabel(value));

        ox.trigger('recalculate-topbarsize');
    });

    return {
        topbar: topbar,
        launchers: launchers,
        launcherDropdown: launcherDropdown
    };
});
