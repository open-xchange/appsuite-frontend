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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'gettext!io.ox/contacts/contacts'], function (ext, links, gt) {

    'use strict';

    //  actions
    var Action = links.Action;

    new Action('io.ox/contacts/main/delete', {
        index: 100,
        id: 'delete',
        requires: 'some delete',
        action:  function (data) {
            require(['io.ox/contacts/api', 'io.ox/core/tk/dialogs'], function (api, dialogs) {
                new dialogs.ModalDialog()
                .text('Are you really sure about your decision? Are you aware of all consequences you have to live with?')
                .addPrimaryButton('delete', 'Shut up and delete it!', 'delete')
                .addButton('cancel', 'No, rather not', 'cancel')
                .show()
                .done(function (action) {
                    if (action === 'delete') {
                        api.remove(data);
                    }
                });
            });
        }
    });

    new Action('io.ox/contacts/main/update', {
        index: 100,
        id: 'edit',
        requires: 'one modify',
        action: function (data) {
            if (data.mark_as_distributionlist === true) {
                require(['io.ox/contacts/distrib/main'], function (m) {
                    m.getApp(data).launch().done(function () {
                        this.edit(data);
                    });
                });
            } else {
                require(['io.ox/contacts/util'], function (util) {
                    util.createEditPage(data);
                });
            }
        }
    });

    new Action('io.ox/contacts/main/create', {
        index: 100,
        id: 'create',
		requires: 'create',
        action: function (app) {
            require(['io.ox/contacts/create/main'], function (create) {
                create.show(app).done(function (data) {
                    if (data) {
                        app.getGrid().selection.set(data);
                    }
                });
            });
        }
    });

    new Action('io.ox/contacts/main/distrib', {
        index: 100,
        id: 'create-dist',
		requires: function (e) {
            return e.collection.has('create');
        },
        action: function (app) {
            require(['io.ox/contacts/distrib/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.create(app.folder.get());
                });
            });
        }
    });

    var copyMove = function (type, apiAction, title) {
        return function (list) {
            require(['io.ox/contacts/api', 'io.ox/core/tk/dialogs', 'io.ox/core/tk/folderviews'], function (api, dialogs, views) {
                var dialog = new dialogs.ModalDialog({ easyOut: true })
                    .header($('<h3>').text(title))
                    .addPrimaryButton('ok', gt('OK'))
                    .addButton('cancel', gt('Cancel'));
                dialog.getBody().css('maxHeight', '250px');
                var item = _(list).first(),
                    tree = new views.FolderTree(dialog.getBody(), { type: type });
                tree.paint();
                dialog.show(function () {
                    tree.selection.set({ id: item.folder_id || item.folder });
                })
                .done(function (action) {
                    if (action === 'ok') {
                        var selectedFolder = tree.selection.get();
                        if (selectedFolder.length === 1) {
                            // move action
                            api[apiAction](list, selectedFolder[0].id);
                        }
                    }
                    tree.destroy();
                    tree = dialog = null;
                });
            });
        };
    };

    new Action('io.ox/contacts/main/move', {
        id: 'move',
        requires: 'some delete',
        multiple: copyMove('contacts', 'move', gt('Move'))
    });

    new Action('io.ox/contacts/main/copy', {
        id: 'copy',
        requires: 'some read',
        multiple: copyMove('contacts', 'copy', gt('Copy'))
    });

    //  points

    ext.point('io.ox/contacts/detail/actions').extend(new links.InlineLinks({
        index: 100,
        id: 'inline-links',
        ref: 'io.ox/contacts/links/inline'
    }));

    // toolbar

    ext.point('io.ox/contacts/links/toolbar').extend(new links.Button({
        index: 100,
        id: 'create',
        label: gt('Add contact'),
        cssClasses: 'btn btn-primary',
        ref: 'io.ox/contacts/main/create'
    }));

    ext.point('io.ox/contacts/links/toolbar').extend(new links.Button({
        index: 200,
        id: 'create-dist',
        cssClasses: 'btn btn-primary',
        label: gt('Add distribution list'),
        ref: 'io.ox/contacts/main/distrib'
    }));

    //  inline links

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'update',
        label: gt('Edit'),
        ref: 'io.ox/contacts/main/update'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        index: 200,
        id: 'move',
        label: gt('Move'),
        ref: 'io.ox/contacts/main/move'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        index: 300,
        id: 'copy',
        label: gt('Copy'),
        ref: 'io.ox/contacts/main/copy'
    }));

    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        index: 400,
        prio: 'hi',
        id: 'delete',
        label: gt('Delete'),
        ref: 'io.ox/contacts/main/delete',
        special: 'danger'
    }));
});
