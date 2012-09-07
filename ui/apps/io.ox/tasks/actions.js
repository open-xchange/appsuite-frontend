/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define("io.ox/tasks/actions", ['io.ox/core/extensions',
                              'io.ox/core/extPatterns/links',
                              'gettext!io.ox/tasks/actions'], function (ext, links, gt) {

    "use strict";
    var Action = links.Action;
    
    new Action('io.ox/tasks/actions/edit', {
        id: 'edit',
        action: function (data) {
            console.log("task edit dummy action fired");
        }
    });
    
    new Action('io.ox/tasks/actions/delete', {
        id: 'delete',
        action: function (data) {
            console.log("task delete dummy action fired");
        }
    });
    
    new Action('io.ox/tasks/actions/done', {
        id: 'done',
        action: function (data) {
            console.log("task done dummy action fired");
        }
    });
    
    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'edit',
        index: 10,
        label: gt("Edit"),
        ref: 'io.ox/tasks/actions/edit'
    }));
    
    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'delete',
        index: 20,
        label: gt("Delete"),
        ref: 'io.ox/tasks/actions/delete'
    }));
    
    ext.point('io.ox/tasks/links/inline').extend(new links.Link({
        id: 'done',
        index: 30,
        label: gt("Done"),
        ref: 'io.ox/tasks/actions/done'
    }));
});