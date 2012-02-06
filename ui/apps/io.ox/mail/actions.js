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

define('io.ox/mail/actions',
        ['io.ox/core/extensions',
         'io.ox/core/config'], function (ext, config) {

    'use strict';

    var defaultDraftFolder = config.get('modules.mail.defaultFolder.drafts');

    // actions

    ext.point('io.ox/mail/actions/compose').extend({
        id: 'compose',
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.compose();
                });
            });
        }
    });

    ext.point('io.ox/mail/actions/delete').extend({
        id: 'delete',
        requires: function (context) {
            return context.collection.has('some', 'delete');
        },
        action: function (data) {
            console.debug('Action: delete');
            //api.remove(grid.selection.get());
            //grid.selection.selectNext();
        }
    });

    ext.point('io.ox/mail/actions/reply-all').extend({
        id: 'reply-all',
        requires: function (context) {
            return context.collection.has('some') && context.context.folder_id !== defaultDraftFolder;
        },
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.replyall(data);
                });
            });
        }
    });

    ext.point('io.ox/mail/actions/reply').extend({
        id: 'reply',
        requires: function (context) {
            return context.collection.has('some') && context.context.folder_id !== defaultDraftFolder;
        },
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.reply(data);
                });
            });
        }
    });

    ext.point('io.ox/mail/actions/forward').extend({
        id: 'forward',
        requires: function (context) {
            return context.collection.has('some');
        },
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.forward(data);
                });
            });
        }
    });

    ext.point('io.ox/mail/actions/edit').extend({
        id: 'edit',
        requires: function (context) {
            return context.context.folder_id === defaultDraftFolder;
        },
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    var self = this;
                    this.compose(data).done(function () {
                        self.setMsgRef(data.folder_id + '/' + data.id);
                        self.markClean();
                    });
                });
            });
        }
    });


    ext.point('io.ox/mail/actions/source').extend({
        id: 'edit',
        requires: function (context) {
            return context.context.folder_id !== defaultDraftFolder;
        },
        action: function (data) {
            require(["io.ox/mail/api"], function (api) {
                // get contact picture
                api.getSource(data).done(function (srcData) {

                    require(["io.ox/core/tk/dialogs"], function (dialogs) {
                        var dialog = new dialogs.ModalDialog()
                            .addButton("ok", "OK");

                        dialog.getContentNode().append($('<pre>').text(srcData));

                        dialog.show();
                    });
                });
            });
        }
    });

    // toolbar

    ext.point('io.ox/mail/links/toolbar').extend(new ext.Link({
        index: 100,
        id: 'compose',
        label: 'Compose new email',
        ref: 'io.ox/mail/actions/compose'
    }));

    // inline links

    ext.point('io.ox/mail/links/inline').extend(new ext.Link({
        index: 100,
        id: 'reply-all',
        label: 'Reply All',
        ref: 'io.ox/mail/actions/reply-all'
    }));

    ext.point('io.ox/mail/links/inline').extend(new ext.Link({
        index: 200,
        id: 'reply',
        label: 'Reply',
        ref: 'io.ox/mail/actions/reply'
    }));

    ext.point('io.ox/mail/links/inline').extend(new ext.Link({
        index: 300,
        id: 'forward',
        label: 'Forward',
        ref: 'io.ox/mail/actions/forward'
    }));

    ext.point('io.ox/mail/links/inline').extend(new ext.Link({
        index: 400,
        id: 'edit',
        label: 'Edit',
        ref: 'io.ox/mail/actions/edit'
    }));

    ext.point('io.ox/mail/links/inline').extend(new ext.Link({
        index: 700,
        id: 'source',
        label: 'View Source',
        ref: 'io.ox/mail/actions/source'
    }));

    ext.point('io.ox/mail/links/inline').extend(new ext.Link({
        index: 700,
        id: 'delete',
        label: 'Delete',
        ref: 'io.ox/mail/actions/delete',
        attention: true
    }));

});