/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/extPatterns/stage', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    var READY = $.when();

    var Stage = function (id, options) {
        // options should have a 'run' function
        ext.point(id).extend(options);
    };

    Stage.run = function (id, baton) {

        var list = ext.point(id).list(), def = $.Deferred();

        function next() {
            if (list.length) {
                try {
                    ((list.shift().run || $.noop)(baton) || READY).then(next, def.reject);
                } catch (e) {
                    console.error('Stage', e.message, 'id', id, 'baton', baton, 'list', list);
                }
            } else {
                def.resolve();
            }
        }

        next();

        return def;
    };

    return Stage;
});
