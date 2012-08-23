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
 */
define('io.ox/portal/settings/pane',
      ['io.ox/core/extensions',
       'io.ox/settings/utils',
       'io.ox/portal/settings/plugin/model',
       'io.ox/core/tk/dialogs',
       'settings!io.ox/portal',
       'text!io.ox/portal/settings/tpl/listbox.html',
       'text!io.ox/portal/settings/tpl/plugin.html',
       'gettext!io.ox/portal/settings'], function (ext, utils, PluginModel, dialogs, settings, tmplListBox, tmplPlugin, gt) {

    'use strict';

    var staticStrings =  {
        ACTIVATE_PLUGIN: gt('Activate Plugin'),
        PLUGIN_SETTINGS: gt('Properties'),
        SAVE:            gt('Save'),
        PORTAL:          gt('Portal'),
        PORTAL_PLUGINS:  gt('Portal Plugins'),
        PROPERTIES:      gt('Properties')
    };

    var plugins = [];

    var activePlugins = settings.get('activePlugins') || [];

    _.each(ext.getPlugins({ prefix: 'plugins/portal/', name: 'portal', nameOnly: true }), function (pluginName) {
        var isActive = _.include(activePlugins, pluginName);
        var plugin = {id: pluginName, name: gt(pluginName), active: isActive};

        if (pluginName === 'reddit') {
            plugin.subreddits = 'foo';
        }
        plugins.push(plugin);
    });

    var collection,
        PluginSelectView = Backbone.View.extend({
            _modelBinder: undefined,
            initialize: function (options) {
                this.template = doT.template(tmplPlugin);
                this._modelBinder = new Backbone.ModelBinder();
            },
            render: function () {
                var self = this;

                self.$el.empty().append(self.template({
                    id: this.model.get('id')
                }));

                var defaultBindings = Backbone.ModelBinder.createDefaultBindings(self.el, 'data-property');
                self._modelBinder.bind(self.model, self.el, defaultBindings);

                return self;
            },
            events: {
                'click .deletable-item': 'onSelect'
            },
            onSelect: function () {
                this.$el.parent().find('div[selected="selected"]').attr('selected', null);
                this.$el.find('.deletable-item').attr('selected', 'selected');
            }
        }),

        PluginSettingsView = Backbone.View.extend({
            initialize: function (options) {
                this.plugin = options.plugin;
                this.deferred = new $.Deferred();
                this.strings = staticStrings;

                var that = this;
                var req = ['text!io.ox/portal/settings/tpl/pluginsettings.html'];
                var response = $.ajax({
                    url: ox.base + '/apps/plugins/portal/' + this.plugin.id + '/settings/plugin.js',
                    type: 'HEAD',
                    async: false
                }).status;

                if (response === 200) {
                    req.push('plugins/portal/' + this.plugin.id + '/settings/plugin');
                }

                require(req, function (tmplPluginSettings, pluginFeatures) {
                    that.template = doT.template(tmplPluginSettings);
                    that.pluginFeatures = pluginFeatures;
                    that.deferred.resolve();
                });
            },
            render: function () {
                var that = this;

                this.deferred.done(function () {
                    that.$el.empty().append(that.template({
                        active: that.plugin.get('active'),
                        id: that.plugin.get('id'),
                        strings: that.strings
                    }));

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
                if (this.$el.find('input#plugin-active').is(':checked')) {
                    activePlugins.push(this.plugin.get('id'));
                    activePlugins = _.uniq(activePlugins);
                    this.plugin.set('active', true);
                } else {
                    activePlugins = _.without(activePlugins, this.plugin.get('id'));
                    this.plugin.set('active', false);
                }
                settings.set('activePlugins', activePlugins);
                settings.save();

                var plugins = ext.getPlugins({ prefix: 'plugins/portal/', name: 'portal' });
                var allActivePlugins = _.map(activePlugins || [], function (value) { return 'plugins/portal/' + value + '/register'; });
                plugins = _.intersection(plugins, allActivePlugins);

                // Load all active plugins
                require(plugins).pipe(function () {
                    // Enable or Disable all plugins
                    var extensions = ext.point('io.ox/portal/widget').all();
                    _.chain(extensions).each(function (extension) {
                            var eid = extension.id;

                            var isActive = _.find(activePlugins, function (plugin) {
                                var pluginLength = plugin.length;
                                return (eid.length >= pluginLength && eid.substring(0, pluginLength) === plugin);
                            });

                            if (!isActive) {
                                ext.point("io.ox/portal/widget").disable(eid);
                            } else {
                                ext.point("io.ox/portal/widget").enable(eid);
                            }
                        }
                    );

                    ox.trigger("refresh^");
                });

                this.dialog.close();
            }
        });

    ext.point("io.ox/portal/settings/detail").extend({
        index: 200,
        id: "portalsettings",
        draw: function (data) {
            var that = this;

            collection = new Backbone.Collection(plugins);

            var PluginsView = Backbone.View.extend({
                initialize: function () {
                    this.template = doT.template(tmplListBox);
                    _.bindAll(this);
                    this.collection = collection;
                },
                render: function () {
                    var self = this;
                    self.$el.empty().append(self.template({strings: staticStrings}));

                    this.collection.each(function (item) {
                        self.$el.find('.listbox').append(new PluginSelectView({ model: item }).render().el);
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

                    view.dialog = new dialogs.SidePopup().show(e, function (popup) {
                        popup.append(view.render().el);
                    });
                }
            });

            var view = new PluginsView();
            that.append(view.render().el);
        }
    });

    return {};
});