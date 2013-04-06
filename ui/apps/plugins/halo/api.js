/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

// TODO: Caching?

define.async('plugins/halo/api',
    ['io.ox/core/http',
     'io.ox/core/config',
     'plugins/halo/config',
     'io.ox/core/extensions'
    ], function (http, config, haloConfigUtil, ext) {

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
        this.investigate = function (contact) {
            var investigationMap = {};
            // Send a request for every active provider
            var myProviders = providerFilter.filterProviders(activeProviders);
            _(myProviders).each(function (providerName) {
                // Construct the basic request
                var request = {
                    module: 'halo/contact',
                    params: {
                        action: 'investigate',
                        provider: providerName
                    },
                    appendColumns: false,
                    contact: contact
                };
                // Let extensions enhance the request with additional parameters
                requestEnhancementPoint.each(function (ext) {
                    if (!ext.enhances(providerName)) {
                        return;
                    }
                    var updatedRequest = ext.enhance(request, providerName);
                    if (updatedRequest) {
                        request = updatedRequest;
                    }
                });
                // Read back the contact in case it was modified by an extension point
                contact = request.contact;
                delete request.contact;

                request.data = contact;

                // have the http module handle the request and put the deferred into the map
                investigationMap[providerName] = http.PUT(request);
            });
            return investigationMap;
        };
    }

    function HaloView() {

        var rendererPoint = ext.point('io.ox/halo/contact:renderer');

        this.filterProviders = function (providers) {
            var filtered = [];

            _(providers).each(function (providerName) {
                rendererPoint.each(function (ext) {
                    if (ext.handles(providerName)) {
                        filtered.push(providerName);
                    }
                });
            });

            return filtered;
        };

        this.draw = function ($node, providerName, data) {
            $node = $($node);
            var deferreds = [];
            rendererPoint.each(function (ext) {
                if (ext.handles(providerName)) {
                    var deferred = ext.draw($node, providerName, data);
                    if (deferred) {
                        deferreds.push(deferred);
                    }
                }
            });
            return $.when.apply($, deferreds);
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
        .pipe(function (list) {
            // TODO: remove; temp.fix for sequence
            list = _(list).without('com.openexchange.halo.contacts');
            list.unshift('com.openexchange.halo.contacts');
            var providerConfig = config.get('ui.halo.providers');
            activeProviders = haloConfigUtil.interpret(providerConfig, list);
            // publish api!
            return api;
        });
});
