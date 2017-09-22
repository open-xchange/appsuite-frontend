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
], function (folderAPI, settings, account, gt, api, notifications) {

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
                focus: '.btn-primary',
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

    return {

        multiple: function (list, baton) {

            var all = list.slice();
            list = folderAPI.ignoreSentItems(list);

            var shiftDelete = baton && baton.options.shiftDelete && settings.get('features/shiftDelete'),
                showPrompt = !shiftDelete && (settings.get('removeDeletedPermanently') || _(list).any(function (o) {
                    return account.is('trash', o.folder_id);
                }));

            // this probably needs to be done server-side
            // far too much delay when rushing through folders
            // and deleting unimportant unseen stuff, e.g. spam mail

            // function remove(l, a) {
            //     var spamList = _(l).filter(function (o) {
            //         return account.is('spam', o.folder_id);
            //     });

            //     if (spamList && spamList.length > 0) {
            //         return api.markRead(spamList).always(function () {
            //             return api.remove(l, a);
            //         });
            //     } else {
            //         return api.remove(l, a);
            //     }
            // }

            if (showPrompt) {
                require(['io.ox/backbone/views/modal'], function (ModalDialogView) {
                    new ModalDialogView({
                        title: getQuestion(list),
                        focus: '.btn-primary',
                        previousFocus: $('[data-ref="io.ox/mail/listview"]')
                    })
                    .on('delete', function () {
                        api.remove(list, all).fail(notifications.yell);
                    })
                    .addCancelButton()
                    .addButton({ action: 'delete', label: gt('Delete') })
                    .hideBody()
                    .open();
                });
            } else {
                api.remove(list, all, shiftDelete).fail(function (e) {
                    // mail quota exceeded? see above
                    if (e.code === 'MSG-0039') return;
                    notifications.yell(e);
                });
            }
        }
    };
});
