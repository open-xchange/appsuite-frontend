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
     'io.ox/core/config',
     'io.ox/core/api/folder',
     'io.ox/core/notifications',
     'io.ox/core/print',
     'io.ox/contacts/api',
     'io.ox/core/api/account',
     'io.ox/core/capabilities',
     'io.ox/office/preview/fileActions',
     'settings!io.ox/mail'
    ], function (ext, links, api, util, gt, config, folderAPI, notifications, print, contactAPI, account, capabilities, previewfileactions, settings) {

    'use strict';

    var isDraftFolder = function (folder_id) {
            return _.contains(account.getFoldersByType('drafts'), folder_id);
        },
        isDraftMail = function (mail) {
            return isDraftFolder(mail.folder_id) || ((mail.flags & 4) > 0);
        },
        Action = links.Action,
        isPreviewable = function (e) {
            return capabilities.has('document_preview') && e.collection.has('one') && previewfileactions.SupportedExtensions.test(e.context.filename);
        };

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
            var check = settings.get('removeDeletedPermanently') || _(list).any(function (o) {
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
                        textarea = $('<textarea class="mail-source-view" rows="15" readonly="readonly">')
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

    new Action('io.ox/mail/actions/print', {
        requires: function (e) {
            return e.collection.has('some', 'read') && _.device('!small');
        },
        multiple: function (list, baton) {
            print.request('io.ox/mail/print', list);
        }
    });

    new Action('io.ox/mail/actions/print#disabled', {
        id: 'print',
        requires: function () {
            return _.device('!small');
        },
        multiple: function (list, baton) {
                var data = baton.data,
                    win;
                //single vs. multi
                if (list.length === 1) {
                    win = print.open('mail', data, {
                            template: 'infostore://70170',
                            id: data.id,
                            folder: data.folder_id,
                            view: 'text',
                            format: 'template'
                        });
                    win.print();
                } else {
                    win = print.openURL();
                    win.document.title = gt('Print');

                    require(['io.ox/core/http'], function (http) {
                        /**
                         * returns data for requested list elements
                         * @param  {array} list of data objects
                         * @return {deferred} arrray of objects sorted by received_date
                         */
                        var getList = function (list) {
                            return api.getList(list)
                            .pipe(function (data) {
                                //sort and map for print request
                                return _.chain(data)
                                        .sortBy(function (mail) {
                                            return 1 - mail.received_date;
                                        })
                                        .map(function (mail) {
                                            return { id: mail.id, folder: mail.folder_id };
                                        })
                                        .value();
                            });
                        };
                        /**
                         * returns printable content ob submitted ids
                         * @param  {array} listmin of data objects
                         * @return {deferred} print content
                         */
                        var getPrintable = function (listmin) {
                            return http.PUT({
                                module: 'mail',
                                dataType: 'text',
                                params: {
                                    action: 'list',
                                    template: 'infostore://70170',
                                    view: 'text',
                                    format: 'template',
                                    columns: '602,603,604,605,606,607,610'
                                },
                                data: listmin
                            });
                        };

                        //get received_date for sorting
                        getList(list)
                        .pipe(function (listmin) {
                            //get content for popup
                            getPrintable(listmin)
                            .done(function (print) {
                                var $content = $('<div>').append(print),
                                    head = $('<div>').append($content.find('style')),
                                    body = $('<div>').append($content.find('.mail-detail'));
                                win.document.write(head.html() + body.html());
                                win.print();
                            });
                        });
                    });
                }
                win.focus();
            }
    });

    function moveAndCopy(type, label, success) {

        new Action('io.ox/mail/actions/' + type, {
            id: type,
            requires: 'toplevel some',
            multiple: function (list, baton) {
                var vGrid = baton.grid || ('app' in baton && baton.app.getGrid());

                require(["io.ox/core/tk/dialogs", "io.ox/core/tk/folderviews"], function (dialogs, views) {

                    function commit(target) {
                        if (type === "move" && vGrid) vGrid.busy();
                        api[type](list, target).then(
                            function () {
                                notifications.yell('success', success);
                                folderAPI.reload(target, list);
                                if (type === "move" && vGrid) vGrid.idle();
                            },
                            notifications.yell
                        );
                    }

                    if (baton.target) {
                        commit(baton.target);
                    } else {
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
                                if (target && (target !== folderId) || type === 'copy') {
                                    commit(target);
                                }
                            }
                            tree.destroy();
                            tree = dialog = null;
                        });
                    }
                });
            }
        });
    }

    moveAndCopy('move', gt('Move'), gt('Mails have been moved'));
    moveAndCopy('copy', gt('Copy'), gt('Mails have been copied'));

    new Action('io.ox/mail/actions/markunread', {
        id: 'markunread',
        requires: function (e) {
            return e.collection.isLarge() || api.getList(e.context).pipe(function (list) {
                var bool = e.collection.has('toplevel') &&
                    _(list).reduce(function (memo, data) {
                        return memo && (data && (data.flags & api.FLAGS.SEEN) === api.FLAGS.SEEN);
                    }, true);
                return bool;
            });
        },
        multiple: function (list) {
            api.markUnread(list);
        }
    });

    new Action('io.ox/mail/actions/markread', {
        id: 'markread',
        requires: function (e) {
            return e.collection.isLarge() || api.getList(e.context).pipe(function (list) {
                var bool = e.collection.has('toplevel') &&
                    _(list).reduce(function (memo, data) {
                        return memo || (data && (data.flags & api.FLAGS.SEEN) === 0);
                    }, false);
                return bool;
            });
        },
        multiple: function (list) {
            api.markRead(list);
        }
    });

    new Action('io.ox/mail/actions/markspam', {
        id: 'markspam',
        requires: function (e) {
            return e.collection.isLarge() || api.getList(e.context).pipe(function (list) {
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
            return require(['io.ox/preview/main']).pipe(function (p) {
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
        multiple: function (list, baton) {
            // open side popup
            require(['io.ox/core/tk/dialogs', 'io.ox/preview/main'], function (dialogs, p) {
                new dialogs.SidePopup().show(baton.e, function (popup) {
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

    new Action('io.ox/mail/actions/open', {
        requires: function (e) {
            return isPreviewable(e);
        },
        action: function (o) {
            var file = o;
            if (o.mail) {
                file.data = {mail: o.mail, id: o.id};
            }
            ox.launch('io.ox/office/preview/main', { action: 'load', file: file });
        }
    });

    new Action('io.ox/mail/actions/open-attachment', {
        id: 'open',
        requires: function (e) {
            return !isPreviewable(e);
        },
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
            window.location.assign(url);
        }
    });

    new Action('io.ox/mail/actions/save-attachment', {
        id: 'save',
        capabilities: 'infostore',
        requires: 'some',
        multiple: function (list) {
            notifications.yell('info', 'Attachments will be saved!');
            api.saveAttachments(list)
                .done(function (data) {
                    notifications.yell('success', gt('Attachments have been saved'));
                })
                .fail(notifications.yell);
        }
    });


    new Action('io.ox/mail/actions/vcard', {
        id: 'vcard',
        capabilities: 'contacts',
        requires: function (e) {
            var context = e.context,
                hasRightSuffix = context.filename && context.filename.match(/\.vcf$/i) !== null,
                isVCardType = context.content_type && !!context.content_type.match(/^text\/vcard/i),
                isDirctoryType = context.content_type && !!context.content_type.match(/^text\/directory/i);
            return  (hasRightSuffix && isDirctoryType) || isVCardType;
        },
        action: function (baton) {
            var attachment = baton.data;
            require(['io.ox/core/api/conversion']).done(function (conversionAPI) {
                conversionAPI.convert({
                    identifier: 'com.openexchange.mail.vcard',
                    args: [
                        {'com.openexchange.mail.conversion.fullname': attachment.parent.folder_id},
                        {'com.openexchange.mail.conversion.mailid': attachment.parent.id},
                        {'com.openexchange.mail.conversion.sequenceid': attachment.id}
                    ]
                }, {
                    identifier: 'com.openexchange.contact.json',
                    args: []
                })
                .then(
                    function success(data) {
                        //TODO: Handle data not being an array or containing more than one contact
                        var contact = data[0];
                        contact.folder_id = config.get('folder.contacts');
                        require(['io.ox/contacts/edit/main'], function (m) {
                            if (m.reuse('edit', contact)) {
                                return;
                            }
                            m.getApp(contact).launch();
                        });
                    },
                    function fail(data) {
                        console.err('FAILED!', data);
                    }
                );
            });
        }
    });

    new Action('io.ox/mail/actions/ical', {
        id: 'ical',
        capabilities: 'calendar',
        requires: function (e) {
            var context = e.context,
                hasRightSuffix = context.filename && !!context.filename.match(/\.ics$/i),
                isCalendarType = context.content_type  && !!context.content_type.match(/^text\/calendar/i),
                isAppType = context.content_type  && !!context.content_type.match(/^application\/ics/i);
            return hasRightSuffix || isCalendarType || isAppType;
        },
        action: function (baton) {
            var attachment = baton.data;
            require(['io.ox/core/api/conversion']).done(function (conversionAPI) {
                conversionAPI.convert({
                    identifier: 'com.openexchange.mail.ical',
                    args: [
                        {'com.openexchange.mail.conversion.fullname': attachment.parent.folder_id},
                        {'com.openexchange.mail.conversion.mailid': attachment.parent.id},
                        {'com.openexchange.mail.conversion.sequenceid': attachment.id}
                    ]
                },
                {
                    identifier: 'com.openexchange.ical',
                    args: [
                        {'com.openexchange.groupware.calendar.folder': config.get('folder.calendar')},
                        {'com.openexchange.groupware.task.folder': config.get('folder.tasks')}
                    ]
                })
                .done(function (data) {
                    notifications.yell('success', gt('The appointment has been added to your calendar'));
                })
                .fail(notifications.yell);
            });
        }
    });

    new Action('io.ox/mail/actions/save', {
        id: 'saveEML',
        requires: 'some',
        multiple: function (data) {
            var url;
            if (!_.isObject(_(data).first().parent)) {
                url = api.getUrl(data, 'eml');
            } else {
                // download attachment eml
                url = api.getUrl(_(data).first(), 'download');
            }
            window.location.assign(url);
        }
    });

    new Action('io.ox/mail/actions/add-to-portal', {
        capabilities: 'portal', // was: !disablePortal
        requires: 'one',
        action: function (baton) {
            require(['io.ox/portal/widgets'], function (widgets) {
                widgets.add('stickymail', {
                    plugin: 'mail',
                    props: {
                        id: baton.data.id,
                        folder_id: baton.data.folder_id,
                        title: baton.data.subject
                    }
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
        capabilities: 'contacts',
        requires: 'some',
        action: function (baton) {

            var data = baton.data,
                collectedRecipientsArray = data.to.concat(data.cc).concat(data.from),
                collectedRecipients = [],
                dev = $.Deferred(),
                arrayOfMembers = [],
                currentId = ox.user_id,
                lengthValue,
                contactsFolder = config.get('folder.contacts'),

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
        capabilities: 'calendar',
        requires: 'some',
        action: function (baton) {
            var data = baton.data,
                collectedRecipients = [],
                participantsArray = [],
                currentId = ox.user_id,
                currentFolder = config.get('folder.calendar'),
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
        capabilities: 'tasks',
        requires: 'one',
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
                            folder_id: config.get('folder.tasks'),
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
            return $('<i class="icon-pencil accent-color">');
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
        label:
            //#. Translation should be as short a possible
            //#. Instead of "Mark as unread" or "Mark unread" it's just "Unread"
            //#. German, for example, should be "Ungelesen"
            gt('Unread'),
        ref: 'io.ox/mail/actions/markunread'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: 501,
        prio: 'hi',
        id: 'markread',
        label:
            //#. Translation should be as short a possible
            //#. Instead of "Mark as read" it's just "Mark read"
            //#. German, for example, should be "Gelesen"
            gt('Mark read'),
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
        index: 1050,
        prio: 'lo',
        id: 'print',
        label: gt('Print'),
        ref: 'io.ox/mail/actions/print'
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
        id: 'vcard',
        index: 50,
        label: gt('Add to address book'),
        ref: 'io.ox/mail/actions/vcard'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'ical',
        index: 50,
        label: gt('Add to calendar'),
        ref: 'io.ox/mail/actions/ical'
    }));

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
        id: 'open1',
        index: 250,
        label: gt('Open'),
        ref: 'io.ox/mail/actions/open'
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
