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
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/common'
], function (api, util, yell, gt, ModalDialog, mini) {

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
                text, dialog, hasFirstOccurence;

            if (hasSeries) {
                hasFirstOccurence = _(list).some(function (event) {
                    return event.hasFlag('first_occurrence') || !event.hasFlag('organizer');
                });
                text = hasFirstOccurence
                    ? gt('Do you want to delete the whole series or just this appointment within the series?')
                    : gt('Do you want to delete this and all future appointments or just this appointment within the series?');
            } else {
                text = gt('Do you want to delete this appointment?');
            }
            dialog = new ModalDialog({
                title: displayComment ? gt('Delete appointment') : text,
                description: displayComment ? [$('<div>').text(text), commentView] : false
            })
            .addCancelButton({ left: true })
            .on('action', function (action) {
                if (action === 'cancel') return;
                cont(action);
            });

            if (hasSeries) {
                dialog.addButton({ label: gt('This appointment'), action: 'appointment', className: 'btn-default' });
                if (hasFirstOccurence) dialog.addButton({ label: gt('Series'), action: 'series' });
                else dialog.addButton({ label: gt('All future appointments'), action: 'thisandfuture' });
            } else {
                dialog.addButton({ label: gt('Delete'), action: 'appointment' });
            }
            dialog.open();
        });
    };

});
