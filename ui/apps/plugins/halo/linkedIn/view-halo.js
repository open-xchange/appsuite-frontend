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

define("plugins/halo/linkedIn/view-halo", ["io.ox/linkedIn/view-detail", "less!io.ox/linkedIn/style.less"], function (viewer) {

    "use strict";

    return {
        draw: function (liResponse) {
            var $node = $("<div>").addClass("linkedIn");
            $node.append($("<div>").addClass("widget-title clear-title").text("LinkedIn"));
            if (liResponse.status && liResponse.status === 404) {
                $node.append($("<div>").text("Not found"));
            } else {
                $node.append(viewer.draw(liResponse));
            }
            return $node;

        }
    };
});