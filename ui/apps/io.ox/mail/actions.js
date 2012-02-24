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
         'io.ox/mail/api',
         'io.ox/core/config'], function (ext, api, config) {

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
        id: 'source',
        requires: function (context) {
            return context.context.folder_id !== defaultDraftFolder;
        },
        action: function (data) {
            api.getSource(data).done(function (srcData) {

                require(["io.ox/core/tk/dialogs"], function (dialogs) {
                    var dialog = new dialogs.ModalDialog()
                        .addButton("ok", "OK");

                    dialog.getContentNode().append($('<pre>').text(srcData));
                    dialog.show();
                });
            });
        }
    });

    ext.point('io.ox/mail/actions/markunread').extend({
        id: 'markunread',
        requires: function (context) {
            return _.isEqual(context.context.flags & api.FLAGS.SEEN, api.FLAGS.SEEN);
        },
        action: function (data) {
            api.update(data, {flags: api.FLAGS.SEEN, value: false}).done(function (updateData) {
                api.trigger('refresh.list');
            });
        }
    });

    ext.point('io.ox/mail/actions/markread').extend({
        id: 'markread',
        requires: function (context) {
            return _.isEqual(context.context.flags & api.FLAGS.SEEN, 0);
        },
        action: function (data) {
            api.update(data, {flags: api.FLAGS.SEEN, value: true}).done(function (updateData) {
                api.trigger('refresh.list');
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
        index: 500,
        id: 'markunread',
        label: 'Mark Unread',
        ref: 'io.ox/mail/actions/markunread'
    }));

    ext.point('io.ox/mail/links/inline').extend(new ext.Link({
        index: 501,
        id: 'markread',
        label: 'Mark read',
        ref: 'io.ox/mail/actions/markread'
    }));

    function changeLabel(options, color) {
        console.log('changeLabel', options, color);

        return api.update(options, {color_label: color, value: true}).done(function (updateData) {
            api.trigger('refresh.list');
        });
    }

    ext.point('io.ox/mail/links/inline').extend({
        index: 503,
        id: 'doofesDropDown',
        draw: function (options) {
            var labelList = $('<ul>'),

                dropdown = $('<div>', {
                    'class': 'labeldropdown dropdown'
                }).append(labelList),

                link = $('<a>', {
                    'class': 'io-ox-action-link',
                    //'href': '#',
                    'tabindex': 1,
                    'data-action': 'label'
                }).text('Label')
                .click(function (e) {
                    var linkWidth = link.outerWidth(),
                        dropDownWidth = dropdown.outerWidth(),
                        coords = link.position();
                    dropdown.css('left', coords.left + (linkWidth - dropDownWidth))
                            .css('top', coords.top + link.outerHeight())
                            .css('zIndex', 1)
                            .slideToggle("fast");
                }).blur(function (e) {
                    console.log(e);
                    dropdown.delay(100).slideUp('fast');
                });

            _(api.COLORS).each(function (index, color) {
                var li = $('<li>').text(color).click(function (e) {changeLabel(options, api.COLORS[color]); });
                if (_.isEqual(options.color_label, api.COLORS[color])) {
                    li.addClass('active');
                }
                labelList.append(li);
            });

            this.append(link).append(dropdown);
        }
    });

    ext.point('io.ox/mail/links/inline').extend(new ext.Link({
        index: 600,
        id: 'source',
        label: 'View Source',
        ref: 'io.ox/mail/actions/source'
    }));

    ext.point('io.ox/mail/links/inline').extend(new ext.Link({
        index: 700,
        id: 'delete',
        label: 'Delete',
        ref: 'io.ox/mail/actions/delete',
        special: "danger"
    }));

});