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
	var DEV_PLUGINS = [];

    // application object
    var availablePlugins = _(manifests.manager.pluginsFor('portal')).uniq().concat(DEV_PLUGINS),
        collection = new Backbone.Collection([]);

    collection.comparator = function (a, b) {
        return ext.indexSorter({ index: a.get('index') }, { index: b.get('index') });
    };

    var api = {

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
                    return (obj.enabled === undefined || obj.enabled === true) && _(availablePlugins).contains(obj.plugin);
                })
                .value();
        },

        loadPlugins: function () {
            return require(availablePlugins);
        },

        getAllTypes: function () {
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
        },

        getColors: function () {
            return 'black red orange lightgreen green lightblue blue purple pink gray'.split(' ');
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
                plugin: 'plugins/portal/' + plugin + '/register',
                props: props || {},
                type: type
            };

            settings.set('widgets/user/' + id, widget).save();

            collection.add(widget);
        }
    };

    collection.reset(api.getSettings());

    return api;
});
