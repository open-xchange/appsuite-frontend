/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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
    'io.ox/mail/mailfilter/settings/filter',
    'waitsFor',
    'gettext!io.ox/settings'
], function (filters, waitsFor, gt) {

    'use strict';

    var resultWithoutFilter = { data: [] },
        resultWithSomeFilters = {
            data: [
                {
                    id: 1,
                    position: 0,
                    rulename: 'testrule 1',
                    active: false,
                    flags: [],
                    test: { id: 'size', comparison: 'over', size: 101 },
                    actioncmds: [{ id: 'stop' }]
                },
                {
                    id: 2,
                    position: 1,
                    rulename: 'testrule 2',
                    active: false,
                    flags: [],
                    test: {
                        id: 'allof',
                        tests: [
                            {
                                id: 'header',
                                comparison: 'contains',
                                headers: ['From'],
                                values: ['sender']
                            },
                            {
                                id: 'body',
                                comparison: 'contains',
                                extensionskey: 'text',
                                extensionsvalue: null,
                                values: ['contend']
                            },
                            {
                                id: 'header',
                                comparison: 'contains',
                                headers: ['Subject'],
                                values: ['subject']
                            }
                        ]
                    },
                    actioncmds: [
                        {
                            id: 'addflags',
                            flags: ['$cl_1']
                        },
                        {
                            id: 'addflags',
                            flags: ['$tag']
                        },
                        {
                            id: 'addflags',
                            flags: ['\\deleted']
                        }
                    ]
                }
            ]
        },

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
                { test: 'currentdate', comparison: ['ge', 'le', 'is', 'contains', 'matches'] }
            ],
            actioncommands: ['keep', 'discard', 'redirect', 'move', 'reject', 'stop', 'vacation', 'notify', 'addflags', 'set']
        } },
        resultConfigLimited = { timestamp: 1378223251586, data: {
            tests: [
                { test: 'address', comparison: ['user', 'detail'] },
                { test: 'envelope', comparison: ['regex', 'is', 'contains', 'matches'] },
                { test: 'exists', comparison: [] },
                { test: 'false', comparison: [] },
                { test: 'true', comparison: [] },
                { test: 'not', comparison: [] },
                { test: 'size', comparison: ['under'] },
                { test: 'header', comparison: ['is', 'contains', 'matches'] },
                { test: 'allof', comparison: [] },
                { test: 'anyof', comparison: [] },
                { test: 'body', comparison: ['regex', 'is', 'contains', 'matches'] }
            ],
            actioncommands: ['keep', 'discard', 'redirect', 'move', 'reject', 'stop', 'vacation', 'notify', 'set']
        } },
        model;

    describe('Mailfilter detailview without filters', function () {

        var $container = $('<div id="testNode">'),
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
                var addButton = $container.find('.btn-primary[data-action="add"]');
                addButton.click();
                $popup = $('body').find('.io-ox-mailfilter-edit').closest('.modal-dialog');
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
            expect($popup.find('[data-action="check-for-stop"]:checked'), 'check if stop action element is checked').to.have.length(1);

            expect($popup.find('.alert.alert-info'), 'initial alert for empty conditions').to.have.length(1);

        });

        it('should fill the dropdowns with all available conditions and actions', function () {
            // conditions
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Sender/From') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Any recipient') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Subject') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Mailing list') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Envelope - To') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('CC') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Header') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Envelope') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Size (bytes)') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Content') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Current Date') + ')')).to.have.length(1);

            // actions
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Keep') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Discard') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Redirect to') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Move to folder') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Reject with reason') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Mark mail as') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Tag mail with') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Flag mail with') + ')')).to.have.length(1);

        });

        // conditions
        it.skip('should draw the "Sender/From" condition', function (done) {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Sender/From') + ')').click();

            expect($popup.find('.alert.alert-info'), 'remove alert info element if a condition is displayed').to.have.length(0);

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Sender/From') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="values"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('.row').hasClass('has-error'), 'set warnig class if field is empty').to.be.true;
            expect($popup.find('button[data-action="save"]:disabled'), 'disable save button if field is empty').to.have.length(1);

            setTimeout(function () {
                $popup.find('li input[name="values"]').val('test').change();
                expect($popup.find('.row').hasClass('has-error'), 'remove warnig class if field is filled').to.be.false;
                expect($popup.find('button[data-action="save"]:disabled'), 'reenable save button if field is filled').to.have.length(0);
                done();
            }, 1);

            setTimeout(function () {
                $popup.find('li input[name="values"]').val('').change();
                expect($popup.find('.row').hasClass('has-error').hasClass('has-error'), 'set warnig class if field value has been cleared').to.be.true;
                expect($popup.find('button[data-action="save"]:disabled'), 'disable save button if field value has been cleared').to.have.length(1);
                done();
            }, 1);

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);
            expect($popup.find('.alert.alert-info'), 'alert for empty conditions').to.have.length(1);

        });

        it('should draw the "Any recipient" condition', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Any recipient') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Any recipient') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="values"]')).to.have.length(1);
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
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Subject') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Subject') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="values"]')).to.have.length(1);
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
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Mailing list') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Mailing list') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="values"]')).to.have.length(1);
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
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('To') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('To') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="values"]')).to.have.length(1);
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
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('CC') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('CC') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="values"]')).to.have.length(1);
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
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Header') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Header') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="headers"]')).to.have.length(1);
            expect($popup.find('li input[name="values"]')).to.have.length(1);

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
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Envelope') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Envelope') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="values"]')).to.have.length(1);
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
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Size (bytes)') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Size (bytes)') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="size"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="over"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="under"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Content" condition', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Content') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Content') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="values"]')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Current Date" condition', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Current Date') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Current Date') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input.datepicker-day-field ')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-value="ge"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="le"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-test"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        // actions
        it('should draw the "Keep" action', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Keep') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Keep') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Discard" action', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Discard') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Discard') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li.filter-settings-view').hasClass('warning')).to.be.true;

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Redirect to" action', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Redirect to') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Redirect to') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="to"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Move to folder" action', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Move to folder') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Move to folder') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li a.folderselect')).to.have.length(1);
            expect($popup.find('li input[disabled="disabled"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Reject with reason" action', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Reject with reason') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Reject with reason') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="text"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Mark mail as" action', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Mark mail as') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Mark mail as') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li a.dropdown-toggle')).to.have.length(1);

            expect($popup.find('li li a[data-action="change-value"]')).to.have.length(2);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Tag mail with" action', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Tag mail with') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Tag mail with') + ')')).to.have.length(1);

            expect($popup.find('li.filter-settings-view')).to.have.length(1);
            expect($popup.find('li input[name="flags"]')).to.have.length(1);

            expect($popup.find('li a[data-action="remove-action"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-action"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

        });

        it('should draw the "Flag mail" with action', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Flag mail with') + ')').click();

            expect($popup.find('li.filter-settings-view .list-title')).to.have.length(1);
            expect($popup.find('li.filter-settings-view .list-title:contains(' + gt('Flag mail with') + ')')).to.have.length(1);

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

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Sender/From') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="values"]').val('sender').change();
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

            }, 1);

        });

        it('should save the "Any recipient" condition', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Any recipient') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="values"]').val('sender').change();
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

            }, 1);

        });

        it('should save the "Subject" condition', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Subject') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="values"]').val('subject').change();
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

            }, 1);

        });

        it('should save the "Mailing list" condition', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Mailing list') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="values"]').val('Listname').change();
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

            }, 1);

        });

        it('should save the "To" condition', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('To') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="values"]').val('to value').change();
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

            }, 1);

        });

        it('should save the "CC" condition', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('CC') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="values"]').val('CC value').change();
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

            }, 1);

        });

        it('should save the "Header" condition', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Header') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="headers"]').val('name value').change();
                $popup.find('li input[name="values"]').val('header value').change();
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

            }, 1);

        });

        it('should save the "Header" with header Cc', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Header') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="headers"]').val('Cc').change();
                $popup.find('li input[name="values"]').val('header value').change();
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

            }, 1);

        });

        it('should save the "Envelope" condition', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Envelope') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="values"]').val('envelope value').change();
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

            }, 1);

        });

        it('should save the "Size (bytes)" condition', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Size (bytes)') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="size"]').val('10').change();
                $popup.find('li li a[data-value="over"]').click();
                $popup.find('[data-action="save"]').click();

                waitsFor(function () {
                    if (collection.length === 1) {
                        model = collection.findWhere({ id: 1 });
                        return true;
                    }
                }).then(function () {
                    model.get('test').should.be.deep.equal({ comparison: 'over', id: 'size', size: 10 });
                    done();
                });

            }, 1);

        });

        it('should save the "Content" condition', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Content') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="values"]').val('test').change();
                $popup.find('li li a[data-value="is"]').click();
                $popup.find('[data-action="save"]').click();

                waitsFor(function () {
                    if (collection.length === 1) {
                        model = collection.findWhere({ id: 1 });
                        return true;
                    }
                }).then(function () {
                    model.get('test').should.be.deep.equal({ comparison: 'is', id: 'body', values: ['test'], extensionskey: 'text', extensionsvalue: null });
                    done();
                });

            }, 1);

        });

        it('should save the "Keep" action', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Keep') + ')').click();

            setTimeout(function () {
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

            }, 1);

        });

        it('should save the "Discard" action', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Discard') + ')').click();

            setTimeout(function () {
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

            }, 1);

        });

        it('should save the "Redirect to" action', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Redirect to') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="to"]').val('tester@open-xchange.com').trigger('change');
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

            }, 1);

        });

        it('should save the Move to folder action', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Move to folder') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="into"]').val('INBOX').change();
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

            }, 1);

        });

        it('should save the "Reject with reason" action', function (done) {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Reject with reason') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="text"]').val('reason').change();
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

            }, 1);

        });

        it('should save the "Mark mail as" action', function (done) {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Mark mail as') + ')').click();

            setTimeout(function () {
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

            }, 1);

        });

        it('should save the "Tag mail with" action', function (done) {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Tag mail with') + ')').click();

            setTimeout(function () {
                $popup.find('li input[name="flags"]').val('tag').change();
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

            }, 1);

        });

        it('should save the "Flag mail with" action', function (done) {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Flag mail with') + ')').click();

            setTimeout(function () {
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

            }, 1);

        });

        it('should create a rule with some conditions and actions', function (done) {

            setTimeout(function () {
                $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Sender/From') + ')').click();
                $popup.find('li[data-test-id="0"] input[name="values"]').val('sender').change();
                $popup.find('li[data-test-id="0"] a[data-value="matches"]').click();

                $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Size (bytes)') + ')').click();
                $popup.find('li[data-test-id="1"] input[name="size"]').val('10').change();
                $popup.find('li[data-test-id="1"] li a[data-value="over"]').click();

                $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Tag mail with') + ')').click();
                $popup.find('li[data-action-id="0"] input[name="flags"]').val('tag').change();

                $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Flag mail with') + ')').click();
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
                            size: 10
                        }]
                    });
                    done();
                });

            }, 1);

        });

        it('should draw the "Apply rule if ..." dropdown', function () {
            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Sender/From') + ')').click();
            $popup.find('li[data-test-id="0"] input[name="values"]').val('sender').trigger('change');
            $popup.find('li[data-test-id="0"] li a[data-value="matches"]').click();

            expect($popup.find('a[data-value="allof"]')).to.have.length(0);
            expect($popup.find('a[data-value="anyof"]')).to.have.length(0);

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Size (bytes)') + ')').click();
            $popup.find('li[data-test-id="1"] input[name="size"]').val('10').trigger('change');
            $popup.find('li[data-test-id="1"] li a[data-value="over"]').click();

            expect($popup.find('a[data-value="allof"]')).to.have.length(1);
            expect($popup.find('a[data-value="anyof"]')).to.have.length(1);
        });

    });

    describe('Mailfilter detailview without filters and limited configuration', function () {

        var $container = $('<div id="testNode">'),
            $popup;

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

            filters.editMailfilter($container.empty()).done(function () {
                var addButton = $container.find('.btn-primary[data-action="add"]');
                addButton.click();
                $popup = $('body').find('.io-ox-mailfilter-edit').closest('.modal-dialog');
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
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Keep') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Discard') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Redirect to') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Move to folder') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Reject with reason') + ')')).to.have.length(1);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Mark mail as') + ')')).to.have.length(0);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Tag mail with') + ')')).to.have.length(0);
            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Flag mail with') + ')')).to.have.length(0);

        });

        it('should fill the dropdowns with the limited conditions', function () {

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Header') + ')').click();

            expect($popup.find('li li a[data-value="contains"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="is"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="matches"]')).to.have.length(1);
            expect($popup.find('li li a[data-value="regex"]')).to.have.length(0);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

            $popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Size (bytes)') + ')').click();

            expect($popup.find('li li a[data-value="over"]')).to.have.length(0);
            expect($popup.find('li li a[data-value="under"]')).to.have.length(1);

            $popup.find('li a[data-action="remove-test"]').click();
            expect($popup.find('li.filter-settings-view')).to.have.length(0);

            expect($popup.find('a[data-action="change-dropdown-value"]:contains(' + gt('Current Date') + ')')).to.have.length(0);

        });

    });

    describe('Mailfilter detailview with filters', function () {

        var $container = $('<div id="testNode">'),
            collection,
            $popup;

        beforeEach(function (done) {
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultWithSomeFilters));
            });

            this.server.respondWith('PUT', /api\/mailfilter\?action=new/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultAfterSave));
            });

            this.server.respondWith('PUT', /api\/mailfilter\?action=config/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultConfig));
            });

            filters.editMailfilter($container.empty()).done(function (filtercollection) {
                collection = filtercollection;
                $container.find('li[data-id="2"] a[data-action="edit"]').click();
                $popup = $('body').find('.io-ox-mailfilter-edit').closest('.modal-dialog');
                done();
            });
            $('body', document).append($container);
        });

        afterEach(function () {
            $('#testNode').remove();
            $popup.remove();
        });

        it('should draw all conditions and actions', function () {
            expect($popup.find('.tests li.filter-settings-view')).to.have.length(3);
            expect($popup.find('.actions li.filter-settings-view')).to.have.length(3);
        });

        it('should reset the model if the popup is closed with cancel', function (done) {

            setTimeout(function () {
                $popup.find('li[data-test-id="0"] input[name="values"]').val('testsender').change();
                $popup.find('[data-action="cancel"]').click();

                waitsFor(function () {
                    if (collection.length === 2) {
                        model = collection.findWhere({ id: 1 });
                        return true;
                    }
                }).then(function () {
                    collection.get('2').attributes.test.tests[0].should.be.deep.equal({ comparison: 'contains', headers: ['From'], id: 'header', values: ['sender'] });
                    done();
                });

            }, 1);

        });

    });

});
