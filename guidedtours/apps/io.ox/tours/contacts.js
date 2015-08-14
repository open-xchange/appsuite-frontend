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

define('io.ox/tours/contacts', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'gettext!io.ox/tours'
], function (ext, notifications, gt) {

    'use strict';

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
});
