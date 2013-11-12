/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('plugins/halo/linkedIn/register', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    ext.point('io.ox/halo/contact:renderer').extend({

        id: 'linkedin',

        handles: function (type) {
            return type === 'com.openexchange.halo.linkedIn.fullProfile';
        },

        draw: function (baton) {

            var node = this, def = $.Deferred();

            require(['plugins/halo/linkedIn/view-halo', 'less!io.ox/linkedIn/style'], function (base) {
                var data = baton.data.values ? baton.data.values[0] : baton.data;
                node.append(base.draw(data));
                def.resolve();
            });

            return def;
        }
    });
});
