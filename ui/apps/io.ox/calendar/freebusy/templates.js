/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/freebusy/templates', ['gettext!io.ox/calendar/freebusy'], function (gt) {

    'use strict';

    return {

        getMainContainer: function () {
            return $('<div class="abs free-busy-view">');
        },

        getHeadline: function () {
            return $('<h1>').text(gt('Find a free time'));
        },

        getParticipantsView: function () {
            return $('<div class="participants-view">');
        },

        getParticipantsScrollpane: function () {
            return $('<div class="abs participants-view-scrollpane">');
        },

        getColorClass: function (index) {
            return 'color-index-' + ((index * 2) % 9);
        },

        getParticipantColor: function (index) {
            return $('<div class="participant-color">').addClass(this.getColorClass(index));
        },

        updateParticipantColor: function (container, cid, index) {
            var node = container.find('[data-cid="' + cid + '"] .participant-color');
            node.attr('class', 'participant-color ' + this.getColorClass(index));
        },

        getControls: function () {
            return $('<div class="abs free-busy-controls">');
        },

        getAutoCompleteControls: function () {
            return $('<div class="autocomplete-controls input-append pull-left">').append(
                $('<input type="text" class="add-participant" tabindex="1">').attr('placeholder', gt('Add participant') + ' ...'),
                $('<button class="btn add-button" type="button" data-action="add" tabindex="-1">').append($('<i class="icon-plus">'))
            );
        },

        getPopover: function () {
            return $('<a href="#" class="hint pull-left" tabindex="2">')
                .text(gt('How does this work?'))
                .click($.preventDefault)
                .popover({
                    content: gt(
                        'If you spot a free time, just select this area. ' +
                        'To do this, move the cursor to the start time, hold the mouse button, and <b>drag the mouse</b> to the end time. ' +
                        'You will automatically return to the appointment. ' +
                        'The selected start and end time as well as the current participant list will be applied. '
                    ),
                    html: true,
                    placement: 'top',
                    title: gt('Help'),
                    trigger: 'focus'
                });
        },

        getBackButton: function () {
            return $('<button class="btn pull-right" tabindex="3" data-action="cancel">').text(gt('Back to appointment'));
        },

        getQuitButton: function () {
            return $('<button class="btn pull-right" tabindex="3" data-action="quit">').text(gt('Quit'));
        }
    };
});
