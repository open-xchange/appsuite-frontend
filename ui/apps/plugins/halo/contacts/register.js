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

define("plugins/halo/contacts/register", ["io.ox/core/extensions"], function (ext) {

    "use strict";

    ext.point("io.ox/halo/contact:renderer").extend({
        id: "contacts",
        handles: function (type) {
            return type === "com.openexchange.halo.contacts";
        },
        draw: function  ($node, providerName, contacts) {
            if (contacts.length === 0) {
                return;
            }
            var deferred = new $.Deferred();
            require(["io.ox/contacts/view-detail", "less!io.ox/contacts/style.css"], function (view) {
                $node.append(view.draw(contacts[0]));
                deferred.resolve();
            });
            return deferred;
        }
    });

    ext.point("io.ox/halo/contact:requestEnhancement").extend({
        id: "contacts-request",
        enhances: function (type) {
            return type === "com.openexchange.halo.contacts";
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = "contacts";
        }
    });
});
