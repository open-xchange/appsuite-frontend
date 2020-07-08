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

define('io.ox/onboarding/register', ['io.ox/core/extensions', 'gettext!io.ox/core/onboarding'], function (ext, gt) {

    'use strict';

    ext.point('io.ox/core/appcontrol/right/dropdown').extend({
        id: 'onboarding_new',
        index: 10,
        extend: function () {
            this.link('connect-wizard', gt('Connect Wizard'), function () {
                require(['io.ox/onboarding/main'], function (wizard) {
                    wizard.run();
                });
            });
        }

    });

});
