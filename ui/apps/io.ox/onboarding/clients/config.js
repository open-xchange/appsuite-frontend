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

define('io.ox/onboarding/clients/config', [
    'io.ox/onboarding/clients/api',
    'io.ox/core/api/user',
    'io.ox/onboarding/clients/defaults',
    'io.ox/onboarding/clients/codes'
], function (api, userAPI, defaults, codes) {

    'use strict';

    function _cid(/*id,id,...*/) {
        var SEP = '/';
        return Array.prototype.join.call(arguments, SEP);
    }

    function compactObject(o) {
        var clone = _.clone(o);
        _.each(clone, function (value, key) {
            if (!_.isSet(value)) delete clone[key];
        });
        return clone;
    }

    function getIndexFor(obj) {
        var order = {
            'apple.iphone': 101,
            'apple.ipad': 102,
            'apple.mac': 103,
            'android.phone': 201,
            'android.tablet': 202,
            'windows.desktop': 301
        };
        return order[obj.id] || 1000;
    }

    var config = {

        hash: {},

        types: ['platforms', 'devices', 'scenarios', 'actions', 'matching'],

        load: function () {
            return api.config().then(function (data) {
                // reoder devices
                data.devices = _.sortBy(data.devices, getIndexFor);
                // extend
                _.extend(this, data);
                // user inputs and step progress
                this.model = new Backbone.Model();
                // hash maps and defaults
                _(this.types).each(function (type) {
                    // create hash maps
                    var hash = this.hash[type] = _.toHash(data[type]);
                    // apply defaults (keepa hash and list up-to-date)
                    _.each(defaults[type], function (value, key) {
                        _.extend(hash[key], value, compactObject(hash[key]));
                    });
                }, this);
                // lazy: get user data
                userAPI.getCurrentUser().then(function (data) {
                    config.user = data.attributes;
                });
                // return config
                return this;
            }.bind(this));
        },

        getState: function () {
            return _.extend({}, this.model.attributes);
        },

        getScenarioCID: function () {
            return _cid(this.model.get('device'), this.model.get('scenario'));
        },

        // user states

        getPlatform: function () {
            return this.hash.platforms[this.model.get('platform')];
        },

        getDevice: function () {
            return this.hash.devices[this.model.get('device')];
        },

        getScenario: function () {
            return this.hash.scenarios[this.model.get('scenario')];
        },

        getAction: function () {
            return this.hash.actions[this.model.get('action')];
        },

        // all

        getPlatforms: function () {
            return this.platforms;
        },

        getDevices: function () {
            var devices = this.devices,
                platform = this.getPlatform();
            if (platform) {
                // agreement: first part of device id matches platform id
                return _.filter(devices, function (obj) {
                    return obj.id.split('.')[0] === platform.id;
                });
            }
            return devices;
        },

        getScenarios: function () {
            var device = this.getDevice(),
                scenarios = this.scenarios;
            if (device) {
                var scenarioIds = device.scenarios;
                return _.filter(scenarios, function (obj) {
                    var cid = _cid(device.id, obj.id);
                    return scenarioIds.indexOf(cid) >= 0;
                });
            }
            return scenarios;
        },

        getActions: function (scenario) {
            var cid = _cid(this.model.get('device'), scenario || this.model.get('scenario')),
                matching = this.hash.matching[cid];

            // TODO: remove after backend added check
            if (!matching) {
                if (ox.debug) console.error('undefined onboarding scenario: ' + cid);
                return;
            }
            return _.filter(this.actions, function (obj) {
                return matching.actions.indexOf(obj.id) >= 0;
            });
        },

        // user data helpers

        getUserMail: function () {
            var user = this.user;
            if (!user) return;
            return user.email1 || user.email3 || user.email3;
        },

        getUserMobile: function () {
            var user = this.user;
            if (!user) return;
            return user.cellular_telephone1 || user.cellular_telephone2;
        },

        isIncomplete: function () {
            var complete = true;
            _.each(this.hash, function (data) {
                complete = complete && !_.isEmpty(data);
            });
            return !complete;
        },

        getCodes: codes.get
    };

    return config;

});
