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
    'io.ox/contacts/distrib/main', 'io.ox/contacts/api', 'gettext!io.ox/contacts'
], function (main, api, gt) {

    'use strict';

    var listname = 'testlist',
        participants = [
            { display_name: 'otto.xentner', mail: 'otto.xentner@open-xchange.com', mail_field: 0 },
            { display_name: 'Otto Xentner1', mail: 'otto.xentner1@open-xchange.com', mail_field: 0 }
        ],
        input = [ 'otto.xentner@open-xchange.com', '"Otto Xentner1" <otto.xentner1@open-xchange.com>'],
        searchResult = {
            timestamp: 1379403021960,
            data: []
        };

    /*
     * Suite: Distributionlist Test
     */

    describe.only('Distributionlist edit', function () {
        var app = null,
            clock;

        beforeEach(function () {
            this.server.respondWith('PUT', /api\/contacts\?action=search/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{ "timestamp":1368791630910,"data": []}');
            });
            clock = sinon.useFakeTimers();
        });

        afterEach(function () {
            clock.restore();
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
            expect(createForm.find('input.add-participant.tt-input').length, 'find input for name').to.equal(1);
            expect(header.find('button.btn.btn-primary:disabled').length, 'find disabled save button').to.equal(1);
            expect(createForm.find('[data-extension-id="displayname"] input').length, 'find display name').to.equal(1);
        });

        it('should paint the empty list message', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist');
            expect(createForm.find('[data-extension-id="participants_list"] li').text(), 'find empty list message').to.equal(gt('This list has no contacts yet'));
        });

        it('fills the namefield ', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist'),
                header = app.getWindow().nodes.header;
            createForm.find('[data-extension-id="displayname"] input').val(listname).keyup().trigger('change');
            clock.tick(1000);
            expect(header.find('button.btn.btn-primary:disabled').length, 'check for enabled save button').to.equal(0);
            expect(app.model.get('display_name')).to.equal(listname);
        });

        it('adds a new member with pure mail address', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist'),
                e = $.Event('keydown', { which: 13 });
            createForm.find('input.add-participant.tt-input').val(input[0]).trigger('change').trigger('input.tt').trigger(e);
            clock.tick(1000);
            expect(app.model.get('distribution_list').length).to.equal(1);
            expect(app.model.get('distribution_list')[0]).to.deep.equal(participants[0]);
        });

        it('adds a new member with mail address and name', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist'),
                e = $.Event('keydown', { which: 13 });
            createForm.find('input.add-participant.tt-input').val(input[1]).trigger('change').trigger('input.tt').trigger(e);
            clock.tick(1000);
            expect(app.model.get('distribution_list').length).to.equal(2);
            expect(app.model.get('distribution_list')[1]).to.deep.equal(participants[1]);
        });

        it('should paint the members of the distributionlist', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist');
            expect(createForm.find('.participant-wrapper').length, 'find distributionlist members').to.equal(2);
        });

        it('removes a member of the distributionlist', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist');
            createForm.find('.participant-wrapper .remove').first().trigger('click');
            expect(createForm.find('.participant-wrapper').length, 'find distributionlist members').to.equal(1);
        });

        it('filter duplicated entries ', function () {
            var createForm = app.getWindow().nodes.body.find('.window-content .create-distributionlist'),
                e = $.Event('keydown', { which: 13 });
            expect(createForm.find('.participant-wrapper').length, 'find distributionlist members').to.equal(1);

            createForm.find('input.add-participant.tt-input').val(input[1]).trigger('change').trigger('input.tt').trigger(e);
            clock.tick(1000);

            expect(app.model.get('distribution_list').length).to.equal(1);
            expect(app.model.get('distribution_list')[0]).to.deep.equal(participants[1]);
        });

        it('quit the app', function (done) {
            //quit the app, but don't cleanup (force = true)
            //and don't sync any models (override default destroy method)
            app.destroy = _.noop;
            app.quit(true).done(done);
        });

    });

});
