
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
 */

define('io.ox/tours/main',
    ['io.ox/core/extensions',
     'io.ox/core/notifications',
     'io.ox/core/extPatterns/stage',
     'gettext!io.ox/tours',
     'css!3rd.party/hopscotch/hopscotch.css'
    ], function (ext, notifications, Stage, gt) {

    'use strict';

    var switchToAppFunc = function (name, yielded) {
            if (typeof yielded === 'undefined') {
                return function (yielded) {
                    switchToApp(name, yielded);
                };
            }
            switchToApp(name, yielded);
        },

        switchToApp = function (name, yielded) {
            ox.load([name]).done(function (m) {
                m.getApp().launch().done(function () {
                    var that = this;
                    if (name === 'io.ox/calendar/edit/main') {
                        $(that).one('finishedCreating', yielded);//calendar needs some time to set up the view
                        that.create({});
                    } else if (name === 'io.ox/mail/write/main') {
                        that.compose({ subject: '[Guided tours] Example e-mail'});
                        yielded();
                    } else {
                        yielded();
                    }
                });
            });
        },

        tours = function () {
            var tours = {};
            ext.point('io.ox/tours/extensions').each(function (tourExtension) {
                var appId = tourExtension.app;
                if (!tours[appId] || tourExtension.priority > tours[appId].priority) {
                    tours[appId] = tourExtension.tour;
                    tours[appId].priority = tourExtension.priority;
                }
            });
            return tours;
        };

    /* Tour: intro. The special one that does not belong to an app */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/intro',
        app: 'io.ox/intro',
        priority: 1,
        tour: {
            id: 'Switching from OX6',
            steps: [{
                title: gt.format(gt('Welcome to %s'), ox.serverConfig.productName),
                placement: 'bottom',
                target: 'io-ox-topbar',
                content: gt('This guided tour will briefly introduce you to the product. Get more detailed information in the tours for the single apps or in the online help.'),
                xOffset: 'center',
                arrowOffset: 'center',
                width: 380,
                padding: 45
            },
            {
                title: gt('Launching an app'),
                placement: 'bottom',
                target: function () { return $('.launcher[data-app-name="io.ox/mail"]')[0]; },
                content: gt('To launch an app, click on an entry on the left side of the menu bar.')
            },
            {
                onShow: function () { notifications.hideList(); },
                title: gt('Displaying the help or the settings'),
                placement: 'left',
                target: function () { return $('.launcher .fa-cog:visible')[0]; },
                content: gt('To display the help or the settings, click the System menu icon in the menu bar.'),
                arrowOffset: 1,
                yOffset: -5
            },
            {
                onShow: function () { notifications.showList(); },
                title: gt('The New objects icon'),
                placement: 'left',
                target: function () { return $('#io-ox-notifications-icon:visible')[0]; },
                content: gt('The New objects icon shows the number of unread E-Mails or other notifications. If clicking the icon, the info area opens.'),
                arrowOffset: -1
            },
            {
                onShowDeferred: switchToAppFunc('io.ox/mail/main'),
                title: gt('The info area'),
                placement: 'left',
                target: function () { return $('#io-ox-notifications')[0]; },
                content: gt('In case of new notifications, e.g. appointment invitations, the info area is opened on the right side.')
            },
            {
                onShow: function () { notifications.hideList(); },
                title: gt('Creating new items'),
                placement: 'right',
                target: function () { return $('.classic-toolbar .io-ox-action-link:visible')[0]; },
                content: gt('To create a new E-Mail, click the Compose new E-Mail in the toolbar.'),
                arrowOffset: 1,
                yOffset: -5
            },
            {
                title: gt('Opening or closing the folder tree'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('To open or close the folder tree, click on View >  Folder view on the right side of the toolbar.')
            },
            {
                title: gt('Searching for objects'),
                placement: 'left',
                target: function () { return $('#io-ox-search-topbar-icon:visible')[0]; },
                content: gt('To search for objects, click the Search icon in the menu bar.')
            },
            {
                title: gt('The toolbar'),
                placement: 'bottom',
                target: function () { return $('.classic-toolbar:visible')[0]; },
                content: gt('Depending on the app, the toolbar contains various functions for creating, editing and organizing objects.')
            },
            {
                title: gt('The folder tree'),
                placement: 'right',
                target: function () { return $('.foldertree-container:visible')[0]; },
                content: gt('Use the folder tree to open the folder containing the objects that you want to view in the list.')
            },
            {
                title: gt('The list'),
                placement: 'top', // see bug #34010
                target: function () { return $('.list-view:visible')[0]; },
                content: gt('Use the list to select an object, show its contents or activate functions.'),
                yOffset: 50,
                xOffset: 200
            },
            {
                title: gt('The Detail view'),
                placement: 'left',
                target: function () { return $('.mail-detail-pane:visible')[0]; },
                content: gt('The Detail view displays an object\'s content. Depending on the app, further functions for organizing objects can be found in the Detail view.'),
                xOffset: 100
            },
            {
                title: gt('Further information'),
                placement: 'left',
                target: function () { return $('.launcher .fa-cog:visible')[0]; },
                content: gt('Detailed instructions for the single apps are located in System menu > Help.'),
                arrowOffset: 1,
                yOffset: -5
            }]
        }
    });

    /* Tour: portal */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/portal',
        app: 'io.ox/portal',
        priority: 1,
        tour: {
            id: 'Portal',
            steps: [{
                onShowDeferred: switchToAppFunc('io.ox/portal/main'),
                title: gt('The Portal'),
                placement: 'bottom',
                target: function () { return $('.launcher[data-app-name="io.ox/portal"]')[0]; },
                content: gt('The Portal informs you about current E-Mails, appointments or social network news.')
            },
            {
                title: gt('Reading the details'),
                placement: 'bottom',
                target: function () { return $('.widget .item:visible')[0]; },
                content: gt('To read the details, click on an entry in a square.')
            },
            {
                title: gt('Drag and drop'),
                placement: 'right',
                target: function () {
                    if (_.device('desktop')) {//skip this step on tablets (no target does the trick)
                        return $('.widget:visible')[0];
                    } else {
                        return null;
                    }
                },
                content: gt('To change the layout, drag a square\'s title to another position and drop it there.')
            },
            {
                title: gt('Closing a square'),
                placement: 'bottom',
                target: function () { return $('.widget .disable-widget .fa-times:visible')[0]; },
                content: gt('If you no longer want to display a square, click the cross on the upper right side.'),
                xOffset: -10,
                arrowOffset: 1
            },
            {
                title: gt('Customizing the Portal'),
                placement: 'left',
                target: function () { return $('.header [data-action="customize"]')[0]; },
                content: gt('To display a square again or to display further information sources, click on Customize this page.'),
                yOffset: -10,
                arrowOffset: 1
            }]
        }
    });

    /* Tour: e-mail */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/mail',
        app: 'io.ox/mail',
        priority: 1,
        tour: {
            id: 'E-Mail',
            steps: [{
                title: gt('Composing a new E-Mail'),
                placement: 'right',
                target: function () { return $('[data-ref="io.ox/mail/actions/compose"]:visible')[0]; },
                content: gt('To compose a new E-Mail, click on Compose in the toolbar.'),
                arrowOffset: 1,
                yOffset: -5,
                multipage: true,
                onNext: function () {
                    if ($('.launcher[data-app-name="io.ox/mail/write"]').length === 0) {
                        switchToApp('io.ox/mail/write/main', function () {
                            window.hopscotch.nextStep();
                            window.hopscotch.prevStep();
                        });
                    } else {
                        $('.launcher[data-app-name="io.ox/mail/write"]').first().click();
                        window.hopscotch.nextStep();
                        window.hopscotch.prevStep();
                    }
                }
            },
            {
                title: gt('Entering the recipient\'s name'),
                placement: 'right',
                target: function () { return $('#writer_field_to:visible')[0]; },
                content: gt('Enter the recipient\'s name on the top left side. As soon as you typed the first letters, suggestions from the address books are displayed. To accept a recipient suggestion, click on it.'),
                arrowOffset: 1,
                yOffset: -5
            },
            {
                title: gt('Further functions'),
                placement: 'right',
                target: function () { return $('.section-link:visible')[0]; },
                content: gt('Below the recipient you will find further functions, e.g. for sending copies to other recipients or for adding attachments.')
            },
            {
                title: gt('Entering the subject'),
                placement: 'bottom',
                target: function () { return $('.subject-wrapper:visible')[0]; },
                content: gt('Enter the subject on the right side of the recipient.')
            },
            {
                title: gt('Entering the E-Mail text'),
                placement: 'top',
                target: function () { return $('.editor-outer-container:visible')[0]; },
                content: (_.device('desktop') ? gt('Enter the E-Mail text below the subject. If the text format was set to HTMl in the options, you can format the E-Mail text. To do so select a text part and then click an icon in the formatting bar.')
                    : gt('Enter the E-Mail text below the subject.')),
                yOffset: 110,
                arrowOffset: 'center'
            },
            {
                title: gt('Sending the E-Mail'),
                placement: 'left',
                target: function () { return $('.btn[data-action="send"]:visible')[0]; },
                content: gt('To send the E-Mail, click on Send on the upper right side.'),
                multipage: true,
                onNext: function () {
                    if ($('input[name="subject"]').val() === '[Guided tours] Example e-mail') {
                        $('.btn[data-action="discard"]:visible').click();
                    }
                    switchToApp('io.ox/mail/main', function () {
                        window.hopscotch.nextStep();
                        window.hopscotch.prevStep();
                    });
                },
                arrowOffset: 1,
                yOffset: -5
            },
            {
                title: gt('Sorting your E-Mails'),
                placement: 'bottom', /* Check target */
                target: function () { return $('.dropdown.grid-options.toolbar-item.pull-right:visible')[0]; },
                content: gt('To sort the E-Mails, click on Sort by. Select a sort criteria.'),
                xOffset: -230, // see bug #34010
                arrowOffset: 230,
                width: 260
            },
            {
                title: gt('Selecting a view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('To choose between the different views. click on View in the toolbar. Select a menu entry in the layout.'),
                xOffset: -15
            },
            {
                title: gt('Opening an E-Mail in a separate window'),
                placement: 'top', // see bug #34125
                target: function () { return $('.list-view:visible')[0]; },
                content: gt('If double-clicking on an E-Mail in the list, the E-Mail is opened in a separate window.'),
                yOffset: 110  // see bug #34125
            },
            {
                title: gt('Reading E-Mail conversations'),
                placement: 'left',
                target: function () {
                    var visibleMails = $('.selectable.mail').slice(0, 5),
                        threadedMails = visibleMails.find('.thread-size:visible');
                    if (threadedMails.length > 0) {
                        return threadedMails[0];
                    }
                    return null;
                },
                content: gt('To open or close an E-Mail in a conversation, click on a free area in the header.'),
                arrowOffset: 1,
                yOffset: -10
            },
            {
                title: gt('Halo view'),
                placement: (_.device('desktop') ? 'right': 'bottom'),
                target: function () { return $('.person-link.person-from:visible')[0]; },
                content: gt('To receive information about the sender or other recipients, open the Halo view by clicking on a name.'),
                arrowOffset: 1,
                yOffset: -10
            },
            {
                title: gt('Editing multiple E-Mails'),
                placement: 'bottom',
                target: function () { return $('[data-ref="io.ox/mail/listview"]:visible')[0]; },
                //target: function () { return $('.list-view:visible')[0]; },
                content: gt('In order to edit multiple E-Mails at once, enable the checkboxes on the left side of the E-Mails. If the checkboxes are not displayed, click on View > Checkboxes on the right side of the toolbar.'),
                xOffset: -15
            },
            {
                title: gt('Opening the E-Mail settings'),
                placement: 'left',
                target: function () { return $('.launcher .fa-cog:visible')[0]; },
                content: gt('To open the E-Mail settings, click the System menu icon on the upper right side of the menu bar. Select Settings. Click on E-Mail on the left side. To display all settings, enable Advanced settings in the bottom left side'),
                arrowOffset: 1,
                yOffset: -5
            }]
        }
    });

    /* Tour: contacts / address book */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/contacts',
        app: 'io.ox/contacts',
        priority: 1,
        tour: {
            id: 'Address book',
            steps: [{
                title: gt('Creating a new contact'),
                placement: 'right',
                target: function () { return $('.classic-toolbar .io-ox-action-link:visible')[0]; },
                content: gt('To create a new contact, click on New > Add contact in the toolbar.'),
                yOffset: -10
            },
            {
                title: gt('Navigation bar'),
                placement: 'right',
                target: function () { return $('.contact-grid-index:visible')[0]; },
                content: gt('Click on a letter on the left side of the navigation bar in order to display the corresponding contacts from the selected address book.')
            },
            {
                title: gt('Sending an E-Mail to a contact'),
                placement: 'bottom',
                target: function () { return $('.contact-detail [href^="mailto"]:visible')[0]; },
                content: gt('To send an E-Mail to the contact, click on an E-Mail address or on Send email in the toolbar.')
            },
            {
                title: gt('Editing multiple contacts'),
                placement: 'top',
                target: function () { return $('.vgrid-scrollpane-container:visible')[0]; },
                content: gt('To edit multiple contacts at once, enable the checkboxes on the left side of the contacts. If the checkboxes are not displayed, click on View > Checkboxes on the right side of the toolbar.'),
                xOffset: -20
            }]
        }
    });

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
                        switchToApp('io.ox/calendar/edit/main', function () {
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
                    switchToApp('io.ox/calendar/main', function () {
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

    /* Tour: Files / Infostore */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/files',
        app: 'io.ox/files',
        priority: 1,
        tour: {
            id: 'Files',
            steps: [{
                title: gt('Folder tree'),
                placement: 'right',
                target: function () { return $('.foldertree-container:visible')[0]; },
                content: gt('Use the folder tree to access own, public or shared files. If the folder tree is hidden, click on View > Folder view on the right side of the toolbar.')
            },
            {
                title: gt('Selecting a view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('To select one of the views List, Icons or Squares, click on View on the right side of the toolbar.')
            },
            {
                title: gt('The List view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('The List view shows details like the size and date of change. Use the checkboxes to select files. Click on a file to view further details and functions in the pop-up.')
            },
            {
                title: gt('The Icons view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('The Icons view displays an icon and the file name for each file. Click on an icon to view further details and functions in the pop-up.')
            },
            {
                title: gt('The Tiles view'),
                placement: 'left',
                target: function () { return $('.classic-toolbar .pull-right:visible')[0]; },
                content: gt('The Tiles view shows a big icon for each file. Click on an icon to view further details and functions in the pop-up.')
            },
            {
                onShow: function () {
                    if ($('.toolbar-button.dropdown.open .dropdown-menu').length === 0) {
                        $('[data-ref="io.ox/files/dropdown/new"]').click();
                    }
                },
                title: gt('Uploading a file'),
                placement: 'right',
                target: function () { return $('[data-ref="io.ox/files/dropdown/new"]')[0]; },
                /*target: function () { return $('[data-action="io.ox/files/actions/upload"]')[0]; },*/
                content: gt('To upload a file, click on New > Upload new file in the toolbar.')
            },
            {
                onShow: function () {
                    if ($('.toolbar-button.dropdown.open .dropdown-menu').length === 0) {
                        $('[data-ref="io.ox/files/dropdown/new"]').click();
                    }
                },
                title: gt('Creating a note'),
                placement: 'right',
                target: function () { return $('[data-ref="io.ox/files/dropdown/new"]')[0]; },
                content: gt('To create a note, click on New > Add note in the toolbar.')
            },
            {
                title: gt('Slideshow'),
                placement: 'bottom',
                target: function () { return $('[data-ref="io.ox/files/icons/slideshow"]:visible')[0]; },
                content: gt('If a folder contains images, you can display a slideshow. To do so click the View slideshow icon in the toolbar.')
            },
            {
                title: gt('Displaying information'),
                placement: 'bottom',
                target: function () { return $('.file-cell')[0]; },
                content: gt('To view further information, click on a file. A pop-up window displays further details and functions.')
            }]
        }
    });

    /* Tour: Tasks */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/tasks',
        app: 'io.ox/tasks',
        priority: 1,
        tour: {
            id: 'Tasks',
            steps: [{
                title: gt('Creating a new task'),
                placement: 'right',
                target: function () { return $('[data-ref="io.ox/tasks/actions/create"]')[0]; },
                content: gt('To create a new task, click on New in the toolbar.'),
                multipage: true,
                onNext: function () {
                    if ($('.launcher[data-app-name="io.ox/tasks/edit"]').length === 0) {
                        switchToApp('io.ox/tasks/edit/main', function () {
                            window.hopscotch.nextStep();
                            window.hopscotch.prevStep();
                        });
                    } else {
                        $('.launcher[data-app-name="io.ox/tasks/edit"]').first().click();
                        window.hopscotch.nextStep();
                        window.hopscotch.prevStep();
                    }
                }
            },
            {
                title: gt('Entering the task\'s data'),
                placement: 'bottom',
                target: function () { return $('.io-ox-tasks-edit [data-extension-id="title"]:visible')[0]; },
                content: gt('Enter the subject, the start date, and a description.')
            },
            {
                title: gt('Adding further details'),
                placement: 'top',
                target: function () { return $('.io-ox-tasks-edit .expand-link:visible')[0]; },
                content: gt('To add further details, click on Expand form.'),
                onShow: function () {
                    if ($('[data-extension-id="start_date"]:visible').length === 0) {
                        $('.expand-link:visible').trigger('click');
                    }
                }
            },
            {
                title: gt('Creating recurring tasks'),
                placement: 'top',
                target: function () { return $('[data-extension-id="recurrence"]:visible')[0]; },
                content: gt('To create recurring tasks, enable Repeat. Functions for setting the recurrence parameters are shown.')
            },
            {
                title: gt('Using the reminder function'),
                placement: 'top',
                target: function () { return $('[for="task-edit-reminder-select"]:visible')[0]; },
                content: gt('To not miss the task, use the reminder function.')
            },
            {
                title: gt('Tracking the editing status'),
                placement: 'top',
                target: function () {
                    if (!_.device('desktop')) {//tablets need scrolling here
                        $('[for="task-edit-status-select"]:visible')[0].scrollIntoView(true);
                    }
                    return $('[for="task-edit-status-select"]:visible')[0];
                },
                content: gt('To track the editing status, enter the current progress.')
            },
            {
                title: gt('Inviting other participants'),
                placement: 'top',
                target: function () {
                    if (!_.device('desktop')) {//tablets need scrolling here
                        $('.add-participant.task-participant-input-field:visible')[0].scrollIntoView(true);
                    }
                    return $('.add-participant.task-participant-input-field:visible')[0];
                },
                content: gt('To invite other participants, enter their names in the field below Participants. You can add documents as attachment to the task.'),
                onShow: function () {
                    $('.tab-link[tabindex="0"]:visible').click();
                }
            },
            {
                title: gt('Entering billing information'),
                placement: (_.device('desktop') ? 'top': 'left'),
                target: function () { return $('.task-edit-row [tabindex="2"]:visible')[0]; },
                content: gt('To enter billing information, click on Show details.'),
                onShow: function () { $('.tab-link[tabindex="2"]:visible').click(); }
            },
            {
                title: gt('Creating the task'),
                placement: 'left',
                target: function () {
                    if (!_.device('desktop')) {//tablets need scrolling here
                        $('.btn.task-edit-save:visible')[0].scrollIntoView(true);
                    }
                    return $('.btn.task-edit-save:visible')[0];
                },
                content: gt('To create the task, click on Create on the upper right side.'),
                multipage: true,
                onNext: function () {
                    switchToApp('io.ox/tasks/main', function () {
                        window.hopscotch.nextStep();
                        window.hopscotch.prevStep();
                    });
                },
                onShow: function () {
                    $('.tab-link[tabindex="0"]:visible').click();
                }
            },
            {
                title: gt('Sorting tasks'),
                placement: 'bottom',
                target: function () { return $('.grid-options.dropdown:visible')[0]; },
                content: gt('To sort the tasks, click on Sort by. Select a sort criteria.'),
                xOffset: -10
            },
            {
                title: gt('Editing multiple tasks'),
                placement: 'bottom', // preventive fixed along with bug #34125
                target: function () { return $('.vgrid-scrollpane-container:visible')[0]; },
                //target: function () { return $('abs.vgrid-scrollpane:visible')[0]; },
                content: gt('To edit multiple tasks at once, enable the checkboxes at the left side of the tasks. If the checkboxes are not displayed, click on View > Checkboxes on the right side of the toolbar.'),
                xOffset: -10
            }]
        }
    });

    /* Tour: Settings */
    ext.point('io.ox/tours/extensions').extend({
        id: 'default/io.ox/settings',
        app: 'io.ox/settings',
        priority: 1,
        tour: {
            id: 'Settings',
            steps: [{
                title: gt('Opening the settings'),
                placement: 'left',
                target: function () { return $('.launcher .fa-cog:visible')[0]; },
                content: gt('To open the settings, click the System menu icon on the upper right side of the menu bar. Select Settings. ')
            },
            {
                title: gt('How the settings are organized'),
                placement: 'right',
                target: function () { return $('.io-ox-settings-window .vgrid-scrollpane')[0]; },
                content: gt('The settings are organized in topics. Select the topic on the left side, e.g Basic settings or E-Mail. To view all settings, enable Advanced settings at the bottom.')
            },
            {
                title: gt('Editing settings'),
                placement: 'left',
                target: function () { return $('.io-ox-settings-window .settings-container')[0]; },
                content: gt('Edit a setting on the right side. In most of the cases, the changes are activated immediately.')
            },
            {
                title: gt('Opening the help'),
                placement: 'left',
                target: function () { return $('#io-ox-topbar .launcher .fa-cog')[0]; },
                content: gt('To open the help, click the System menu icon on the upper right side of the menu bar. Select Help. The help for the currently selected app is displayed. To browse the complete help, click on Start Page or Table Of Contents at the upper part of the window.')
            },
            {
                title: gt('Signing out'),
                placement: 'left',
                target: function () { return $('#io-ox-topbar .launcher .fa-cog')[0]; },
                content: gt('To sign out, click the System menu icon on the upper right side of the menu bar. Select Sign out.')
            }]
        }
    });

    /* New stage: Starts a tour upon login (unless it was already seen in that particular version) */
    new Stage('io.ox/core/stages', {
        id: 'tours',
        index: 1000,
        run: function () {

            ox.load(['io.ox/tours/main', 'settings!io.ox/tours']).done(function (tours, tourSettings) {
                var disableTour = tourSettings.get('server/disableTours'),
                    startOnFirstLogin = tourSettings.get('server/startOnFirstLogin'),
                    tourVersion = tourSettings.get('server/version', 0),
                    tourVersionSeen = tourSettings.get('user/alreadySeenVersion', -1);

                if (!disableTour && startOnFirstLogin && tourVersion > tourVersionSeen) {
                    tourSettings.set('user/alreadySeenVersion', tourVersion).save();
                    tours.runTour('io.ox/intro');
                }
            });
            return $.when();
        }
    });

    /* Link: Intro tour in settings toolbar */
    ext.point('io.ox/core/topbar/right/dropdown').extend({
        id: 'intro-tour',
        index: 210, /* close to the help link */
        draw: function () {
            var node = this,
                link = $('<li>', {'class': 'io-ox-specificHelp'}).appendTo(node);

            if (_.device('small')) {//tablets are fine just disable phones
                return;
            }

            require(['settings!io.ox/tours', 'io.ox/tours/main'], function (tourSettings, thisIsStupid) {
                if (tourSettings.get('disableTours', false)) {
                    link.remove();
                    return;
                }

                link.append(
                    $('<a target="_blank" href="" role="menuitem">').text(
                        //#. Tour name; general introduction
                        gt('Getting started')
                    )
                    .on('click', function (e) {
                        thisIsStupid.runTour('io.ox/intro');
                        e.preventDefault();
                    })
                );
            });
        }
    });

    /* Link: Tour specifically for this app in settings toolbar */
    ext.point('io.ox/core/topbar/right/dropdown').extend({
        id: 'app-specific-tour',
        index: 220, /* close to the intro tour and the help link */
        draw: function () {
            var node = this,
                tourLink = $('<li>', {'class': 'io-ox-specificHelp'}).appendTo(node);

            if (_.device('small')) {
                tourLink.remove();
                return;
            }

            require(['settings!io.ox/tours', 'io.ox/tours/main'], function (tourSettings, thisIsStupid) {
                tourLink.append(
                    $('<a target="_blank" href="" role="menuitem">').text(gt('Guided tour for this app'))
                    .on('click', function (e) {
                        var currentApp = ox.ui.App.getCurrentApp(),
                            currentType = currentApp.attributes.name;

                        thisIsStupid.runTour(currentType);
                        e.preventDefault();
                    })
                );

                ox.ui.windowManager.events.on('window.show', function () {
                    var currentApp = ox.ui.App.getCurrentApp(),
                        currentType = currentApp.attributes.name,
                        isAvailable = thisIsStupid.isAvailable(currentType);

                    if (tourSettings.get('disableTours', false) || tourSettings.get('disable/' + currentType, false) || !isAvailable) {
                        tourLink.hide();
                    } else {
                        tourLink.show();
                    }
                });
            });
        }
    });

    ext.point('io.ox/core/topbar/right/dropdown').sort();

    return {
        availableTours: function () {
            return _(tours()).keys();
        },

        isAvailable: function (tourname) {
            return _(_(tours()).keys()).contains(tourname);
        },

        get: function (tourname) {
            return tours()[tourname];
        },

        getAll: function () {
            return tours();
        },

        runTour: function (tourname) {
            require(['apps/3rd.party/hopscotch/hopscotch-0.1.js']).done(function () {
                var tour = tours()[tourname],
                    hs = window.hopscotch;

                if (!tour) {
                    return;
                }
                tour.i18n = {
                    prevBtn: '<i class="fa fa-chevron-left">&nbsp;</i>',
                    nextBtn: '<i class="fa fa-chevron-right">&nbsp;</i>',
                    doneBtn: '<i class="fa fa-check">&nbsp;</i>'
                };

                //RESET
                hs.endTour(true);

                // ERROR HANDLING
                hs.registerHelper('error', function (arg) {
                    console.log('Tour error', arg);
                });

                tour.onEnd = function () { window.hopscotch.endTour(true); };
                tour.showPrevButton = true;
                tour.showNextButton = true;

                //GO!
                hs.startTour(tour);
            });
        }
    };

});
