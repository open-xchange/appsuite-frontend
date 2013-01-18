/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/widgets',
	['io.ox/core/extensions',
     'io.ox/core/manifests',
     'settings!io.ox/portal'], function (ext, manifests, settings) {

	'use strict';

	// use for temporary hacks
	var DEV_PLUGINS = ['plugins/portal/contacts/register', 'plugins/portal/files/register'];

    // application object
    var availablePlugins = _(manifests.manager.pluginsFor('portal')).uniq().concat(DEV_PLUGINS),
        allTypes = ext.point('io.ox/portal/widget').chain().pluck('id').value(),
        collection = new Backbone.Collection([]);

    collection.comparator = function (a, b) {
        return ext.indexSorter({ index: a.get('index') }, { index: b.get('index') });
    };

    function reduceBool(memo, bool) {
        return memo && bool;
    }

    var api = {

        getAvailablePlugins: function () {
            return availablePlugins;
        },

        getCollection: function () {
            return collection;
        },

        getEnabled: function () {
            return collection.chain().filter(function (model) {
                return !model.has('enabled') || model.get('enabled') === true;
            });
        },

        getSettings: function () {
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
                    return _(availablePlugins).contains(obj.plugin) || _(allTypes).contains(obj.type);
                })
                .value();
        },

        loadAllPlugins: function () {
            return require(availablePlugins);
        },

        loadUsedPlugins: function () {
            var usedPlugins = collection.pluck('plugin'),
                dependencies = _(availablePlugins).intersection(usedPlugins);
            return require(dependencies).done(function () {
                api.removeDisabled();
            });
        },

        getAllTypes: function () {
            return _.chain(availablePlugins.concat(allTypes))
                .map(function (id) {
                    var type = id.replace(/^plugins\/portal\/(\w+)\/register$/, '$1');
                    return ext.point('io.ox/portal/widget/' + type + '/settings').options();
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
            return collection.pluck('plugin')
                .map(function (id) {
                    return id.replace(/^plugins\/portal\/(\w+)\/register$/, '$1').toLowerCase();
                });
        },

        getColors: function () {
            return 'black red orange lightgreen green lightblue blue purple pink gray'.split(' ');
        },

        getTitle: function (data, fallback) {
            return data.title || (data.props ? (data.props.description || data.props.title) : '') || fallback || '';
        },

        add: function (type, plugin, props) {

            // find free id
            var widgets = settings.get('widgets/user', {}),
                widget,
                i = 0, id = type + '_0',
                colors = api.getColors();

            while (id in widgets) {
                id = type + '_' + (++i);
            }

            widget = {
                color: colors[_.random(colors.length - 1)],
                enabled: true,
                id: id,
                index: 0,
                plugin: 'plugins/portal/' + (plugin || type) + '/register',
                props: props || {},
                type: type
            };

            settings.set('widgets/user/' + id, widget).save();

            collection.add(widget);
        },

        removeDisabled: function () {
            collection.remove(
                collection.filter(function (model) {
                    return ext.point('io.ox/portal/widget/' + model.get('type'))
                        .invoke('isEnabled').reduce(reduceBool, true).value() === false;
                })
            );
        },

        toJSON: function () {
            // get latest values
            var widgets = {};
            collection.each(function (model) {
                var id = model.get('id');
                widgets[id] = model.toJSON();
                delete widgets[id].baton;
            });
            return widgets;
        },

        update: function (obj) {
            collection.each(function (model) {
                var id = model.get('id');
                if (id in obj) {
                    model.set(obj[id], { silent: true });
                }
            });
        },

        save: function (widgets) {
            return settings.set('widgets/user', widgets).save();
        }
    };

    collection.reset(api.getSettings());

    collection.on('change', function () {
        api.save(api.toJSON());
    });

    collection.on('remove', function (model) {
        settings.remove('widgets/user/' + model.get('id')).save();
    });

    return api;
});
