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
            var displayComment = _(list).some(function (event) {
                    return event.get('attendees').length > 1;
                }),
                guid,
                model = new Backbone.Model({ comment: '' }),
                commentView = [
                    //#. used as a noun, not as a verb
                    $('<label>').text(gt('Comment')).attr({ for: guid = _.uniqueId('containerlabel-') }),
                    new mini.InputView({ name: 'comment', model: model, placeholder: gt('Password'), autocomplete: false }).render().$el
                ];
            commentView[1].find('input').attr('id', guid);

            var cont = function (action) {

                list = _(list).chain().map(function (obj) {
                    obj = obj instanceof Backbone.Model ? obj.attributes : obj;
                    var options = {
                        id: obj.id,
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
                return event.has('recurrenceId') && event.get('id') === event.get('seriesId');
            });
            if (hasSeries) {
                var hasFirstOccurence = _(list).some(function (event) {
                        return event.hasFlag('first_occurrence') || !event.hasFlag('organizer');
                    }),
                    dialog = new dialogs.ModalDialog({ addClass: 'delete-dialog' });

                if (hasFirstOccurence) {
                    dialog
                    .text(gt('Do you want to delete the whole series or just this appointment within the series?'))
                        .addPrimaryButton('series', gt('Series'), 'series')
                        .addButton('appointment', gt('This appointment'), 'appointment');
                } else {
                    dialog
                        .text(gt('Do you want to delete this and all future appointments or just this appointment within the series?'))
                        .addPrimaryButton('thisandfuture', gt('All future appointments'), 'thisandfuture')
                        .addButton('appointment', gt('This appointment'), 'appointment');
                }

                if (displayComment) dialog.append(commentView);

                dialog
                    .addAlternativeButton('cancel', gt('Cancel'), 'cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'cancel') return;
                        cont(action);
                    });
            } else {
                new dialogs.ModalDialog({ addClass: 'delete-dialog' })
                    .text(gt('Do you want to delete this appointment?'))
                    .append(displayComment ? commentView : $())
                    .addPrimaryButton('ok', gt('Delete'), 'ok')
                    .addAlternativeButton('cancel', gt('Cancel'), 'cancel')
                    .show()
                    .done(function (action) {
                        if (action === 'cancel') return;
                        cont('appointment');
                    });
            }
        });
    };

});
