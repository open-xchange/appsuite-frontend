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

define('io.ox/portal/widgets',
    ['io.ox/core/extensions',
     'io.ox/core/manifests',
     'io.ox/core/upsell',
     'io.ox/core/notifications',
     'settings!io.ox/portal',
     'gettext!io.ox/portal'
    ], function (ext, manifests, upsell, notifications, settings, gt) {

    'use strict';

    // use for temporary hacks
    var DEV_PLUGINS = []; // ['plugins/portal/helloworld/register'];

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
            userValues = settings.get('settings' + widgetSet, {});

        // Load the users widgets
        _(settings.get('widgets/user', {})).each(function (widgetDef, id) {
            widgets[id] = _.extend({}, widgetDef, {userWidget: true});
        });

        // Ensure all eager widgets of all generations that weren't removed in their corresponding generation
        function processEager(gen) {
            var deleted = {};
            _(settings.get('widgets/deleted' + widgetSet + '/gen_' + gen, [])).each(function (id) {
                deleted[id] = true;
            });
            return function process(widgetDef, id) {
                if (!deleted[id]) {
                    widgets[id] = _.extend({}, widgets[id], widgetDef, userValues[id], {eagerWidget: true});
                }
            };
        }

        for (var gen = 0; gen <= generation; gen++) {
            _(settings.get('widgets/eager' + widgetSet + '/gen_' + gen)).each(processEager(gen));
        }

        // Ensure all protected widgets
        _(settings.get('widgets/protected' + widgetSet)).each(function (widgetDef, id) {
            widgetDef.protectedWidget = true;
            widgets[id] = _.extend({}, widgets[id], widgetDef, {protectedWidget: true});
            if (widgetDef.changeable) {
                var updates = userValues[id] || {};
                _(widgetDef.changeable).each(function (enabled, attr) {
                    if (enabled) {
                        widgets[id][attr] = updates[attr] || widgets[id][attr];
                    }
                });
            }
        });

        if (_.isEmpty(widgets)) {
            // Fallback. No widgets configured and no ones saved previously.

            widgets = {
                mail_0: {
                    plugin: 'plugins/portal/mail/register',
                    color: 'blue',
                    userWidget: true,
                    index: 1
                },
                calendar_0: {
                    plugin: 'plugins/portal/calendar/register',
                    color: 'red',
                    userWidget: true,
                    index: 2
                },
                tasks_0: {
                    plugin: 'plugins/portal/tasks/register',
                    color: 'green',
                    userWidget: true,
                    index: 3
                },
                birthdays_0: {
                    plugin: 'plugins/portal/birthdays/register',
                    color: 'lightgreen',
                    userWidget: true,
                    index: 4
                },
                facebook_0: {
                    plugin: 'plugins/portal/facebook/register',
                    color: 'blue',
                    userWidget: true,
                    index: 4
                },
                twitter_0: {
                    plugin: 'plugins/portal/twitter/register',
                    color: 'pink',
                    userWidget: true,
                    index: 5
                },
                linkedin_0: {
                    plugin: 'plugins/portal/linkedin/register',
                    color: 'lightblue',
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
            return _(collection.filter(function (model) {
                return !model.has('candidate') && (!model.has('enabled') || model.get('enabled') === true);
            }));
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
            return 'black red orange lightgreen green lightblue blue purple pink gray'.split(' ');
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
                widget, i = 0, id = type + '_0',
                colors = api.getColors();

            options = _.extend({
                color: colors[_.random(colors.length - 1)],
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
                index: 0, // otherwise not visible
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
            widgets = {};
            collection.each(function (model) {
                if (!model.get('userWidget')) {
                    return;
                }
                var id = model.get('id');
                widgets[id] = model.toJSON();
                delete widgets[id].baton;
            });
            return widgets;
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

            // update current data first
            settings.load().then(function () {
                // update collection
                api.getSettingsSorted();

                var obj = _.extend({}, widgets),
                    old_state = obj;
                // update all indexes
                widgetList.children().each(function (index) {
                    var node = $(this), id = node.attr('data-widget-id');
                    if (id in obj) {
                        obj[id].index = index + 1;
                    }
                });
                self.update(obj);
                collection.trigger('sort');
                return settings.set('widgets/user', self.toJSON()).set('settings' + widgetSet, self.extraSettingsToJSON()).save().fail(
                    // don't say anything if successful
                    function () {
                        // reset old state
                        self.update(old_state);
                        collection.trigger('sort');
                        widgetList.sortable('cancel');
                        notifications.yell('error', gt('Could not save settings.'));
                    }
                );
            });
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

    collection
        .reset(api.getSettingsSorted())
        .on('change', _.debounce(function () {
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

    return api;
});
