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

define('io.ox/calendar/extensions', [
    'io.ox/core/extensions',
    'io.ox/calendar/util',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar'
], function (ext, util, folderAPI, gt) {

    'use strict';

    ext.point('io.ox/calendar/appointment').extend({
        id: 'default',
        index: 100,
        draw: (function () {
            function addColors(node, model) {
                var folder = folderAPI.pool.getModel(model.get('folder')).toJSON(),
                    color = util.getAppointmentColor(folder, model),
                    foregroundColor = util.getForegroundColor(color),
                    colorName = util.getColorName(color);

                if (!color) {
                    // cleanup possible previous styles
                    node.css({
                        'background-color': '',
                        'color': '',
                        'border-left-color': ''
                    }).data('background-color', null);
                    node.removeClass('white black');
                    return;
                }
                node.css({
                    'background-color': color,
                    'color': foregroundColor,
                    'border-left-color': foregroundColor === 'white' ? '' : foregroundColor
                }).data('background-color', color);
                node.addClass(foregroundColor === 'white' ? 'white' : 'black');
                if (util.canAppointmentChangeColor(folder, model)) {
                    node.attr('data-folder', folder.id);
                }
                //#. Will be used as aria lable for the screen reader to tell the user which color/category the appointment within the calendar has.
                if (colorName) node.attr('aria-label', getTitle(model) + ', ' + gt('Category') + ': ' + colorName);
            }

            function addModifyClass(node, model) {
                var folderId = model.get('folder'),
                    folderModel = folderAPI.pool.getModel(folderId),
                    folder = folderModel.toJSON();
                node.toggleClass('modify', folderAPI.can('write', folder, model.attributes) && util.allowedToEdit(model.toJSON(), folderModel));
            }

            function getTitle(model) {
                return _([model.get('summary'), model.get('location')]).compact().join(', ');
            }

            return function (baton) {
                var model = baton.model,
                    folderId = model.get('folder'),
                    folderModel = folderAPI.pool.getModel(folderId),
                    folder = folderModel.toJSON(),
                    incomplete = !folder.permissions,
                    // in week view all day appointments are 20px high, no space to show the location too, so it can be dismissed
                    skipLocation = !model.get('location') || (baton.view && baton.view.mode && baton.view.mode.indexOf('week') === 0 && util.isAllday(model)),
                    appointmentTitle = getTitle(model),
                    contentNode = $('<div class="appointment-content">')
                        .attr({
                            title: appointmentTitle,
                            'aria-describedby': _.uniqueId('appointment-desc-'),
                            'data-detail-popup': 'appointment'
                        });

                // cleanup classes to redraw correctly
                this.removeClass('free modify private disabled needs-action accepted declined tentative');

                // Call this before addColor is invoked
                this.attr({ 'aria-label': getTitle(model),
                    'aria-haspopup': 'dialog',
                    'aria-expanded': 'false',
                    tabindex: '0'
                }).on('keydown', function (e) {
                    // Handle Enter and Space key activation
                    if (e.which === 13 || e.which === 32) {
                        e.preventDefault();
                        $(this).click();
                    }
                });

                if (String(folder.id) === String(folderId)) addColors(this, model);
                else if (folderId !== undefined) folderAPI.get(folderId).done(addColors.bind(this, this, model));

                if (!folder.module) folderAPI.once('after:flat:event', addColors.bind(this, this, model));

                if (util.isPrivate(model) && ox.user_id !== (model.get('createdBy') || {}).entity && !folderAPI.is('private', folder)) {
                    this.addClass('private disabled');
                } else {
                    var conf = util.getConfirmationStatus(model);
                    if (util.isPrivate(model)) this.addClass('private');
                    this.addClass(util.getShownAsClass(model) + ' ' + util.getConfirmationClass(conf) + ' ' + util.getStatusClass(model));

                    addModifyClass(this, model);
                    if (incomplete) folderModel.once('change', addModifyClass.bind(undefined, this, model));
                }
                if (skipLocation) {
                    contentNode.append(
                        util.returnIconsByType(model).type,
                        model.get('summary') ? $('<div class="title">').text(_.noI18n(model.get('summary'))) : ''
                    );
                } else {
                    contentNode.append(
                        $('<div class="title-container">').append(
                            util.returnIconsByType(model).type,
                            model.get('summary') ? $('<div class="title">').text(_.noI18n(model.get('summary'))) : ''
                        ),
                        $('<div class="location">').text(_.noI18n(model.get('location')))
                    );
                }

                this.append(contentNode).attr({ 'data-extension': 'default' });
            };
        }())
    });
});
