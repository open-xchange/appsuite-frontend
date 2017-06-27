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

/**
 * If you need to set a non user setting, you can use this function to set it.
 * Example: setSetting('io.ox/mail', 'features/unseenFolder', true);
 * @param module {string} for example mail, calender, contacts etc.
 * @param name {string} the settings name
 * @param value {boolean|number|string|object} the value for the setting
 */
exports.command = function (module, name, value) {

    this
        .timeoutsAsyncScript(5000)
        .executeAsync(function (module, name, valueStr, done) {
            require(['settings!' + module], function (settings) {
                settings.set(name, JSON.parse(valueStr));
                done(true);
            }, function () {
                done(false);
            });
        }, [module, name, JSON.stringify(value)], function (result) {
            if (result.value === false) this.assert.fail('not found', 'settings!' + module, util.format('Failed to save %s=%s in module %s.', name, value, module));
        });

    return this;

};
