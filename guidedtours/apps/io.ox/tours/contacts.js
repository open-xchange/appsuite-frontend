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
    'io.ox/core/tk/wizard',
    'gettext!io.ox/tours'
], function (Tour, gt) {

    'use strict';

    /* Tour: contacts / address book */
    Tour.registry.add({
        id: 'default/io.ox/contacts',
        app: 'io.ox/contacts',
        priority: 1
    }, function () {
        new Tour()
        .step()
            .title(gt('Creating a new contact'))
            .content(gt('To create a new contact, click on New > Add contact in the toolbar.'))
            .spotlight('.classic-toolbar .io-ox-action-link:first')
            .end()
        .step()
            .title(gt('Navigation bar'))
            .content(gt('Click on a letter on the left side of the navigation bar in order to display the corresponding contacts from the selected address book.'))
            .spotlight('.contact-grid-index')
            .end()
        .step()
            .title(gt('Sending an E-Mail to a contact'))
            .content(gt('To send an E-Mail to the contact, click on an E-Mail address or on Send email in the toolbar.'))
            .spotlight('.contact-detail [href^="mailto"]:first')
            .hotspot('.classic-toolbar [data-action=send]')
            .end()
        .step()
            .title(gt('Editing multiple contacts'))
            .content(gt('To edit multiple contacts at once, enable the checkboxes on the left side of the contacts. If the checkboxes are not displayed, click on View > Checkboxes on the right side of the toolbar.'))
            .spotlight('.vgrid-scrollpane')
            .hotspot('.classic-toolbar [data-dropdown=view]')
            .end()
        .start();
    });
});
