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

define('io.ox/mail/actions/delete', [
    'io.ox/core/folder/api',
    'settings!io.ox/mail',
    'io.ox/core/api/account',
    'gettext!io.ox/mail',
    'io.ox/mail/api',
    'io.ox/core/notifications'
], function (folderAPI, settings, accountAPI, gt, api, notifications) {

    'use strict';

    function getQuestion(list) {
        return gt.ngettext(
            'Do you want to permanently delete this mail?',
            'Do you want to permanently delete these mails?',
            list.length
        );
    }

    api.on('delete:fail:quota', function (e, error, list) {
        require(['io.ox/backbone/views/modal'], function (ModalDialogView) {
            new ModalDialogView({
                title: gt('Mail quota exceeded'),
                previousFocus: $('[data-ref="io.ox/mail/listview"]')
            })
            .on('delete', function () {
                // true -> force
                api.remove(list, list, true);
            })
            .addCancelButton()
            .addButton({ action: 'delete', label: gt('Delete') })
            .build(function () {
                this.$body.append(
                    $('<div>').text(gt('Emails cannot be put into trash folder while your mail quota is exceeded.')),
                    $('<div>').text(getQuestion(list))
                );
            })
            .open();
        });
    });

    function ignoreCurrentlyEdited(list) {
        var hash = {};
        _.each(ox.ui.App.get('io.ox/mail/compose'), function (app) {
            // ignore not fully initialised (minimized) restore point instances
            if (!app.view) return;
            hash[app.view.model.get('msgref')] = true;
        });
        if (!Object.keys(hash).length) return list;
        return _.filter(list, function (mail) {
            if (!accountAPI.is('drafts', mail.folder_id)) return true;
            if (!mail.attachment) return true;
            return !hash[mail.msgref];
        });
    }

    function setFocus(baton) {
        if (baton.e.clientX && baton.e.clientY) return;
        $('.io-ox-mail-window .list-item[tabindex="0"]').trigger('focus');
    }

    return function (baton) {

        var list = folderAPI.ignoreSentItems(baton.array()),
            all = list.slice(),
            shiftDelete = baton && baton.options.shiftDelete && settings.get('features/shiftDelete'),
            showPrompt = !shiftDelete && (settings.get('removeDeletedPermanently') || _(list).any(function (o) {
                return accountAPI.is('trash', o.folder_id);
            }));

        // pragmatic approach for bug 55442 cause mail is so special (weak spot: empty folder)
        list = ignoreCurrentlyEdited(list);
        if (all.length !== list.length) {
            notifications.yell({
                headline: gt('Note'),
                type: 'info',
                message: gt('Currently edited drafts with attachments can not be deleted until you close the correspondig mail compose window.')
            });
            // no messages left
            if (!list.length) return;
            all = list.slice();
        }

        if (showPrompt) {
            require(['io.ox/backbone/views/modal'], function (ModalDialog) {
                //#. 'Delete mail' as modal dialog header to confirm to delete a mail.
                new ModalDialog({ title: gt('Delete mail'), description: getQuestion(list) })
                    .addCancelButton()
                    .addButton({ label: gt('Delete'), action: 'delete' })
                    .on('delete', function () {
                        api.remove(list, all).fail(notifications.yell).then(function () { setFocus(baton); });
                    })
                    // trigger back event, used for mobile swipe delete reset
                    .on('cancel', function () { ox.trigger('delete:canceled', list); })
                    .open();
            });
        } else {
            api.remove(list, all, shiftDelete).fail(function (e) {
                // mail quota exceeded? see above
                if (e.code === 'MSG-0039') return;
                notifications.yell(e);
            }).then(function () { setFocus(baton); });
        }
    };
});
