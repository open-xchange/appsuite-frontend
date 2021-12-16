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

define(['io.ox/mail/vacationnotice/settings/filter'], function (filter) {

    'use strict';

    var resultWithFlag = {
            timestamp: 1378223251586,
            'data': [{
                'position': 1,
                'id': 1,
                'flags': ['vacation'],
                'test': { 'id': 'true' },
                'actioncmds': [{
                    'id': 'vacation',
                    'text': 'text',
                    'days': '7',
                    'subject': 'subject',
                    'addresses': ['tester@open-xchange.com']
                }],
                'rulename': 'Abwesenheitsnotiz',
                'active': true
            }]
        },

        resultWithFlagTwoMails = {
            timestamp: 1378223251586,
            'data': [{
                'position': 1,
                'id': 1,
                'flags': ['vacation'],
                'test': { 'id': 'true' },
                'actioncmds': [{
                    'id': 'vacation',
                    'text': 'text',
                    'days': '7',
                    'subject': 'subject',
                    'addresses': ['tester@open-xchange.com', 'tester2@open-xchange.com']
                }],
                'rulename': 'Abwesenheitsnotiz',
                'active': true
            }]
        },
        expextedModel = {
            id: 1,
            text: 'text',
            days: '7',
            subject: 'subject',
            addresses: ['tester@open-xchange.com', 'tester2@open-xchange.com'],
            internal_id: 'vacation',
            activateTimeFrame: false,
            primaryMail: 'tester@open-xchange.com',
            'tester@open-xchange.com': true,
            'tester2@open-xchange.com': true
        },

        createDaysObject = function (from, to) {
            var objectOfValues = {};
            for (var i = from; i <= to; i += 1) {
                objectOfValues[i] = i;
            }
            return objectOfValues;
        },

        multiValues = {
            aliases: _.object(['tester@open-xchange.com', 'tester2@open-xchange.com'], ['tester@open-xchange.com', 'tester2@open-xchange.com']),
            days: createDaysObject(1, 31)
        },

        node;

    describe('Mailfilter Vacationnotice with one active mail', function () {

        beforeEach(function () {
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                var data = (xhr.url.indexOf('flag=vacation') >= 0) ? resultWithFlag : { data: [{}] };
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(data));
            });
            $('body', document).append(node = $('<div id="vacationnoticetestNode">'));
        });

        afterEach(function () {
            node.remove();
        });

        it('should draw the form', function (done) {
            filter.editVacationtNotice(node, multiValues, 'tester@open-xchange.com').then(function () {
                expect(node.find('input[name="subject"]')).to.have.length(1);
                expect(node.find('textarea[name="text"]')).to.have.length(1);
                expect(node.find('select')).to.have.length(1);
                expect(node.find('option')).to.have.length(31);
                expect(node.find('input[type="checkbox"]')).to.have.length(2);
                done();
            });
        });

        it('should check only one alias', function (done) {
            filter.editVacationtNotice(node, multiValues, 'tester@open-xchange.com').then(function () {
                expect(node.find('input[type="checkbox"]:checked')).to.have.length(1);
                done();
            });
        });

    });

    describe('Mailfilter Vacationnotice with two active mails', function () {

        beforeEach(function () {
            this.server.respondWith('GET', /api\/mailfilter\?action=list/, function (xhr) {
                var data = (xhr.url.indexOf('flag=vacation') >= 0) ? resultWithFlagTwoMails : { data: [{}] };
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(data));
            });
            $('body', document).append(node = $('<div id="vacationnoticetestNode">'));

        });

        afterEach(function () {
            node.remove();
        });

        it('should check two aliases', function (done) {
            filter.editVacationtNotice(node, multiValues, 'tester@open-xchange.com').then(function () {
                expect(node.find('input[type="checkbox"]:checked')).to.have.length(2);
                done();
            });
        });

        it('should create the filtermodel', function (done) {
            filter.editVacationtNotice(node, multiValues, 'tester@open-xchange.com').done(function (model) {
                expect(model.get('id')).to.equal(expextedModel.id);
                expect(model.get('text')).to.equal(expextedModel.text);
                expect(model.get('subject')).to.equal(expextedModel.subject);
                expect(model.get('addresses')).to.deep.equal(expextedModel.addresses);
                expect(model.get('internal_id')).to.equal(expextedModel.internal_id);
                expect(model.get('activateTimeFrame')).to.equal(expextedModel.activateTimeFrame);
                expect(model.get('primaryMail')).to.equal(expextedModel.primaryMail);
                expect(model.get('tester@open-xchange.com')).to.equal(expextedModel['tester@open-xchange.com']);
                expect(model.get('tester2@open-xchange.com')).to.equal(expextedModel['tester2@open-xchange.com']);
                done();
            });
        });

    });

});
