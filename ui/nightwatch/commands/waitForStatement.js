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

/**
 * A custom command which
 * @param function The statement function. This function is executed in the page environment and the tests block until the function returns true.
 * @param args An array of arguments which should be passed to the function
 * @param timeout {number} optional, default is 5000
 * @param pollInterval {number} optional, default is 500
 * @param errorCallback {function} optional. For the case that the element has not been found, you can use the error callback for a specific error. If no callback is provided, a default error is thrown.
 */
exports.command = function (func, args, timeout, pollInterval, errorCallback) {

    pollInterval = pollInterval || 500;
    timeout = timeout || 5000;

    this
        .timeoutsAsyncScript(timeout + pollInterval)
        .executeAsync(function (funcStr, argStr, timeout, pollInterval, done) {
            var start = new Date().getTime(),
                pid = setInterval(function () {
                    var now = new Date().getTime(), func;
                    /*eslint no-eval: 0*/
                    eval('func = ' + funcStr);
                    if (func.apply(window, JSON.parse(argStr)) === true) {
                        clearInterval(pid);
                        return done(true);
                    }
                    // wait time is over
                    if (now - start > timeout) {
                        clearInterval(pid);
                        return done(false);
                    }
                }, pollInterval);
        }, [func.toString(), JSON.stringify(args), timeout, pollInterval], function (result) {
            if (!result || result.value !== true) {
                if (errorCallback) errorCallback.call(this);
                else this.assert.fail('not satisfied', 'statement', 'Timedout while waiting for a statement in a function to be true.');
            }
        });

    return this;

};
