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

exports.command = function (selector, wait) {

    wait = wait || 500;

    this
        .timeoutsAsyncScript(wait + 1000)
        .executeAsync(function (selector, wait, done) {
            var start = new Date().getTime(),
                pid = setInterval(function () {
                    var now = new Date().getTime();
                    if ($(selector).is(':focus')) {
                        clearInterval(pid);
                        return done(true);
                    }
                    // wait time is over
                    if (now - start > wait) {
                        clearInterval(pid);
                        return done(false);
                    }
                }, 500);
        }, [selector, wait], function (result) {
            if (!result || result.value !== true) this.assert.fail('not found', 'focus', util.format('Timedout while waiting for "%s" to have have focus.', selector));
        });

    return this;

};
