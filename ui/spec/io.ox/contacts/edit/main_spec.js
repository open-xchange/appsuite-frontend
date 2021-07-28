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

define([
    'io.ox/contacts/edit/main'
], function (main) {

    'use strict';

    var //capabilities = caputil.preset('common').init('io.ox/contacts/edit/main', main),
        testObject = {
            folder_id: 1
        };

    /*
     * Suite: Contacts Test
     */

    describe('Contact edit', function () {
        var app = null;

        /*beforeEach(function () {
            return capabilities.reset();
        });*/

        it('should provide a getApp function', function () {
            expect(main.getApp).to.be.a('function');
        });

        it('should provide a launch function', function () {
            app = main.getApp(testObject);
            expect(app.launch).to.be.a('function');
        });

        it('should open contact edit app ', function () {
            return app.launch().then(function () {
                expect(app).to.exist;
            });
        });

        it('should open the create formular', function () {
            var createForm = app.getWindow().nodes.main.find('.contact-edit');
            expect(createForm.children().length, 'number of elements in the form').to.be.above(0);
        });

        it('should paint some form components', function () {
            var createForm = app.getWindow().nodes.main.find('.contact-edit'),
                footer = app.getWindow().nodes.footer;
            expect(footer.find('button.btn.btn-primary.save').length, 'find save button').to.equal(1);
            expect(footer.find('button.btn.btn-default.discard').length, 'find discard button').to.equal(1);

            expect(createForm.find('.contact-photo').length, 'find picture-upload').to.equal(1);
            expect(createForm.find('[data-section="personal"]').length, 'find personal block').to.equal(1);
            expect(createForm.find('[data-section="business"]').length, 'find business block').to.equal(1);
            expect(createForm.find('[data-section="communication"]').length, 'find communication block').to.equal(1);
            expect(createForm.find('[data-field="note"]').length, 'find note field').to.equal(1);
        });

        it('should activate the save button if some data is available', function () {
            var createForm = app.getWindow().nodes.main.find('.contact-edit'),
                footer = app.getWindow().nodes.footer;

            createForm.find('input[name="first_name"]').val('test').change();
            expect(footer.find('button.btn.btn-primary.save:disabled').length, 'find disabled save button').to.equal(0);
            expect(footer.find('button.btn.btn-primary.save').length, 'find active save button').to.equal(1);

        });

        it('should close the edit app', function () {
            app.setQuit(function () {
                return $.when();
            });
            return app.quit();
        });

    });

});
