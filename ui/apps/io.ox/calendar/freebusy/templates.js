/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/freebusy/templates', [
    'io.ox/core/notifications',
    'gettext!io.ox/calendar/freebusy'
], function (notifications, gt) {

    'use strict';

    var MAX_COLOR = 10;

    return {

        getMainContainer: function () {
            return $('<div class="abs free-busy-view">');
        },

        getHeadline: function (standalone) {
            return $('<h1>').text(
                standalone ? gt('Scheduling') : gt('Find a free time')
            );
        },

        getParticipantsView: function () {
            return $('<div class="participants-view">');
        },

        getParticipantsScrollpane: function () {
            return $('<div class="abs participants-view-scrollpane">');
        },

        getFreeColor: function (collection) {
            var used = {}, i, index = 0, min = Infinity;
            for (i = 0; i < MAX_COLOR; i++) {
                used[i] = 0;
            }
            collection.each(function (model) {
                if (model.index !== undefined) {
                    // due to the one that asks for a color
                    used[model.index % MAX_COLOR]++;
                }
            });
            for (i = 0; i < MAX_COLOR; i++) {
                if (used[i] < min) {
                    index = i;
                    min = used[i];
                }
            }
            return index;
        },

        getColorClass: function (index) {
            return 'color-index-' + (index % MAX_COLOR);
        },

        getParticipantColor: function (index) {
            return $('<div class="participant-color">').addClass(this.getColorClass(index));
        },

        getIntervalDropdown: function () {
            return $('<div class="view-dropdown dropdown pull-right">').append(
                $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" tabindex="4">').append(
                    $.txt(gt('Change view')),
                    $.txt(' '),
                    $('<i class="fa fa-caret-down" aria-hidden="true">')
                ),
                $('<ul class="dropdown-menu pull-right" role="menu">').append(
                    $('<li role="presentation">').append($('<a role="menuitem" href="#" data-action="day">').text(gt('Day'))),
                    $('<li role="presentation">').append($('<a role="menuitem" href="#" data-action="workweek">').text(gt('Workweek'))),
                    $('<li role="presentation">').append($('<a role="menuitem" href="#" data-action="week">').text(gt('Week')))
                )
            );
        },

        getControls: function () {
            return $('<div class="abs free-busy-controls">');
        },

        getAutoCompleteControls: function () {
            return $('<div class="abs autocomplete-controls">').append(
                $('<input type="text" class="add-participant form-control" tabindex="1">').attr('placeholder', gt('Add participant') + ' ...')
            );
        },

        getPopover: function (standalone) {

            var part1 = gt('If you spot a free time, just select this area. ' +
                    'To do this, move the cursor to the start time, hold the mouse button, and <b>drag the mouse</b> to the end time.'),
                part2 = gt('You will automatically return to the appointment dialog. ' +
                    'The selected start and end time as well as the current participant list will be applied.');

            return $('<a href="#" class="hint pull-left" tabindex="2">')
                .text(gt('How does this work?'))
                .click($.preventDefault)
                .popover({
                    content: part1 + (!standalone ? ' ' + part2 : ''),
                    html: true,
                    placement: 'top',
                    title: gt('Help'),
                    trigger: 'focus'
                });
        },

        getBackControl: function () {
            return $('<div class="close-control">').append(
                $('<a href="#" tabindex="3" data-action="cancel">').text(gt('Back to appointment')),
                $('<i class="fa fa-reply">')
            );
        },

        getQuitControl: function () {
            return $('<div class="close-control">').append(
                $('<a href="#" tabindex="3" data-action="quit">').text(gt('Quit')).append($('<i class="fa fa-times">'))
            );
        },

        informAboutfallback: function (data) {
            var owner = data['com.openexchange.folderstorage.displayName'] || '';
            notifications.yell({
                headline: gt('Note'),
                type: 'info',
                message: owner !== '' ?
                    //#. Warning dialog
                    //#. %1$s is a folder/calendar name
                    //#. %2$s is the folder owner
                    gt('You are not allowed to create appointments in "%1$s" owned by %2$s. ' +
                        'Appointments will therefore be created in your private calendar.', data.title, owner) :
                    //#. Warning dialog
                    //#. %1$s is a folder/calendar name
                    gt('You are not allowed to create appointments in "%1$s". ' +
                        'Appointments will therefore be created in your private calendar.', data.title)
            });
        }
    };
});
