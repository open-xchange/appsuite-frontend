/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Maik Schäfer <maik.schaefer@open-xchange.com>
 */

define('io.ox/onboarding/register', [
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'io.ox/core/capabilities',
    'gettext!io.ox/core/onboarding'
], function (ext, settings, capabilities, gt) {

    'use strict';

    ext.point('io.ox/core/appcontrol/right/settings').extend({
        id: 'connect-wizard',
        index: 200,
        enabled: capabilities.has('client-onboarding'),
        extend: function () {
            if (_.device('smartphone') || !settings.get('onboardingWizard')) return;

            this.link('connect-wizard', gt('Connect your device'), function () {
                require(['io.ox/onboarding/main'], function (wizard) {
                    wizard.load();
                });
            });
        }
    });

    ext.point('io.ox/core/appcontrol/right/account').extend({
        id: 'connect-wizard-mobile',
        index: 120,
        enabled: capabilities.has('client-onboarding'),
        extend: function () {
            if (!_.device('smartphone') || !settings.get('onboardingWizard')) return;

            this.link('connect-wizard-mobile', gt('Connect this device'), function () {
                require(['io.ox/onboarding/main'], function (wizard) {
                    wizard.load();
                });
            });
        }
    });

});
