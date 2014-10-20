/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/share', [
    'io.ox/core/tk/dialogs',
    'io.ox/files/share/view',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (dialogs, ShareView, notifications, gt) {

    'use strict';

    return function (files) {
        var count = files.length,
            insert = count === 1 ? _.ellipsis(files[0].filename, { max: 40, charpos: 'middel' }) : count,
            //#. if only one item -> insert filename / on more than one item -> item count
            header = gt.format(gt.ngettext('Share the file "%1$d"', 'Share %1$d items', count), insert),
            view = new ShareView({ files: files });
        $.noop(files, dialogs, ShareView. notifications, gt, count, view, header);

        new dialogs.ModalDialog({ width: 600 })
            .header($('<h4>').text(header))
            .append(view.render().$el)
            .addPrimaryButton('share', gt('Share'), 'delete')
            .addButton('cancel', gt('Cancel'), 'cancel')
            .show()
            .done(function (action) {
                if (action === 'share') {
                    notifications.yell('warning', 'The share cannot be set up because of unready API');
                }
            });
    };
});

// Iconview Inline Links

// old share action
// new Action('io.ox/files/icons/share', {
//     capabilities: 'publication',
//     requires: function (e) {
//         var check = function (data) {
//             data = data || {};
//             return folderAPI.can('publish', data) && !folderAPI.is('trash', data);
//         };
//         if (e.baton.app) {
//             return e.baton.app.folder.getData().then(check);
//         } else if (e.baton.data.folder_id) {//no app given, maybe the item itself has a folder
//             return folderAPI.get(e.baton.data.folder_id).then(check);
//         } else {//continue without foldercheck
//             return check();
//         }
//     },
//     action: function (baton) {
//         require(['io.ox/core/pubsub/publications'], function (publications) {
//             baton.app.folder.getData().then(function (data) {
//                 baton = ext.Baton({ data: data });
//                 publications.buildPublishDialog(baton);
//             });
//         });
//     }
// });
