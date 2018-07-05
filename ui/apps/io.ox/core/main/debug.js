/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/main/debug', [
], function () {
    // enable special logging to investigate why boot fails
    var debug = $.noop;

    if (/\bcore/.test(_.url.hash('debug'))) {
        debug = function () {
            var args = _(arguments).toArray(), t = _.now() - ox.t0;
            args.unshift('core (' + (t / 1000).toFixed(1) + 's): ');
            console.log.apply(console, args);
        };
    }

    return debug;
});
