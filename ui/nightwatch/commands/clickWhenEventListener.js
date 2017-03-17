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

exports.command = function (selector, eventType, wait) {

    wait = wait || 500;

    this
        .timeoutsAsyncScript(wait + 1000)
        .executeAsync(function (selector, eventType, wait, done) {
            var start = new Date().getTime(),
                pid = setInterval(function () {
                    var now = new Date().getTime(),
                        ev = $._data(document.querySelector(selector), 'events');
                    if (ev[eventType]) {
                        clearInterval(pid);
                        $(selector).click();
                        return done(true);
                    }
                    // wait time is over
                    if (now - start > wait) {
                        clearInterval(pid);
                        return done(false);
                    }
                }, 500);
        }, [selector, eventType, wait], function (result) {
            if (!result || result.value !== true) this.assert.fail('not found', eventType, 'Timedout while waiting for "' + selector + '" to have event type "' + eventType + '".');
        });

    return this;

};
