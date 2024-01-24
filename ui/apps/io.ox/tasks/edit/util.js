/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/tasks/edit/util', ['gettext!io.ox/tasks'], function (gt) {

    'use strict';

    var util = {
        //build progressField and buttongroup
        buildProgress: function (val) {
            val = val || 0;
            var progress = $('<input type="text" id="task-edit-progress-field" class="form-control progress-field">').val(val),
                wrapper = $('<div class="input-group">').append(
                    progress,
                    $('<div class="input-group-btn">').append(
                        $('<button type="button" class="btn btn-default" data-action="minus">').append(
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
                        $('<button type="button" class="btn btn-default" data-action="plus">').append(
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
