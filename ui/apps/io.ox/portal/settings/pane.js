/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/settings/pane', [
    'io.ox/core/extensions',
    'io.ox/core/manifests',
    'io.ox/portal/settings/widgetview',
    'io.ox/core/upsell',
    'io.ox/portal/widgets',
    'gettext!io.ox/portal',
    'settings!io.ox/portal',
    'io.ox/backbone/mini-views/listutils',
    'static/3rd.party/jquery-ui.min.js',
    'less!io.ox/portal/style'
], function (ext, manifests, WidgetSettingsView, upsell, widgets, gt, settings, listUtils) {

    'use strict';

    var POINT = 'io.ox/portal/settings/detail', pane;

    var collection = widgets.getCollection(),
        list = $('<ol class="list-group list-unstyled widget-list">'),
        notificationId = _.uniqueId('notification_');

    collection
        .on('remove', function (model) {
            var id = model.get('id');
            if (views[id]) {
                views[id].remove();
            }
            repopulateAddButton();
        })
        .on('add', function (model) {
            var view = createView(model).render(),
                lastProtected = list.find('li.protected').last();
            if (lastProtected.length) {
                lastProtected.after(view.el);
            } else {
                list.prepend(view.el);
            }
            view.edit();
        });

    ext.point(POINT).extend({
        draw: function () {
            var self = this;
            pane = $('<div class="io-ox-portal-settings">').busy();
            self.append(pane);
            widgets.loadAllPlugins().done(function () {
                ext.point(POINT + '/pane').invoke('draw', pane);
                pane.idle();
            });
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.addClass('io-ox-portal-settings').append(
                $('<h1 class="pull-left">').text(gt('Portal settings'))
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
        var button;
        this.append(
            $('<div class="btn-group-portal pull-right">').append(
                button = $('<button class="btn btn-primary dropdown-toggle" data-toggle="dropdown" type="button" aria-haspopup="true" tabindex="1">').append(
                    $.txt(gt('Add widget')),
                    $.txt(' '),
                    $('<i class="fa fa-caret-down" aria-hidden="true">')
                ),
                $('<ul class="dropdown-menu io-ox-portal-settings-dropdown" role="menu">').on('click', 'a:not(.io-ox-action-link)', addWidget)
            ),
            $('<div class="clearfix">'),
            $('<div class="sr-only" role="log" aria-live="polite" aria-relevant="all">').attr('id', notificationId)
        );
        repopulateAddButton();
        button.dropdown();
    }

    function repopulateAddButton() {
        widgets.loadAllPlugins().done(function () {
            $('.io-ox-portal-settings-dropdown').children('[role=presentation]').remove().end().append(
                _(widgets.getAllTypes()).map(function (options) {

                    var isUnique = options.unique && widgets.containsType(options.type),
                        isVisible = upsell.visible(options.requires);

                    if (isUnique || !isVisible) {
                        return $();
                    } else {
                        return $('<li role="presentation">')
                        // add disabld class if requires upsell
                        .addClass(!upsell.has(options.requires) ? 'requires-upsell' : undefined)
                        .append(
                            $('<a>', { href: '#', 'data-type': options.type, role: 'menuitem', tabindex: 1 }).text(options.title)
                        );
                    }
                })
            );
        });

    }

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'add',
        draw: drawAddButton
    });

    var drawChangeColor = (function () {

        var colorNames = {
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
                    $('<a>').attr({
                        href: '#',
                        role: 'button',
                        tabindex: 1,
                        'data-toggle': 'dropdown',
                        'aria-haspopup': 'true',
                        'aria-label': title + ', ' + gt('Color')
                    }).addClass('dropdown-toggle'),
                    gt('Color'),
                    'color',
                    activeColor
                ),
                $('<ul class="dropdown-menu" role="menu">').append(
                    _(colorNames).map(function (name, color) {
                        return $('<li>').append(
                            $('<a>', { href: '#', 'data-action': 'change-color', 'data-color': color, 'tabindex': 1, role: 'menuitem' }).append(
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

    ext.point(POINT + '/view').extend({
        id: 'state',
        index: 100,
        draw: function (baton) {
            var data = baton.model.toJSON();
            this[data.enabled ? 'removeClass' : 'addClass']('disabled');
        }
    });

    function dragViaKeyboard(e) {

        var node = $(this),
            list = node.closest('.widget-list'),
            items = list.children('.draggable'),
            current = node.parent(),
            index = items.index(current),
            id = current.attr('data-widget-id'),
            notification = pane.find('#' + notificationId);

        function cont() {
            widgets.save(list);
            list.find('[data-widget-id="' + id + '"] .drag-handle').focus();
            notification.text(gt('the item has been moved'));
        }

        switch (e.which) {
        case 38:
            if (index > 0) {
                // up
                e.preventDefault();
                current.insertBefore(current.prevAll('.draggable:first'));
                cont();
            }
            break;
        case 40:
            if (index < items.length) {
                // down
                e.preventDefault();
                current.insertAfter(current.nextAll('.draggable:first'));
                cont();
            }
            break;
        default:
            break;
        }

    }

    ext.point(POINT + '/view').extend({
        id: 'drag-handle',
        index: 200,
        draw: function (baton) {
            if (_.device('smartphone')) return;

            var data = baton.model.toJSON(),
                point = ext.point(baton.view.point),
                title = widgets.getTitle(data, point.prop('title'));
            this
                .addClass(data.protectedWidget && data.protectedWidget === true ? ' protected' : ' draggable')
                .append(
                    data.protectedWidget && data.protectedWidget === true ? $() :
                    listUtils.dragHandle(gt('Drag to reorder widget'), title + ', ' + gt('Use cursor keys to change the item position. Virtual cursor mode has to be disabled.'), baton.model.collection.length <= 1 ? 'hidden' : '')
                    .on('keydown', dragViaKeyboard)
                );
        }
    });

    ext.point(POINT + '/view').extend({
        id: 'controls',
        index: 300,
        draw: function (baton) {
            var data = baton.model.toJSON(),
                point = ext.point(baton.view.point),
                title = widgets.getTitle(data, point.prop('title'));

            if (data.protectedWidget) {
                // early exit if protected Widget
                this.append('&nbsp;');
                return;
            }

            var $controls = listUtils.widgetControlls(),
                $link = listUtils.controlsToggle();

            if (data.enabled) {
                // editable?
                if (baton.view.options.editable) {
                    $controls.append(
                        listUtils.appendIconText(
                            listUtils.controlsEdit(title, gt('Edit')),
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
                        listUtils.appendIconText($link.attr({ 'aria-label': title + ', ' + gt('Disable') }), gt('Disable'), 'disable')
                    );
                }
            } else {
                $controls.append(
                    listUtils.appendIconText($link.attr({ 'aria-label': title + ', ' + gt('Enable') }), gt('Enable'), 'enable')
                );
            }

            $controls.append(
                listUtils.controlsDelete(title, gt('remove'))
            );

            this.append($controls);
        }
    });

    ext.point(POINT + '/view').extend({
        id: 'title',
        index: 400,
        draw: function (baton) {
            var data = baton.model.toJSON(),
                point = ext.point(baton.view.point),
                title = widgets.getTitle(data, point.prop('title'));
            this.append(
                listUtils.widgetTitle(title)
                    .addClass('widget-color-' + (data.color || 'black') + ' widget-' + data.type)
                    .removeClass('pull-left')
            );
        }
    });

    var views = {};

    function createView(model) {
        var id = model.get('id'),
            point = 'io.ox/portal/widget/' + model.get('type');
        return (views[id] = new WidgetSettingsView({ model: model, point: point, test: 'test' }));
    }

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: 'list',
        draw: function () {

            this.append(list.empty());

            collection.each(function (model) {
                if (model.get('protectedWidget') !== true || model.get('enabled') !== false) {
                    list.append(createView(model).render().el);
                }
            });

            // make sortable
            list.sortable({
                axis: 'y',
                containment: list.parent(),
                delay: 150,
                handle: '.drag-handle',
                cancel: 'li.protected',
                items: '> li.draggable',
                start: function (e, ui) {
                    ui.item.attr('aria-grabbed', 'true');
                },
                stop: function (e, ui) {
                    ui.item.attr('aria-grabbed', 'false');
                },
                scroll: true,
                update: function () {
                    widgets.getCollection().trigger('order-changed', 'settings');
                    widgets.save(list);
                }
            });

            collection
                .on('change', function () {
                    // re-render all views
                    _(views).each(function (view) {
                        view.render();
                    });
                })
                .on('sort', function () {
                    this.sort({ silent: true });
                    list.empty();
                    this.each(function (model) {
                        if (model.get('protectedWidget') !== true || model.get('enabled') !== false) {
                            list.append(createView(model).render().el);
                        }
                    });
                });
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 500,
        id: 'summaryView',
        draw: function () {

            var buildCheckbox = function () {
                var checkbox = $('<input type="checkbox" tabindex="1">')
                .on('change', function () {
                    settings.set('mobile/summaryView', checkbox.prop('checked')).save();
                }).addClass('input-xlarge');
                checkbox.prop('checked', settings.get('mobile/summaryView'));
                return checkbox;

            };
            this.append(
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle').append(
                        $('<h2>').text(gt('Smartphone settings:'))
                    ),
                    $('<div>').addClass('form-group').append(
                        $('<div>').addClass('checkbox').append(
                            $('<label>').text(gt('Reduce to widget summary')).prepend(
                                buildCheckbox('showHidden')
                            )
                        )
                    )
                )
            );
        }
    });
    return {};
});
