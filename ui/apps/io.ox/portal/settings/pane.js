/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/portal/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/manifests',
    'io.ox/portal/settings/widgetview',
    'io.ox/core/upsell',
    'io.ox/portal/widgets',
    'gettext!io.ox/portal',
    'settings!io.ox/portal',
    'io.ox/backbone/mini-views/listutils',
    'io.ox/backbone/mini-views/settings-list-view',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/settings/util',
    'static/3rd.party/jquery-ui.min.js',
    'less!io.ox/portal/style'
], function (ext, ExtensibleView, manifests, WidgetSettingsView, upsell, widgets, gt, settings, listUtils, ListView, Dropdown, util) {

    'use strict';

    ext.point('io.ox/portal/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {

            var view = new ExtensibleView({ point: 'io.ox/portal/settings/detail/view', model: settings })
                .build(function () {
                    this.listenTo(settings, 'change:mobile/summaryView', function () {
                        console.log('AHA!');
                        settings.saveAndYell();
                    });
                });

            this.append(view.$el.busy());

            widgets.loadAllPlugins().done(function () {
                view.render().$el.idle();
            });
        }
    });

    var collection = widgets.getCollection(),
        notificationId = _.uniqueId('notification_');

    collection
        .on('remove', function () {
            repopulateAddButton();
        });

    ext.point('io.ox/portal/settings/detail/view').extend({
        index: 100,
        id: 'header',
        render: function () {
            this.$el.addClass('io-ox-portal-settings').append(
                util.header(gt('Portal settings'))
            );
        }
    });

    function addWidget(e) {

        e.preventDefault();

        var type = $(this).attr('data-type'),
            requires = manifests.manager.getRequirements('plugins/portal/' + type + '/register');

        // upsell check
        if (!upsell.any(requires)) {
            // trigger global upsell event
            upsell.trigger({
                type: 'portal-widget',
                id: type,
                missing: upsell.missing(requires)
            });
        } else {
            // add widget
            widgets.add(type);
            repopulateAddButton();
        }
    }

    function drawAddButton() {
        var $ul = $('<ul class="dropdown-menu io-ox-portal-settings-dropdown" role="menu">').on('click', 'a:not(.io-ox-action-link)', addWidget),
            $toggle = $('<button type="button" class="btn btn-primary dropdown-toggle add-widget" data-toggle="dropdown" aria-haspopup="true">').append(
                $('<i class="fa fa-plus" aria-hidden="true">'),
                $('<span>').text(gt('Add widget') + ' '),
                $('<i class="fa fa-caret-down" aria-hidden="true">')
            );

        this.$el.append(
            $('<div class="form-group buttons">').append(
                new Dropdown({
                    className: 'btn-group-portal',
                    $ul: $ul,
                    $toggle: $toggle
                }).render().$el,
                $('<div class="sr-only" role="log" aria-live="assertive" aria-relevant="additions text">').attr('id', notificationId)
            )
        );

        repopulateAddButton();
    }

    function repopulateAddButton() {
        widgets.loadAllPlugins().done(function () {
            $('.io-ox-portal-settings-dropdown').children('[role=presentation]').remove().end().append(
                _(widgets.getAllTypes()).map(function (options) {

                    var isUnique = options.unique && widgets.containsType(options.type),
                        isVisible = upsell.visible(options.requires);

                    if (isUnique || !isVisible) {
                        return $();
                    }
                    return $('<li role="presentation">')
                        // add disabld class if requires upsell
                        .addClass(!upsell.has(options.requires) ? 'requires-upsell' : undefined)
                        .append(
                            $('<a href="#" role="menuitem">').attr('data-type', options.type).text(options.title)
                        );
                })
            );
        });

    }

    ext.point('io.ox/portal/settings/detail/view').extend({
        index: 200,
        id: 'add',
        render: drawAddButton
    });

    var drawChangeColor = (function () {

        var colorNames = {
            default:    gt('Default'),
            black:      gt('Black'),
            gray:       gt('Gray'),
            red:        gt('Red'),
            orange:     gt('Orange'),
            lightgreen: gt('Light green'),
            green:      gt('Green'),
            lightblue:  gt('Light blue'),
            blue:       gt('Blue'),
            purple:     gt('Purple'),
            pink:       gt('Pink')
        };

        return function (activeColor, title) {
            return $('<div class="action dropdown colors">').append(
                listUtils.appendIconText(
                    $('<a href="#" role="button" class="dropdown-toggle" data-toggle="dropdown" aria-haspopup="true">').attr({
                        //#. %1$s is the title of the item, which should be colored
                        'aria-label': gt('Color %1$s', title)
                    }),
                    gt('Color'),
                    'color',
                    activeColor
                ),
                $('<ul class="dropdown-menu" role="menu">').append(
                    _(colorNames).map(function (name, color) {
                        return $('<li role="presentation">').append(
                            $('<a href="#" data-action="change-color" role="menuitem">').attr('data-color', color).append(
                                $('<span class="color-example">').addClass('color-' + color),
                                $.txt(name)
                            )
                            .addClass(color === activeColor ? 'active-color' : undefined)
                        );
                    })
                )
            );
        };
    }());

    ext.point('io.ox/portal/settings/detail/list-item').extend({
        id: 'state',
        index: 100,
        draw: function (baton) {
            var data = baton.model.toJSON();
            this.toggleClass('disabled', !data.enabled);
        }
    });

    ext.point('io.ox/portal/settings/detail/list-item').extend({
        id: 'drag-handle',
        index: 200,
        draw: function (baton) {

            if (_.device('smartphone')) return;
            var data = baton.model.toJSON();
            // seems to be added in MW silently..
            // a protectedWidget might be editable. If it is the "index" allow d&d for reorder
            var protectedButDraggable = data.protectedWidget && (data.changeable && data.changeable.index);

            this.addClass(data.protectedWidget && !protectedButDraggable ? 'protected' : ' draggable')
                .append(
                    data.protectedWidget && !protectedButDraggable ? $('<div class="spacer">') :
                        listUtils.dragHandle(gt('Drag to reorder widget'), baton.model.collection.length <= 1 ? 'hidden' : '')
                );

        }
    });

    ext.point('io.ox/portal/settings/detail/list-item').extend({
        id: 'title',
        index: 400,
        draw: function (baton) {
            var data = baton.model.toJSON(),
                point = ext.point(baton.view.point),
                title = widgets.getTitle(data, point.prop('title'));
            this.append(
                listUtils.makeTitle(title)
                    .addClass('widget-color-' + (data.color || 'black') + ' widget-' + data.type)
                    .removeClass('pull-left')
            );
        }
    });

    ext.point('io.ox/portal/settings/detail/list-item').extend({
        id: 'controls',
        index: 500,
        draw: function (baton) {

            var data = baton.model.toJSON(),
                point = ext.point(baton.view.point),
                title = widgets.getTitle(data, point.prop('title'));

            if (data.protectedWidget) {
                // early exit if protected Widget
                this.append('&nbsp;');
                return;
            }

            var $controls = listUtils.makeControls(),
                $link = listUtils.controlsToggle();

            if (data.enabled) {
                // editable?
                if (baton.view.options.editable) {
                    $controls.append(
                        listUtils.appendIconText(
                            listUtils.controlsEdit({ 'aria-label': gt('Edit %1$s', title) }),
                            gt('Edit'),
                            'edit'
                        )
                    );
                }
                var $node = drawChangeColor(data.color, title);
                // Delegate fix for mobile dropdowns.
                // On mobile we need to bind the action directly to the hrefs
                // as the delegate is bound to parent element which is not longer
                // valid
                if (_.device('smartphone')) {
                    $node.find('[data-action="change-color"]').on('click', function (e) {
                        baton.view.onChangeColor(e);
                    });
                }

                $controls.append($node);

                if (_.device('!smartphone')) {
                    $controls.append(
                        listUtils.appendIconText($link.attr({
                            'aria-label': gt('Disable %1$s', title)
                        }), gt('Disable'), 'disable')
                    );
                }
            } else {
                $controls.append(
                    listUtils.appendIconText($link.attr({
                        'aria-label': gt('Enable %1$s', title)
                    }), gt('Enable'), 'enable')
                );
            }

            $controls.append(
                listUtils.controlsDelete({ title: gt('Remove %1$s', title) })
            );

            this.append($controls);
        }
    });

    ext.point('io.ox/portal/settings/detail/view').extend({
        index: 300,
        id: 'list',
        render: function () {

            this.$el.append(
                new ListView({
                    collection: collection,
                    sortable: true,
                    containment: this.$el,
                    notification: this.$('#' + notificationId),
                    childView: WidgetSettingsView,
                    dataIdAttribute: 'data-widget-id',
                    childOptions: function (model) {
                        return {
                            point: 'io.ox/portal/widget/' + model.get('type')
                        };
                    },
                    filter: function (model) {
                        //TODO: some tests?
                        var enabledIsChangeable = _.isObject(model.get('changeable')) && model.get('changeable').enabled === true,
                            anyChangeable = _.any(model.get('changeable'), function (val) {
                                return val === true;
                            });
                        //do not show protected widgets which are disabled and the disabled state can not be changed
                        if (model.get('protectedWidget') === true && (model.get('enabled') !== true || enabledIsChangeable)) return false;
                        //do not show protected widgets which are enabled but don't have any attribute changeable
                        if (model.get('protectedWidget') === true && model.get('enabled') === true && !anyChangeable) return false;
                        return true;
                    }
                })
                .on('add', function (view) {
                    // See Bugs: 47816 / 47230
                    if (ox.ui.App.getCurrentApp().get('name') === 'io.ox/portal') return;
                    view.edit();
                })
                .on('order:changed', function () {
                    widgets.getCollection().trigger('order-changed', 'settings');
                    widgets.save(this.$el);
                })
                .render().$el
            );
        }
    });

    ext.point('io.ox/portal/settings/detail/view').extend({
        index: 500,
        id: 'summaryView',
        render: function () {
            this.$el.append(
                util.fieldset(
                    gt('Smartphone settings:'),
                    $('<div class="form-group">').append(
                        util.checkbox('mobile/summaryView', gt('Reduce to widget summary'), settings)
                    )
                )
            );
        }
    });

    return {};
});
