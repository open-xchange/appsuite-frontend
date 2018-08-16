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

define('io.ox/calendar/week/extensions', [
    'io.ox/core/extensions',
    'io.ox/calendar/util',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar'
], function (ext, util, folderAPI, gt) {

    'use strict';

    ext.point('io.ox/calendar/week/view/appointment').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {
            var self = this,
                a = baton.model,
                folder = folderAPI.pool.getModel(a.get('folder')).toJSON(),
                conf = 1,
                confString = '%1$s',
                classes = '';

            function addColors(f) {
                var color = util.getAppointmentColor(f, a),
                    foregroundColor = util.getForegroundColor(color);
                if (!color) return;
                self.css({
                    'background-color': color,
                    'color': foregroundColor,
                    'border-left-color': foregroundColor === 'white' ? '' : foregroundColor
                }).data('background-color', color);
                self.addClass(util.getForegroundColor(color) === 'white' ? 'white' : 'black');
                if (util.canAppointmentChangeColor(f, a)) {
                    self.attr('data-folder', f.id);
                }
            }

            var folderId = a.get('folder');
            if (String(folder.id) === String(folderId)) {
                addColors(folder);
            } else if (folderId !== undefined) {
                folderAPI.get(folderId).done(addColors);
            }

            if (util.isPrivate(a) && ox.user_id !== a.get('createdBy').entity && !folderAPI.is('private', folder)) {
                classes = 'private disabled';
            } else {
                conf = util.getConfirmationStatus(a);
                classes = (util.isPrivate(a) ? 'private ' : '') + util.getShownAsClass(a) +
                    ' ' + util.getConfirmationClass(conf);
                // if (conf === 'TENTATIVE') {
                //     confString =
                //         //#. add confirmation status behind appointment title
                //         //#. %1$s = apppintment title
                //         //#, c-format
                //         gt('%1$s (Tentative)');
                // }
            }

            this
                .attr('tabindex', 0)
                .addClass(classes)
                .append(
                    $('<div class="appointment-content">').append(
                        $('<div>').append(
                            util.returnIconsByType(a).type,
                            a.get('summary') ? $('<div class="title">').text(gt.format(confString, a.get('summary') || '\u00A0')) : ''
                        ),
                        a.get('location') ? $('<div class="location">').text(a.get('location') || '\u00A0') : '',
                        $('<div class="flags">').append(util.returnIconsByType(a).property)
                    )
                )
                .attr({
                    'data-extension': 'default'
                });

            this.on('calendar:weekview:rendered', function () {

                var contentHeight = $(this).find('.appointment-content').height(),
                    titleHeight = $(this).find('.title').height(),
                    noWrap = $(this).hasClass('no-wrap'),
                    locationHeight = $(this).find('.location').length < 1 || noWrap ? 0 : $(this).find('.location').height(),
                    flagsHeight = $(this).find('.flags').height();

                if (!flagsHeight) return;
                if (titleHeight + locationHeight < contentHeight - flagsHeight) {
                    $(this).find('.flags').addClass('bottom-right');
                } else {
                    $(this).find('.flags').hide();
                }
            });
        }
    });

    ext.point('io.ox/calendar/week/view/appointment').extend({
        id: 'resize-fulltime',
        index: 200,
        draw: function (baton) {
            var model = baton.model;
            if (!util.isAllday(model)) return;
            var folder = folderAPI.pool.getModel(model.get('folder')).toJSON(),
                canModifiy = folderAPI.can('write', folder, model.attributes) && util.allowedToEdit(model, { synced: true, folderData: folder });
            if (!canModifiy) return;
            this.addClass('modify');
            var startDate = baton.view.model.get('startDate'),
                endDate = startDate.clone().add(baton.view.numColumns, 'days');
            if (!model.getMoment('startDate').isSame(startDate, 'day')) this.append($('<div class="resizable-handle resizable-w">'));
            if (!model.getMoment('endDate').isSame(endDate)) this.append($('<div class="resizable-handle resizable-e">'));
        }
    });

    ext.point('io.ox/calendar/week/view/appointment').extend({
        id: 'resize',
        index: 300,
        draw: function (baton) {
            var model = baton.model;
            if (util.isAllday(model)) return;
            var folder = folderAPI.pool.getModel(model.get('folder')).toJSON(),
                canModifiy = folderAPI.can('write', folder, model.attributes) && util.allowedToEdit(model, { synced: true, folderData: folder });
            if (!canModifiy) return;
            this.addClass('modify');
            if (!this.hasClass('rmnorth')) this.append($('<div class="resizable-handle resizable-n">'));
            if (!this.hasClass('rmsouth')) this.append($('<div class="resizable-handle resizable-s">'));
        }
    });

});
