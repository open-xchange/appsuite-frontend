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

define('io.ox/onboarding/main', [
    'io.ox/core/extensions',
    'io.ox/core/tk/wizard',
    'gettext!io.ox/core/onboarding'
], function (ext, Wizard, gt) {
    'use strict';

    var title = gt('Connect your device'),
        wizard;

    var ConnectDeviceView = Backbone.View.extend({

        initialize: function () {

            var options = {
                id: 'connect-wizard',
                title: title
            };
            Wizard.registry.add(options, this.render);
            Wizard.registry.run(options.id);
        },

        render: function () {
            var connectTour = new Wizard();

            connectTour.step({
                id: 'platform',
                back: false,
                next: false,
                minWidth: '600px'
            });

            connectTour.start();
        }
    });

    ext.point('io.ox/onboarding/main').extend({
        id: 'connect-wizard',
        index: 10
    });


    wizard = {
        run: function () {
            console.log(title);
            return new ConnectDeviceView();
        }
    };
    return wizard;

});
