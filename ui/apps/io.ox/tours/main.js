
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
    ['io.ox/core/notifications',
     'gettext!io.ox/tours',
     'css!hopscotch/hopscotch.css'
    ], function (notifications, gt) {

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
                        that.create({});
                    } else if (name === 'io.ox/mail/write/main') {
                        that.compose({ subject: '[Guided tours] Example e-mail'});
                    }
                    yielded();
                });
            });
        },

        tours = function () {
            return {
                'io.ox/intro': {
                    id: 'Switching from OX6',
                    steps: [{
                        title: gt('Launching an app'),
                        placement: 'bottom',
                        target: function () { return $('.launcher[data-app-name="io.ox/mail"]')[0]; },
                        content: gt('To launch an app, click on an entry on the top-left side of the menu bar.')
                    },
                    {
                        onShow: function () { notifications.hideList(); },
                        title: gt('Displaying the help or the settings'),
                        placement: 'left',
                        target: function () { return $('.launcher .icon-cog:visible')[0]; },
                        content: gt('To display the help or the settings, use the icons on the right side of the menu bar.'),
                        arrowOffset: 1,
                        yOffset: -5
                    },
                    {
                        onShow: function () { notifications.showList(); },
                        title: gt('New objects icon'),
                        placement: 'left',
                        target: function () { return $('#io-ox-notifications-icon:visible')[0]; },
                        content: gt('The New objects icon shows the number of unread E-Mails or other notifications. If clicking the icon, the info area opens.'),
                        arrowOffset: -1
                    },
                    {
                        onShowDeferred: switchToAppFunc('io.ox/mail/main'),
                        title: gt('Info area'),
                        placement: 'left',
                        target: function () { return $('#io-ox-notifications')[0]; },
                        content: gt('In case of new notifications, e.g. appointment invitations, the info area is opened on the right side.')
                    },
                    {
                        onShow: function () { notifications.hideList(); },
                        title: gt('Creating new items'),
                        placement: 'right',
                        target: function () { return $('.window-toolbar .icon-pencil:visible')[0]; },
                        content: gt('To create a new E-Mail, click the Compose new E-Mail icon at the top.'),
                        arrowOffset: 1,
                        yOffset: -5
                    },
                    {
                        title: gt('Opening or closing the folder tree'),
                        placement: 'right',
                        target: function () { return $('.window-toolbar [data-ref="io.ox/mail/links/toolbar/folder"]:visible')[0]; },
                        content: gt('To open or close the folder tree, click the Toggle folder icon.')
                    },
                    {
                        title: gt('Searching for objects'),
                        placement: 'right',
                        target: function () { return $('.window-toolbar [data-ref="io.ox/mail/links/toolbar/search"]:visible')[0]; },
                        content: gt('To search for objects, click the Toggle search icon.')
                    },
                    {
                        title: gt('Folder tree'),
                        placement: 'right',
                        target: function () { return $('.foldertree-container:visible')[0]; },
                        content: gt('Use the folder tree to open the folder containing the objects that you want to view in the sidebar.')
                    },
                    {
                        title: gt('Sidebar'),
                        placement: 'right',
                        target: function () { return $('.vgrid-cell.selectable.mail:visible')[0]; },
                        content: gt('Use the sidebar to select an object in order to view its contents or to apply functions.')
                    },
                    {
                        title: gt('Display area'),
                        placement: 'left',
                        target: function () { return $('.mail-detail:visible')[0]; },
                        content: gt('The display area shows an object\'s content. At the top of the display area you will find functions for e.g. moving or deleting objects.')
                    },
                    {
                        title: gt('Further information'),
                        placement: 'left',
                        target: function () { return $('.launcher .icon-cog:visible')[0]; },
                        content: gt('Detailed guides for all modules are located in the help section of the settings.'),
                        arrowOffset: 1,
                        yOffset: -5
                    }]
                },



                'io.ox/portal' : {
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
                        target: $('.widget .item:visible')[0],
                        content: gt('To read the details, click on an entry in a tile.')
                    },
                    {
                        title: gt('Launching an app'),
                        placement: 'bottom',
                        target: $('.widget .title:visible')[0],
                        content: gt('To launch an app, click on a tile\'s headline.')
                    },
                    {
                        title: gt('Drag and drop'),
                        placement: 'right',
                        target: $('.widget:visible')[0],
                        content: gt('To change the layout, drag a tile\'s background to another position and drop it there.')
                    },
                    {
                        title: gt('Closing a tile'),
                        placement: 'bottom',
                        target: $('.widget .disable-widget .icon-remove:visible')[0],
                        content: gt('If you no longer want to display a tile, click the cross on the upper right side.'),
                        xOffset: -10,
                        arrowOffset: 1
                    },
                    {
                        title: gt('Customizing'),
                        placement: 'left',
                        target: $('.header [data-action="customize"]')[0],
                        content: gt('To display a tile again or to display further information sources, click on Customize this page.'),
                        yOffset: -10,
                        arrowOffset: 1
                    }]
                },



                'io.ox/mail': {
                    id: 'E-Mail',
                    steps: [{
                        title: gt('Composing a new E-Mail'),
                        placement: 'right',
                        target: function () { return $('[data-ref="io.ox/mail/links/toolbar/default"]:visible')[0]; },
                        content: gt('To compose a new E-Mail, click on the Compose new E-Mail icon at the top.'),
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
                        content: gt('Enter the E-Mail text below the subject. If the text format was set to HTMl in the options, you can format the E-Mail text. To do so select a text part and then click an icon in the formatting bar.'),
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
                        placement: 'top',
                        target: function () { return $('.vgrid-toolbar .icon-arrow-down:visible')[0]; },
                        content: gt('The icon on the bottom right side helps you sort your E-Mails. Click the icon to get a list of sort criteria.'),
                        xOffset: -15
                    },
                    {
                        title: gt('Opening E-Mail threads'),
                        placement: 'right',
                        target: function () {
                            var visibleMails = $('.selectable.mail').slice(0, 5),
                                threadedMails = visibleMails.find('.thread-size:visible');
                            if (threadedMails.length > 0) {
                                return threadedMails[0];
                            }
                            return null;
                        },
                        content: gt('The number on the right side of the E-Mail subject corresponds to the number of E-Mails in a thread. To open the thread, click on the number.'),
                        arrowOffset: 1,
                        yOffset: -10
                    },
                    {
                        title: gt('Halo view'),
                        placement: 'right',
                        target: function () { return $('.person-link.person-from:visible')[0]; },
                        content: gt('To receive information about the sender or other recipients, open the Halo view by clicking on a name.'),
                        arrowOffset: 1,
                        yOffset: -10
                    },
                    {
                        title: gt('Editing multiple E-Mails'),
                        placement: 'top',
                        target: function () { return $('.vgrid-toolbar.bottom .icon-th-list:visible')[0]; },
                        content: gt('In order to edit multiple E-Mails at once, enable the checkboxes on the left side of the E-Mails. If the checkboxes are not displayed, click the icon on the bottom left side.'),
                        xOffset: -15
                    },
                    {
                        title: gt('Opening the E-Mail settings'),
                        placement: 'left',
                        target: function () { return $('.launcher .icon-cog:visible')[0]; },
                        content: gt('To open the E-Mail settings, click the Gearwheel icon on the upper right side of the menu bar. Select Settings. Click on E-Mail on the left side.'),
                        arrowOffset: 1,
                        yOffset: -5
                    }]
                },



                'io.ox/contacts': {
                    id: 'Address book',
                    steps: [{
                        title: gt('Creating a new contact'),
                        placement: 'right',
                        target: function () { return $('.window-toolbar .icon-plus:visible')[0]; },
                        content: gt('To create a new contact, click the Add contact icon on top.'),
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
                        content: gt('To send an E-Mail to the contact, click on an E-Mail address or on Send E-Mail at the top of the display area.')
                    },
                    {
                        title: gt('Editing multiple contacts'),
                        placement: 'top',
                        target: function () { return $('.vgrid-toolbar.bottom .icon-th-list:visible')[0]; },
                        content: gt('To edit multiple contacts at once, enable the checkboxes on the left side of the contacts. If the checkboxes are not displayed, click the icon on the bottom left side.'),
                        xOffset: -20
                    }]
                },



                'io.ox/calendar': {
                    id: 'Calendar',
                    steps: [{
                        title: gt('Creating a new appointment'),
                        placement: 'right',
                        target: function () {
                            if ($('.launcher[data-app-name="io.ox/calendar/edit"]').length === 0) {
                                switchToApp('io.ox/calendar/edit/main', function () {
                                    switchToApp('io.ox/calendar/main', function () {});
                                });
                            }
                            return $('[data-ref="io.ox/calendar/links/toolbar/default"]')[0];
                        },
                        content: gt('To create a new appointment, click the New appointment icon at the top.'),
                        multipage: true,
                        onNext: function () {
                            $('.launcher[data-app-name="io.ox/calendar/edit"]').first().click();
                            window.hopscotch.nextStep();
                            window.hopscotch.prevStep();
                        }
                    },
                    {
                        title: gt('Entering the data'),
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
                        title: gt('Using the reminder functions'),
                        placement: 'top',
                        target: function () { return $('[data-extension-id="alarm"]:visible')[0]; },
                        content: gt('To not miss the appointment, use the reminder functions.')
                    },
                    {
                        title: gt('Inviting other participants'),
                        placement: 'top',
                        target: function () { return $('.add-participant:visible')[0]; },
                        content: gt('To invite other participants, enter their names in the field below Participants. To avoid appointment conflicts, click on Find a free time at the upper right side.')
                    },
                    {
                        title: gt('Adding attachments'),
                        placement: 'top',
                        target: function () { return $('[data-extension-id="attachments_legend"]:visible')[0]; },
                        content: gt('Further down you can add attachments to the appointment.')
                    },
                    {
                        title: gt('Creating the appointment'),
                        placement: 'left',
                        target: function () { return $('[data-action="save"]:visible')[0]; },
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
                        placement: 'right',
                        target: function () { return $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible')[0]; },
                        content: gt('To select one of the views like Day, Month or List, click the Eye icon in the toolbar.')
                    },
                    {
                        onShow: function () {
                            if ($('.toolbar-button.dropdown.open .dropdown-menu:visible').length === 0) {
                                $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible').click();
                            }
                        },
                        title: gt('The List view'),
                        placement: 'right',
                        target: function () { return $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible')[0]; },
                        content: gt('The List view shows a sidebar with appointments and a display area with the data of the selected appointment. This view corresponds to the view in E-Mail and Contacts.')
                    },
                    {
                        onShow: function () {
                            if ($('.toolbar-button.dropdown.open .dropdown-menu:visible').length === 0) {
                                $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible').click();
                            }
                        },
                        title: gt('The calendar views'),
                        placement: 'right',
                        target: function () { return $('[data-ref="io.ox/calendar/links/toolbar/view"]:visible')[0]; },
                        content: gt('The calendar views display a calendar sheet with the appointments.')
                    }]
                },



                'io.ox/files': {
                    id: 'Files',
                    steps: [{
                        title: gt('Selecting a view'),
                        placement: 'right',
                        target: function () { return $('[data-ref="io.ox/files/links/toolbar/view"]')[0]; },
                        content: gt('To select one of the views Icon or List, click the icon at the bottom of the toolbar.')
                    },
                    {
                        title: gt('The List view'),
                        placement: 'right',
                        target: function () { return $('[data-ref="io.ox/files/links/toolbar/view"]')[0]; },
                        content: gt('The List view shows a sidebar with files and a display area with the data of the selected file. This view corresponds to the views in E-Mail and Contacts.')
                    },
                    {
                        title: gt('The Icons view'),
                        placement: 'right',
                        target: function () { return $('[data-ref="io.ox/files/links/toolbar/view"]')[0]; },
                        content: gt('The Icons view displays an icon for each file.')
                    },
                    {
                        onShow: function () {
                            if ($('.toolbar-button.dropdown.open .dropdown-menu').length === 0) {
                                $('[data-ref="io.ox/files/links/toolbar/default"]').click();
                            }
                        },
                        title: gt('Uploading a file'),
                        placement: 'right',
                        target: function () { return $('[data-ref="io.ox/files/links/toolbar/default"]')[0]; },
                        content: gt('To upload a file, click the icon at the top. Select Upload new file.')
                    },
                    {
                        onShow: function () {
                            if ($('.toolbar-button.dropdown.open .dropdown-menu').length === 0) {
                                $('[data-ref="io.ox/files/links/toolbar/default"]').click();
                            }
                        },
                        title: gt('Creating a note'),
                        placement: 'right',
                        target: function () { return $('[data-ref="io.ox/files/links/toolbar/default"]')[0]; },
                        content: gt('To create a note, click the icon at the top. Select Add note.')
                    },
                    {
                        title: gt('The Icons view'),
                        placement: 'bottom',
                        target: function () { return $('.files-iconview .files-scrollable-pane')[0]; },
                        content: gt('In the Icons view you can see the files of the selected folder in the display area.')
                    },
                    {
                        title: gt('The folder path'),
                        placement: 'bottom',
                        target: function () { return $('.files-iconview .breadcrumb:visible')[0]; },
                        content: gt('At the top of the display area the path to the selected folder is shown. Click on the path to switch to another folder.')
                    },
                    {
                        title: gt('Slideshow'),
                        placement: 'bottom',
                        target: function () { return $('[data-action="slideshow"]:visible')[0]; },
                        content: gt('If a folder contains images, you can display a slideshow. To do so click on Slideshow on the upper right side.')
                    },
                    {
                        title: gt('Displaying information'),
                        placement: 'bottom',
                        target: function () { return $('.file-icon')[0]; },
                        content: gt('To view further information, click on a file. The information are displayed in a pop-up window.')
                    }]
                },



                'io.ox/tasks': {
                    id: 'Tasks',
                    steps: [{
                        title: gt('Creating a new task'),
                        placement: 'right',
                        target: function () { return $('.window-toolbar [data-ref="io.ox/tasks/links/toolbar/default"]')[0]; },
                        content: gt('To create a new task, click the Create new task icon at the top.'),
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
                        title: gt('Entering the data'),
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
                        content: gt('To not miss the task, use the reminder function. ')
                    },
                    {
                        title: gt('Tracking the editing status'),
                        placement: 'top',
                        target: function () { return $('[for="task-edit-status-select"]:visible')[0]; },
                        content: gt('To track the editing status, enter the current progress.')
                    },
                    {
                        title: gt('Inviting other participants'),
                        placement: 'top',
                        target: function () { return $('.add-participant.task-participant-input-field:visible')[0]; },
                        content: gt('To invite other participants, enter their names in the field below Participants. You can add documents as attachment to the task.'),
                        onShow: function () { $('.tab-link[tabindex="0"]:visible').click(); }
                    },
                    {
                        title: gt('Entering billing information'),
                        placement: 'top',
                        target: function () { return $('.task-edit-row [tabindex="2"]:visible')[0]; },
                        content: gt('In the Details section at the bottom right side you can enter billing information.'),
                        onShow: function () { $('.tab-link[tabindex="2"]:visible').click(); }
                    },
                    {
                        title: gt('Creating the task'),
                        placement: 'left',
                        target: function () { return $('.btn.task-edit-save:visible')[0]; },
                        content: gt('To create the task, click on Create on the upper right side.'),
                        multipage: true,
                        onNext: function () {
                            switchToApp('io.ox/tasks/main', function () {
                                window.hopscotch.nextStep();
                                window.hopscotch.prevStep();
                            });
                        }
                    },
                    {
                        title: gt('Sorting your tasks'),
                        placement: 'top',
                        target: function () { return $('.vgrid-toolbar.bottom .icon-arrow-down:visible')[0]; },
                        content: gt('The icon at the bottom right side helps you sort your tasks. Click the icon to get a list of sort criteria.'),
                        xOffset: -10
                    },
                    {
                        title: gt('Editing multiple tasks'),
                        placement: 'top',
                        target: function () { return $('.vgrid-toolbar.bottom .icon-th-list:visible')[0]; },
                        content: gt('To edit multiple tasks at once, enable the checkboxes at the left side of the tasks. If the checkboxes are not displayed, click the icon at the bottom left side.'),
                        xOffset: -10
                    }]
                },



                'io.ox/settings': {
                    id: 'Settings',
                    steps: [{
                        title: gt('Opening the settings'),
                        placement: 'left',
                        target: function () { return $('#io-ox-topbar .launcher .icon-cog')[0]; },
                        content: gt('To open the settings, click the System menu icon on the upper right side of the menu bar. Select Settings. ')
                    },
                    {
                        title: gt('How the settings are organized'),
                        placement: 'right',
                        target: function () { return $('.io-ox-settings-window .vgrid-scrollpane')[0]; },
                        content: gt('The settings are organized in topics. Select the topic on the left side, e.g Basic settings, E-Mail or My contact data.')
                    },
                    {
                        title: gt('Editing settings'),
                        placement: 'right',
                        target: function () { return $('.io-ox-settings-window .vgrid-scrollpane .vgrid-cell.selectable.application')[0]; },
                        content: gt('Edit a setting on the right side. In most of the cases, the changes are activated immediately.')
                    },
                    {
                        title: gt('Opening the help'),
                        placement: 'left',
                        target: function () { return $('#io-ox-topbar .launcher .icon-cog')[0]; },
                        content: gt('To open the help, click the System menu icon on the upper right side of the menu bar. Select Help. ')
                    },
                    {
                        title: gt('Signing out'),
                        placement: 'left',
                        target: function () { return $('#io-ox-topbar .launcher .icon-cog')[0]; },
                        content: gt('To sign out, click the System menu icon on the upper right side of the menu bar. Select Sign out.')
                    }]
                }
            };
        };




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
            require(['apps/hopscotch/hopscotch-0.1.js']).done(function () {
                var tour = tours()[tourname],
                    hs = window.hopscotch;

                if (!tour) {
                    return;
                }
                tour.i18n = {
                    prevBtn: '<i class="icon-chevron-left">&nbsp;</i>',
                    nextBtn: '<i class="icon-chevron-right">&nbsp;</i>',
                    doneBtn: '<i class="icon-ok">&nbsp;</i>'
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