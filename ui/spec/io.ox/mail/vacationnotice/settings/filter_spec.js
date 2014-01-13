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
            'test': {'id': 'true'},
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
            'test': {'id': 'true'},
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
    model,
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
    };

    describe('Vacationnotice with one active mail', function () {

        beforeEach(function () {
            this.server.autoRespond = false;
            this.server.respondWith('GET', /api\/mailfilter\?action=list&flag=vacation/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(resultWithFlag));
            });
            $('body', document).append(this.node = $('<div id="vacationnoticetestNode">'));

        });

        afterEach(function () {
            $('#vacationnoticetestNode', document).remove();
        });

        it('should draw the form', function () {

            filter.editVacationtNotice(this.node, multiValues, 'tester@open-xchange.com');
            this.server.respond();
            expect(this.node.find('input[name="subject"]').length).toBe(1);
            expect(this.node.find('textarea[name="text"]').length).toBe(1);
            expect(this.node.find('select').length).toBe(1);
            expect(this.node.find('option').length).toBe(31);
            expect(this.node.find('input[type="checkbox"]').length).toBe(2);

        });

        it('should check only one alias', function () {

            filter.editVacationtNotice(this.node, multiValues, 'tester@open-xchange.com');
            this.server.respond();
            expect(this.node.find('input[type="checkbox"]:checked').length).toBe(1);

        });

    });

    describe('Vacationnotice with two active mails', function () {

        beforeEach(function () {
            this.server.autoRespond = false;
            this.server.respondWith('GET', /api\/mailfilter\?action=list&flag=vacation/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(resultWithFlagTwoMails));
            });
            $('body', document).append(this.node = $('<div id="vacationnoticetestNode">'));

        });

        afterEach(function () {
            $('#vacationnoticetestNode', document).remove();
        });

        it('should check two aliases', function () {

            filter.editVacationtNotice(this.node, multiValues, 'tester@open-xchange.com');
            this.server.respond();
            expect(this.node.find('input[type="checkbox"]:checked').length).toBe(2);

        });

        it('should create the filtermodel', function () {
            filter.editVacationtNotice(this.node, multiValues, 'tester@open-xchange.com').done(function (filtermodel) {
                model = filtermodel;
            });
            this.server.respond();

            model.get('id').should.be.equal(expextedModel['id']);
            model.get('text').should.be.equal(expextedModel['text']);
            model.get('subject').should.be.equal(expextedModel['subject']);
            model.get('addresses').should.be.deep.equal(expextedModel['addresses']);
            model.get('internal_id').should.be.equal(expextedModel['internal_id']);
            model.get('activateTimeFrame').should.be.equal(expextedModel['activateTimeFrame']);
            model.get('primaryMail').should.be.equal(expextedModel['primaryMail']);
            model.get('tester@open-xchange.com').should.be.equal(expextedModel['tester@open-xchange.com']);
            model.get('tester2@open-xchange.com').should.be.equal(expextedModel['tester2@open-xchange.com']);
        })

    });

});
