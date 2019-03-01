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
                imageplaceholder: 'data:image/png;base64,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'
            },

            'link/driveappinstall': {
                // transparent placeholder; less variable defines url that is used for background image: '@onboarding-driveapp'
                imageplaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
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
            'caldav': gt('CalDAV'),
            'caldav_url': gt('URL'),
            'caldav_login': gt('Login'),
            'carddav': gt('CardDAV'),
            'carddav_url': gt('URL'),
            'carddav_login': gt('Login'),
            // imap
            'imap': gt('IMAP'),
            'imapServer': gt('Server Name'),
            'imapPort': gt('Port'),
            'imapLogin': gt('User Name'),
            'imapSecure': gt('Connection'),
            // smtp
            'smtp': gt('SMTP'),
            'smtpServer': gt('Server Name'),
            'smtpPort': gt('Port'),
            'smtpLogin': gt('User Name'),
            'smtpSecure': gt('Connection'),
            // eas
            'eas': gt('EAS'),
            'eas_url': gt('URL'),
            'eas_login': gt('Login')
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
                matching = this.hash.matching[cid], lasttype;

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
                            .map(function (key) {
                                var type = key.indexOf('_') >= 0 ? key.split('_')[0] : key.substr(0, 4),
                                    injectHeadline = lasttype !== type;
                                lasttype = type;
                                return [
                                    injectHeadline ? { name: COMPLEMENT.labels[type] || type } : undefined,
                                    {
                                        name: COMPLEMENT.labels[key] || key,
                                        // eslint-disable-next-line no-nested-ternary
                                        value: /imapSecure|smtpSecure/.test(key) ? (action.data[key] ? 'SSL/TLS' : 'STARTTLS') : action.data[key],
                                        type: type
                                    }
                                ];
                            })
                            .flatten()
                            .compact()
                            .value();
                    })
                    .value();
        },

        // user data helpers

        getUserMail: function () {
            var user = this.user;
            if (!user) return;
            return user.email1 || user.email2 || user.email3;
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
