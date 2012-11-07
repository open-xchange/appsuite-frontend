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
 * @author Markus Bode <markus.bode@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/settings/pane',
      ['io.ox/core/extensions',
       'io.ox/settings/utils',
       'io.ox/portal/settings/plugin/model',
       'io.ox/core/tk/dialogs',
       'settings!io.ox/portal',
       'text!io.ox/portal/settings/tpl/listbox.html',
       'text!io.ox/portal/settings/tpl/plugin.html',
       'gettext!io.ox/portal',
       'apps/io.ox/core/tk/jquery-ui.min.js'], function (ext, utils, PluginModel, dialogs, settings, tmplListBox, tmplPlugin, gt) {

    'use strict';

    var staticStrings =  {
        ACTIVATE_PLUGIN: gt('Enable Plugin'),
        PLUGIN_SETTINGS: gt('Properties'),
        SAVE:            gt('Save'),
        PORTAL:          gt('Portal'),
        PORTAL_PLUGINS:  gt('Portal Squares'),
        PROPERTIES:      gt('Properties')
    };

    var pluginSettings = settings.get('pluginSettings', []),

        MAX_INDEX = 99999;

    function getPluginById(id) {
        return _(pluginSettings).chain().filter(function (obj) { return obj.id === id; }).first().value();
    }

    var sortByIndex = function (a, b) {
        return a.index - b.index;
    };

    var getPlugins = function () {
        // get plugins
        var plugins = _(ext.getPlugins({ prefix: 'plugins/portal/', name: 'portal', nameOnly: true })).map(function (id) {
            // apply defaults
            var plugin = _.extend({ id: id, name: id, active: false, index: MAX_INDEX }, getPluginById(id));
            // put disabled plugins to end of list
            if (!plugin.active) {
                plugin.index = MAX_INDEX;
            }
            return plugin;
        });
        // sort by index
        return plugins.sort(sortByIndex);
    };

    var collection,
        plugins,

        changePluginState = function (id, active) {

            // update local settings
            var plugin = getPluginById(id);
            if (plugin) {
                plugin.active = !!active;
            } else if (active === true) {
                // add a new one
                pluginSettings.push({ id: id, name: id, active: true, index: MAX_INDEX });
            }

            // even if we don't find a plugin we track the change for new plugins
            settings.set('pluginSettings', pluginSettings);
            settings.save();

            var plugins = ext.getPlugins({ prefix: 'plugins/portal/', name: 'portal' }),
                activePlugins = _.filter(pluginSettings, function (obj) { return obj.active; }),
                allActivePlugins = _.map(activePlugins, function (obj) {
                    return 'plugins/portal/' + obj.id + '/register';
                });

            // disable/enable corresponding extension point
            ext.point("io.ox/portal/widget")[active === true ? 'enable' : 'disable'](id);

            plugins = _.intersection(plugins, allActivePlugins);

            // Load all active plugins since the portal just relies on existing extension points
            require(plugins).pipe(function () {
                var index = 100;
                // Load plugin with given index (for sub-tiles)
                _.each(arguments, function (obj) {
                    if (obj && _.isFunction(obj.reload)) {
                        obj.reload(index);
                    }
                    index += 100;
                });
                // trigger portal refresh
                ox.trigger("refresh-portal", [true]);
            });
        },

        PluginSelectView = Backbone.View.extend({
            _modelBinder: undefined,
            isEditable: false,
            isSelected: false,
            initialize: function (options) {
                this.template = doT.template(tmplPlugin);
                this._modelBinder = new Backbone.ModelBinder();
            },
            renderState: function () {
                var toggle = this.$el.find('.toggle-state');
                if (toggle) {
                    if (this.model.get('active')) {
                        toggle.text(gt('Disable'));//.removeClass('btn-inverse');
                        this.$el.removeClass('disabled').addClass('enabled');
                    } else {
                        toggle.text(gt('Enable'));//.addClass('btn-inverse');
                        this.$el.removeClass('enabled').addClass('disabled');
                    }
                }
            },
            render: function () {
                var self = this;
                self.$el.empty().append(self.template({
                    id: this.model.get('id'),
                    strings: staticStrings
                }));

                this.renderState();

                // Used by jquery ui sortable
                self.$el.attr('id', this.model.get('id'));

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);

                if (_.include(ox.serverConfig.portalPluginEditable, this.model.get('id'))) {
                    this.isEditable = true;
                    this.$el.find('div.sortable-item').addClass('editable-item');
                }
                return self;
            },
            events: {
                'click .sortable-item': 'onSelect',
                'click .toggle-state': 'changeState'
            },
            changeState: function (e) {
                var active = !this.model.get('active');
                this.model.set('active', active);
                changePluginState(this.model.get('id'), active);
                this.renderState();
            },
            onSelect: function () {
                this.$el.parent().find('div[selected="selected"]').attr('selected', null);
                this.$el.find('.sortable-item').attr('selected', 'selected');
            }
        }),

        PluginSettingsView = Backbone.View.extend({
            initialize: function (options) {
                this.plugin = options.plugin;
                this.deferred = new $.Deferred();
                this.strings = staticStrings;
                var that = this;
                require(['plugins/portal/' + this.plugin.id + '/settings/plugin'], function (pluginFeatures) {
                    that.pluginFeatures = pluginFeatures;
                    that.deferred.resolve();
                });
            },
            render: function () {
                var that = this;

                this.deferred.done(function () {
                    that.$el.empty();

                    if (that.pluginFeatures) {
                        if (that.pluginFeatures.renderSettings) {
                            that.$el.append(that.pluginFeatures.renderSettings());
                        }
                    }
                });

                return that;
            },
            events: {
                'click .save': 'onSave'
            },
            onSave: function () {
                var active = this.$el.find('input#plugin-active').is(':checked');
                this.plugin.set('active', active);
                changePluginState(this.plugin.get('id'), active);
                this.dialog.close();
            }
        });

    ext.point("io.ox/portal/settings/detail").extend({
        index: 200,
        id: "portalsettings",
        draw: function (data) {
            var that = this;
            plugins = getPlugins();
            collection = new Backbone.Collection(plugins);
            var PluginsView = Backbone.View.extend({
                initialize: function () {
                    this.template = doT.template(tmplListBox);
                    _.bindAll(this);
                    this.collection = collection;
                },
                redraw: function ($listbox) {
                    if (!$listbox) {
                        $listbox = this.$el.find('.listbox');
                    }
                    $listbox.empty();

                    this.collection.each(function (item) {
                        $listbox.append(new PluginSelectView({ model: item }).render().el);
                    });
                },
                render: function () {
                    var self = this,
                        $listbox;

                    self.$el.empty().append(self.template({strings: staticStrings}));

                    $listbox = self.$el.find('.listbox');

                    this.redraw($listbox);

                    $listbox.sortable({
                        axis: 'y',
                        items: 'div.enabled',
                        opacity: 0.5,
                        containment: 'parent',
                        update: function (event, ui) {

                            var index = 100, array = $(this).sortable('toArray');

                            _(array).each(function (id) {
                                var plugin = getPluginById(id);
                                if (plugin) {
                                    plugin.index = index;
                                    ext.point("io.ox/portal/widget").get(id, function (e) {
                                        e.index = index;
                                    });
                                    index += 100;
                                }
                            });

                            pluginSettings.sort(sortByIndex);
                            settings.set('pluginSettings', pluginSettings);
                            settings.save();

                            ox.trigger('refresh-portal', [true]);
//                            ox.trigger('refresh-portal');
                        }
                    });

                    return this;
                },
                events: {
                    'click [data-action="prop"]': 'onShowProperties'
                },
                onShowProperties: function (e) {
                    var $sel = this.$el.find('[selected]');
                    e.data = {id: $sel.data('id'), node: this.el};
                    e.target = $sel;

                    var view = new PluginSettingsView({
                        plugin: collection.get([e.data.id])
                    });

                    var d = view.dialog = new dialogs.SidePopup().show(e, function (popup) {
                        popup.append(view.render().el);
                    });

                    var self = this;
                    d.on('close', function () {
                        self.redraw();
                    });
                }
            });

            var view = new PluginsView();
            that.append(view.render().el);
        }
    });

    return {};
});