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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
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

            function getTitle(model) {
                return _([model.get('summary'), model.get('location')]).compact().join(', ');
            }

            return function (baton) {

                var model = baton.model,
                    folderModel = folderAPI.pool.getModel(model.get('folder')),
                    folder = folderModel.toJSON(),
                    folderId = model.get('folder'),
                    // in week view all day appointments are 20px high, no space to show the location too, so it can be dismissed
                    skipLocation = !model.get('location') || (baton.view && baton.view.mode && baton.view.mode.indexOf('week') === 0 && util.isAllday(model)),
                    contentNode = $('<div class="appointment-content" aria-hidden="true">').attr('title', getTitle(model));

                // cleanup classes to redraw correctly
                this.removeClass('free modify private disabled needs-action accepted declined tentative');

                // Call this before addColor is invoked
                this.attr('aria-label', getTitle(model));

                if (String(folder.id) === String(folderId)) addColors(this, model);
                else if (folderId !== undefined) folderAPI.get(folderId).done(addColors.bind(this, this, model));

                if (!folder.module) folderAPI.once('after:flat:event', addColors.bind(this, this, model));

                if (util.isPrivate(model) && ox.user_id !== (model.get('createdBy') || {}).entity && !folderAPI.is('private', folder)) {
                    this.addClass('private disabled');
                } else {
                    var canModifiy = folderAPI.can('write', folder, model.attributes) && util.allowedToEdit(model.toJSON(), folderModel),
                        conf = util.getConfirmationStatus(model);
                    if (util.isPrivate(model)) this.addClass('private');
                    if (canModifiy) this.addClass('modify');
                    this.addClass(util.getShownAsClass(model) + ' ' + util.getConfirmationClass(conf));
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
