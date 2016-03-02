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
