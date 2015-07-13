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
    'io.ox/files/share/wizard',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (dialogs, ShareWizard, notifications, gt) {

    'use strict';

    function share(baton, type) {
        if (!baton || !baton.models) return;

        var header = '',
            count = baton.models.length,
            first = baton.models[0],
            filler = count === 1 ? _.ellipsis(first.getDisplayName(), { max: 40, charpos: 'middle' }) : count,
            view = new ShareWizard({ files: baton.models });

        // build header
        if (first.isFile()) {
            //#. if only one item -> insert filename / on more than one item -> item count
            header = gt.format(gt.ngettext('Share the file "%1$d"', 'Share %1$d items', count), filler);
        } else if (first.isFolder()) {
            header = gt.format(gt.ngettext('Share the folder "%1$d"', 'Share %1$d items', count), filler);
        }

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

        view.model.set('type', type);
    }

    return {
        invite: function (baton) {
            share(baton, 'invite');
        },
        link: function (baton) {
            share(baton, 'link');
        }
    };
});
