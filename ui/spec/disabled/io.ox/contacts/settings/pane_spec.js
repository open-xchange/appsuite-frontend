/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define([
    'io.ox/core/extensions',
    'gettext!io.ox/contacts',
    'io.ox/contacts/settings/pane'
], function (ext, gt) {

    describe('Contact settings', function () {
        beforeEach(function () {

            $('body', document).append(this.node = $('<div id="contactssettingsNode">'));
            ext.point('io.ox/contacts/settings/detail').invoke('draw', this.node);

        });

        afterEach(function () {
            $('#contactssettingsNode', document).remove();
        });

        it('should draw the form', function () {
            this.node.find('h1').length.should.be.equal(1);
            this.node.find('h1').text().should.be.equal(gt('Address Book'));
            this.node.find('input[name="fullNameFormat"]').length.should.be.equal(3);
            this.node.find('input[name="fullNameFormat"]:eq(0)').parent().text().should.be.equal(gt('Language-specific default'));
            this.node.find('input[name="fullNameFormat"]:eq(1)').parent().text().should.be.equal(gt('First name Last name'));
            this.node.find('input[name="fullNameFormat"]:eq(2)').parent().text().should.be.equal(gt('Last name, First name'));
        });

    });

});
