/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

var util = require('util');

exports.command = function (module, name, value) {

    this
        .timeoutsAsyncScript(2000)
        .executeAsync(function (module, name, value, done) {
            require(['settings!' + module], function (settings) {
                settings.set(name, value);
                done(true);
            }, function () {
                done(false);
            });
        }, [module, name, value], function (result) {
            if (result.value === false) this.assert.fail('not found', 'settings!' + module, util.format('Failed to save %s=%s in module %s.', name, value, module));
        });

    return this;

};
