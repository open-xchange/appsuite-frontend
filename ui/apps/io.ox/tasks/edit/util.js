/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/edit/util', ['gettext!io.ox/tasks'], function (gt) {

    'use strict';

    var util = {
        //build progressField and buttongroup
        buildProgress: function (val) {
            val = val || 0;
            var progress = $('<input class="form-control progress-field">').attr({ type: 'text', id: 'task-edit-progress-field', tabindex: 1 }).val(val),
                wrapper = $('<div class="input-group">').append(
                    progress,
                    $('<div class="input-group-btn">').append(
                        $('<button type="button" tabindex="1" class="btn btn-default" data-action="minus">').append(
                            $('<i class="fa fa-minus" aria-hidden="true">'),
                            $('<span class="sr-only">').text(gt('Minus'))
                        )
                        .on('click', function () {
                            var temp = parseInt(progress.val(), 10);
                            temp -= 25;
                            if (temp < 0) {
                                temp = 0;
                            }
                            if (temp !== parseInt(progress.val(), 10)) {
                                progress.val(temp);
                                progress.trigger('change');
                            }
                        }),
                        $('<button type="button" tabindex="1" class="btn btn-default" data-action="plus">').append(
                            $('<i class="fa fa-plus" aria-hidden="true">'),
                            $('<span class="sr-only">').text(gt('Plus'))
                        )
                        .on('click', function () {
                            var temp = parseInt(progress.val(), 10);
                            temp += 25;
                            if (temp > 100) {
                                temp = 100;
                            }
                            if (temp !== parseInt(progress.val(), 10)) {
                                progress.val(temp);
                                progress.trigger('change');
                            }
                        })
                    )
                );

            return { progress: progress, wrapper: wrapper };
        },
        sanitizeBeforeSave: function (baton) {

            // check if waiting for attachmenthandling is needed
            var list = baton.attachmentList;
            if (list && (list.attachmentsToAdd.length + list.attachmentsToDelete.length) > 0) {
                //temporary indicator so the api knows that attachments need to be handled even if nothing else changes
                baton.model.attributes.tempAttachmentIndicator = true;
            }

            // remove hours and minutes when full_time attribute it set
            if (baton.model.get('full_time')) {
                if (baton.model.get('end_time')) {
                    baton.model.set('end_time', moment.utc(baton.model.get('end_time')).startOf('day').valueOf(), { silent: true });
                }
                if (baton.model.get('start_time')) {
                    baton.model.set('start_time', moment.utc(baton.model.get('start_time')).startOf('day').valueOf(), { silent: true });
                }
            }

            // accept any formating
            if (baton.model.get('actual_costs')) {
                baton.model.set('actual_costs', (String(baton.model.get('actual_costs'))).replace(/,/g, '.'));
            }
            if (baton.model.get('target_costs')) {
                baton.model.set('target_costs', (String(baton.model.get('target_costs'))).replace(/,/g, '.'));
            }
        }
    };

    return util;
});
