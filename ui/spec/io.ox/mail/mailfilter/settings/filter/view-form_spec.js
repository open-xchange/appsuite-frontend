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

define([
    'io.ox/mail/mailfilter/settings/filter',
    'waitsFor',
    'gettext!io.ox/settings/settings'
], function (filters, waitsFor, gt) {

    'use strict';

    var resultWithoutFilter = { data: [] },
        resultAfterSave = { data: 1 },
        resultConfig = { timestamp: 1378223251586, data: {
            tests: [
                { test: 'address', comparison: ['user', 'detail'] },
                { test: 'envelope', comparison: ['regex', 'is', 'contains', 'matches'] },
                { test: 'exists', comparison: [] },
                { test: 'false', comparison: [] },
                { test: 'true', comparison: [] },
                { test: 'not', comparison: [] },
                { test: 'size', comparison: ['over', 'under'] },
                { test: 'header', comparison: ['regex', 'is', 'contains', 'matches'] },
                { test: 'allof', comparison: [] },
                { test: 'anyof', comparison: [] },
                { test: 'body', comparison: ['regex', 'is', 'contains', 'matches'] },
                { test: 'currentdate', comparison: ['ge', 'le', 'is', 'contains','matches'] }
            ],
            actioncommands: ['keep', 'discard', 'redirect', 'move', 'reject', 'stop', 'vacation', 'notify', 'addflags', 'set']
        }},
        resultConfigLimited = { timestamp: 1378223251586, data: {
            tests: [
                { test: 'address', comparison: ['user', 'detail'] },
                { test: 'envelope', comparison: ['regex', 'is', 'contains', 'matches'] },
                { test: 'exists', comparison: [] },
                { test: 'false', comparison: [] },
                { test: 'true', comparison: [] },
                { test: 'not', comparison: [] },
                { test: 'size', comparison: ['over', 'under'] },
                { test: 'header', comparison: ['regex', 'is', 'contains', 'matches'] },
                { test: 'allof', comparison: [] },
                { test: 'anyof', comparison: [] },
                { test: 'body', comparison: ['regex', 'is', 'contains', 'matches'] },
                { test: 'currentdate', comparison: ['ge', 'le', 'is', 'contains','matches'] }
            ],
            actioncommands: ['keep', 'discard', 'redirect', 'move', 'reject', 'stop', 'vacation', 'notify', 'set']
        }},
        model;

    describe('Mailfilter detailview', function () {

        var $container = $('<div id="testNode">'),
            addButton,
            $popup,
            collection;

        beforeEach(function (done) {
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultWithoutFilter));
            });

            this.server.respondWith('PUT', /api\/mailfilter\?action=new/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultAfterSave));
            });

            this.server.respondWith('PUT', /api\/mailfilter\?action=config/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultConfig));
            });

            filters.editMailfilter($container.empty()).done(function (filtercollection) {
                collection = filtercollection;
                addButton = $container.find('.btn-primary[data-action="add"]');
                addButton.click();
                $popup = $('body').find('.io-ox-mailfilter-edit').closest('.io-ox-dialog-popup');
                done();
            });
            $('body', document).append($container);
        });

        afterEach(function () {
            $('#testNode').remove();
            $popup.remove();
        });

        it('should open the new rule dialog', function () {
            expect($popup).to.have.length(1);

        });

        it('should draw all initial ui components', function () {

            expect($popup.find('[name="rulename"]'), 'rulename element').to.have.length(1);
            expect($popup.find('.alert.alert-info'), 'alert info element').to.have.length(1);
            expect($popup.find('a[data-toggle="dropdown"]:contains(' + gt('Add condition') + ')'), 'Add condition element').to.have.length(1);
            expect($popup.find('a[data-toggle="dropdown"]:contains(' + gt('Add action') + ')'), 'Add action element').to.have.length(1);
            expect($popup.find('[data-action="check-for-stop"]'), 'check for stop action element').to.have.length(1);

            expect($popup.find('.alert.alert-info'), 'initial alert for empty conditions').to.have.length(1);

        });

        it('should fill the dropdowns with all available conditions and actions', function () {
            // conditions
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Any recipient') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Subject') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mailing list') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('To') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('CC') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Header') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Envelope') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Size (bytes)') + ')')).to.have.length(1);

            // actions
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Keep') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Discard') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Redirect to') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Move to folder') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Reject with reason') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mark mail as') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Tag mail with') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Flag mail with') + ')')).to.have.length(1);

        });

        it('should draw the "Sender/From" condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-test"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Any recipient" condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Any recipient') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-test"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Subject" condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Subject') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-test"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Mailing list" condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mailing list') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-test"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "To" condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('To') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-test"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "CC" condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('CC') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-test"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Header" condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Header') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-test"]')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-test-second"]')).to.have.length(1);

            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Envelope" condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Envelope') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-test"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Size (bytes)" condition', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Size (bytes)') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-test"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="over"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="under"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Keep" action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Keep') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Discard" action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Discard') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li.filter-settings-view').hasClass('warning')).to.be.true;

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Redirect to" action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Redirect to') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-action"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Move to folder" action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Move to folder') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li a.folderselect')).to.have.length(1);
            expect($popup.find('li input[disabled="disabled"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Reject with reason" action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Reject with reason') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-action"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Mark mail as" action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mark mail as') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-action="change-value-actions"]')).to.have.length(2);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Tag mail with" action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Tag mail with') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[data-action="change-text-action"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Flag mail" with action', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Flag mail with') + ')').click();

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li div.flag-dropdown')).to.have.length(1);
            expect($popup.find('li li a[data-action="change-color"]')).to.have.length(11);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should save a empty rule', function (done) {
            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
                return false;
            }).then(function () {
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
                done();
            });

        });

        it('should save the "Sender/From" condition', function (done) {

            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('sender').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('test').should.be.deep.equal({ comparison: 'matches', headers: ['From'], id: 'header', values: ['sender'] });
                done();
            });

        });

        it('should save the "Any recipient" condition', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Any recipient') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('sender').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('test').should.be.deep.equal({ comparison: 'matches', headers: ['To', 'Cc'], id: 'header', values: ['sender'] });
                done();
            });

        });

        it('should save the "Subject" condition', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Subject') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('subject').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('test').should.be.deep.equal({ comparison: 'matches', headers: ['Subject'], id: 'header', values: ['subject'] });
                done();
            });

        });

        it('should save the "Mailing list" condition', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mailing list') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('Listname').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('test').should.be.deep.equal({
                    comparison: 'matches',
                    headers: ['List-Id', 'X-BeenThere', 'X-Mailinglist', 'X-Mailing-List'],
                    id: 'header',
                    values: ['Listname']
                });
                done();
            });

        });

        it('should save the "To" condition', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('To') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('to value').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('test').should.be.deep.equal({ comparison: 'matches', headers: ['To'], id: 'header', values: ['to value'] });
                done();
            });

        });

        it('should save the "CC" condition', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('CC') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('CC value').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('test').should.be.deep.equal({ comparison: 'matches', headers: ['Cc'], id: 'header', values: ['CC value'] });
                done();
            });

        });

        it('should save the "Header" condition', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Header') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('header value').trigger('change');
            $popup.find('input[data-action="change-text-test-second"]').val('name value').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('test').should.be.deep.equal({ comparison: 'matches', headers: ['name value'], id: 'header', values: ['header value'] });
                done();
            });

        });

        it('should save the "Header" with header Cc', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Header') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('header value').trigger('change');
            $popup.find('input[data-action="change-text-test-second"]').val('Cc').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('test').should.be.deep.equal({ comparison: 'matches', headers: ['Cc'], id: 'header', values: ['header value'] });
                done();
            });

        });

        it('should save the "Envelope" condition', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Envelope') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('envelope value').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('test').should.be.deep.equal({ comparison: 'matches', headers: ['To'], id: 'envelope', values: ['envelope value'] });
                done();
            });

        });

        it('should save the "Size (bytes)"" condition', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Size (bytes)') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('10').trigger('change');
            $popup.find('li li a[data-value="over"]').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('test').should.be.deep.equal({ comparison: 'over', id: 'size', size: '10' });
                done();
            });

        });

        it('should save the "Keep" action', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Keep') + ')').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('actioncmds').should.be.deep.equal([{ id: 'keep' }]);
                done();
            });

        });

        it('should save the "Discard" action', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Discard') + ')').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('actioncmds').should.be.deep.equal([{ id: 'discard' }]);
                done();
            });

        });

        it('should save the "Redirect to" action', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Redirect to') + ')').click();
            $popup.find('input[data-action="change-text-action"]').val('tester@open-xchange.com').trigger('change');

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('actioncmds').should.be.deep.equal([{ id: 'redirect', to: 'tester@open-xchange.com' }]);
                done();
            });

        });

        it('should save the Move to folder action', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Move to folder') +')').click();
            $popup.find('input[data-action="change-text-action"]').val('INBOX').trigger('change');

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('actioncmds').should.be.deep.equal([{ id: 'move', into: 'INBOX' }]);
                done();
            });

        });

        it('should save the "Reject with reason" action', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Reject with reason') + ')').click();
            $popup.find('input[data-action="change-text-action"]').val('reason').trigger('change');

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('actioncmds').should.be.deep.equal([{ id: 'reject', text: 'reason' }]);
                done();
            });

        });

        it('should save the "Mark mail as" action', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mark mail as') + ')').click();
            $popup.find('a:contains(' + gt('deleted') + ')').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('actioncmds').should.be.deep.equal([{ flags: ['\\deleted'], id: 'addflags' }]);
                done();
            });

        });

        it('should save the "Tag mail with" action', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Tag mail with') + ')').click();
            $popup.find('input[data-action="change-text-action"]').val('tag').trigger('change');

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('actioncmds').should.be.deep.equal([{ flags: ['$tag'], id: 'addflags' }]);
                done();
            });

        });

        it('should save the "Flag mail with" action', function (done) {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Flag mail with') + ')').click();
            $popup.find('a[data-action="change-color"] span.flag-example.flag_1').click();

            $popup.find('[data-action="save"]').click();

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('actioncmds').should.be.deep.equal([{ flags: ['$cl_1'], id: 'addflags' }]);
                done();
            });

        });

        it('should create a rule with some conditions and actions', function (done) {
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

            waitsFor(function () {
                if (collection.length === 1) {
                    model = collection.findWhere({ id: 1 });
                    return true;
                }
            }).then(function () {
                model.get('actioncmds').should.be.deep.equal([{ flags: ['$tag'], id: 'addflags' }, { flags: ['$cl_1'], id: 'addflags' }]);
                model.get('test').should.be.deep.equal({ id: 'allof', tests: [
                    {
                        comparison: 'matches',
                        headers: ['From'],
                        id: 'header',
                        values: ['sender']
                    }, {
                        comparison: 'over',
                        id: 'size',
                        size: '10'
                    }]
                });
                done();
            });

        });

        it('should draw the "Apply rule if ..." dropdown', function () {
            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Sender/From') + ')').click();
            $popup.find('input[data-action="change-text-test"]').val('sender').trigger('change');
            $popup.find('li li a[data-value="matches"]').click();

            expect($popup.find('a[data-value="allof"]')).to.have.length(0);
            expect($popup.find('a[data-value="anyof"]')).to.have.length(0);

            $popup.find('a[data-action="change-value-extern"]:contains(' + gt('Size (bytes)') + ')').click();
            $popup.find('li[data-test-id="1"] input[data-action="change-text-test"]').val('10').trigger('change');
            $popup.find('li[data-test-id="1"] li a[data-value="over"]').click();

            expect($popup.find('a[data-value="allof"]')).to.have.length(1);
            expect($popup.find('a[data-value="anyof"]')).to.have.length(1);
        });

    });

    describe('Mailfilter detailview', function () {

        var $container = $('<div id="testNode">'),
            addButton,
            $popup,
            collection;

        beforeEach(function (done) {
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultWithoutFilter));
            });

            this.server.respondWith('PUT', /api\/mailfilter\?action=new/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultAfterSave));
            });

            this.server.respondWith('PUT', /api\/mailfilter\?action=config/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultConfigLimited));
            });

            filters.editMailfilter($container.empty()).done(function (filtercollection) {
                collection = filtercollection;
                addButton = $container.find('.btn-primary[data-action="add"]');
                addButton.click();
                $popup = $('body').find('.io-ox-mailfilter-edit').closest('.io-ox-dialog-popup');
                done();
            });
            $('body', document).append($container);
        });

        afterEach(function () {
            $('#testNode').remove();
            $popup.remove();
        });

        it('should fill the dropdowns with the limited actions', function () {
            // actions
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Keep') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Discard') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Redirect to') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Move to folder') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Reject with reason') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Mark mail as') + ')')).to.have.length(0);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Tag mail with') + ')')).to.have.length(0);
            expect($popup.find('a[data-action="change-value-extern"]:contains(' + gt('Flag mail with') + ')')).to.have.length(0);

        });

    });

});
