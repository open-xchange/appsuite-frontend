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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define(['io.ox/mail/mailfilter/settings/filter', 'gettext!io.ox/settings/settings'], function (filters, gt) {

    'use strict';

    var resultWithoutFilter = { data: [] },
        resultAfterSave = { data: 1},
        model;

    describe('Mailfilter filter without rules', function () {

        var $container = $('<div id="testNode">'),
            addButton,
            $popup,
            collection;

        beforeEach(function () {
            var def;
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(resultWithoutFilter));
            });

            this.server.respondWith('PUT', /api\/mailfilter\?action=new/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(resultAfterSave));
            });

            def = filters.editMailfilter($container.empty()).done(function (filtercollection) {
                collection = filtercollection;
            });
            waitsFor(function () {
                return def.state() === 'resolved';
            }, 'setup mailfilter edit view', ox.testTimeout);
            runs(function () {
                addButton = $container.find('.btn-primary[data-action="add"]');
                addButton.click();
                $popup = $('body').find('.io-ox-mailfilter-edit').closest('.io-ox-dialog-popup');
            });
            $('body', document).append($container);
        });

        afterEach(function () {
            $('#testNode').remove();
            $popup.remove();
        });

        it('should open the new rule dialog', function () {
            expect($popup.length).toBe(1);

        });

        it('should draw all initial ui componets', function () {

            expect($popup.find('[name="rulename"]').length).toBe(1);
            expect($popup.find('.alert.alert-block').length).toBe(1);
            expect($popup.find('a[data-toggle="dropdown"]:contains(' + gt('Add condition') + ')').length).toBe(1);
            expect($popup.find('a[data-toggle="dropdown"]:contains(' + gt('Add action') + ')').length).toBe(1);
            expect($popup.find('[data-action="check-for-stop"]').length).toBe(1);

        });

        it('should fill the dropdowns with all available conditions and actions', function () {
            // conditions
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Any recipient') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Subject') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mailing list') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('To') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('CC') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Header') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Envelope') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Size (bytes)') + ')').length).toBe(1);

            // actions
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Keep') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Discard') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Redirect to') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Move to folder') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Reject with reason') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mark mail as') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Tag mail with') + ')').length).toBe(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Flag mail with') + ')').length).toBe(1);
            
        });

        it('should draw the Sender/From condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Any recipient condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Any recipient') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Subject condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Subject') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Mailing list condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mailing list') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the To condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('To') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the CC condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('CC') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Header condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Header') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test-second"]').length).toBe(1);
            
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Envelope condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Envelope') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="contains"]').length).toBe(1);
            expect($popup.find('li li a[data-value="is"]').length).toBe(1);
            expect($popup.find('li li a[data-value="matches"]').length).toBe(1);
            expect($popup.find('li li a[data-value="regex"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Size (bytes) condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Size (bytes)') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-test"]').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-value="over"]').length).toBe(1);
            expect($popup.find('li li a[data-value="under"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-test"]').length).toBe(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Keep action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Keep') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Discard action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Discard') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li.filter-settings-view').hasClass('warning')).toBe(true);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Redirect to action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Redirect to') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-action"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Move to folder action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Move to folder') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li a.folderselect').length).toBe(1);
            expect($popup.find('li input[disabled="disabled"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Reject with reason action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Reject with reason') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-action"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Mark mail as action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mark mail as') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li a.dropdown-toggle').length).toBe(1);

            expect($popup.find('li li a[data-action="change-value-actions"]').length).toBe(2);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Tag mail with action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Tag mail with') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li input[data-action="change-text-action"]').length).toBe(1);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should draw the Flag mail with action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Flag mail with') + ')').click();

            expect($popup.find('li.filter-settings-view').length).toBe(1);
            expect($popup.find('li div.flag-dropdown').length).toBe(1);
            expect($popup.find('li li a[data-action="change-color"]').length).toBe(11);

            expect($popup.find('li a[data-action="remove-action"]').length).toBe(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view').length).toBe(0);

        });

        it('should save a empty rule', function () {
            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            
            model.attributes.should.have.a.property('active');
            model.attributes.active.should.be.equal(true);
            model.attributes.should.have.a.property('test');
            model.attributes.test.should.be.deep.equal({ 'id': 'true' });
            model.attributes.should.have.a.property('actioncmds');
            model.attributes.actioncmds.should.be.a('array');
            model.attributes.actioncmds.should.be.empty;
            model.attributes.should.have.a.property('flags');
            model.attributes.flags.should.be.a('array');
            model.attributes.flags.should.be.empty;
            model.attributes.should.have.a.property('rulename');
        });

        it('should save the Sender/From condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('sender').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('test').should.be.deep.equal({comparison: 'matches', headers: ['From'], id: 'header', values: ['sender']});

        });

        it('should save the Any recipient condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Any recipient') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('sender').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('test').should.be.deep.equal({comparison: 'matches', headers: ['To', 'Cc'], id: 'header', values: ['sender']});

        });

        it('should save the Subject condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Subject') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('subject').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('test').should.be.deep.equal({comparison: 'matches', headers: ['Subject'], id: 'header', values: ['subject']});

        });

        it('should save the Mailing list condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mailing list') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('Listname').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('test').should.be.deep.equal({comparison: 'matches', headers: ['List-Id', 'X-BeenThere', 'X-Mailinglist', 'X-Mailing-List'], id: 'header', values: ['Listname']});

        });

        it('should save the To condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('To') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('to value').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('test').should.be.deep.equal({comparison: 'matches', headers: ['To'], id: 'header', values: ['to value']});

        });

        it('should save the CC condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('CC') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('CC value').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('test').should.be.deep.equal({comparison: 'matches', headers: ['Cc'], id: 'header', values: ['CC value']});

        });

        it('should save the Header condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Header') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('header value').trigger('change');
            $popup.find('input[data-action="change-text-test-second"]').val('name value').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('test').should.be.deep.equal({comparison: 'matches', headers: ['name value'], id: 'header', values: ['header value']});

        });

        it('should save the Header condition and the result should be like CC condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Header') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('header value').trigger('change');
            $popup.find('input[data-action="change-text-test-second"]').val('Cc').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('test').should.be.deep.equal({comparison: 'matches', headers: ['Cc'], id: 'header', values: ['header value']});

        });

        it('should save the Envelope condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Envelope') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('envelope value').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('test').should.be.deep.equal({comparison: 'matches', headers: ['To'], id: 'envelope', values: ['envelope value']});

        });

        it('should save the Size (bytes) condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Size (bytes)') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('10').trigger('change');
            $popup.find('li li a[data-value="over"]').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('test').should.be.deep.equal({comparison: 'over', id: 'size', size: '10'});

        });

        it('should save the Keep action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Keep') + ')').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('actioncmds').should.be.deep.equal([{id: 'keep'}]);

        });

        it('should save the Discard action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Discard') + ')').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('actioncmds').should.be.deep.equal([{id: 'discard'}]);

        });

        it('should save the Redirect to action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Redirect to') + ')').click();
            $popup.find('input[data-action="change-text-action"]').val('tester@open-xchange.com').trigger('change');

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('actioncmds').should.be.deep.equal([{id: 'redirect', to: 'tester@open-xchange.com'}]);

        });

        // it('should save the Move to folder action', function () {
        //     $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Move to folder') +')').click();
        //     $popup.find('input[data-action="change-text-action"]').val('tester@open-xchange.com').trigger('change');

        //     $popup.find('[data-action="save"]').click();
        //     this.server.respond();
        //     model = collection.findWhere({ id: 1 });
        //     console.log(model.get('actioncmds'))
        //     model.get('actioncmds').should.be.deep.equal([{id: 'redirect', to: 'tester@open-xchange.com'}]);

        // });

        it('should save the Reject with reason action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Reject with reason') + ')').click();
            $popup.find('input[data-action="change-text-action"]').val('reason').trigger('change');

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('actioncmds').should.be.deep.equal([{id: 'reject', text: 'reason'}]);

        });

        it('should save the Mark mail as action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mark mail as') + ')').click();
            $popup.find('a:contains(' + gt('deleted') + ')').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('actioncmds').should.be.deep.equal([{flags: ['\\deleted'], id: 'addflags'}]);

        });

        it('should save the Tag mail with action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Tag mail with') + ')').click();
            $popup.find('input[data-action="change-text-action"]').val('tag').trigger('change');

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('actioncmds').should.be.deep.equal([{flags: ['$tag'], id: 'addflags'}]);

        });

        it('should save the Flag mail with action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Flag mail with') + ')').click();
            $popup.find('a[data-action="change-color"] span.flag-example.flag_1').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });
            model.get('actioncmds').should.be.deep.equal([{flags: ['$cl_1'], id: 'addflags'}]);

        });

        it('should create a rule with some conditions and actions', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('sender').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Size (bytes)') + ')').click();
            $popup.find('li[data-test-id="1"] input[data-action="change-text-test"]').val('10').trigger('change');
            $popup.find('li[data-test-id="1"] li a[data-value="over"]').click();

            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Tag mail with') + ')').click();
            $popup.find('input[data-action="change-text-action"]').val('tag').trigger('change');

            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Flag mail with') + ')').click();
            $popup.find('li[data-action-id="1"] a[data-action="change-color"] span.flag-example.flag_1').click();

            $popup.find('[data-action="save"]').click();
            this.server.respond();
            model = collection.findWhere({ id: 1 });

            model.get('actioncmds').should.be.deep.equal([{flags: ['$tag'], id: 'addflags'}, {flags: ['$cl_1'], id: 'addflags'}]);
            model.get('test').should.be.deep.equal({id: 'allof', tests: [{comparison: 'matches', headers: ['From'], id: 'header', values: ['sender']}, {comparison: 'over', id: 'size', size: '10'}]});

        });

    });

});
