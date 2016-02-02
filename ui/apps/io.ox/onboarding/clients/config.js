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
    'io.ox/onboarding/clients/codes'
], function (api, userAPI, codes) {

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
        return this.order[obj.id] || 1000;
    }

    var config = {

        hash: {},

        types: ['platforms', 'devices', 'scenarios', 'actions', 'matching'],

        props: {
            platform: 'platforms',
            device: 'devices',
            scenario: 'scenarios'
        },

        order: {
            // devices
            'apple.iphone': 101,
            'apple.ipad': 102,
            'apple.mac': 103,
            'android.phone': 201,
            'android.tablet': 202,
            // scenarios
            'eassync': 101,
            'emclientinstall': 102,
            'mailappinstall': 201,
            'mailsync': 202,
            'mailmanual': 203,
            'syncappinstall': 301,
            'davsync': 302,
            'davmanual': 303,
            'drivewindowsclientinstall': 401,
            'driveappinstall': 402,
            'drivemacinstall': 403
        },

        defaults: {
            platforms: {
                'android':  { icon: 'fa-android' },
                'apple':    { icon: 'fa-apple' },
                'windows':  { icon: 'fa-windows' }
            },
            devices: {
                'android.phone':    { icon: 'fa-mobile' },
                'android.tablet':   { icon: 'fa-tablet' },
                'apple.iphone':     { icon: 'fa-mobile' },
                'apple.ipad':       { icon: 'fa-tablet' },
                'apple.mac':        { icon: 'fa-laptop' },
                'windows.phone':    { icon: 'fa-mobile' },
                'windows.desktop':  { icon: 'fa-laptop' }
            },
            scenarios: {
                // combinations
                'eassync':          { icon: ['fa-envelope-o', 'fa-calendar', 'fa-users'] },
                'oxupdaterinstall': { icon: ['fa-envelope-o', 'fa-calendar', 'fa-users'] },
                'emclientinstall':  { icon: ['fa-envelope-o', 'fa-calendar', 'fa-users'] },
                // mail
                'mailappinstall':   { icon: 'fa-envelope-o' },
                'mailsync':         { icon: 'fa-envelope-o' },
                'mailmanual':       { icon: 'fa-envelope-o' },
                // davs
                'davsync':          { icon: ['fa-calendar', 'fa-users'] },
                'syncappinstall':   { icon: ['fa-calendar', 'fa-users'] },
                'davmanual':        { icon: 'fa-wrench' },
                // drive
                'drivewindowsclientinstall':  { icon: 'fa-cloud' },
                'driveappinstall':  { icon: 'fa-cloud' },
                'drivemacinstall':  { icon: 'fa-cloud' }

            }
        },

        load: function () {
            return api.config().then(function (data) {
                // reoder devices and scenarios
                data.devices = _.sortBy(data.devices, getIndexFor, this);
                data.scenarios = _.sortBy(data.scenarios, getIndexFor, this);
                // extend
                _.extend(this, data);
                // user inputs and step progress
                this.model = new Backbone.Model();
                // hash maps and defaults
                _(this.types).each(function (type) {
                    // create hash maps
                    var hash = this.hash[type] = _.toHash(data[type]);
                    // apply defaults (keepa hash and list up-to-date)
                    _.each(this.defaults[type], function (value, key) {
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

        // remove invalid values

        filterInvalid: function (data) {
            var obj = {};
            // device, scenario, action
            _.each(data, function (value, key) {
                var prop = config.props[key];
                // invalid key
                if (!prop) return;
                // invalid value
                if (!config.hash[prop][value]) return;
                obj[key] = value;
            });
            return obj;
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
            return _.chain(this.actions)
                    .filter(function (obj) { return matching.actions.indexOf(obj.id) >= 0; })
                    .sortBy(function (obj) { return matching.actions.indexOf(obj.id); })
                    .value();
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

        getUserCountryCode: function () {
            var user = this.user;
            if (!user) return;
            // iso country code
            return user.locale.slice(3, 5).toUpperCase();
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
