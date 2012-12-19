/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */

define('io.ox/calendar/acceptdeny',
    ['io.ox/calendar/api',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/calendar'], function (api, dialogs, gt) {

    'use strict';

    return function (o) {

        o = { folder: o.folder_id, id: o.id };

        var inputid = _.uniqueId('dialog');

        return new dialogs.ModalDialog({easyOut: true})
            .header($('<h3>').text('Change confirmation status'))
            .append($('<p>').text(gt('You are about to change your confirmation status. Please leave a comment for other participants.')))
            .append(
                $('<div>').addClass('row-fluid').css({'margin-top': '20px'}).append(
                    $('<div>').addClass('control-group span12').css({'margin-bottom': '0px'}).append(
                        $('<label>').addClass('control-label').attr('for', inputid).text(gt('Comment:')),
                        $('<div>').addClass('controls').css({'margin-right': '10px'}).append(
                            $('<input>')
                            .css({'width': '100%'})
                            .attr('data-property', 'comment')
                            .attr('id', inputid))
                        )
                    )
                )
            .addAlternativeButton('cancel', gt('Cancel'))
            .addDangerButton('declined', gt('Decline'))
            .addWarningButton('tentative', gt('Tentative'))
            .addSuccessButton('accepted', gt('Accept'))
            .show(function () {
                $(this).find('[data-property="comment"]').focus();
            })
            .done(function (action, data, node) {
                var val = $.trim($(node).find('[data-property="comment"]').val());
                if (action === 'cancel') {
                    return;
                }
                o.data = {};
                o.data.confirmmessage = val;

                switch (action) {
                case 'cancel':
                    return;
                case 'accepted':
                    o.data.confirmation = 1;
                    break;
                case 'declined':
                    o.data.confirmation = 2;
                    break;
                case 'tentative':
                    o.data.confirmation = 3;
                    break;
                }

                api.confirm(o)
                    .fail(function (err) {
                        console.log('ERROR', err);
                    });
            });
    };
});
