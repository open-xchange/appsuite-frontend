/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/upsell', [
    'io.ox/core/capabilities',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (capabilities, settings, gt) {

    'use strict';

    function showUpgradeDialog(options) {
        console.debug('upsell:requires-upgrade', options);
        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            new dialogs.ModalDialog()
                .build(function () {
                    this.getHeader().append(
                        $('<h4>').text(gt('Upgrade required'))
                    );
                    this.getContentNode().append(
                        $.txt(gt('This feature is not available. In order to use it, you need to upgrade your account now.')),
                        $.txt(' '),
                        $.txt(gt('The first 90 days are free.'))
                    );
                    this.addPrimaryButton('upgrade', gt('Get free upgrade'));
                    this.addButton('cancel', gt('Cancel'));
                })
                .setUnderlayStyle({
                    opacity: 0.70,
                    backgroundColor: '#08C'
                })
                .on('upgrade', function () {
                    ox.trigger('upsell:upgrade', options);
                })
                .on('show', function () {
                    ox.off('upsell:requires-upgrade', showUpgradeDialog);
                })
                .on('close', function () {
                    ox.on('upsell:requires-upgrade', showUpgradeDialog);
                })
                .show();
        });
    }

    function upgrade(options) {
        console.debug('upsell:upgrade', options);
        // needs no translation; just for demo purposes
        /*eslint-disable no-alert*/
        alert('User decided to upgrade! (global event: upsell:upgrade)');
        /*eslint-enable no-alert */
    }

    // local copy for speed
    var enabled = settings.get('upsell/enabled') || {},
        capabilityCache = {},
        enabledCache = {};

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
        visible: function (array) {
            if (!array) return true;
            return _([].concat(array)).reduce(function (memo, capability) {
                return memo || capability === undefined || that.enabled(capability) || that.has(capability);
            }, false);
        },

        // checks if upsell is enabled for a set of capabilities
        // true if at least one set matches
        enabled: (function () {

            // checks if upsell is enabled for a single capability
            function isEnabled(capability) {
                if (!_.isString(capability)) return false;

                return !!enabled[capability];
            }

            return function () {
                // you can pass separate arguments as arrays and if two operands are not connected by an operator an && is automatically inserted
                var condition = _(arguments).flatten().join(' || ').replace(/([^&\|]) ([^&\|])/gi, '$1 && $2');
                condition = condition.replace(/[a-z_:-]+/ig, function (match) {
                    match = match.toLowerCase();
                    return isEnabled(match);
                });
                /*eslint no-new-func: 0*/
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
        // flag helps during development of custom upsell wizard; just diables some capabilites but
        // neither registers events nor adds portal plugin
        demo: function (debugCustomWizard) {
            var e = enabled, c = capabilityCache;
            e.portal = e.webmail = e.contacts = e.calendar = e.infostore = e.tasks = e.publication = e.subscription = e.carddav = e.active_sync = true;
            c.portal = c.webmail = c.contacts = true;
            c.calendar = c.infostore = c.tasks = c.active_sync = c['active_sync || caldav || carddav'] = false;
            c.publication = c.subscription = false;
            settings.set('features/upsell/secondary-launcher', { icon: 'fa-star fa-star fa-star', color: '#ff0' });
            settings.set('features/upsell/portal-widget', { imageURL: 'http://lorempixel.com/400/300/' });
            settings.set('features/upsell/folderview/mail/i18n/en_US', { title: 'Custom english title for synchronizing mails.' });
            settings.set('features/upsell/topbar-dropdown', { color: '#f00' });
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
        if (hash.indexOf('upsell') > -1) {
            that.demo();
        }

    }());

    return that;

});
