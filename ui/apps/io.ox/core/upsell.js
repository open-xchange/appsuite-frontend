/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/upsell',
    ['settings!io.ox/core',
     'gettext!io.ox/core'], function (settings, gt) {

    'use strict';

    function showUpgradeDialog() {
        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            new dialogs.ModalDialog({ easyOut: true })
                .build(function () {
                    this.getHeader().append(
                        $('<h4>').text(gt('Upgrade'))
                    );
                    this.getContentNode().append(
                        $.txt(gt('This feature is not available. In order to use it, you need to upgrade your account now.')),
                        $.txt(' '),
                        $.txt(gt('The first 90 days are free.'))
                    );
                    this.addPrimaryButton('upgrade', gt('Get free upgrade'));
                })
                .setUnderlayStyle({
                    opacity: 0.80
                })
                .on('upgrade', function () {
                    ox.trigger('upsell:upgrade');
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

    function upgrade() {
        // needs no translation; just for demo purposes
        alert('User decided to upgrade! (global event: upsell:upgrade)');
    }

    var that = {

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
        }
    };

    return that;

});
