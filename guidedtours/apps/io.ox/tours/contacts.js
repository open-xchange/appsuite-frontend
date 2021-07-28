/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
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
            .spotlight('.io-ox-contacts-window .primary-action .btn:visible, .classic-toolbar [data-ref="io.ox/contacts/dropdown/new"]:visible')
            .end()
        .step()
            .title(gt('Navigation bar'))
            .content(gt('Click on a letter on the left side of the navigation bar in order to display the corresponding contacts from the selected address book.'))
            .spotlight('.contact-grid-index')
            .end()
        .step()
            .title(gt('Sending an email to a contact'))
            .content(gt('To send an email to the contact, click on an email address or on Send email in the toolbar.'))
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
