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
        // do not use "gt.ngettext" for plural without count
        return (list.length === 1) ?
            gt('Do you want to permanently delete this mail?') :
            gt('Do you want to permanently delete these mails?');
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

    // check for open composition spaces (does not cover 'empty folder' action yet)
    var promptForCurrentlyEdited = (function () {

        function ignoreCurrentlyEdited(list) {
            if (!Object.keys(ox.ui.spaces).length) return list;
            return _.filter(list, function (mail) {
                return !ox.ui.spaces[mail.cid];
            });
        }

        return function promptForCurrentlyEdited(all, list) {
            var filtered = ignoreCurrentlyEdited(list),
                diff = all.length - filtered.length;
            // do not show dialog an proceed
            if (!diff) return $.when();

            var def = $.Deferred();
            require(['io.ox/backbone/views/modal'], function (ModalDialog) {
                var dialog = new ModalDialog({
                    title: gt('Are you sure?'),
                    description: gt.ngettext(
                        //#. %1$d is the number of mails
                        'This would also delete a currently edited draft.',
                        'This would also delete %1$d currently edited drafts.', diff, diff
                    ),
                    async: true,
                    backdrop: true
                })
                .addCancelButton()
                .addButton({ action: 'force', label: gt('Delete') })
                .open();

                dialog.on('cancel', def.reject);
                dialog.on('force', def.resolve);
                dialog.on('action', dialog.close);
            });
            return def;
        };

    })();

    return function (baton) {
        var list = folderAPI.ignoreSentItems(baton.array()),
            all = list.slice(),
            shiftDelete = baton && baton.options.shiftDelete && settings.get('features/shiftDelete'),
            showPrompt = !shiftDelete && (settings.get('removeDeletedPermanently') || _(list).any(function (o) {
                return accountAPI.is('trash', o.folder_id);
            }));

        // delete also currently edited drafts and it's corresponding composition spaces?
        promptForCurrentlyEdited(all, list).then(function proceed() {
            // permanently delete?
            if (showPrompt) {
                require(['io.ox/backbone/views/modal'], function (ModalDialog) {
                    //#. 'Delete mail' as modal dialog header to confirm to delete a mail.
                    new ModalDialog({ title: gt('Delete mail'), description: getQuestion(list) })
                        .addCancelButton()
                        .addButton({ label: gt('Delete'), action: 'delete' })
                        .on('delete', function () { api.remove(list, all).fail(notifications.yell); })
                        // trigger back event, used for mobile swipe delete reset
                        .on('cancel', function () { ox.trigger('delete:canceled', list); })
                        .open();
                });
            } else {
                api.remove(list, all, shiftDelete).fail(function (e) {
                    // mail quota exceeded? see above
                    if (e.code === 'MSG-0039') return;
                    notifications.yell(e);
                });
            }
        }, function cancel() {
            ox.trigger('delete:canceled', all);
        });

    };
});
