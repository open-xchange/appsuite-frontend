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

exports.command = function (selector, wait) {

    wait = wait || 500;

    this
        .timeoutsAsyncScript(wait + 1000)
        .executeAsync(function (selector, wait, done) {
            var start = new Date().getTime(),
                pid = setInterval(function () {
                    var now = new Date().getTime(),
                        isVisible = false;
                    try {
                        isVisible = $(selector).is(':visible');
                    } catch (e) {
                        isVisible = $(selector.replace(/::shadow/g, '')).is(':visible');
                    }
                    if (isVisible) {
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
            if (!result || result.value !== true) this.assert.fail('not visible', 'visible', 'Timedout while waiting for "' + selector + '" to to become visible.');
        });

    return this;

};
