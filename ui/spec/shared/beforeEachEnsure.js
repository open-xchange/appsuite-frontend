/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('beforeEachEnsure', function () {

    'use strict';

    //wrapper for beforeEach
    //callback is executed only once
    //hint: context is passed through
    //hint: for async callbacks simply return a deferred
    function ensure (cb) {
        var def;
        beforeEach.call(this, function (done) {
            def = (def || cb.call(this) || $.Deferred().resolve());
            //async vs. sync
            if (!!def.done)
                def.done(done);
            else
                done();
        });
    }

    return ensure;
});
