/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("plugins/halo/linkedIn/register", ["io.ox/core/extensions"], function (ext) {

    "use strict";

    ext.point("io.ox/halo/contact:renderer").extend({

        id: "linkedin",

        handles: function (type) {
            return type === 'com.openexchange.halo.linkedIn.fullProfile';
        },

        draw: function (baton) {

            var node = this, def = $.Deferred();

            require(["plugins/halo/linkedIn/view-halo", "less!io.ox/linkedIn/style.less"], function (base) {
                var data = baton.data.values ? baton.data.values[0] : baton.data;
                node.append(base.draw(data));
                def.resolve();
            });

            return def;
        }
    });
});
