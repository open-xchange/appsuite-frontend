/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define("io.ox/office/actions",
    ["io.ox/core/extensions",
     "io.ox/core/extPatterns/links",
     "io.ox/files/api",
     "gettext!io.ox/office/main"], function (ext, links, api, gt) {

    'use strict';

    // imports

    var Action = links.Action;
    var Link = links.Link;

    // actions

    new Action('io.ox/office/actions/save', {
        id: 'save',
        action: function (app) {
            app.save();
            api.update(app.getFileDescriptor()).done();
        }
    });

    // links

    ext.point('io.ox/office/links/toolbar').extend(new Link({
        index: 100,
        id: "save",
        label: gt("Save"),
        ref: "io.ox/office/actions/save"
    }));

});
