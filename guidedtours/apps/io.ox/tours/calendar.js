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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/tours/calendar', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/tours/utils',
    'gettext!io.ox/tours'
], function (ext, notifications, utils, gt) {

    'use strict';

    /* Tour: calendar / appointments */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/calendar',
        app: 'io.ox/calendar',
        priority: 1,
        tour: {
            id: 'Calendar',
            steps: [{
                title: gt('Creating a new appointment'),
                placement: 'right',
                target: function () {
                    return $('[data-ref="io.ox/calendar/detail/actions/create"]')[0];
                },
                // target: function () { return $('.classic-toolbar .io-ox-action-link:visible')[0];
                content: gt('To create a new appointment, click on New in the toolbar.'),
                multipage: true,
                onNext: function () {
                    if (
                        $('.launcher[data-app-name="io.ox/calendar/edit"]').length === 0) {
                        utils.switchToApp('io.ox/calendar/edit/main', function () {
                            window.hopscotch.nextStep();
                            window.hopscotch.prevStep();
                        });
                    } else {
                        $('.launcher[data-app-name="io.ox/calendar/edit"]').first().click();
                        window.hopscotch.nextStep();
                        window.hopscotch.prevStep();
                    }
                }
            },
            {
                title: gt('Entering the appointment\'s data'),
                placement: 'bottom',
                target: function () { return $('[data-extension-id="title"]:visible')[0]; },
                content: gt('Enter the subject, the start and the end date of the appointment. Other details are optional.')
            },
            {
                title: gt('Creating recurring appointments'),
                placement: 'top',
                target: function () { return $('[data-extension-id="recurrence"]:visible')[0]; },
                content: gt('To create recurring appointments, enable Repeat. Functions for setting the recurrence parameters are shown.')
            },
            {
                title: gt('Using the reminder function'),
                placement: 'top',
                target: function () { return $('[data-extension-id="alarm"]:visible')[0]; },
                content: gt('To not miss the appointment, use the reminder function.')
            },
            {
                title: gt('Inviting other participants'),
                placement: 'top',
                target: function () {
                    if (!_.device('desktop')) {//tablets need scrolling here
                        $('.add-participant:visible')[0].scrollIntoView(true);
                    }
                    return $('.add-participant:visible')[0];
                },
                content: gt('To invite other participants, enter their names in the field below Participants. To avoid appointment conflicts, click on Find a free time at the upper right side.')
            },
            {
                title: gt('Adding attachments'),
                placement: 'top',
                target: function () {
                    if (!_.device('desktop')) {//tablets need scrolling here
                        $('[data-extension-id="attachments_legend"]:visible')[0].scrollIntoView(true);
                    }
                    return $('[data-extension-id="attachments_legend"]:visible')[0];
                },
                content: gt('Further down you can add documents as attachments to the appointment.')
            },
            {
                title: gt('Creating the appointment'),
                placement: 'left',
                target: function () {
                    if (!_.device('desktop')) {//tablets need scrolling here
                        $('[data-action="save"]:visible')[0].scrollIntoView(true);
                    }
                    return $('[data-action="save"]:visible')[0];
                },
                content: gt('To create the appointment, click on Create at the upper right side.'),
                multipage: true,
                onNext: function () {
                    utils.switchToApp('io.ox/calendar/main', function () {
                        window.hopscotch.nextStep();
                        window.hopscotch.prevStep();
                    });
                }
            },
            {
                onShow: function () {
                    if ($('.toolbar-button.dropdown.open .dropdown-menu:visible').length === 0) {
                        $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible').click();
                    }
                },
                title: gt('Selecting a view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('To select one of the views like Day, Month or List, click on View in the toolbar. Select a menu entry from the Layout section.')
            },
            {
                onShow: function () {
                    if ($('.toolbar-button.dropdown.open .dropdown-menu:visible').length === 0) {
                        $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible').click();
                    }
                },
                title: gt('The List view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('The List view shows a list of the appointments in the current folder. If clicking on an appointment, the appointment\'s data and some functions are displayed in the Detail view.')
            },
            {
                onShow: function () {
                    if ($('.toolbar-button.dropdown.open .dropdown-menu:visible').length === 0) {
                        $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible').click();
                    }
                },
                title: gt('The calendar views'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('The calendar views display a calendar sheet with the appointments for the selected time range.')
            }]
        }
    });
});
