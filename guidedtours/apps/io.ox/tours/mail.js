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

define('io.ox/tours/mail', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/tours/utils',
    'gettext!io.ox/tours'
], function (ext, notifications, utils, gt) {

    'use strict';

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
                        utils.switchToApp('io.ox/mail/write/main', function () {
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
                    utils.switchToApp('io.ox/mail/main', function () {
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
                placement: (_.device('desktop') ? 'right' : 'bottom'),
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
});
