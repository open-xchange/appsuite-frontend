/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
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

    return {

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

            if (check) {
                require(['io.ox/core/tk/dialogs'], function (dialogs) {
                    new dialogs.ModalDialog()
                        .append(
                            $('<h4>').text(question)
                        )
                        .addPrimaryButton('delete', gt('Delete'), 'delete', { tabIndex: 1 })
                        .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
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
                                .addPrimaryButton('delete', gt('Delete'), 'delete', { tabIndex: 1 })
                                .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
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
    };
});
