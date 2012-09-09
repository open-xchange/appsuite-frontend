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
                              'gettext!io.ox/tasks/actions',
                              'io.ox/core/notifications'], function (ext, links, gt, notifications) {

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
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                //build popup
                var popup = new dialogs.ModalDialog()
                    .addPrimaryButton('delete', gt('delete'))
                    .addButton('cancel', gt('Cancel'));
                
                //Header
                popup.getBody()
                    .append($("<span>")
                            .text(gt('Do you really want to delete this task?')));
                
                //go
                popup.show().done(function (action) {
                    if (action === 'delete') {
                        require(['io.ox/tasks/api'], function (api) {
                            api.erase(data.last_modified, data.id, data.folder_id)
                                .done(function (data) {
                                    
                                    if (!data) {
                                        notifications.yell('success', gt('Task was deleted!'));
                                    } else {//task was modified
                                        notifications.yell('fail', gt('Failure! Please refresh.'));
                                    }
                                });
                        });
                    }
                });
            });
        }
    });
    
    new Action('io.ox/tasks/actions/done', {
        id: 'done',
        action: function (data) {
            require(['io.ox/tasks/api'], function (api) {
                api.update(data.last_modified, data.id, {status: 3}, data.folder_id)
                    .done(function (data) {
                        notifications.yell('success', gt('Done!'));
                    });
            });
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