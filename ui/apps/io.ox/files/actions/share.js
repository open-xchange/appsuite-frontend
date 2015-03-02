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
            insert = count === 1 ? _.ellipsis(files[0].filename, { max: 40, charpos: 'middle' }) : count,
            //#. if only one item -> insert filename / on more than one item -> item count
            header = gt.format(gt.ngettext('Share the file "%1$d"', 'Share %1$d items', count), insert),
            view = new ShareView({ files: files });

        new dialogs.ModalDialog({ width: 600, async: true })
            .header($('<h4>').text(header))
            .append(view.render().$el)
            .addPrimaryButton('share', gt('Share'), 'share')
            .addButton('cancel', gt('Cancel'), 'cancel')
            .on('share', function () {
                view.share().then(this.close, this.idle);
            })
            .on('cancel', function () {
                view.cancel();
                this.close();
            })
            .show();
    };
});
