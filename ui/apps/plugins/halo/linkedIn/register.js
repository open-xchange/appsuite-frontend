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
            return type === "com.openexchange.halo.linkedIn.fullProfile";
        },
        draw: function ($node, providerName, liResponse) {
            var deferred = new $.Deferred();
            require(["plugins/halo/linkedIn/view-halo", "less!io.ox/linkedIn/style.less"], function (base) {
                if (liResponse.values) {
                    liResponse = liResponse.values[0];
                }
                $node.append(base.draw(liResponse));
                deferred.resolve();
            });
            return deferred;
        }
    });
});
