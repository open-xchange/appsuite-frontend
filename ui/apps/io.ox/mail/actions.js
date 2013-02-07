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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/mail/actions',
    ['io.ox/core/extensions',
     'io.ox/core/extPatterns/links',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'gettext!io.ox/mail',
     'settings!io.ox/core',
     'io.ox/core/api/folder',
     'io.ox/core/notifications',
     'io.ox/contacts/api',
     'io.ox/core/api/account',
     'io.ox/core/capabilities',
     'settings!io.ox/mail'
    ], function (ext, links, api, util, gt, config, folderAPI, notifications, contactAPI, account, capabilities, settings) {

    'use strict';

    var isDraftFolder = function (folder_id) {
            return _.contains(account.getFoldersByType('drafts'), folder_id);
        },
        isDraftMail = function (mail) {
            return isDraftFolder(mail.folder_id) || ((mail.flags & 4) > 0);
        },
        Action = links.Action;

    // actions

    new Action('io.ox/mail/actions/compose', {
        id: 'compose',
        action: function (baton) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.compose({ folder_id: baton.app.folder.get() });
                });
            });
        }
    });

    new Action('io.ox/mail/actions/delete', {
        id: 'delete',
        requires: 'toplevel some delete',
        multiple: function (list) {
            var check = _(list).any(function (o) {
                return account.is('trash', o.folder_id);
            });
            if (check) {
                var question = gt.ngettext(
                    'Do you really want to permanently delete this mail?',
                    'Do you really want to permanently delete these mails?',
                    list.length
                );
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .text(question)
                        .addPrimaryButton("delete", gt('Delete'))
                        .addButton("cancel", gt('Cancel'))
                        .show()
                        .done(function (action) {
                            if (action === 'delete') {
                                api.remove(list);
                            }
                        });
                });
            } else {
                api.remove(list);
            }
        }
    });

    new Action('io.ox/mail/actions/reply-all', {
        id: 'reply-all',
        requires: function (e) {
            // other recipients that me?
            return e.collection.has('toplevel', 'one') &&
                util.hasOtherRecipients(e.context) && !isDraftMail(e.context);
        },
        action: function (baton) {
            require(['io.ox/mail/write/main'], function (m) {
                if (m.reuse('replyall', baton.data)) return;
                m.getApp().launch().done(function () {
                    this.replyall(baton.data);
                });
            });
        }
    });

    new Action('io.ox/mail/actions/reply', {
        id: 'reply',
        requires: function (e) {
            return e.collection.has('toplevel', 'one') && !isDraftMail(e.context);
        },
        action: function (baton) {
            require(['io.ox/mail/write/main'], function (m) {
                if (m.reuse('reply', baton.data)) return;
                m.getApp().launch().done(function () {
                    this.reply(baton.data);
                });
            });
        }
    });

    new Action('io.ox/mail/actions/forward', {
        id: 'forward',
        requires: function (e) {
            return e.collection.has('toplevel', 'some');
        },
        action: function (baton) {
            require(['io.ox/mail/write/main'], function (m) {
                if (m.reuse('forward', baton.data)) return;
                m.getApp().launch().done(function () {
                    this.forward(baton.data);
                });
            });
        }
    });

    new Action('io.ox/mail/actions/edit', {
        id: 'edit',
        requires: function (e) {
            return e.collection.has('toplevel', 'one') && isDraftMail(e.context);
        },
        action: function (baton) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.edit(baton.data);
                });
            });
        }
    });

    new Action('io.ox/mail/actions/source', {
        id: 'source',
        requires: 'toplevel one',
        action: function (baton) {
            var getSource = api.getSource(baton.data), textarea;
            require(["io.ox/core/tk/dialogs"], function (dialogs) {
                new dialogs.ModalDialog({ easyOut: true, width: 700 })
                    .addPrimaryButton("close", gt("Close"))
                    .header(
                        $('<h4>').text(gt('Mail source') + ': ' + (baton.data.subject || ''))
                    )
                    .append(
                        textarea = $('<textarea class="mail-source-view input-xlarge" rows="15" readonly="readonly">')
                        .on('keydown', function (e) {
                            if (e.which !== 27) {
                                e.stopPropagation();
                            }
                        })
                    )
                    .show(function () {
                        var self = this.busy();
                        getSource.done(function (src) {
                            textarea.val(src || '').css({ visibility: 'visible',  cursor: 'default' });
                            textarea = getSource = null;
                            self.idle();
                        });
                    });
            });
        }
    });

    function moveAndCopy(type, label, success) {

        new Action('io.ox/mail/actions/' + type, {
            id: type,
            requires: 'toplevel some',
            multiple: function (list, baton) {
                var vGrid;
                if (list.length > 1) {
                    vGrid = baton.grid;
                } else {
                    vGrid = baton.app.getGrid();
                }
                require(["io.ox/core/tk/dialogs", "io.ox/core/tk/folderviews"], function (dialogs, views) {
                    var dialog = new dialogs.ModalDialog({ easyOut: true })
                        .header($('<h3>').text(label))
                        .addPrimaryButton("ok", label)
                        .addButton("cancel", gt("Cancel"));
                    dialog.getBody().css({ height: '250px' });
                    var folderId = String(list[0].folder_id),
                        id = settings.get('folderpopup/last') || folderId,
                        tree = new views.FolderTree(dialog.getBody(), {
                            type: 'mail',
                            open: settings.get('folderpopup/open', []),
                            toggle: function (open) {
                                settings.set('folderpopup/open', open).save();
                            },
                            select: function (id) {
                                settings.set('folderpopup/last', id).save();
                            }
                        });
                    dialog.show(function () {
                        tree.paint().done(function () {
                            tree.select(id);
                        });
                    })
                    .done(function (action) {
                        if (action === 'ok') {
                            var target = _(tree.selection.get()).first();
                            if (target && target !== folderId) {
                                if (type === "move" && vGrid) {//add busy animation
                                    vGrid.busy();
                                }
                                api[type](list, target).then(
                                    function () {
                                        notifications.yell('success', success);
                                        folderAPI.reload(target, list);
                                        if (type === "move" && vGrid) {//remove busy animation
                                            vGrid.idle();
                                        }
                                    },
                                    notifications.yell
                                );
                            }
                        }
                        tree.destroy();
                        tree = dialog = null;
                    });
                });
            }
        });
    }

    moveAndCopy('move', gt('Move'), gt('Mails have been moved'));
    moveAndCopy('copy', gt('Copy'), gt('Mails have been copied'));

    new Action('io.ox/mail/actions/markunread', {
        id: 'markunread',
        requires: function (e) {
            return api.getList(e.context).pipe(function (list) {
                var bool = e.collection.has('toplevel') &&
                    _(list).reduce(function (memo, data) {
                        return memo && (data && (data.flags & api.FLAGS.SEEN) === api.FLAGS.SEEN);
                    }, true);
                return bool;
            });
        },
        multiple: function (list) {
            api.markUnread(list).done(function () {
                api.trigger("add-unseen-mails", list); //create notifications in notification area
            });
        }
    });

    new Action('io.ox/mail/actions/markread', {
        id: 'markread',
        requires: function (e) {
            return api.getList(e.context).pipe(function (list) {
                var bool = e.collection.has('toplevel') &&
                    _(list).reduce(function (memo, data) {
                        return memo || (data && (data.flags & api.FLAGS.SEEN) === 0);
                    }, false);
                return bool;
            });
        },
        multiple: function (list) {
            api.markRead(list).done(function () {
                api.trigger("remove-unseen-mails", list); //remove notifications in notification area
            });
        }
    });

    new Action('io.ox/mail/actions/markspam', {
        id: 'marspam',
        requires: function (e) {
            return api.getList(e.context).pipe(function (list) {
                var bool = e.collection.has('toplevel') &&
                    _(list).reduce(function (memo, data) {
                        return memo || (data && (data.flags & api.FLAGS.SPAM) === 0);
                    }, false);
                return bool;
            });
        },
        multiple: function (list) {
            api.markSpam(list);
        }
    });

    new Action('io.ox/mail/actions/preview-attachment', {
        id: 'preview',
        requires: function (e) {
            return require(['io.ox/preview/main'])
                .pipe(function (p) {
                    var list = _.getArray(e.context);
                    // is at least one attachment supported?
                    return e.collection.has('some') && _(list).reduce(function (memo, obj) {
                        return memo || new p.Preview({
                            filename: obj.filename,
                            mimetype: obj.content_type
                        })
                        .supportsPreview();
                    }, false);
                });
        },
        multiple: function (list) {
            // open side popup
            var e = $.Event();
            e.target = this;
            require(['io.ox/core/tk/dialogs', 'io.ox/preview/main'], function (dialogs, p) {
                new dialogs.SidePopup().show(e, function (popup) {
                    _(list).each(function (data, i) {
                        var pre = new p.Preview({
                            data: data,
                            filename: data.filename,
                            parent: data.parent,
                            mimetype: data.content_type,
                            dataURL: api.getUrl(data, 'view')
                        }, {
                            width: popup.parent().width(),
                            height: 'auto'
                        });
                        if (pre.supportsPreview()) {
                            popup.append(
                                $('<h4>').addClass('mail-attachment-preview').text(data.filename)
                            );
                            pre.appendTo(popup);
                            popup.append($('<div>').text('\u00A0'));
                        }
                    });
                });
            });
        }
    });

    new Action('io.ox/mail/actions/open-attachment', {
        id: 'open',
        requires: 'some',
        multiple: function (list) {
            _(list).each(function (data) {
                var url = api.getUrl(data, 'view');
                window.open(url);
            });
        }
    });

    new Action('io.ox/mail/actions/slideshow-attachment', {
        id: 'slideshow',
        requires: function (e) {
            return e.collection.has('multiple') && _(e.context).reduce(function (memo, obj) {
                return memo && (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
            }, true);
        },
        multiple: function (list) {
            require(['io.ox/files/carousel'], function (slideshow) {
                var files = _(list).map(function (file) {
                    return {
                        url: api.getUrl(file, 'view'),
                        filename: file.filename
                    };
                });
                slideshow.init({
                    fullScreen: false,
                    baton: {allIds: files},
                    attachmentMode: true
                });
            });
        }
    });

    new Action('io.ox/mail/actions/download-attachment', {
        id: 'download',
        requires: 'some',
        multiple: function (list) {
            var url;
            if (list.length === 1) {
                // download single attachment
                url = api.getUrl(_(list).first(), 'download');
            } else {
                // download zip file
                url = api.getUrl(list, 'zip');
            }
            window.open(url);
        }
    });

    new Action('io.ox/mail/actions/save-attachment', {
        id: 'save',
        requires: function (e) {
            return e.collection.has('some') && capabilities.has('infostore');
        },
        multiple: function (list) {
            notifications.yell('info', 'Attachments will be saved!');
            api.saveAttachments(list)
                .done(function (data) {
                    notifications.yell('success', 'Attachments have been saved!');
                })
                .fail(notifications.yell);
        }
    });

    new Action('io.ox/mail/actions/save', {
        id: 'saveEML',
        requires: 'some',
        multiple: function (data) {
            window.open(api.getUrl(data, 'eml'));
        }
    });

    new Action('io.ox/mail/actions/add-to-portal', {
        require: function (e) {
            return e.collection.has('one') && capabilities.has('!disablePortal');
        },
        action: function (baton) {
            require(['io.ox/portal/widgets'], function (widgets) {
                widgets.add('stickymail', 'mail', {
                    id: baton.data.id,
                    folder_id: baton.data.folder_id,
                    title: baton.data.subject
                });
                notifications.yell('success', gt('This mail has been added to the portal'));
            });
        }
    });

    // all actions

    new Action('io.ox/mail/actions/sendmail', {
        requires: 'some',
        action: function (baton) {

            var data = baton.data,
                recipients = data.to.concat(data.cc).concat(data.from);

            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.compose({ folder_id: data.folder_id, to: recipients });
                });
            });
        }
    });

    new Action('io.ox/mail/actions/createdistlist', {
        id: 'create-distlist',
        requires: function (e) {
            return e.collection.has('some') && capabilities.has('contacts');
        },
        action: function (baton) {

            var data = baton.data,
                collectedRecipientsArray = data.to.concat(data.cc).concat(data.from),
                collectedRecipients = [],
                dev = $.Deferred(),
                arrayOfMembers = [],
                currentId = ox.user_id,
                lengthValue,
                contactsFolder = config.get('folder/contacts'),

                createDistlist = function (members) {
                    require(['io.ox/contacts/distrib/main'], function (m) {
                        m.getApp().launch().done(function () {
                            this.create(contactsFolder, {distribution_list: members});
                        });
                    });
                };

            _(collectedRecipientsArray).each(function (single) {
                collectedRecipients.push(single[1]);
            });

            lengthValue = collectedRecipients.length;

            _(collectedRecipients).each(function (mail, index) {
                contactAPI.search(mail).done(function (obj) {

                    var currentObj = (obj[0]) ? {id: obj[0].id, folder_id: obj[0].folder_id, display_name: obj[0].display_name, mail: obj[0].email1, mail_field: 1} : {mail: mail, display_name: mail, mail_field: 0};

                    if (obj[0]) {
                        if (obj[0].internal_userid !== currentId) {
                            arrayOfMembers.push(currentObj);
                        } else {
                            lengthValue = lengthValue - 1;
                        }
                    } else {
                        arrayOfMembers.push(currentObj);
                    }

                    if (arrayOfMembers.length === lengthValue) {
                        dev.resolve();
                    }
                });
            });

            dev.done(function () {
                createDistlist(arrayOfMembers);
            });
        }
    });

    new Action('io.ox/mail/actions/invite', {
        id: 'invite',
        requires: function (e) {
            return e.collection.has('some') && capabilities.has('calendar');
        },
        action: function (baton) {
            var data = baton.data,
                collectedRecipients = [],
                participantsArray = [],
                currentId = ox.user_id,
                currentFolder = config.get('folder/calendar'),
                collectedRecipientsArray = data.to.concat(data.cc).concat(data.from),
                dev = $.Deferred(),
                lengthValue,
                createCalendarApp = function (participants, notetext) {
                    require(['io.ox/calendar/edit/main'], function (m) {
                        m.getApp().launch().done(function () {
                            var initData = {participants: participants, title: notetext, folder_id: currentFolder};
                            this.create(initData);
//                             to set Dirty
                            this.model.toSync = initData;
                        });
                    });
                };

            _(collectedRecipientsArray).each(function (single) {
                collectedRecipients.push(single[1]);
            });

            lengthValue = collectedRecipients.length;

            _(collectedRecipients).each(function (mail, index) {
                contactAPI.search(mail).done(function (obj) {
                    var currentObj = (obj[0]) ? obj[0] : {email1: mail, display_name: mail},
                        internalUser = {id: currentObj.internal_userid, type: 1},
                        externalUser = {type: 5, display_name: currentObj.display_name, mail: currentObj.email1};

                    if (currentObj.internal_userid !== currentId) {
                        if (currentObj.internal_userid !== undefined && currentObj.internal_userid !== 0) {
                            participantsArray.push(internalUser);
                        } else if (currentObj.internal_userid === 0) {
                            participantsArray.push(externalUser);
                        } else {
                            participantsArray.push(externalUser);
                        }
                    } else {
                        lengthValue = lengthValue - 1;
                    }

                    if (participantsArray.length === lengthValue) {
                        dev.resolve();
                    }
                });
            });

            dev.done(function () {
                createCalendarApp(participantsArray, data.subject);
            });
        }
    });

    new Action('io.ox/mail/actions/reminder', {
        id: 'reminder',
        requires: function () {
            return capabilities.has('tasks');
        },
        action: function (baton) {
            var data = baton.data;
            require(['io.ox/core/tk/dialogs', 'io.ox/tasks/api', 'io.ox/tasks/util'], function (dialogs, taskApi, tasksUtil) {
                //create popup dialog
                var popup = new dialogs.ModalDialog()
                    .addPrimaryButton('create', gt('Create reminder'))
                    .addButton('cancel', gt('Cancel'));

                //Header
                popup.getHeader()
                    .append($("<h4>")
                            .text(gt('Remind me')));

                //fill popup body
                var popupBody = popup.getBody();

                popupBody.append($('<div>').text(gt('Subject')));
                var titleInput = $('<input>', { type: 'text', value: gt('Mail reminder') + ': ' + data.subject, width: '90%' })
                    .focus(function () {
                            this.select();
                        })
                    .appendTo(popupBody);

                popupBody.append("<div>" + gt('Note') + "</div>");
                var noteInput = $('<textarea>', { width: '90%', rows: "5", value: gt('Mail reminder for') + ": " + data.subject + " \n" +
                    gt('From') + ": " + util.formatSender(data.from[0][0], data.from[0][1]) })
                    .focus(function ()
                            {
                            this.select();
                        })
                    .appendTo(popupBody);

                popupBody.append("<div>" + gt('Remind me') + "</div>");
                var dateSelector = $('<select>', {name: "dateselect"})
                .appendTo(popupBody);
                var endDate = new Date();
                dateSelector.append(tasksUtil.buildDropdownMenu(endDate));

                //ready for work
                var def = popup.show();
                titleInput.focus();
                def.done(function (action) {
                    if (action === "create") {

                        //Calculate the right time
                        var dates = tasksUtil.computePopupTime(endDate, dateSelector.find(":selected").attr("finderId"));

                        taskApi.create({title: titleInput.val(),
                            folder_id: config.get('folder/tasks'),
                            end_date: dates.endDate.getTime(),
                            start_date: dates.endDate.getTime(),
                            alarm: dates.alarmDate.getTime(),
                            note: noteInput.val(),
                            status: 1,
                            recurrence_type: 0,
                            percent_completed: 0
                        })
                        .done(function () {
                            notifications.yell('success', gt('Reminder has been created'));
                        });
                    }
                });
            });
        }
    });

    // toolbar

    new links.ActionGroup('io.ox/mail/links/toolbar', {
        id: 'default',
        index: 100,
        icon: function () {
            return $('<i class="icon-pencil">');
        }
    });

    new links.ActionLink('io.ox/mail/links/toolbar/default', {
        index: 100,
        id: 'compose',
        label: gt('Compose new mail'),
        ref: 'io.ox/mail/actions/compose'
    });

    // inline links

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 100,
        prio: 'hi',
        id: 'reply-all',
        label: gt('Reply All'),
        ref: 'io.ox/mail/actions/reply-all'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 200,
        prio: 'hi',
        id: 'reply',
        label: gt('Reply'),
        ref: 'io.ox/mail/actions/reply'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 300,
        prio: 'hi',
        id: 'forward',
        label: gt('Forward'),
        ref: 'io.ox/mail/actions/forward'
    }));

    // edit draft
    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 400,
        prio: 'hi',
        id: 'edit',
        label: gt('Edit'),
        ref: 'io.ox/mail/actions/edit'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 500,
        prio: 'hi',
        id: 'markunread',
        label: gt('Mark Unread'),
        ref: 'io.ox/mail/actions/markunread'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 501,
        prio: 'hi',
        id: 'markread',
        label: gt('Mark read'),
        ref: 'io.ox/mail/actions/markread'
    }));

    new Action('io.ox/mail/actions/label', {
        id: 'label',
        requires: 'toplevel some',
        multiple: $.noop
    });

//    ext.point('io.ox/mail/links/inline').extend(new links.Link({
//        index: 600,
//        prio: 'lo',
//        id: 'label',
//        ref: 'io.ox/mail/actions/label',
//        draw: function (data) {
//            this.append(
//                $('<span class="dropdown" class="io-ox-inline-links" data-prio="lo">')
//                .append(
//                    // link
//
//                )
//            );
//        }
//    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 700,
        prio: 'lo',
        id: 'move',
        label: gt('Move'),
        ref: 'io.ox/mail/actions/move'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 800,
        prio: 'lo',
        id: 'copy',
        label: gt('Copy'),
        ref: 'io.ox/mail/actions/copy'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 900,
        prio: 'lo',
        id: 'source',
        //#. source in terms of source code
        label: gt('View source'),
        ref: 'io.ox/mail/actions/source'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 1000,
        prio: 'hi',
        id: 'delete',
        label: gt('Delete'),
        ref: 'io.ox/mail/actions/delete'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 1100,
        prio: 'lo',
        id: 'reminder',
        label: gt("Reminder"),
        ref: 'io.ox/mail/actions/reminder'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 1200,
        prio: 'lo',
        id: 'add-to-portal',
        label: gt('Add to portal'),
        ref: 'io.ox/mail/actions/add-to-portal'
    }));


    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 1300,
        prio: 'lo',
        id: 'saveEML',
        label: gt('Save as file'),
        ref: 'io.ox/mail/actions/save'
    }));

    // Attachments

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'slideshow',
        index: 100,
        label: gt('Slideshow'),
        ref: 'io.ox/mail/actions/slideshow-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'preview',
        index: 200,
        label: gt('Preview'),
        ref: 'io.ox/mail/actions/preview-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'open',
        index: 300,
        label: gt('Open in new tab'),
        ref: 'io.ox/mail/actions/open-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'download',
        index: 400,
        label: gt('Download'),
        ref: 'io.ox/mail/actions/download-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'save',
        index: 500,
        label: gt('Save in file store'),
        ref: 'io.ox/mail/actions/save-attachment'
    }));

    ext.point('io.ox/mail/all/actions').extend(new links.Link({
        id: 'sendmail',
        index: 100,
        label: gt('Send new mail'),
        ref: 'io.ox/mail/actions/sendmail'
    }));

    ext.point('io.ox/mail/all/actions').extend(new links.Link({
        id: 'save-as-distlist',
        index: 200,
        label: gt('Save as distribution list'),
        ref: 'io.ox/mail/actions/createdistlist'
    }));

    ext.point('io.ox/mail/all/actions').extend(new links.Link({
        id: 'invite-to-appointment',
        index: 300,
        label: gt('Invite to appointment'),
        ref: 'io.ox/mail/actions/invite'
    }));

    // DND actions

    ext.point('io.ox/mail/dnd/actions').extend({
        id: 'importEML',
        index: 10,
        label: gt('Drop here to import this mail'),
        action: function (file, app) {
            app.queues.importEML.offer(file);
        }
    });

});
