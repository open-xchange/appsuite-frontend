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
            filler = (count === 1) ? _.ellipsis(first.getDisplayName(), { max: 40, charpos: 'middle' }) : '',
            view = new ShareWizard({ files: array });

        function toggleButtons(sendVisible) {
            dialog.$footer.find('.btn[data-action="cancel"]').toggle(sendVisible);
            dialog.$footer.find('.btn[data-action="share"]').text(sendVisible ? gt('Send link') : gt('Close'));
        }

        // build header
        if (count > 1) {
            //#. informs user about the consequences when creating a rule for selected mail
            //#. %1$d number of items (files or folders)
            //#, c-format
            header = gt.ngettext('Sharing link created for %1$d item', 'Sharing link created for %1$d items', count, count);
        } else if (first.isFile()) {
            // special text with file name for single file
            //#. informs user about the consequences when creating a rule for selected mail
            //#. %1$s file name
            //#, c-format
            header = gt('Sharing link created for file "%1$s"', filler);
        } else if (first.isFolder()) {
            // special text with file name for single folder
            //#. informs user about the consequences when creating a rule for selected mails ()
            //#. %1$s folder name
            //#, c-format
            header = gt('Sharing link created for folder "%1$s"', filler);
        }

        // create dialog
        var dialog = new ModalDialog({
            async: true,
            focus: '.link-group>input[type=text]',
            title: header,
            point: 'io.ox/files/actions/share',
            help: 'ox.appsuite.user.sect.dataorganisation.sharing.link.html',
            smartphoneInputFocus: true
        });

        dialog.$el.addClass('get-link-dialog');

        // render share wizard into dialog body
        dialog.$body.append(
            view.render().$el
        );

        // after the dialog is open, we have to trigger an update on the tokenfield, as the correct width can only be calculated once the nodes are actually in the dom.
        dialog.on('open', function () {
            var tokenfield = view.$el.find('input.tokenfield').data('bs.tokenfield');
            if (tokenfield) tokenfield.update();
        });

        // add dialog buttons
        dialog
            .addCancelButton()
            .addButton({ label: gt('Remove link'), action: 'remove', placement: 'left', className: 'btn-default' })
            .addButton({ label: gt('Close'), action: 'share' });

        // initial state is "no send"
        toggleButtons(false);

        // basic setup
        dialog.busy(true);
        dialog.$footer.find('.btn-primary').prop('disabled', true);

        // error handler
        dialog.listenTo(view.model, 'error:sync', function (action) {
            if (action === 'read') return this.close();
            if (action === 'update') return this.close();
            this.idle();
        });

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
                view.share().then(this.close, function () {
                    // it can happen that the dialog is disposed already due to different error handlers, do not call idle in this case
                    if (this && this.disposed === true) return;
                    this.idle();
                }.bind(this));
            })
            .on('remove', function () {
                view.removeLink()
                    .then(function () {
                        notifications.yell('success', gt('The link has been removed'));
                        dialog.close();
                    }, function (error) {
                        notifications.yell(error);
                        dialog.idle();
                    });
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
