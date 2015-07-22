/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/metrics/adapters/console', [
    'settings!io.ox/core',
    'io.ox/core/extensions'
], function (settings, ext) {

    'use strict';

    if (!settings.get('tracking/console/enabled', false)) return;

    // localstorage event 'database'
    var point = ext.point('io.ox/metrics/adapter'),
        store = {
            hash: JSON.parse(
                localStorage.getItem('metrics.adapter.console.storage') || '{}'
            ),
            show: function () {
                _.each(store.hash, function (list) {
                    console.table(list);
                });
            },
            save: function () {
                localStorage.setItem(
                    'metrics.adapter.console.storage',
                    JSON.stringify(store.hash)
                );
            },
            reset: function () {
                store.hash = {};
                store.save();
            },
            add: function (type, baton) {
                baton = baton || {};
                var id = baton.id || type,
                    data = baton.data,
                    entry =  [id, JSON.stringify(data) ];
                // add to store
                store.hash[type] = store.hash[type] || [];
                store.hash[type].push(entry);
                // save to localstorage
                store.save();
                // output
                console.log(entry);
            }
        };

    // for debugging
    window.metrics = store;

    point.extend({
        id: 'console',
        setup: function () {
            store.add('setup');
        },
        trackEvent: function (baton) {
            store.add('trackEvent', baton);
        },
        trackVisit: function (baton) {
            store.add('trackVisit', baton);
        },
        trackPage: function (baton) {
            store.add('trackPage', baton);
        }
    });

});
