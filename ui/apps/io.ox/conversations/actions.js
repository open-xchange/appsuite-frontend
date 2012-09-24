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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/conversations/actions", ["io.ox/core/extensions", "io.ox/core/extPatterns/links"], function (ext, links) {

    "use strict";

    // actions

    ext.point("io.ox/conversations/actions/create").extend({
        index: 100,
        id: "create",
        action: function (data) {
            require(["io.ox/conversations/api"], function (api) {
                api.create("");
            });
        }
    });

    // links

    ext.point("io.ox/conversations/links/toolbar").extend(new links.Button({
        index: 100,
        id: "create",
        label: "Start new conversation",
        cssClasses: 'btn btn-primary',
        ref: "io.ox/conversations/actions/create"
    }));

});