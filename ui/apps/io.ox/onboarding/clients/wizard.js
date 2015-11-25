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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/onboarding/clients/wizard', [
    'io.ox/onboarding/clients/view',
    'io.ox/onboarding/api'
], function (View, api) {

    'use strict';

    var OnboardingModel = Backbone.Model.extend({
        initialize: function (attributes, options) {
            var data = api.meta();
            // create platforms
            this.set({
                platforms: new Backbone.Collection(options.data.platforms),
                devices: new Backbone.Collection(options.data.devices),
                modules: new Backbone.Collection(options.data.modules),
                services: new Backbone.Collection(options.data.services),
                selections: new Backbone.Collection(options.data.selections),
                teaser: data.teaser
            });
            // merge with static values
            this.get('platforms').add(data.platforms, { merge: true });
            this.get('devices').add(data.devices, { merge: true });
            this.get('modules').add(data.modules, { merge: true });

            // add pseudo data for selections
            this.get('selections').each(function (module) {
                var id = module.get('id');
                module.set('title', id.split('/').slice(2, 3).join('/'));
                module.set('description', id.split('/')[3]);
            });
        },

        getDevicesFor: function (platform) {
            return this.get('devices').filter(function (model) {
                // startsWith
                return model.get('id').indexOf(platform + '.') === 0;
            });
        },

        getSelectionsFor: function (device, module) {
            return this.get('selections').filter(function (model) {
                // startsWith
                return model.get('id').indexOf(device + '/' + module) === 0;
            });
        }

    });
    var model = new OnboardingModel(null, { data: api.config() }),
        view = new View(model);

    return {
        view: view,
        model: model
    };
});
