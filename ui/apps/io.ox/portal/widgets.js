/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/portal/widgets', [
    'io.ox/core/extensions',
    'io.ox/core/manifests',
    'io.ox/core/upsell',
    'io.ox/core/notifications',
    'settings!io.ox/portal',
    'gettext!io.ox/portal'
], function (ext, manifests, upsell, notifications, settings, gt) {

    'use strict';

    // for temporary hacks use: ['plugins/portal/helloworld/register']
    var DEV_PLUGINS = [];

    // application object
    var availablePlugins = _(manifests.manager.pluginsFor('portal')).uniq().concat(DEV_PLUGINS),
        collection = new Backbone.Collection([]),
        widgetSet = settings.get('widgetSet', ''),
        generation = Number(settings.get('generation', 0));

    collection.comparator = function (a, b) {
        return ext.indexSorter({ index: a.get('index') }, { index: b.get('index') });
    };

    var widgets = (function () {

        var widgets = {},
            userValues = settings.get('settings' + widgetSet, {}),
            userWidgets = settings.get('widgets/user');

        // Load the users widgets
        _(userWidgets || {}).each(function (widgetDef, id) {
            widgets[id] = _.extend({}, widgetDef, { userWidget: true });
        });

        // http://oxpedia.org/wiki/index.php?title=AppSuite:Configuring_portal_plugins
        //                      +--------------+------------+----------------+--------+
        //                      | show on      | user can...                          |
        //                      | first start  | move       | enable/disable | delete |
        // +--------------------+--------------+------------+----------------+--------+
        // | default            | x            | x          | x              | x      |
        // | eager              | x            | x          | x              |        |
        // | protected          | x            | (property) |                |        |
        // | proteced(disabled) |              |            |                |        |
        // +--------------------+--------------+------------+----------------+--------+

        // Ensure all eager widgets of all generations that weren't removed in their corresponding generation
        function processEager(gen) {
            var deleted = {};
            _(settings.get('widgets/deleted' + widgetSet + '/gen_' + gen, [])).each(function (id) {
                deleted[id] = true;
            });
            return function process(widgetDef, id) {
                if (!deleted[id]) {
                    widgets[id] = _.extend({}, widgets[id], widgetDef, userValues[id], { eagerWidget: true });
                }
            };
        }
        // process all eager generations
        for (var gen = 0; gen <= generation; gen++) {
            _(settings.get('widgets/eager' + widgetSet + '/gen_' + gen)).each(processEager(gen));
        }

        // Ensure all protected widgets
        _(settings.get('widgets/protected' + widgetSet)).each(function (widgetDef, id) {
            widgetDef.protectedWidget = true;
            widgets[id] = _.extend({}, widgets[id], widgetDef, { protectedWidget: true });
            widgets[id].userWidget = false;
            widgetDef.userWidget = false;

            var draggable = false;
            if (widgetDef.changeable) {
                var updates = userValues[id] || {};
                _(widgetDef.changeable).each(function (enabled, attr) {
                    if (enabled) {
                        widgets[id][attr] = updates[attr] || widgets[id][attr];
                        if (attr === 'index') {
                            draggable = true;
                        }
                    }
                });
            }
            widgetDef.draggable = draggable;
            widgets[id].draggable = draggable;
        });

        // Upgrade or downgrade widgets from previous/later versions
        // this is needed, as we don't have migrations for the settings
        var needsSave = false;
        for (var widget in widgets) {
            var manifestManager = require('io.ox/core/manifests').manager;
            var plugin = widgets[widget].plugin;
            if (!plugin || manifestManager.plugins[plugin]) continue;
            if (manifestManager.plugins[plugin.replace('plugins/portal/', 'pe/portal/plugins/')]) {
                widgets[widget].plugin = plugin.replace('plugins/portal/', 'pe/portal/plugins/');
                needsSave = true;
            } else if (manifestManager.plugins[plugin.replace('pe/portal/plugins/', 'plugins/portal/')]) {
                widgets[widget].plugin = plugin.replace('pe/portal/plugins/', 'plugins/portal/');
                needsSave = true;
            }
        }
        if (needsSave) settings.set('widgets/user', widgets).save();

        // no widgets configured (first start)
        if (_.isEmpty(widgets) && !userWidgets) {

            widgets = {
                mail_0: {
                    plugin: 'plugins/portal/mail/register',
                    color: 'default',
                    userWidget: true,
                    index: 1,
                    props: {
                        name: gt('Inbox')
                    }
                },
                birthdays_0: {
                    plugin: 'plugins/portal/birthdays/register',
                    color: 'default',
                    userWidget: true,
                    index: 4
                },
                calendar_0: {
                    plugin: 'plugins/portal/calendar/register',
                    color: 'default',
                    userWidget: true,
                    index: 2
                },
                tasks_0: {
                    plugin: 'plugins/portal/tasks/register',
                    color: 'default',
                    userWidget: true,
                    index: 3
                },
                myfiles_0: {
                    plugin: 'plugins/portal/recentfiles/register',
                    color: 'default',
                    userWidget: true,
                    index: 4
                },
                linkedin_0: {
                    plugin: 'plugins/portal/linkedin/register',
                    color: 'default',
                    userWidget: true,
                    index: 6
                }
            };

            settings.set('widgets/user', widgets).save();
        }

        return widgets;

    }());

    var api = {

        // for demo/debugging
        addPlugin: function (plugin) {
            availablePlugins = availablePlugins.concat(plugin);
        },

        getAvailablePlugins: function () {
            return _(availablePlugins).uniq();
        },

        getCollection: function () {
            return collection;
        },

        getEnabled: function () {
            return collection.filter(function (model) {
                return !model.has('candidate') && (!model.has('enabled') || model.get('enabled') === true);
            });
        },

        getSettings: function () {

            var allTypes = ext.point('io.ox/portal/widget').pluck('id');

            return _(widgets)
                .chain()
                // map first since we need the object keys
                .map(function (obj, id) {

                    obj.id = id;
                    obj.type = id.substr(0, id.lastIndexOf('_'));
                    obj.props = obj.props || {};
                    obj.inverse = _.isUndefined(obj.inverse) ? false : obj.inverse;
                    obj.enabled = _.isUndefined(obj.enabled) ? true : obj.enabled;

                    return obj;
                })
                .filter(function (obj) {
                    return _(api.getAvailablePlugins()).contains(obj.plugin) || _(allTypes).contains(obj.type);
                })
                .value();
        },

        getSettingsSorted: function () {
            return _(api.getSettings())
                .chain()
                .sortBy(function (obj) {
                    return obj.index;
                })
                .map(function (obj) {
                    delete obj.candidate;
                    return obj;
                })
                .value();
        },

        loadAllPlugins: function () {
            return require(api.getAvailablePlugins());
        },

        loadUsedPlugins: function () {
            var dependencies = _.intersection(collection.pluck('plugin'), api.getAvailablePlugins());
            return require(dependencies).then(function () {
                return api.removeDisabled();
            }).fail(function () {
                console.error('Could not load portal plugin in loadUsedPlugins.');
            });
        },

        getOptions: function (type) {
            return ext.point('io.ox/portal/widget/' + type + '/settings').options();
        },

        getAllTypes: function () {

            var allTypes = ext.point('io.ox/portal/widget').pluck('id');

            return _.chain(api.getAvailablePlugins().concat(allTypes))
                .map(function (id) {
                    return id.replace(/^plugins\/portal\/(\w+)\/register$/, '$1');
                })
                .uniq()
                .map(function (type) {
                    var options = api.getOptions(type);
                    // inject "requires" for upsell
                    options.requires = api.requires(type);
                    return options;
                })
                .filter(function (obj) {
                    return obj.type !== undefined;
                })
                .value()
                .sort(function (a, b) {
                    return a.title < b.title ? -1 : +1;
                });
        },

        getUsedTypes: function () {
            // mmmh, chain() on collection seems broken
            return _(collection.pluck('type')).uniq().sort();
        },

        containsType: function (type) {
            return _(this.getUsedTypes()).contains(type);
        },

        getColors: function () {
            return 'default black red orange lightgreen green lightblue blue purple pink gray'.split(' ');
        },

        getTitle: function (data, title) {
            // precedence if title is a function
            if (_.isFunction(title)) return title(data);
            // try custom title, then fallback
            return data.title || (data.props ? (data.props.description || data.props.title) : '') || title || '';
        },

        getPluginByType: function (type) {
            // look for full plugin path
            var plugin = ext.point('io.ox/portal/widget/' + type).prop('plugin');
            if (plugin) return plugin;
            // look for type
            var prop = ext.point('io.ox/portal/widget/' + type).prop('type');
            return 'plugins/portal/' + (prop || type) + '/register';
        },

        add: function (type, options) {

            // find free id
            var defaults = settings.get('widgets/defaults', {}),
                widget, i = 0, id = type + '_0';

            options = _.extend({
                color: 'default',
                enabled: true,
                inverse: false,
                plugin: type,
                props: {}
            }, defaults[type] || {}, options || {});

            while (id in widgets) {
                id = type + '_' + (++i);
            }

            widget = {
                color: options.color,
                enabled: options.enabled,
                inverse: options.inverse,
                id: id,
                // otherwise not visible
                index: 0,
                plugin: this.getPluginByType(options.plugin),
                props: options.props,
                type: type,
                userWidget: true
            };

            settings.set('widgets/user/' + id, widget).saveAndYell();

            // add to widget hash and collection
            widgets[id] = widget;
            collection.unshift(widget);
        },

        remove: function (model) {
            collection.remove(model);
        },

        removeDisabled: function () {
            collection.remove(
                collection.filter(function (model) {
                    return ext.point('io.ox/portal/widget/' + model.get('type'))
                        .invoke('isEnabled')
                        .reduce(function (memo, bool) {
                            return memo && bool;
                        }, true)
                        .value() === false;
                })
            );
            return api.getEnabled();
        },

        toJSON: function () {
            // get latest values
            var w = {};
            collection.each(function (model) {
                if (!model.get('userWidget')) {
                    return;
                }
                var id = model.get('id');
                w[id] = model.toJSON();
                delete w[id].baton;
            });
            return w;
        },

        extraSettingsToJSON: function () {
            var extraSettings = {};
            collection.each(function (model) {
                if (model.get('userWidget')) {
                    return;
                }
                var id = model.get('id');
                extraSettings[id] = {
                    color: model.get('color'),
                    index: model.get('index'),
                    enabled: model.get('protectedWidget') ? true : model.get('enabled')
                };
            });
            return extraSettings;
        },

        update: function (obj) {
            collection.each(function (model) {
                var id = model.get('id');
                if (id in obj) {
                    model.set(obj[id], { silent: true, validate: true });
                }
            });
        },

        /**
         * Save a list of widgets into the database. The parameter
         * @param widgetList must be a jQuery UI sortable object with its
         * children sorted in the order that should be saved.
         *
         * @param widgetList - the sortable list of widgets
         * @return - a deffered object with the save request
         */
        save: function (widgetList) {
            var self = this;

            // update collection

            var obj = _.extend({}, widgets),
                old_state = obj,
                index = 0;

            function getIndex(i) {
                return i;
            }

            // update all indexes
            widgetList.children().each(function () {
                var node = $(this), id = node.attr('data-widget-id');
                if (id in obj) {
                    if (obj[id].draggable || _.isUndefined(obj[id].draggable) || _.isNull(obj[id].draggable)) {
                        index++;
                        obj[id].index = getIndex(index);
                    }
                }
            });

            self.update(obj);
            collection.sort();
            return settings.set('widgets/user', self.toJSON()).set('settings' + widgetSet, self.extraSettingsToJSON()).save().fail(
                // don't say anything if successful
                function () {
                    // reset old state
                    self.update(old_state);
                    collection.trigger('sort');
                    notifications.yell('error', gt('Could not save settings.'));
                }
            );
        },

        requires: function (type) {
            var plugin = this.getPluginByType(type);
            return manifests.manager.getRequirements(plugin);
        },

        // convenience function for upsell
        visible: function (type) {
            var requires = this.requires(type);
            return upsell.has(requires);
        },

        // get model by widget id, e.g. mail_0
        getModel: function (id) {
            return collection.get(id);
        },

        // open settings by widget id
        // returns true if edit dialog can be opened, false otherwise
        edit: function (id) {
            var model = this.getModel(id), options;
            if (model) {
                options = this.getOptions(model.get('type'));
                if (_.isFunction(options.edit)) {
                    options.edit(model);
                    return true;
                }
            }
            return false;
        }
    };

    // Note: Instead of returning this, collection.reset() now returns the changed (added, removed or updated) model or list of models.
    collection
        .reset(api.getSettingsSorted());

    collection
        .on('change', _.debounce(function (model) {
            //update widgets object
            widgets[model.get('id')] = model.attributes;
            settings.set('widgets/user', api.toJSON()).set('settings' + widgetSet, api.extraSettingsToJSON()).saveAndYell();
            // don’t handle positive case here, since this is called quite often
        }, 100))
        .on('remove', function (model) {
            if (model.get('protectedWidget')) {
                // Don't you dare!
                return;
            } else if (model.get('eagerWidget')) {
                var blacklist = settings.get('widgets/deleted' + widgetSet + '/gen_' + generation, []);
                blacklist.push(model.get('id'));
                if (!settings.get('widgets/deleted')) {
                    settings.set('widgets/deleted', {});
                }

                if (!settings.get('widgets/deleted' + widgetSet)) {
                    settings.set('widgets/deleted' + widgetSet, {});
                }

                settings.set('widgets/deleted' + widgetSet + '/gen_' + generation, blacklist).saveAndYell();

            } else if (model.get('userWidget')) {
                settings.remove('widgets/user/' + model.get('id')).saveAndYell();
            }
        });

    // add or remove upsell widget to portal
    require(['io.ox/core/upsell', 'settings!io.ox/core'], function (upsell, coreSettings) {

        var options = _.extend({
                enabled: true,
                requires: 'active_sync || caldav || carddav'
            }, coreSettings.get('features/upsell/portal-widget')),
            hasWidget = api.containsType('upsell'),
            showWidget = options.enabled && !upsell.has(options.requires) && upsell.enabled(options.requires);

        if (hasWidget === showWidget) return;

        if (hasWidget) {
            api.remove('upsell_0');
        } else {
            api.addPlugin('plugins/portal/upsell/register');
            api.add('upsell');
        }
    });

    return api;
});
