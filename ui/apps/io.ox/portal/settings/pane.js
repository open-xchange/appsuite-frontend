/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/settings/pane',
      ['io.ox/core/extensions',
       'io.ox/core/manifests',
       'io.ox/settings/utils',
       'io.ox/core/tk/dialogs',
       'settings!io.ox/portal',
       'gettext!io.ox/portal',
       'apps/io.ox/core/tk/jquery-ui.min.js',
       'less!io.ox/portal/style.css'], function (ext, manifests, utils, dialogs, settings, gt) {

    'use strict';

    var POINT = 'io.ox/portal/settings/detail', pane;

    // application object
    var availablePlugins = _(manifests.manager.pluginsFor('portal')).uniq(),
        collection = new Backbone.Collection([]);

    collection.comparator = function (a, b) {
        return ext.indexSorter({ index: a.get('index') }, { index: b.get('index') });
    };

    var getWidgetSettings = function () {
        return _(settings.get('widgets/user', {}))
            .chain()
            // map first since we need the object keys
            .map(function (obj, id) {
                obj.id = id;
                obj.type = id.split('_')[0];
                obj.props = obj.props || {};
                return obj;
            })
            .filter(function (obj) {
                return _(availablePlugins).contains(obj.plugin);
            })
            .value();
    };

    collection.reset(getWidgetSettings());

    function loadPlugins() {
        return require(availablePlugins);
    }

    ext.point(POINT).extend({
        draw: function () {
            var self = this;
            pane = $('<div class="io-ox-portal-settings">').busy();
            self.append(pane);
            loadPlugins().done(function () {
                ext.point(POINT + '/pane').invoke('draw', pane);
                pane.idle();
            });
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: "header",
        draw: function () {
            this.addClass('io-ox-portal-settings').append(
                $('<h1>').text(gt('Portal settings'))
            );
        }
    });

    function getAllTypes() {
        return _.chain(availablePlugins)
            .map(function (id) {
                var type = id.replace(/^plugins\/portal\/(\w+)\/register$/, '$1').toLowerCase();
                return ext.point('io.ox/portal/widget/' + type + '/settings').options();
            })
            .filter(function (obj) {
                return obj.type !== undefined;
            })
            .value()
            .sort(function (a, b) {
                return a.title < b.title ? -1 : +1;
            });
    }

    function addWidget(e) {

        e.preventDefault();

        // find free id
        var type = $(this).attr('data-type'),
            widgets = settings.get('widgets/user', {}),
            widget,
            i = 0, id = type + '_0';

        while (id in widgets) {
            id = type + '_' + (++i);
        }

        widget = {
            color: 'lightblue',
            enabled: true,
            id: id,
            index: 0,
            plugin: 'plugins/portal/' + type + '/register',
            props: {},
            type: type
        };

        settings.set('widgets/user/' + id, widget).save();

        collection.add(widget);
    }

    function drawAddButton() {
        this.append(
            $('<div class="controls">').append(
                $('<div class="btn-group pull-right">').append(
                    $('<a class="btn btn-primary dropdown-toggle" data-toggle="dropdown" href="#">').append(
                        $.txt(gt('Add widget')), $.txt(' '),
                        $('<span class="caret">')
                    ),
                    $('<ul class="dropdown-menu">').append(
                        _(getAllTypes()).map(function (options) {
                            return $('<li>').append(
                                $('<a>', { href: '#', 'data-type': options.type }).text(options.title)
                            );
                        })
                    )
                    .on('click', 'a', addWidget)
                )
            )
        );
    }

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: "add",
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

        return function (activeColor) {
            return $('<div class="action dropdown colors">').append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">').text(gt('Color')),
                $('<ul class="dropdown-menu">').append(
                    _(colorNames).map(function (name, color) {
                        return $('<li>').append(
                            $('<a>', { href: '#', 'data-action': 'change-color', 'data-color': color }).append(
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

    function getTitle(data, view) {
        return data.title || (data.props ? data.props.description : '') || view.options.title || '';
    }

    ext.point(POINT + '/view').extend({
        draw: function (baton) {

            var data = baton.model.toJSON();

            this[data.enabled ? 'removeClass' : 'addClass']('disabled');

            this.append(
                // widget title
                $('<div>')
                .addClass('widget-title pull-left widget-color-' + (data.color || 'black') + ' widget-' + data.type)
                .text(getTitle(data, baton.view)),
                // close (has float: right)
                $('<a href="#" class="close" data-action="remove">').html('&times;')
            );

            if (data.enabled) {
                // editable?
                if (baton.view.options.editable) {
                    this.append(
                        $('<a href="#" class="action" data-action="edit">').text(gt('Edit'))
                    );
                }
                this.append(
                    drawChangeColor(data.color),
                    $('<a href="#" class="action" data-action="toggle">').text(gt('Disable'))
                );
            } else {
                this.append(
                    $('<a href="#" class="action" data-action="toggle">').text(gt('Enable'))
                );
            }
        }
    });

    var WidgetSettingsView = Backbone.View.extend({

        tagName: 'li',

        className: "widget-settings-view",

        events: {
            'click [data-action="edit"]': 'onEdit',
            'click [data-action="change-color"]': 'onChangeColor',
            'click [data-action="toggle"]': 'onToggle',
            'click [data-action="remove"]': 'onRemove'
        },

        initialize: function () {
            this.$el.attr('data-widget-id', this.model.get('id'));
            // get explicit state
            var enabled = this.model.get('enabled');
            this.model.set('enabled', !!(enabled === undefined || enabled === true));
            // get default color
            var color = this.model.get('color');
            this.model.set('color', color === undefined || color === 'default' ? 'black' : color);
            // get widget options
            this.options = ext.point('io.ox/portal/widget/' + this.model.get('type') + '/settings').options();
        },

        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point(POINT + '/view').invoke('draw', this.$el.empty(), baton);
            return this;
        },

        edit: function () {
            if (_.isFunction(this.options.edit)) {
                this.options.edit(this.model, this);
            }
        },

        onEdit: function (e) {
            e.preventDefault();
            this.edit();
        },

        onChangeColor: function (e) {
            e.preventDefault();
            var node = $(e.target), color = node.attr('data-color');
            this.model.set('color', color);
            this.render();
        },

        onToggle: function (e) {
            e.preventDefault();
            this.model.set('enabled', !this.model.get('enabled'));
            this.render();
        },

        removeWidget: function () {
            this.model.collection.remove(this.model);
            this.remove();
        },

        onRemove: function (e) {
            e.preventDefault();
            var self = this, dialog;
            // do we have custom data that might be lost?
            if (!_.isEmpty(this.model.get('props'))) {
                var dialog = new dialogs.ModalDialog({ easyOut: true })
                .header($("<h4>").text(gt('Delete widget')))
                .append($('<span>').text(gt('Do you really want to delete this widget?')))
                .addPrimaryButton('delete', gt('Delete'))
                .addButton('cancel', gt('Cancel'));
                if (this.model.get('enabled')) {
                    dialog.addAlternativeButton('disable', gt('Just disable widget'));
                }
                dialog.show().done(function (action) {
                    if (action === 'delete') {
                        self.removeWidget();
                    } else if (action === 'disable') {
                        self.onToggle(e);
                    }
                });
            } else {
                this.removeWidget();
            }
        }
    });

    var views = {};

    function createView(model) {
        var id = model.get('id');
        return (views[id] = new WidgetSettingsView({ model: model }));
    }

    function saveWidgets() {
        // get latest values
        var widgets = {};
        collection.each(function (model) {
            var id = model.get('id');
            widgets[id] = model.toJSON();
        });
        // update all indexes
        pane.find('.widget-settings-view').each(function (index) {
            var node = $(this), id = node.attr('data-widget-id');
            if (id in widgets) {
                widgets[id].index = index;
            }
        });
        settings.set('widgets/user', widgets).save();
    }

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: "list",
        draw: function () {

            var list = $('<ul class="widget-list">');

            collection.each(function (model) {
                list.append(createView(model).render().el);
            });

            this.append(list);

            // make sortable
            list.sortable({
                containment: this,
                axis: 'y',
                scroll: true,
                delay: 150,
                stop: function (e, ui) {
                    saveWidgets();
                }
            });

            collection.on('change', function () {
                // save settings
                saveWidgets();
                // re-render all views
                _(views).each(function (view) {
                    view.render();
                });
            });

            collection.on('remove', function (model) {
                settings.remove('widgets/user/' + model.get('id')).save();
            });

            collection.on('add', function (model) {
                model.candidate = true;
                var view = createView(model).render();
                list.prepend(view.el);
                view.edit();
            });
        }
    });

    return {};
});
