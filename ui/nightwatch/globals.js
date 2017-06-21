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

var chromedriver = require('chromedriver');
module.exports = {
    before: function (done) {
        if (this.test_settings.globals.environment === 'local') chromedriver.start();
        done();
    },
    after: function (done) {
        if (this.test_settings.globals.environment === 'local') return chromedriver.stop();
        done();
    }
};
