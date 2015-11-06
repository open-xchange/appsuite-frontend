/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define([
    'io.ox/contacts/edit/main',
    'io.ox/contacts/api',
    'spec/shared/capabilities'
], function (main, api, caputil) {

    'use strict';
    var capabilities = caputil.preset('common').init('io.ox/contacts/edit/main', main),
        testObject = {
            folder_id: 1
        };

    /*
     * Suite: Contacts Test
     */

    describe('Contact edit', function () {
        var app = null;

        beforeEach(function (done) {

            capabilities.reset().done(function () {
                done();
            });

        });

        it('should provide a getApp function', function () {
            expect(main.getApp).to.be.a('function');
        });

        it('should provide a launch function', function () {
            app = main.getApp(testObject);
            expect(app.launch).to.be.a('function');
        });

        it('should open contact edit app ', function (done) {
            app.launch().done(function () {
                expect(app).to.exist;
                done();
            });
        });

        it('should open the create formular', function () {
            var createForm = app.getWindow().nodes.main.find('.edit-contact');
            expect(createForm.children().length, 'number of elements in the form').to.be.above(0);
        });

        it('should paint some form components', function () {
            var createForm = app.getWindow().nodes.main.find('.edit-contact'),
                header = app.getWindow().nodes.header;

            expect(header.find('button.btn.btn-primary.save:disabled').length, 'find disabled save button').to.equal(1);
            expect(header.find('button.btn.btn-default.discard').length, 'find discard button').to.equal(1);
            expect(header.find('.checkbox-inline input.toggle-check').length, 'find show all fields checkbox').to.equal(1);
            expect(createForm.find('.picture-upload-view').length, 'find picture-upload').to.equal(1);

            expect(createForm.find('[data-id="personal"]').length, 'find personal block').to.equal(1);
            expect(createForm.find('[data-id="job"]').length, 'find job block').to.equal(1);
            expect(createForm.find('[data-id="messaging"]').length, 'find messaging block').to.equal(1);
            expect(createForm.find('[data-id="phone"]').length, 'find phone block').to.equal(1);
            expect(createForm.find('[data-id="home_address"]').length, 'find home and address block').to.equal(1);
            expect(createForm.find('[data-id="comment"]').length, 'find comment block').to.equal(1);
            expect(createForm.find('[data-id="attachments"]').length, 'find attachments block').to.equal(1);

        });

        it('should activate the save button if some data is available', function () {
            var createForm = app.getWindow().nodes.main.find('.edit-contact'),
                header = app.getWindow().nodes.header;

            createForm.find('input[name="first_name"]').val('test').change();
            expect(header.find('button.btn.btn-primary.save:disabled').length, 'find disabled save button').to.equal(0);
            expect(header.find('button.btn.btn-primary.save').length, 'find active save button').to.equal(1);

        });

    });

});
