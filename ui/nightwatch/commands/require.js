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
 * This is a helper function, if you need to change something inside the appsuite code.
 * This should only be used if really necessary. Usually, everything could be achieved by simulating that user action.
 * Example: .require(['io.ox/core/folder/api'], function (api) { // do something });
 * Please note, that the callback of the require is running inside the client environment and has no access to the variables from the test.
 * @param packages {array}
 * @param callback {function}
 */
exports.command = function (packages, callback) {
    // make sure, packages is an array
    packages = [].concat(packages);
    // make sure, callback exists
    if (!callback) callback = function () {};

    this
        .timeoutsAsyncScript(2000)
        .executeAsync(function (pkgs, cbStr, done) {
            require(pkgs, function () {
                // Receive the callback from the outer function as string, because the function arguments cannot be passed from Node to the browser
                // Eval the string of the function to receive the original function.
                var cb;
                /*eslint no-eval: 0*/
                eval('cb = ' + cbStr);
                if (cb && typeof cb === 'function') cb.apply(this, arguments);
                done();
            });
        }, [packages, callback.toString()], function (data) {
            if (data.error) console.error(data);
        });

    return this;

};
