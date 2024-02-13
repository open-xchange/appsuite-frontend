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

// TODO: Caching?

define.async('plugins/halo/api', [
    'io.ox/core/http',
    'plugins/halo/config',
    'io.ox/core/extensions'
], function (http, haloConfigUtil, ext) {

    'use strict';

    var activeProviders = [],
        api;

    function HaloAPI(options) {

        var providerFilter = options.providerFilter || {
            filterProviders: function (providers) {
                return providers;
            }
        };

        var requestEnhancementPoint = ext.point('io.ox/halo/contact:requestEnhancement');

        // Investigate a contact
        // This will trigger a backend halo call for every active provider
        // extensions in point 'io.ox/halo/contact:requestEnhancement' will have a chance to modify the call
        // returns an Object mapping a provider to a deferred that will eventually provide the data
        // "provider" is optional and reduces lookup to this provider name
        this.investigate = function (obj, provider) {

            var investigationMap = {},
                contact = _.copy(obj);

            // parse user data to contact format
            if (contact.id && contact.contact_id && contact.id !== contact.contact_id) {
                contact.id = contact.contact_id;
                delete contact.contact_id;
            }

            // Send a request for every active provider
            var providers = provider ? [provider] : providerFilter.filterProviders(activeProviders);

            _(providers).each(function (name) {
                // Construct the basic request
                var request = {
                    module: 'halo/contact',
                    params: {
                        action: 'investigate',
                        provider: name,
                        timezone: 'utc'
                    },
                    appendColumns: false,
                    contact: contact
                };
                // Let extensions enhance the request with additional parameters
                requestEnhancementPoint.each(function (ext) {
                    if (!ext.enhances(name)) {
                        return;
                    }
                    var updatedRequest = ext.enhance(request, name);
                    if (updatedRequest) {
                        request = updatedRequest;
                    }
                });
                // Read back the contact in case it was modified by an extension point
                contact = request.contact;
                delete request.contact;
                request.data = contact;
                // have the http module handle the request and put the deferred into the map
                investigationMap[name] = http.PUT(request);
            });

            return provider ? investigationMap[provider] : investigationMap;
        };

        this.refreshServices = function () {
            return http.GET({
                module: 'halo/contact',
                params: {
                    action: 'services'
                }
            })
            .then(function (list) {
                // TODO: remove; temp.fix for sequence
                list = _(list).without('com.openexchange.halo.contacts');
                list.unshift('com.openexchange.halo.contacts');
                activeProviders = list;
                // publish api!
                return api;
            });
        };
    }

    function HaloView() {

        var point = ext.point('io.ox/halo/contact:renderer');

        this.filterProviders = function (providers) {
            var filtered = [];
            _(providers).each(function (providerName) {
                point.each(function (ext) {
                    if (ext.handles(providerName)) {
                        filtered.push(providerName);
                    }
                });
            });
            return filtered;
        };

        this.draw = function (baton) {
            var defs = point.map(function (ext) {
                if (ext.handles(baton.provider)) {
                    return ext.draw.call(baton.ray, baton);
                }
            })
            .compact()
            .value();
            return $.when.apply($, defs);
        };
    }

    var viewer = new HaloView();

    api = {
        halo: new HaloAPI({
            providerFilter: viewer
        }),
        viewer: viewer
    };

    // initialize (async)
    return http.GET({
        module: 'halo/contact',
        params: {
            action: 'services'
        }
    })
    .then(function (list) {
        // TODO: remove; temp.fix for sequence
        list = _(list).without('com.openexchange.halo.contacts');
        list.unshift('com.openexchange.halo.contacts');
        activeProviders = list;
        // publish api!
        return api;
    });
});
