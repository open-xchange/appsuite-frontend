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

define(['io.ox/contacts/distrib/main', 'io.ox/contacts/api', 'waitsFor'], function (main, api, waitsFor) {

    'use strict';

    var testObjects = {
            user1: {
                nameValue: 'user1',
                mailValue: 'user1@user1.test',
                fillForm: 'user1 <user1@user1.test>'
            },
            user2: {
                nameValue: 'user2',
                mailValue: 'user2@user2.test',
                fillForm: 'user2 <user2@user2.test>'
            },
            user3: {
                nameValue: 'user3',
                mailValue: 'user3@user3.test',
                fillForm: 'user3 <user3@user3.test>'
            }
        },

        fillAndTrigger = function (o) {
            o.inputName.val(o.fillForm);
            o.addButton.trigger('click');
        },

        listname = 'testlist',

        result = {
            'timestamp': 1379403021960,
            'data': {
                'id': 510778
            }
        };

    /*
     * Suite: Distributionlist Test
     */

    describe('Distributionlist edit', function () {

        var app = null;

        beforeEach(function () {
            this.server.respondWith('PUT', /api\/contacts\?action=new/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(result));
            });
        });

        it('should provide a getApp function ', function () {
            expect(main.getApp).to.be.a('function');
        });

        it('should provide a launch function ', function () {
            app = main.getApp();
            expect(app.launch).to.be.a('function');
        });

        it('should open distributionlist app ', function (done) {
            app.launch().done(function () {
                app.create(1);
                expect(app).to.exist;
                done();
            });
        });

        it('should open the create formular', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist');
            expect(createForm.children().length, 'number of elements in the form').to.be.above(0);
        });

        it('should paint some form components', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist'),
                header = app.getWindow().nodes.header;
            expect(createForm.find('input.add-participant').length, 'find input for name').to.equal(1);
            expect(header.find('button.btn.btn-primary').length, 'find save button').to.equal(1);
            expect(createForm.find('[data-extension-id="displayname"] input').length, 'find display name').to.equal(1);
        });

        it('fills the namefield ', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist');
            createForm.find('[data-extension-id="displayname"] input').val(listname).trigger('change');
        });

        it('fills the array with the test data ', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist');
            _.each(testObjects, function (val) {
                fillAndTrigger({
                    inputName: createForm.find('input.add-participant'),
                    addButton: createForm.find('button[data-action="add"]'),
                    fillForm: val.fillForm
                });
            });
        });

        it('quit the app', function (done) {
            //quit the app, but don't cleanup (force = true)
            //and don't sync any models (override default destroy method)
            app.destroy = _.noop;
            app.quit(true).done(done);
        });

    });

});
