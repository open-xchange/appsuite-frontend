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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */

define('io.ox/files/actions/share', [
    'io.ox/backbone/views/modal',
    'io.ox/files/share/wizard',
    'io.ox/core/notifications',
    'gettext!io.ox/files'
], function (ModalDialog, ShareWizard, notifications, gt) {

    'use strict';

    function link(array) {

        if (!array) return;

        var header = '',
            count = array.length,
            first = array[0],
            filler = (count === 1) ? _.ellipsis(first.getDisplayName(), { max: 40, charpos: 'middle' }) : count,
            view = new ShareWizard({ files: array });

        function toggleButtons(sendVisible) {
            dialog.$footer.find('.btn[data-action="cancel"]').toggle(sendVisible);
            dialog.$footer.find('.btn[data-action="share"]').text(sendVisible ? gt('Send link') : gt('Close'));
        }

        // build header
        if (first.isFile()) {
            //#. if only one item -> insert filename / on more than one item -> item count
            header = gt.format(gt.ngettext('Sharing link created for file "%1$d"', 'Sharing link created for %1$d items', count), filler);
        } else if (first.isFolder()) {
            header = gt.format(gt.ngettext('Sharing link created for folder "%1$d"', 'Sharing link created for %1$d items', count), filler);
        }

        // create dialog
        var dialog = new ModalDialog({
            async: true,
            focus: '.link-group>input[type=text]',
            title: header,
            help: 'ox.appsuite.user.sect.dataorganisation.sharing.link.html',
            smartphoneInputFocus: true,
            width: 600
        });

        dialog.$el.addClass('get-link-dialog');

        // render share wizard into dialog body
        dialog.$body.append(
            view.render().$el
        );

        // add dialog buttons
        dialog
            .addCancelButton()
            .addButton({ label: gt('Close'), action: 'share' })
            .addAlternativeButton({ label: gt('Remove link'), action: 'remove' });

        // initial state is "no send"
        toggleButtons(false);

        // basic setup
        dialog.busy(true);
        dialog.$footer.find('.btn-primary').prop('disabled', true);

        // add event listeners
        view.listenTo(view.model, 'change:url', function (value) {
            if (!value) return;

            dialog.idle();
            dialog.$footer.find('.btn-primary').prop('disabled', false);
        });

        view.listenTo(view.model, 'change:recipients', function (model, value) {
            toggleButtons(value.length > 0);
        });

        dialog
            .on('share', function () {
                view.share().then(this.close, this.idle);
            })
            .on('remove', function () {
                view.removeLink();
                notifications.yell('success', gt('The link has been removed'));
                this.close();
            });

        dialog.open();

        return dialog;
    }

    return {
        // array is an array of models
        invite: function (array) {

            if (!array) return;

            return require(['io.ox/files/share/permissions'], function (permissions) {
                var model = _.first(array);
                permissions.showByModel(model, { share: true });
            });
        },

        link: link
    };
});
