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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/calendar/actions/delete', [
    'io.ox/calendar/api',
    'io.ox/calendar/util',
    'io.ox/core/yell',
    'gettext!io.ox/calendar',
    'io.ox/core/tk/dialogs',
    'io.ox/backbone/mini-views/common'
], function (api, util, yell, gt, dialogs, mini) {

    'use strict';

    return function (list) {
        api.getList(list).done(function (list) {
            var displayComment = _(list).every(function (event) {
                    return (event.hasFlag('organizer') || (event.hasFlag('organizer_on_behalf') && !event.hasFlag('attendee'))) && event.get('attendees').length > 1;
                }),
                guid,
                model = new Backbone.Model({ comment: '' }),
                commentView = [
                    $('<label>').text(gt('Add a message to the notification email for the other participants.')).attr({ for: guid = _.uniqueId('containerlabel-') }),
                    new mini.InputView({ name: 'comment', model: model, placeholder: gt('Password'), autocomplete: false }).render().$el
                ];
            commentView[1].find('input').attr('id', guid);

            var cont = function (action) {

                list = _(list).chain().map(function (obj) {
                    obj = obj instanceof Backbone.Model ? obj.attributes : obj;
                    var options = {
                        // prefer the seriesId over the id to make it work for exeptions
                        id:  action === 'thisandfuture' || action === 'series' ? obj.seriesId || obj.id : obj.id,
                        folder: obj.folder,
                        recurrenceRange: action === 'thisandfuture' ? 'THISANDFUTURE' : undefined
                    };
                    // if the whole series should be deleted, don't send the recurrenceId.
                    if (action !== 'series' && obj.recurrenceId) {
                        options.recurrenceId = obj.recurrenceId;
                    }
                    return options;
                })
                .uniq(function (obj) {
                    return JSON.stringify(obj);
                }).value();

                var options = util.getCurrentRangeOptions();

                if (displayComment && model.get('comment')) options.comment = model.get('comment');

                api.remove(list, options).fail(yell);
            };

            var hasSeries = _(list).some(function (event) {
                    if (event.hasFlag('last_occurrence')) return false;
                    return event.has('recurrenceId');
                }),
                text, dialog;

            if (hasSeries) {
                var hasFirstOccurence = _(list).some(function (event) {
                    return event.hasFlag('first_occurrence') || !event.hasFlag('organizer');
                });
                dialog = new dialogs.ModalDialog({ addClass: 'delete-dialog' });

                if (hasFirstOccurence) {
                    text = gt('Do you want to delete the whole series or just this appointment within the series?');
                    dialog
                        .addPrimaryButton('series', gt('Series'), 'series')
                        .addButton('appointment', gt('This appointment'), 'appointment');
                } else {
                    text = gt('Do you want to delete this and all future appointments or just this appointment within the series?');
                    dialog
                        .addPrimaryButton('thisandfuture', gt('All future appointments'), 'thisandfuture')
                        .addButton('appointment', gt('This appointment'), 'appointment');
                }

                if (displayComment) {
                    dialog.header($('<h1>').text(gt('Delete appointment')))
                        .append($('<div>').text(text))
                        .append(commentView);
                } else {
                    dialog.append($('<h1>').text(text));
                }

                dialog
                    .addAlternativeButton('cancel', gt('Cancel'), 'cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'cancel') return;
                        cont(action);
                    });
            } else {

                dialog = new dialogs.ModalDialog({ addClass: 'delete-dialog' })
                    .addPrimaryButton('ok', gt('Delete'), 'ok')
                    .addAlternativeButton('cancel', gt('Cancel'), 'cancel');
                text = gt('Do you want to delete this appointment?');

                if (displayComment) {
                    dialog.header($('<h1>').text(gt('Delete appointment')))
                        .append($('<div>').text(text))
                        .append(commentView);
                } else {
                    dialog.append($('<h1>').text(text));
                }

                dialog.show()
                    .done(function (action) {
                        if (action === 'cancel') return;
                        cont('appointment');
                    });
            }
        });
    };

});
