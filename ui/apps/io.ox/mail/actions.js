/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/mail/actions', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/mail/api',
    'io.ox/mail/util',
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/core/print',
    'io.ox/core/api/account',
    'io.ox/core/notifications',
    'io.ox/core/viewer/views/types/typesutil',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (ext, actionsUtil, api, util, filesAPI, folderAPI, print, account, notifications, viewerTypes, settings, gt) {

    'use strict';

    var Action = actionsUtil.Action;

    new Action('io.ox/mail/actions/compose', {
        capabilities: '!guest',
        action: function (baton) {
            ox.registry.call('mail-compose', 'open', null, { folderId: baton.app.folder.get() });
        }
    });

    new Action('io.ox/mail/actions/reply-all', {
        collection: 'some && toplevel',
        matches: matchesReply,
        action: reply('replyall')
    });

    function matchesReply(baton) {
        // multiple selection
        if (baton.selection.length > 1) return;
        // multiple and not a thread?
        if (baton.collection.has('multiple') && !baton.isThread) return;
        // get first mail
        var data = baton.first();
        // has sender? and not a draft mail
        return util.hasFrom(data) && !isDraftMail(data);
    }

    function isDraftMail(mail) {
        return isDraftFolder(mail.folder_id) || ((mail.flags & 4) > 0);
    }

    function isDraftFolder(folder_id) {
        return _.contains(account.getFoldersByType('drafts'), folder_id);
    }

    function reply(mode) {
        return function (baton) {
            var data = baton.first();
            require(['io.ox/mail/compose/checks'], function (checks) {
                checks.replyToMailingList(_.cid(data), mode, data).then(function (mode) {
                    ox.registry.call('mail-compose', 'open', { type: mode, original: { folderId: data.folder_id, id: data.id, security: data.security } });
                });
            });
        };
    }

    function setFocus(baton) {
        if (baton.e.clientX && baton.e.clientY) return;
        $('.io-ox-mail-window .list-item[tabindex="0"]').trigger('focus');
    }

    new Action('io.ox/mail/actions/reply', {
        collection: 'some && toplevel',
        matches: matchesReply,
        action: reply('reply')
    });

    new Action('io.ox/mail/actions/forward', {
        capabilities: '!guest',
        collection: 'some && toplevel',
        action: function (baton) {
            var multiple = baton.selection && baton.selection.length > 1;
            // Only first mail of thread is selected on multiselection, as most commonly users don't want to forward whole threads
            var data = !multiple ? [baton.first()] : baton.selection.map(function (o) {
                return _.cid(_.cid(o).replace(/^thread./, ''));
            });
            // reduce data for compose
            data = data.map(function (mail) {
                return { id: mail.id, folderId: mail.folder_id, security: mail.security };
            });
            ox.registry.call('mail-compose', 'open', { type: 'forward', original: data });
        }
    });

    new Action('io.ox/mail/actions/delete', {
        collection: 'toplevel && some && delete',
        action: 'io.ox/mail/actions/delete'
    });

    new Action('io.ox/mail/actions/edit', {
        collection: 'one && toplevel',
        matches: function (baton) {
            // get first mail
            var data = baton.first();
            // must be draft folder
            return data && isDraftMail(data);
        },
        action: function (baton) {
            var data = baton.first(),
                app = _(ox.ui.apps.models).find(function (model) {
                    return model.refId === data.id;
                });
            // reuse open editor
            if (app) return app.launch();
            ox.registry.call('mail-compose', 'open', {
                type: 'edit', original: { folderId: data.folder_id, id: data.id, security: data.security }
            });
        }
    });

    new Action('io.ox/mail/actions/edit-copy', {
        collection: 'one && toplevel',
        matches: function (baton) {
            // get first mail
            var data = baton.first();
            // must be draft folder
            return data && isDraftMail(data);
        },
        action: function (baton) {
            var data = baton.first();
            ox.registry.call('mail-compose', 'open', {
                type: 'copy', original: { folderId: data.folder_id, id: data.id, security: data.security }
            })
            .done(function (window) {
                var model = window.app.model;
                //#. If the user selects 'copy of' in the drafts folder, the subject of the email is prefixed with [Copy].
                //#. Please make sure that this is a prefix in every translation since it will be removed when the mail is sent.
                //#. %1$s the original subject of the mail
                model.set('subject', gt('[Copy] %1$s', model.get('subject')));
            });
        }
    });

    new Action('io.ox/mail/actions/source', {
        collection: 'some && toplevel',
        matches: function (baton) {
            // multiple selection
            if (baton.selection && baton.selection.length > 1) return;
            if (baton.collection.has('multiple') && !baton.isThread) return false;
            return true;
        },
        action: 'io.ox/mail/actions/source'
    });

    new Action('io.ox/mail/actions/filter', {
        capabilities: 'mailfilter_v2',
        collection: 'some && toplevel',
        matches: function (baton) {
            // multiple and not a thread?
            if (baton.collection.has('multiple') && !baton.isThread) return false;
            return true;
        },
        action: function (baton) {

            require(['io.ox/mail/mailfilter/settings/filter'], function (filter) {

                filter.initialize().then(function (data, config, opt) {
                    var factory = opt.model.protectedMethods.buildFactory('io.ox/core/mailfilter/model', opt.api),
                        args = { data: { obj: factory.create(opt.model.protectedMethods.provideEmptyModel()) } },
                        preparedTest = {
                            id: 'allof',
                            tests: [
                                _.copy(opt.filterDefaults.tests.subject),
                                opt.filterDefaults.tests.address ? _.copy(opt.filterDefaults.tests.address) : _.copy(opt.filterDefaults.tests.from)
                            ]
                        };

                    preparedTest.tests[0].values = [baton.data.subject];
                    preparedTest.tests[1].values = [baton.data.from[0][1]];

                    args.data.obj.set('test', preparedTest);

                    ext.point('io.ox/settings/mailfilter/filter/settings/detail').invoke('draw', undefined, args, config);
                });
            });
        }
    });

    new Action('io.ox/mail/actions/print', {
        device: '!smartphone',
        collection: 'some && (read || !toplevel)',
        action: function (baton) {
            print.request('io.ox/mail/print', baton.array());
        }
    });

    new Action('io.ox/mail/actions/flag', {
        toggle: settings.get('features/flag/star'),
        collection: 'some',
        matches: function (baton) {
            return !_(baton.array()).every(util.isFlagged);
        },
        action: function (baton) {
            api.flag(baton.data, true).then(function () { setFocus(baton); });
        }
    });

    new Action('io.ox/mail/actions/unflag', {
        toggle: settings.get('features/flag/star'),
        collection: 'some',
        matches: function (baton) {
            return _(baton.array()).any(util.isFlagged);
        },
        action: function (baton) {
            api.flag(baton.data, false).then(function () { setFocus(baton); });
        }
    });

    new Action('io.ox/mail/actions/archive', {
        capabilities: 'archive_emails',
        collection: 'some && delete',
        matches: function (baton) {
            return baton.array().reduce(checkForArchiveAction, true);
        },
        action: function (baton) {
            var list = _.isArray(baton.data) ? baton.data : [baton.data];
            api.archive(list).then(function () { setFocus(baton); });
        }
    });

    new Action('io.ox/mail/actions/triggerFlags', {
        collection: 'some',
        action: function () {
            var dropDown = $('.dropdown.flag-picker').data();
            $(document).trigger('click.bs.dropdown.data-api');
            _.delay(function () {
                dropDown.view.open();
            }, 200);
        }
    });

    function checkForArchiveAction(memo, obj) {
        // already false?
        if (memo === false) return false;
        // is not primary account?
        if (!account.isPrimary(obj.folder_id)) return false;
        // is unified folder (may be external)
        if (account.isUnifiedFolder(obj.folder_id)) return false;
        // is in a subfolder of archive?
        if (account.is('archive', obj.folder_id)) return false;
        // else
        return true;
    }

    new Action('io.ox/mail/actions/move', {
        collection: 'toplevel && some && delete',
        action: generate('move', gt('Move'), { single: gt('Email has been moved'), multiple: gt('Emails have been moved') })
    });

    new Action('io.ox/mail/actions/copy', {
        collection: 'toplevel && some',
        action: generate('copy', gt('Copy'), { single: gt('Email has been copied'), multiple: gt('Emails have been copied') })
    });

    function generate(type, label, success) {
        return function (baton) {
            require(['io.ox/mail/actions/copyMove'], function (action) {
                action.multiple({ list: baton.array(), baton: baton, type: type, label: label, success: success });
            });
        };
    }

    new Action('io.ox/mail/actions/mark-unread', {
        collection: 'toplevel && change:seen',
        matches: function (baton) {
            return baton.array().reduce(function (memo, obj) {
                return memo || !util.isUnseen(obj);
            }, false);
        },
        action: function (baton) {
            // we don't process sent items
            var list = folderAPI.ignoreSentItems(baton.array());
            api.markUnread(list).then(function () { setFocus(baton); });
        }
    });

    new Action('io.ox/mail/actions/mark-read', {
        collection: 'toplevel && change:seen',
        matches: function (baton) {
            return baton.array().reduce(function (memo, obj) {
                return memo || util.isUnseen(obj);
            }, false);
        },
        action: function (baton) {
            // we don't process sent items
            var list = folderAPI.ignoreSentItems(baton.array());
            api.markRead(list).then(function () { setFocus(baton); });
        }
    });

    new Action('io.ox/mail/actions/spam', {
        capabilities: 'spam',
        collection: 'some && delete && toplevel',
        matches: function (baton) {
            return baton.array().reduce(checkForSpamAction, true);
        },
        action: function (baton) {
            api.markSpam(baton.array())
                .done(function (result) {
                    var error = _(result).chain().pluck('error').compact().first().value();
                    if (error) notifications.yell(error);
                    setFocus(baton);
                })
                .fail(function (error) {
                    notifications.yell(error);
                    api.trigger('refresh.all');
                });
        }
    });

    function checkForSpamAction(memo, obj) {
        // already false?
        if (memo === false) return false;
        // is not primary account?
        if (!account.isPrimary(obj.folder_id)) return false;
        // is spam/confirmed_spam/sent/drafts folder?
        if (account.is('spam|confirmed_spam|sent|drafts', obj.folder_id)) return false;
        // is marked as spam already?
        if (util.isSpam(obj)) return false;
        // else
        return true;
    }

    new Action('io.ox/mail/actions/nospam', {
        capabilities: 'spam',
        collection: 'some && delete && toplevel',
        matches: function (baton) {
            return baton.array().reduce(checkForNoSpamAction, true);
        },
        action: function (baton) {
            api.noSpam(baton.array()).done(function (result) {
                var error = _(result).chain().pluck('error').compact().first().value();
                if (error) notifications.yell(error);
                setFocus(baton);
            });
        }
    });

    function checkForNoSpamAction(memo, obj) {
        // already false?
        if (memo === false) return false;
        // is not primary account?
        if (!account.isPrimary(obj.folder_id)) return false;
        // do not show in subfolders of spam folder
        var spamfolders = account.getFoldersByType('spam').concat(account.getFoldersByType('confirmed_spam'));
        if (spamfolders.indexOf(obj.folder_id) < 0) return false;
        // else
        return account.is('spam|confirmed_spam', obj.folder_id) || util.isSpam(obj);
    }

    // Tested: Yas
    new Action('io.ox/mail/actions/save', {
        // ios cannot handle EML download
        device: '!ios',
        collection: 'some && read',
        action: function (baton) {
            require(['io.ox/mail/actions/save'], function (action) {
                action.multiple(baton.array());
            });
        }
    });

    new Action('io.ox/mail/actions/add-to-portal', {
        capabilities: 'portal',
        collection: 'one && toplevel',
        action: function (baton) {
            require(['io.ox/mail/actions/addToPortal'], function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/mail/actions/sendmail', {
        collection: 'some',
        action: function (baton) {
            require(['io.ox/core/api/user'], function (userAPI) {
                account.getAllSenderAddresses().done(function (senderAddresses) {
                    userAPI.getCurrentUser().done(function (user) {
                        var data = baton.data,
                            toAdresses = data.to.concat(data.cc).concat(data.bcc).concat(data.from),
                            ownAddresses = _.compact([user.get('email1'), user.get('email2'), user.get('email3')]);

                        ownAddresses = ownAddresses.concat(_(senderAddresses).pluck(1));
                        var filtered = _(toAdresses).filter(function (addr) {
                            return ownAddresses.indexOf(addr[1]) < 0;
                        });
                        if (filtered.length === 0) filtered = toAdresses;
                        filtered = _(filtered).uniq(false, function (addr) {
                            return addr[1];
                        });

                        ox.registry.call('mail-compose', 'open', { to: filtered });
                    });
                });
            });
        }
    });

    new Action('io.ox/mail/actions/createdistlist', {
        capabilities: 'contacts',
        collection: 'some',
        action: function (baton) {
            require(['io.ox/mail/actions/create'], function (action) {
                action.createDistributionList(baton);
            });
        }
    });

    new Action('io.ox/mail/actions/invite', {
        capabilities: 'calendar',
        collection: 'some',
        action: function (baton) {
            require(['io.ox/mail/actions/create'], function (action) {
                action.createAppointment(baton);
            });
        }
    });

    new Action('io.ox/mail/actions/reminder', {
        capabilities: 'tasks',
        collection: 'one && toplevel',
        action: function (baton) {
            require(['io.ox/mail/actions/reminder'], function (action) {
                action(baton);
            });
        }
    });

    // Attachments

    new Action('io.ox/mail/attachment/actions/view', {
        collection: 'some',
        matches: function (baton) {
            return baton.array().some(function (data) {
                var model = new filesAPI.Model(data);
                return viewerTypes.canView(model);
            });
        },
        action: function (baton) {
            // mappings for different invokation sources
            var files = baton.list || baton.array(),
                selection =  baton.array()[0];
            ox.load(['io.ox/mail/actions/viewer']).done(function (action) {
                action({
                    files: files,
                    selection: selection,
                    restoreFocus: baton.restoreFocus,
                    openedBy: baton.openedBy
                });
            });
        }
    });

    new Action('io.ox/mail/attachment/actions/download', {
        // ios 11 supports file downloads
        device: '!ios || ios >= 11',
        collection: 'some',
        action: function (baton) {
            // download single attachment or zip file
            var list = baton.array(),
                url = list.length === 1 ?
                    api.getUrl(_(list).first(), 'download') :
                    api.getUrl(list, 'zip');
            // download via iframe or window open
            require(['io.ox/core/download'], function (download) {
                download[_.device('ios') ? 'window' : 'url'](url);
            });
        }
    });

    new Action('io.ox/mail/attachment/actions/save', {
        capabilities: 'infostore',
        collection: 'some',
        action: function (baton) {
            require(['io.ox/mail/actions/attachmentSave'], function (action) {
                action.multiple(baton.array());
            });
        }
    });

    new Action('io.ox/mail/attachment/actions/vcard', {
        capabilities: 'contacts',
        collection: 'one',
        matches: function (baton) {
            var context = baton.first(),
                hasRightSuffix = (/\.vcf$/i).test(context.filename),
                isVCardType = (/^text\/(x-)?vcard/i).test(context.content_type),
                isDirectoryType = (/^text\/directory/i).test(context.content_type);
            return (hasRightSuffix && isDirectoryType) || isVCardType;
        },
        action: function (baton) {
            require(['io.ox/mail/actions/vcard'], function (action) {
                action(baton);
            });
        }
    });

    new Action('io.ox/mail/attachment/actions/ical', {
        capabilities: 'calendar',
        collection: 'some',
        matches: function (baton) {
            var context = baton.first(),
                hasRightSuffix = context.filename && !!context.filename.match(/\.ics$/i),
                isCalendarType = context.content_type && !!context.content_type.match(/^text\/calendar/i),
                isAppType = context.content_type && !!context.content_type.match(/^application\/ics/i),
                mail = api.pool.get('detail').get(_.cid(context.mail));
            if (mail.get('imipMail')) return false;
            return hasRightSuffix || isCalendarType || isAppType;
        },
        action: function (baton) {
            require(['io.ox/mail/actions/ical'], function (action) {
                action(baton);
            });
        }
    });

    // inline links
    var inlineLinks = [
        {
            id: 'reply',
            prio: 'hi',
            mobile: 'lo',
            title: gt('Reply'),
            ref: 'io.ox/mail/actions/reply',
            section: 'standard'
        },
        {
            id: 'reply-all',
            prio: 'hi',
            mobile: 'hi',
            title: gt('Reply all'),
            ref: 'io.ox/mail/actions/reply-all',
            section: 'standard'
        },
        {
            id: 'forward',
            prio: 'hi',
            mobile: 'hi',
            title: gt('Forward'),
            ref: 'io.ox/mail/actions/forward',
            section: 'standard'
        },
        {
            id: 'edit',
            prio: 'hi',
            mobile: 'lo',
            title: gt('Edit'),
            ref: 'io.ox/mail/actions/edit',
            section: 'standard'
        },
        {
            id: 'delete',
            prio: 'hi',
            mobile: 'lo',
            title: gt('Delete'),
            ref: 'io.ox/mail/actions/delete',
            section: 'standard'
        },
        {
            id: 'spam',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Mark as spam'),
            ref: 'io.ox/mail/actions/spam',
            section: 'flags'
        },
        {
            id: 'nospam',
            prio: 'lo',
            mobile: 'lo',
            title: gt('Not spam'),
            ref: 'io.ox/mail/actions/nospam',
            section: 'flags'
        },
        {
            id: 'sendmail',
            prio: 'lo',
            title: gt('Send new email'),
            ref: 'io.ox/mail/actions/sendmail',
            section: 'recipients'
        },
        {
            id: 'invite-to-appointment',
            prio: 'lo',
            title: gt('Invite to appointment'),
            ref: 'io.ox/mail/actions/invite',
            section: 'recipients'
        },
        {
            id: 'save-as-distlist',
            prio: 'lo',
            title: gt('Save as distribution list'),
            ref: 'io.ox/mail/actions/createdistlist',
            section: 'recipients'
        },
        {
            id: 'move',
            prio: 'lo',
            title: gt('Move'),
            ref: 'io.ox/mail/actions/move',
            section: 'file-op'
        },
        {
            id: 'copy',
            prio: 'lo',
            title: gt('Copy'),
            ref: 'io.ox/mail/actions/copy',
            section: 'file-op'
        },
        {
            id: 'archive',
            prio: 'lo',
            //#. Verb: (to) archive messages
            title: gt.pgettext('verb', 'Archive'),
            ref: 'io.ox/mail/actions/archive',
            section: 'file-op'
        },
        {
            id: 'print',
            prio: 'lo',
            mobile: 'none',
            title: gt('Print'),
            ref: 'io.ox/mail/actions/print',
            section: 'export'
        },
        {
            id: 'save-as-eml',
            prio: 'lo',
            mobile: 'none',
            title: gt('Save as file'),
            ref: 'io.ox/mail/actions/save',
            section: 'export'
        },
        {
            id: 'source',
            prio: 'lo',
            mobile: 'lo',
            //#. source in terms of source code
            title: gt('View source'),
            ref: 'io.ox/mail/actions/source',
            section: 'export'
        },
        {
            id: 'filter',
            prio: 'lo',
            mobile: 'none',
            title: gt('Create filter rule'),
            ref: 'io.ox/mail/actions/filter',
            section: 'file-op'
        },
        {
            id: 'reminder',
            prio: 'lo',
            mobile: 'none',
            title: gt('Reminder'),
            ref: 'io.ox/mail/actions/reminder',
            section: 'keep'
        },
        {
            id: 'add-to-portal',
            prio: 'lo',
            mobile: 'none',
            title: gt('Add to portal'),
            ref: 'io.ox/mail/actions/add-to-portal',
            section: 'keep'
        }
    ];

    ext.point('io.ox/mail/links/inline').extend(
        inlineLinks.map(function (extension, index) {
            extension.index = 100 + index * 100;
            extension.mobile = extension.mobile || extension.prio || 'none';
            return extension;
        })
    );

    new Action('io.ox/mail/actions/label', {
        id: 'label',
        collection: 'toplevel some',
        action: $.noop
    });


    // Attachments

    ext.point('io.ox/mail/attachment/links').extend(
        {
            id: 'vcard',
            mobile: 'hi',
            index: 50,
            title: gt('Add to address book'),
            ref: 'io.ox/mail/attachment/actions/vcard'
        },
        {
            id: 'ical',
            mobile: 'hi',
            index: 50,
            title: gt('Add to calendar'),
            ref: 'io.ox/mail/attachment/actions/ical'
        },
        {
            id: 'view_new',
            index: 100,
            mobile: 'hi',
            //#. used as a verb here. label of a button to view attachments
            title: gt('View'),
            ref: 'io.ox/mail/attachment/actions/view'
        },
        {
            id: 'download',
            index: 400,
            mobile: 'hi',
            title: gt('Download'),
            ref: 'io.ox/mail/attachment/actions/download'
        },
        {
            id: 'save',
            index: 500,
            mobile: 'hi',
            //#. %1$s is usually "Drive" (product name; might be customized)
            title: gt('Save to %1$s', gt.pgettext('app', 'Drive')),
            ref: 'io.ox/mail/attachment/actions/save'
        },
        {
            // uses internal viewer, not "view in browser"
            id: 'viewer',
            index: 600,
            mobile: 'hi',
            //#. used as a verb here. label of a button to view attachments
            label: gt('View'),
            ref: 'io.ox/mail/actions/viewer'
        }
    );

    // DND actions

    ext.point('io.ox/mail/dnd/actions').extend({
        id: 'importEML',
        index: 10,
        label: gt('Drop here to import this email'),
        action: function (file, app) {
            app.queues.importEML.offer(file, { folder: app.folder.get() });
        }
    });

    ext.point('io.ox/mail/folderview/premium-area').extend({
        index: 100,
        id: 'inline-premium-links',
        draw: function (baton) {
            this.append(
                baton.renderActions('io.ox/mail/links/premium-links', baton)
            );
        }
    });

});
