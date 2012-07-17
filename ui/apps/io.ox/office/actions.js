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

define('io.ox/office/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'gettext!io.ox/office/main'], function (ext, links, gt) {

    'use strict';

    // imports

    var Action = links.Action,
        Link = links.Link;

    // actions

    new Action('io.ox/office/actions/save', {
        id: 'save',
        action: function (app) { app.save(); }
    });

    new Action('io.ox/office/actions/flush', {
        id: 'flush',
        action: function (app) { app.flush(); }
    });

    new Action('io.ox/office/actions/print', {
        id: 'print',
        action: function (app) { app.print(); }
    });

    // links

    ext.point('io.ox/office/links/toolbar').extend(new Link({
        index: 100,
        id: 'save',
        label: gt('Export Document'),
        ref: 'io.ox/office/actions/save'
    }));

    ext.point('io.ox/office/links/toolbar').extend(new Link({
        index: 110,
        id: 'flush',
        label: gt('Flush'),
        ref: 'io.ox/office/actions/flush'
    }));

    ext.point('io.ox/office/links/toolbar').extend(new Link({
        index: 120,
        id: 'print',
        label: gt('Print'),
        ref: 'io.ox/office/actions/print'
    }));

});
