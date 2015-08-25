/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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
     'io.ox/core/folder/api',
     'io.ox/core/notifications',
     'io.ox/core/print',
     'io.ox/contacts/api',
     'io.ox/core/api/account',
     'io.ox/core/extPatterns/actions',
     'settings!io.ox/mail'
    ], function (ext, links, api, util, gt, coreConfig, folderAPI, notifications, print, contactAPI, account, actions, settings) {

    'use strict';

    var isDraftFolder = function (folder_id) {
            return _.contains(account.getFoldersByType('drafts'), folder_id);
        },
        isDraftMail = function (mail) {
            return isDraftFolder(mail.folder_id) || ((mail.flags & 4) > 0);
        },
        Action = links.Action;

    // actions

    new Action('io.ox/mail/actions/unselect', {
        requires: function (e) {
            return e.collection.has('toplevel', 'multiple') && !e.baton.isThread;
        },
        multiple: function (list, baton) {
            if (baton.grid) baton.grid.selection.clear();
        }
    });

    new Action('io.ox/mail/actions/compose', {
        id: 'compose',
        requires: function () {
            return true;
        },
        action: function (baton) {
            ox.registry.call('mail-compose', 'compose', { folder_id: baton.app.folder.get() });
        }
    });

    new Action('io.ox/mail/actions/delete', {
        id: 'delete',
        requires: 'toplevel some delete',
        multiple: function (list) {

            var all = list.slice();
            list = folderAPI.ignoreSentItems(list);

            var check = settings.get('removeDeletedPermanently') || _(list).any(function (o) {
                return account.is('trash', o.folder_id);
            });

            var question = gt.ngettext(
                'Do you want to permanently delete this mail?',
                'Do you want to permanently delete these mails?',
                list.length
            );

            if (check) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .append(
                            $('<h4>').text(question)
                        )
                        .addPrimaryButton('delete', gt('Delete'), 'delete', {tabIndex: '1'})
                        .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'})
                        .on('delete', function () {
                            api.remove(list, all).fail(notifications.yell);
                        }).show();
                });
            } else {
                api.remove(list, all).fail(function (e) {
                    // mail quota exceeded?
                    if (e.code === 'MSG-0039') {
                        require(['io.ox/core/tk/dialogs'], function (dialogs) {
                            new dialogs.ModalDialog()
                                .header(
                                    $('<h4>').text(gt('Mail quota exceeded'))
                                )
                                .append(
                                    $('<div>').text(gt('Emails cannot be put into trash folder while your mail quota is exceeded.')),
                                    $('<div>').text(question)
                                )
                                .addPrimaryButton('delete', gt('Delete'), 'delete', {tabIndex: '1'})
                                .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'})
                                .on('delete', function () {
                                    api.remove(list, { force: true });
                                })
                                .show();
                        });
                    } else {
                        notifications.yell(e);
                    }
                });
            }
        }
    });

    new Action('io.ox/mail/actions/reply-all', {
        id: 'reply-all',
        requires: function (e) {
            // must be top-level
            if (!e.collection.has('toplevel', 'some')) return;
            // multiple and not a thread?
            if (!e.collection.has('one') && !e.baton.isThread) return;
            // get first mail
            var data = e.baton.first();
            // has sender? and not a draft mail
            return util.hasFrom(data) && !isDraftMail(data);
        },
        action: function (baton) {
            ox.registry.call('mail-compose', 'replyall', baton.first());
        }
    });

    new Action('io.ox/mail/actions/reply', {
        id: 'reply',
        requires: function (e) {
            // must be top-level
            if (!e.collection.has('toplevel', 'some')) return;
            // multiple and not a thread?
            if (!e.collection.has('one') && !e.baton.isThread) return;
            // get first mail
            var data = e.baton.first();
            // has sender? and not a draft mail
            return util.hasFrom(data) && !isDraftMail(data);
        },
        action: function (baton) {
            ox.registry.call('mail-compose', 'reply', baton.first());
        }
    });

    new Action('io.ox/mail/actions/forward', {
        id: 'forward',
        requires: function (e) {
            return e.collection.has('toplevel', 'some');
        },
        action: function (baton) {
            ox.registry.call('mail-compose', 'forward', baton.isThread ? baton.first() : baton.data);
        }
    });

    new Action('io.ox/mail/actions/edit', {
        id: 'edit',
        requires: function (e) {
            // must be top-level
            if (!e.collection.has('toplevel')) return;
            // multiple and not a thread?
            if (!e.collection.has('one') && !e.baton.isThread) return;
            // get first mail
            var data = e.baton.first();
            // must be draft folder
            return data && isDraftMail(data);
        },
        action: function (baton) {
            var data = baton.first(),
                check = false;
            _.each(ox.ui.apps.models, function (app) {
                if (app.refId === data.id) {
                    check = true;
                    app.launch();
                }
            });
            if (check === true) return;

            ox.registry.call('mail-compose', 'edit', data);
        }
    });

    new Action('io.ox/mail/actions/source', {
        id: 'source',
        requires: function (e) {
            // must be at least one message and top-level
            if (!e.collection.has('some') || !e.collection.has('toplevel')) return;
            // multiple and not a thread?
            if (!e.collection.has('one') && !e.baton.isThread) return;
            // get first mail
            return true;
        },
        action: function (baton) {
            var data = baton.first();
            require(['io.ox/core/tk/dialogs'], function (dialogs) {
                new dialogs.ModalDialog({ width: 700 })
                    .addPrimaryButton('close', gt('Close'), 'close', {tabIndex: '1'})
                    .header(
                        $('<h4>').text(gt('Mail source') + ': ' + (data.subject || ''))
                    )
                    .append(
                        $('<textarea class="form-control mail-source-view" rows="15" readonly="readonly">')
                        .on('keydown', function (e) {
                            if (e.which !== 27) e.stopPropagation();
                        })
                    )
                    .show(function () {
                        api.getSource(data).done(function (src) {
                            this.find('textarea').val(src || '').css({ visibility: 'visible', cursor: 'default' });
                            this.idle();
                        }.bind(this));
                    });
            });
        }
    });

    new Action('io.ox/mail/actions/print', {
        requires: function (e) {
            // not on smartphones
            if (_.device('smartphone')) return false;
            // need some and either read access or being embedded
            return e.collection.has('some') && (e.collection.has('read') || !e.collection.has('toplevel'));
        },
        multiple: function (list) {
            print.request('io.ox/mail/print', list);
        }
    });

    /*
     *  Move and Copy
     */

    function generate(type, label, success) {

        new Action('io.ox/mail/actions/' + type, {
            id: type,
            requires: 'toplevel some',
            multiple: function (list, baton) {

                require(['io.ox/core/folder/actions/move'], function (move) {
                    move.item({
                        all: list,
                        api: api,
                        button: label,
                        list: folderAPI.ignoreSentItems(list),
                        module: 'mail',
                        root: '1',
                        settings: settings,
                        success: success,
                        target: baton.target,
                        title: label,
                        type: type
                    });
                });
            }
        });
    }

    generate('move', gt('Move'), { multiple: gt('Mails have been moved'), single: gt('Mail has been moved') });
    generate('copy', gt('Copy'), { multiple: gt('Mails have been copied'), single: gt('Mail has been copied') });

    new Action('io.ox/mail/actions/markunread', {
        id: 'markunread',
        requires: function (e) {
            // must be top-level
            if (!e.collection.has('toplevel')) return;
            // partiallySeen? has at least one email that's seen?
            return _(e.baton.array()).reduce(function (memo, obj) {
                return memo || !util.isUnseen(obj);
            }, false);
        },
        multiple: function (list) {
            // we don't process sent items
            list = folderAPI.ignoreSentItems(list);
            api.markUnread(list);
        }
    });

    new Action('io.ox/mail/actions/markread', {
        id: 'markread',
        requires: function (e) {
            // must be top-level
            if (!e.collection.has('toplevel')) return;
            // partiallyUnseen? has at least one email that's seen?
            return _(e.baton.array()).reduce(function (memo, obj) {
                return memo || util.isUnseen(obj);
            }, false);
        },
        multiple: function (list) {
            // we don't process sent items
            list = folderAPI.ignoreSentItems(list);
            api.markRead(list);
        }
    });

    // SPAM

    new Action('io.ox/mail/actions/spam', {
        capabilities: 'spam',
        requires: function (e) {
            // must be top-level
            if (!e.collection.has('toplevel', 'some')) return false;
            // is spam?
            return _(e.baton.array()).reduce(function (memo, obj) {
                // already false?
                if (memo === false) return false;
                // is not primary account?
                if (!account.isPrimary(obj.folder_id)) return false;
                // is spam folder?
                if (account.is('spam', obj.folder_id)) return false;
                // is marked as spam already?
                if (util.isSpam(obj)) return false;
                // else
                return true;
            }, true);
        },
        multiple: function (list) {
            api.markSpam(list);
        }
    });

    new Action('io.ox/mail/actions/nospam', {
        capabilities: 'spam',
        requires: function (e) {
            // must be top-level
            if (!e.collection.has('toplevel', 'some')) return false;
            // is spam?
            return _(e.baton.array()).reduce(function (memo, obj) {
                // already false?
                if (memo === false) return false;
                // is not primary account?
                if (!account.isPrimary(obj.folder_id)) return false;
                // else
                return account.is('spam', obj.folder_id) || util.isSpam(obj);
            }, true);
        },
        multiple: function (list) {
            api.noSpam(list);
        }
    });

    // Attachments

    new Action('io.ox/mail/actions/preview-attachment', {
        id: 'preview',
        requires: function (e) {
            return require(['io.ox/preview/main']).pipe(function (p) {
                var list = _.getArray(e.context);
                // is at least one attachment supported?
                return e.collection.has('some') && _.device('!smartphone') && _(list).reduce(function (memo, obj) {
                    return memo || new p.Preview({
                        filename: obj.filename,
                        // fixes 'audio/mp3; name="Metallica - 01 - Enter Sandman.mp3"''
                        mimetype: String(obj.content_type || '').split(';')[0],
                        attachment: true
                    })
                    .supportsPreview();
                }, false);
            });
        },
        multiple: function (list, baton) {
            //remove last element from id-list if previewing during compose (forward mail as attachment)
            var adjustFn = list[0].parent.adjustid || '';
            list[0].id = _.isFunction(adjustFn) ? adjustFn(list[0].id) : list[0].id;
            // open side popup
            require(['io.ox/core/tk/dialogs', 'io.ox/preview/main'], function (dialogs, p) {
                new dialogs.SidePopup({ tabTrap: true }).show(baton.e, function (popup) {
                    _(list).each(function (data) {
                        var pre = new p.Preview({
                            data: data,
                            filename: data.filename,
                            parent: data.parent,
                            mimetype: data.content_type,
                            dataURL: api.getUrl(data, 'view'),
                            downloadURL: api.getUrl(data, 'download')
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
        requires: 'one',
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
                return memo || (/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(obj.filename);
            }, false);
        },
        multiple: function (list, baton) {
            require(['io.ox/files/carousel'], function (slideshow) {
                var regIsImage = /\.(gif|bmp|tiff|jpe?g|gmp|png)$/i,
                    files = _(list).map(function (file) {
                        // get URL
                        var url = api.getUrl(file, 'view');
                        // non-image files need special format parameter
                        if (!regIsImage.test(file.filename)) url += '&format=preview_image&session=' + ox.session;
                        return { url: url, filename: file.filename };
                    }),
                    startIndex = 0;
                if (baton.startItem) {
                    _(files).each(function (file, index) {
                       if (file.url.indexOf('attachment=' + baton.startItem.id) !== -1) {
                           startIndex = index;
                       }
                    });
                }
                slideshow.init({
                    fullScreen: false,
                    baton: {allIds: files, startIndex: startIndex},
                    attachmentMode: true,
                    useSelectionAsStart: true
                });
            });
        }
    });

    new Action('io.ox/mail/actions/download-attachment', {
        id: 'download',
        requires: function (e) {
            return _.device('!ios') && e.collection.has('some');
        },
        multiple: function (list) {

            // download single attachment or zip file
            var url = list.length === 1 ?
                api.getUrl(_(list).first(), 'download') :
                api.getUrl(list, 'zip');

            // download via iframe
            require(['io.ox/core/download'], function (download) {
                download.url(url);
            });
        }
    });

    new Action('io.ox/mail/actions/save-attachment', {
        id: 'save',
        capabilities: 'infostore',
        requires: 'some',
        multiple: function (list) {
            require(['io.ox/mail/actions/attachmentSave'], function (action) {
                action.multiple(list);
            });
        }
    });

    new Action('io.ox/mail/actions/vcard', {
        id: 'vcard',
        capabilities: 'contacts',
        requires: function (e) {
            if (!e.collection.has('one')) {
                return false;
            }
            var context = e.context,
                hasRightSuffix = (/\.vcf$/i).test(context.filename),
                isVCardType = (/^text\/(x-)?vcard/i).test(context.content_type),
                isDirectoryType = (/^text\/directory/i).test(context.content_type);
            return  (hasRightSuffix && isDirectoryType) || isVCardType;
        },
        action: function (baton) {
            var attachment = _.isArray(baton.data) ? _.first(baton.data) : baton.data;

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

                        if (!_.isArray(data) || data.length === 0) {
                            notifications.yell('error', gt('Failed to add. Maybe the vCard attachment is invalid.'));
                            return;
                        }

                        var contact = data[0], folder = coreConfig.get('folder/contacts');

                        if (contact.mark_as_distributionlist) {
                            // edit distribution list
                            require(['io.ox/contacts/distrib/main'], function (m) {
                                m.getApp(contact).launch().done(function () {
                                    this.create(folder, contact);
                                });
                            });
                        } else {
                            // edit contact
                            require(['io.ox/contacts/edit/main'], function (m) {
                                contact.folder_id = folder;
                                if (m.reuse('edit', contact)) {
                                    return;
                                }
                                m.getApp(contact).launch();
                            });
                        }
                    },
                    function fail(e) {
                        notifications.yell(e);
                    }
                );
            });
        }
    });

    new Action('io.ox/mail/actions/ical', {
        id: 'ical',
        capabilities: 'calendar',
        requires: function (e) {
            var context = _.isArray(e.context) ? _.first(e.context) : e.context,
                hasRightSuffix = context.filename && !!context.filename.match(/\.ics$/i),
                isCalendarType = context.content_type  && !!context.content_type.match(/^text\/calendar/i),
                isAppType = context.content_type  && !!context.content_type.match(/^application\/ics/i);
            return hasRightSuffix || isCalendarType || isAppType;
        },
        action: function (baton) {
            var attachment = _.isArray(baton.data) ? _.first(baton.data) : baton.data;

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
                        {'com.openexchange.groupware.calendar.folder': coreConfig.get('folder/calendar')},
                        {'com.openexchange.groupware.task.folder': coreConfig.get('folder/tasks')}
                    ]
                })
                .done(function () {
                    notifications.yell('success', gt('The appointment has been added to your calendar'));
                })
                .fail(notifications.yell);
            });
        }
    });

    new Action('io.ox/mail/actions/save', {
        id: 'saveEML',
        requires: function (e) {
            // ios cannot handle EML download
            return _.device('!ios') && e.collection.has('some', 'read');
        },
        multiple: function (data) {

            require(['io.ox/core/download'], function (download) {

                var url, first = _(data).first();

                // download plain EML?
                if (!_.isObject(first.parent)) {
                    return data.length === 1 ? download.mail(first) : download.mails(data);
                }

                if (first.msgref && _.isObject(first.parent)) {
                    // using msgref reference if previewing during compose (forward previewed mail as attachment)
                    url = api.getUrl(data, 'eml:reference');
                } else {
                    // adjust attachment id for previewing nested email within compose view
                    var adjustFn = first.parent.adjustid || '';
                    first.id = _.isFunction(adjustFn) ? adjustFn(first.id) : first.id;
                    // download attachment eml
                    url = api.getUrl(first, 'download');
                }

                download.url(url);
            });
        }
    });

    new Action('io.ox/mail/actions/add-to-portal', {
        capabilities: 'portal',
        requires: 'one toplevel',
        action: function (baton) {
            require(['io.ox/portal/widgets'], function (widgets) {
                //using baton.data.parent if previewing during compose (forward mail as attachment)
                widgets.add('stickymail', {
                    plugin: 'mail',
                    props: $.extend({
                        id: baton.data.id,
                        folder_id: baton.data.folder_id,
                        title: baton.data.subject
                    }, baton.data.parent || {})
                });
                notifications.yell('success', gt('This mail has been added to the portal'));
            });
        }
    });

    // all actions

    new Action('io.ox/mail/actions/sendmail', {
        requires: 'some',
        action: function (baton) {
            var data = baton.data;
            ox.registry.call('mail-compose', 'compose', { folder_id: data.folder_id, to: data.to.concat(data.cc).concat(data.from) });
        }
    });

    new Action('io.ox/mail/actions/createdistlist', {
        id: 'create-distlist',
        capabilities: 'contacts',
        requires: 'some',
        action: function (baton) {

            var data = baton.data,
                collectedRecipients = [].concat(data.to, data.cc, data.from),
                dev = $.Deferred(),
                arrayOfMembers = [],
                currentId = ox.user_id,
                lengthValue,
                contactsFolder = coreConfig.get('folder/contacts'),

                createDistlist = function (members) {
                    require(['io.ox/contacts/distrib/main'], function (m) {
                        m.getApp().launch().done(function () {
                            this.create(contactsFolder, { distribution_list: members });
                        });
                    });
                };

            collectedRecipients = _(collectedRecipients).chain()
                .map(function (obj) {
                    return obj[1];
                })
                .uniq()
                .value();

            // get length now to know when done
            lengthValue = collectedRecipients.length;

            _(collectedRecipients).each(function (mail) {
                contactAPI.search(mail).done(function (results) {

                    var currentObj, result = results[0];

                    if (result) {
                        // found via search
                        currentObj = {
                            id: result.id,
                            folder_id: result.folder_id,
                            display_name: result.display_name,
                            mail: result.email1,
                            mail_field: 1
                        };
                        if (result.internal_userid !== currentId) {
                            arrayOfMembers.push(currentObj);
                        } else {
                            lengthValue = lengthValue - 1;
                        }
                    } else {
                        // manual add
                        currentObj = {
                            display_name: mail,
                            mail: mail,
                            mail_field: 0
                        };
                        arrayOfMembers.push(currentObj);
                    }

                    // done?
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
                currentFolder = coreConfig.get('folder/calendar'),
                collectedRecipientsArray = data.to.concat(data.cc).concat(data.from),
                dev = $.Deferred(),
                lengthValue,
                createCalendarApp = function (participants, notetext) {
                    require(['io.ox/calendar/edit/main'], function (m) {
                        m.getApp().launch().done(function () {
                            //remove participants received mail via msisdn
                            participants = _.filter(participants, function (participant) {
                                if (participant.mail)
                                    return util.getChannel(participant.mail, false) !== 'phone';
                                return true;
                            });
                            var initData = {participants: participants, title: notetext, folder_id: currentFolder};
                            this.create(initData);
                            // to set Dirty
                            this.model.toSync = initData;
                        });
                    });
                };

            _(collectedRecipientsArray).each(function (single) {
                collectedRecipients.push(single[1]);
            });

            lengthValue = collectedRecipients.length;

            _(collectedRecipients).each(function (mail) {
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
        requires: 'one toplevel',
        action: function (baton) {
            var data = baton.data;
            require(['io.ox/core/tk/dialogs', 'io.ox/tasks/api', 'io.ox/tasks/util'], function (dialogs, taskAPI, tasksUtil) {
                //create popup dialog

                var titleInput,
                    noteInput,
                    dateSelector,
                    endDate = new Date(),
                    popup = new dialogs.ModalDialog()
                        .addPrimaryButton('create', gt('Create reminder'), 'create', {tabIndex: '1'})
                        .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'});

                //Header
                popup.getHeader().append($('<h4>').text(gt('Remind me')));

                //fill popup body
                var popupBody = popup.getBody();

                popupBody.append(
                    $('<div class="form-group">').append(
                        $('<label>').text(gt('Subject')),
                        titleInput = $('<input class="form-control">', { type: 'text', value: gt('Mail reminder') + ': ' + data.subject, tabindex: '1', 'aria-labelledby': 'subject' })
                            .focus(function () { this.select(); })
                    ),
                    $('<div class="form-group">').append(
                        $('<label>').text(gt('Note')),
                        noteInput = $('<textarea class="form-control">', { rows: '5', value: gt('Mail reminder for') + ': ' + data.subject + ' \n' + gt('From') + ': ' + util.formatSender(data.from[0]), tabindex: '1', 'aria-labelledby': 'note' })
                            .focus(function () { this.select(); })
                    ),
                    $('<div class="form-group">').append(
                        $('<label id="remindme">').text(gt('Remind me')),
                        dateSelector = $('<select class="form-control">', { name: 'dateselect', tabindex: '1', 'aria-labelledby': 'remindme' }).append(tasksUtil.buildDropdownMenu({time: endDate}))
                    )
                );

                //ready for work
                var def = popup.show();
                titleInput.focus();
                def.done(function (action) {
                    if (action === 'create') {

                        //Calculate the right time
                        var dates = tasksUtil.computePopupTime(dateSelector.val(), true);

                        taskAPI.create({
                            title: titleInput.val(),
                            folder_id: coreConfig.get('folder/tasks'),
                            alarm: dates.alarmDate,
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
            return $('<i class="fa fa-pencil accent-color">');
        }
    });

    new links.ActionLink('io.ox/mail/links/toolbar/default', {
        index: 100,
        id: 'compose',
        label: gt('Compose new mail'),
        ref: 'io.ox/mail/actions/compose'
    });

    // inline links

    var INDEX = 0;

    // ext.point('io.ox/mail/links/inline').extend(new links.Link({
    //     index: 10, // should be first
    //     prio: 'hi',
    //     id: 'unselect',
    //     label: gt('Unselect all'),
    //     ref: 'io.ox/mail/actions/unselect'
    // }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'hi',
        id: 'reply',
        mobile: 'hi',
        label: gt('Reply'),
        ref: 'io.ox/mail/actions/reply',
        section: 'standard'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'hi',
        id: 'reply-all',
        mobile: 'hi',
        label: gt('Reply All'),
        ref: 'io.ox/mail/actions/reply-all',
        drawDisabled: true,
        section: 'standard'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'hi',
        id: 'forward',
        mobile: 'hi',
        label: gt('Forward'),
        ref: 'io.ox/mail/actions/forward',
        section: 'standard'
    }));

    // edit draft
    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'hi',
        id: 'edit',
        mobile: 'hi',
        label: gt('Edit'),
        ref: 'io.ox/mail/actions/edit',
        section: 'standard'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'hi',
        id: 'delete',
        mobile: 'hi',
        label: gt('Delete'),
        ref: 'io.ox/mail/actions/delete',
        section: 'standard'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'hi',
        mobile: 'hi',
        id: 'markunread',
        label:
            //#. Translation should be as short a possible
            //#. Instead of "Mark as unread" it's just "Mark unread"
            //#. German, for example, should be just "Ungelesen"
            gt('Mark unread'),
        ref: 'io.ox/mail/actions/markunread',
        section: 'flags'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX + 1,
        prio: 'hi',
        mobile: 'hi',
        id: 'markread',
        label:
            //#. Translation should be as short a possible
            //#. Instead of "Mark as read" it's just "Mark read"
            //#. German, for example, should be just "Gelesen"
            gt('Mark read'),
        ref: 'io.ox/mail/actions/markread',
        section: 'flags'
    }));

    new Action('io.ox/mail/actions/label', {
        id: 'label',
        requires: 'toplevel some',
        multiple: $.noop
    });

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'hi',
        mobile: 'hi',
        id: 'spam',
        label: gt('Mark as spam'),
        ref: 'io.ox/mail/actions/spam',
        section: 'flags'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX + 1,
        prio: 'hi',
        mobile: 'hi',
        id: 'nospam',
        label: gt('Not spam'),
        ref: 'io.ox/mail/actions/nospam',
        section: 'flags'
    }));

    // recipients

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        id: 'sendmail',
        index: INDEX += 100,
        prio: 'lo',
        label: gt('Send new mail'),
        ref: 'io.ox/mail/actions/sendmail',
        section: 'recipients'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        id: 'invite-to-appointment',
        index: INDEX += 100,
        prio: 'lo',
        label: gt('Invite to appointment'),
        ref: 'io.ox/mail/actions/invite',
        section: 'recipients'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        id: 'save-as-distlist',
        index: INDEX += 100,
        prio: 'lo',
        label: gt('Save as distribution list'),
        ref: 'io.ox/mail/actions/createdistlist',
        section: 'recipients'
    }));

    // file op

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'lo',
        mobile: 'lo',
        id: 'move',
        label: gt('Move'),
        ref: 'io.ox/mail/actions/move',
        section: 'file-op'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'lo',
        mobile: 'lo',
        id: 'copy',
        label: gt('Copy'),
        ref: 'io.ox/mail/actions/copy',
        section: 'file-op'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'lo',
        mobile: 'none',
        id: 'print',
        label: gt('Print'),
        ref: 'io.ox/mail/actions/print',
        section: 'export'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'lo',
        mobile: 'none',
        id: 'saveEML',
        label: gt('Save as file'),
        ref: 'io.ox/mail/actions/save',
        section: 'export'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'lo',
        mobile: 'none',
        id: 'source',
        //#. source in terms of source code
        label: gt('View source'),
        ref: 'io.ox/mail/actions/source',
        section: 'export'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'lo',
        mobile: 'lo',
        id: 'reminder',
        label: gt('Reminder'),
        ref: 'io.ox/mail/actions/reminder',
        section: 'keep'
    }));

    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        index: INDEX += 100,
        prio: 'lo',
        mobile: 'none',
        id: 'add-to-portal',
        label: gt('Add to portal'),
        ref: 'io.ox/mail/actions/add-to-portal',
        section: 'keep'
    }));

    // Attachments

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'vcard',
        mobile: 'high',
        index: 50,
        label: gt('Add to address book'),
        ref: 'io.ox/mail/actions/vcard'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'ical',
        mobile: 'high',
        index: 50,
        label: gt('Add to calendar'),
        ref: 'io.ox/mail/actions/ical'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'slideshow',
        index: 100,
        mobile: 'high',
        label: gt('Slideshow'),
        ref: 'io.ox/mail/actions/slideshow-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'preview',
        index: 200,
        mobile: 'high',
        label: gt('Preview'),
        ref: 'io.ox/mail/actions/preview-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'open',
        index: 300,
        mobile: 'high',
        label: gt('Open in browser'),
        ref: 'io.ox/mail/actions/open-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'download',
        index: 400,
        mobile: 'high',
        label: gt('Download'),
        ref: 'io.ox/mail/actions/download-attachment'
    }));

    ext.point('io.ox/mail/attachment/links').extend(new links.Link({
        id: 'save',
        index: 500,
        mobile: 'high',
        label: gt('Save to Drive'),
        ref: 'io.ox/mail/actions/save-attachment'
    }));

    // DND actions

    ext.point('io.ox/mail/dnd/actions').extend({
        id: 'importEML',
        index: 10,
        label: gt('Drop here to import this mail'),
        action: function (file, app) {
            app.queues.importEML.offer(file, { folder: app.folder.get() });
        }
    });
});
