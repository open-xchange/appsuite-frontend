/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/onboarding/clients/config', [
    'io.ox/onboarding/clients/api',
    'io.ox/core/api/user',
    'io.ox/onboarding/clients/codes',
    'gettext!io.ox/core/onboarding'

], function (api, userAPI, codes, gt) {

    'use strict';

    var COMPLEMENT = {

        stores: (function () {
            var prefix = ox.language.slice(0, 2).toUpperCase(),
                country = _.contains(['EN', 'DE', 'ES', 'FR'], prefix) ? prefix : 'EN';
            return {
                // stores
                'macappstore': {
                    name: gt('Mac App Store'),
                    //#. %1$s: app store name
                    description: gt('Get the App from %1$s.', gt('Mac App Store')),
                    image: 'apps/themes/icons/default/appstore/Mac_App_Store_Badge_' + country + '_165x40.svg'
                },
                'appstore': {
                    name: gt('App Store'),
                    //#. %1$s: app store name
                    description: gt('Get the App from %1$s.', gt('App Store')),
                    image: 'apps/themes/icons/default/appstore/App_Store_Badge_' + country + '_135x40.svg'
                },
                'playstore': {
                    name: gt('Google Play'),
                    //#. %1$s: app store name
                    description: gt('Get the App from %1$s', gt('Google Play')),
                    image: 'apps/themes/icons/default/googleplay/google-play-badge_' + country + '.svg'
                },
                'common': {
                    description: gt('Download the application.')
                }
            };
        })(),

        actiontypes: {
            'email': {
                description: gt('Get your device configured by email.')
            },
            'download': {
                description: gt('Let´s automatically configure your device, by clicking the button below.')
            }
        },

        actions: {
            'link/mailappinstall': {
                // transparent placeholder; less variable defines url that is used for background image: '@onboarding-mailapp'
                imageplaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            },

            'link/driveappinstall': {
                // transparent placeholder; less variable defines url that is used for background image: '@onboarding-driveapp'
                imageplaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            }
        },

        order: {
            // os
            'windows': 101,
            'android': 102,
            'apple': 103,
            // devices
            'windows.desktop': 101,
            'android.phone': 201,
            'android.tablet': 202,
            'apple.iphone': 301,
            'apple.ipad': 302,
            'apple.mac': 303,
            // data
            'caldav_url': 401,
            'caldav_login': 402,
            'carddav_url': 403,
            'carddav_login': 404,
            // imap
            'imapServer': 411,
            'imapPort': 412,
            'imapLogin': 413,
            'imapSecure': 414,
            // smtp
            'smtpServer': 421,
            'smtpPort': 422,
            'smtpLogin': 423,
            'smtpSecure': 424,
            // eas
            'eas_url': 431,
            'eas_login': 432
        },

        labels: {
            // card
            'caldav_url': gt('CalDAV URL'),
            'caldav_login': gt('CalDAV Login'),
            'carddav_url': gt('CardDAV URL'),
            'carddav_login': gt('CardDAV Login'),
            // imap
            'imapServer': gt('IMAP Server'),
            'imapPort': gt('IMAP Port'),
            'imapLogin': gt('IMAP Login'),
            'imapSecure': gt('IMAP Secure'),
            // eas
            // smtp
            'smtpServer': gt('SMTP Server'),
            'smtpPort': gt('SMTP Port'),
            'smtpLogin': gt('SMTP Login'),
            'smtpSecure': gt('SMTP Secure'),
            'eas_url': gt('EAS URL'),
            'eas_login': gt('EAS Login')
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
        }
    };

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
        return COMPLEMENT.order[obj.id] || 1000;
    }

    var mobiledevice = (function () {
        if (_.device('android')) return _.device('smartphone') ? 'android.phone' : 'android.tablet';
        if (_.device('ios')) return _.device('smartphone') ? 'apple.iphone' : 'apple.ipad';
    })();

    var config = {

        hash: {},

        load: function () {
            return api.config(mobiledevice).then(function (data) {
                // reoder devices and scenarios
                data.platforms = _.sortBy(data.platforms, getIndexFor);
                data.devices = _.sortBy(data.devices, getIndexFor);
                // extend
                _.extend(this, data);
                // user inputs and step progress
                this.model = new Backbone.Model();
                // hash maps and defaults
                _('platforms,devices,scenarios,actions,matching'.split(',')).each(function (type) {
                    // create hash maps
                    var hash = this.hash[type] = _.toHash(data[type], 'id');
                    // apply defaults (keep hash and list up-to-date)
                    _.each(COMPLEMENT.defaults[type], function (value, key) {
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
            return _cid(config.getDevice().id, this.model.get('scenario'));
        },

        // user states

        getPlatform: function () {
            if (this.platforms.length === 1) return this.platforms[0];
            return this.hash.platforms[this.model.get('platform')];
        },

        getDevice: function () {
            if (this.devices.length === 1) return this.devices[0];
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
            var device = this.getDevice();
            if (!device) return this.scenarios;
            // respect order for device
            return _.map(device.scenarios, function (id) {
                var base = id.split('/')[1];
                return config.hash.scenarios[base];
            });
        },

        getActions: function (scenario) {
            var cid = _cid(config.getDevice().id, scenario || this.model.get('scenario')),
                matching = this.hash.matching[cid];

            // TODO: remove after backend added check
            if (!matching) {
                if (ox.debug) console.error('undefined onboarding scenario: ' + cid);
                return;
            }
            return _.chain(this.actions)
                    .filter(function (obj) { return matching.actions.indexOf(obj.id) >= 0; })
                    .sortBy(function (obj) { return matching.actions.indexOf(obj.id); })
                    .map(function (obj) {
                        // join and normalize
                        var action = _.extend(_.pick(obj, 'id', 'default', 'data'), { 'scenario': cid }, obj[config.getDevice().id] || {});
                        if (action.type) action.store = { type: action.type };
                        action.type = obj.id.split('/')[0];
                        return action;
                    })
                    .each(function (action) {
                        // add store information
                        if (action.type === 'link') { _.extend(action.store, COMPLEMENT.stores[action.store.type] || {}); }
                        _.extend(action, COMPLEMENT.actiontypes[action.type], COMPLEMENT.actions[action.id]);
                        // prepare properties
                        if (action.type !== 'display') return;
                        action.data = _(Object.keys(action.data))
                            .chain()
                            .sortBy(function (key) { return COMPLEMENT.order[key] || 1000; })
                            .map(function (key) { return { name: COMPLEMENT.labels[key] || key, value: action.data[key] }; })
                            .value();
                    })
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

        getCodes: codes.get,

        find: codes.find
    };

    return config;

});
