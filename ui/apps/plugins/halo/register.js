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

define("plugins/halo/register", ["io.ox/core/extensions"], function (ext) {

    "use strict";

    ext.point("io.ox/core/person:action").extend({
        index: 10,
        id: "default",
        label: "Halo",
        action: function (data, e) {
            // require detail view, dialogs & all halo extensions
            require(ox.withPluginsFor('plugins/halo', ["plugins/halo/view-detail", "io.ox/core/tk/dialogs"]), function (view, dialogs) {
                new dialogs.SidePopup().show(e, function (popup) {
                    popup.append(view.draw(data));
                });
            });
        }
    });

    ext.point("io.ox/core/resource:action").extend({
        action: function (data, e) {
            // require detail view, dialogs & all halo extensions
            require(['io.ox/core/tk/dialogs', 'io.ox/contacts/view-detail'], function (dialogs, view) {
                    new dialogs.SidePopup().show(e, function (popup) {
                        popup.append(view.draw(data));
                    });
                }
            );
        }
    });

    ext.point("io.ox/testing/suite").extend({
        id: "default",
        file: "plugins/halo/config-test",
        title: "Halo Config"
    });

    // use global click handler
    $('body').on('click', '.halo-link', function (e) {
        e.preventDefault();
        ext.point('io.ox/core/person:action').invoke('action', this, $(this).data(), e);
    });

    $('body').on('click', '.halo-resource-link', function (e) {
        e.preventDefault();
        ext.point('io.ox/core/resource:action').invoke('action', this, $(this).data(), e);
    });
});
