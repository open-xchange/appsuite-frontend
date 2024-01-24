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

define('io.ox/core/upsell', [
    'io.ox/core/capabilities',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (capabilities, settings, gt) {

    'use strict';

    function showUpgradeDialog(options) {
        console.debug('upsell:requires-upgrade', options);
        require(['io.ox/backbone/views/modal'], function (ModalDialog) {
            new ModalDialog({
                title: gt('Upgrade required'),
                description: gt('This feature is not available. In order to use it, you need to upgrade your account now.') + ' ' + gt('The first 90 days are free.')
            })
                .addCancelButton()
                .addButton({ label: gt('Get free upgrade'), action: 'upgrade' })
                .on('upgrade', function () { ox.trigger('upsell:upgrade', options); })
                .on('open', function () {
                    ox.off('upsell:requires-upgrade', showUpgradeDialog);
                    this.$el.next('.modal-backdrop.in:visible').css({ opacity: 0.70, backgroundColor: '#08C' });
                })
                .on('close', function () { ox.on('upsell:requires-upgrade', showUpgradeDialog); })
                .open();
        });
    }

    function upgrade(options) {
        console.debug('upsell:upgrade', options);
        // needs no translation; just for demo purposes
        // eslint-disable-next-line no-alert
        alert('User decided to upgrade! (global event: upsell:upgrade)');
    }

    // local copy for speed
    var enabled = settings.get('upsell/enabled') || {},
        capabilityCache = {},
        enabledCache = {};

    //enabled = { infostore: true }; //uncomment for debugging

    var that = {
        // convenience functions
        trigger: function (options) {
            ox.trigger('upsell:requires-upgrade', options || {});
        },

        // simple click handler
        click: function (e) {
            e.preventDefault();
            that.trigger();
        },

        // find one set of capabilities that matches
        // returns true or false
        any: function (array) {
            if (!array) return true;
            return _([].concat(array)).reduce(function (memo, c) {
                return memo || c === undefined || that.has(c);
            }, false);
        },

        // returns missing capabilities (<string>)
        missing: function (condition) {
            if (!condition) return '';

            condition = [].concat(condition).join(' ');

            return _(condition.match(/!?[a-z_:-]+/ig))
                .filter(function (c) {
                    return !that.has(c);
                })
                .join(' ');
        },

        // bypass for convenience
        has: function (string) {
            if (!string) return true;
            // check cache
            if (string in capabilityCache) return capabilityCache[string];
            // lookup
            return (capabilityCache[string] = capabilities.has(string));
        },

        // checks if something should be visible depending on required capabilites
        // true if any item matches requires capabilites
        // true if any item does not match its requirements but is enabled for upsell
        // this function is used for any inline link, for example, to decide whether or not showing it
        visible: (function () {
            function isEnabled(cap) {
                if (!_.isString(cap)) return false;

                return !!enabled[cap];
            }

            function isEnabledOrHas(cap) {
                var condition = cap.replace(/([^&|]) ([^&|])/gi, '$1 && $2').replace(capabilities.whitelistRegex, '');
                if (ox.debug && /,/.test(condition)) return !!console.error('You can\'t use a comma in a condition use space instead.');
                condition = condition.replace(/[\w:-]+/ig, function (match) {
                    match = match.toLowerCase();
                    return isEnabled(match) || that.has(match);
                });
                /*eslint no-new-func: 0*/
                return new Function('return !!(' + condition + ')')();
            }

            return function (array) {
                var list = _.compact([].concat(array));
                return !list.length || _.reduce(list, function (memo, capability) {
                    // consider egde cases here
                    // for example 'active_sync clientonboarding' with cap['active_sync'] = false and cap['client-onboarding'] = true
                    // and upsell['active_sync'] = true but upsell['cient-onboarding'] = false should return true
                    return memo || isEnabledOrHas(capability);
                }, false);
            };
        })(),

        // checks if upsell is enabled for a set of capabilities
        // true if at least one set matches
        enabled: (function () {
            // checks if upsell is enabled for a single capability
            function isEnabled(capability) {
                if (!_.isString(capability)) return false;

                return !!enabled[capability];
            }

            return function () {
                // example: 'a', 'b || c' -> 'a || b || c'
                // example: 'a b && c' -> 'a && b && c'
                // example: 'a,b' -> invalid
                var condition = _(arguments).flatten().join(' || ').replace(/([^&|]) ([^&|])/gi, '$1 && $2').replace(capabilities.whitelistRegex, '');
                if (ox.debug && /,/.test(condition)) return !!console.error('You can\'t use a comma in a condition use space instead.');
                condition = condition.replace(/[a-z0-9_:-]+/ig, function (match) {
                    match = match.toLowerCase();
                    return isEnabled(match);
                });
                return new Function('return !!(' + condition + ')')();
            };

        }()),

        captureRequiresUpgrade: function () {
            ox.on('upsell:requires-upgrade', showUpgradeDialog);
            that.captureRequiresUpgrade = $.noop;
        },

        captureUpgrade: function () {
            ox.on('upsell:upgrade', upgrade);
            that.captureUpgrade = $.noop;
        },

        useDefaults: function () {
            that.captureRequiresUpgrade();
            that.captureUpgrade();
        },

        // helpful if something goes wrong
        debug: function () {
            console.debug('enabled', enabled, 'capabilityCache', capabilityCache, 'enabledCache', enabledCache);
        },

        // just for demo purposes
        // flag helps during development of custom upsell wizard; just disables some capabilites but
        // neither registers events nor adds portal plugin
        demo: function (debugCustomWizard) {
            var e = enabled, c = capabilityCache;
            e.portal = e.webmail = e.contacts = e.calendar = e.infostore = e.tasks = e.publication = e.subscription = e.carddav = e.active_sync = true;
            c.portal = c.webmail = c.contacts = true;
            c.calendar = c.infostore = c.tasks = c.active_sync = c['active_sync || caldav || carddav'] = false;
            c.publication = c.subscription = false;
            // uncomment the following lines to show the triggers at the bottom of all folderviews.
            // e.caldav = e.boxcom = e.google = e.microsoftgraph = true;
            // c.calendar = c.infostore = true;
            // c.caldav = c.carddav = c['boxcom || google || microsoftgraph'] = false;
            // c.boxcom = c.google = c.microsoftgraph = false;
            // settings.set('upsell/premium/folderView/visible', true);
            settings.set('features/upsell/secondary-launcher', { icon: 'fa-star fa-star fa-star', color: '#ff0' });
            settings.set('features/upsell/portal-widget', { imageURL: 'http://lorempixel.com/400/300/' });
            settings.set('features/upsell/folderview/mail/i18n/en_US', { title: 'Custom english title for synchronizing mails.' });
            settings.set('features/upsell/topbar-dropdown', { color: '#df0000' });
            settings.set('features/upsell/mail-folderview-quota', { upsellLimit: 10 * 1024 * 1024 });
            console.debug('Disabled inline actions regarding calendar, tasks, and files; enabled upsell instead');
            if (!debugCustomWizard) {
                that.useDefaults();
            }
        },

        // for development & debugging
        setEnabled: function (capability) {
            enabled[capability] = true;
        }
    };

    (function () {
        var hash = _.url.hash('demo') || '';
        if (hash.indexOf('upsell') > -1) that.demo();
    }());

    return that;
});
