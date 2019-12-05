/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
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
