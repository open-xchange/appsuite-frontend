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

define(['io.ox/mail/autoforward/settings/filter'], function (filter) {

    'use strict';

    var resultWithFlag = {
            timestamp: 1378223251586,
            'data': [
                {
                    'position': 1,
                    'id': 1,
                    'flags': ['autoforward'],
                    'test': {
                        'id': 'true'
                    },
                    'actioncmds': [{
                        'to': 'tester@open-xchange.com',
                        'id': 'redirect'
                    }, {
                        'id': 'keep'
                    }],
                    'rulename': 'autoforward',
                    'active': false
                }
            ]
        },
        multiValues = {},
        model;

    describe('Mailfilter Autoforward', function () {

        beforeEach(function (done) {
            this.server.respondWith('GET', /api\/mailfilter\?action=list&flag=autoforward/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(resultWithFlag));
            });
            this.server.respondWith('GET', /api\/mailfilter\?action=list&flag=vacation/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify([]));
            });
            $('body', document).append(this.node = $('<div id="autoforwardtestNode">'));

            filter.editAutoForward(this.node, multiValues, 'tester@open-xchange.com').done(function (filtermodel) {
                model = filtermodel;
                done();
            });
        });

        afterEach(function () {
            $('#autoforwardtestNode', document).remove();
        });

        it('should draw the form', function () {
            expect(this.node.find('input[name="forwardmail"]')).to.have.length(1);
            expect(this.node.find('input[name="forwardmail"]').val()).to.equal('tester@open-xchange.com');
            expect(this.node.find('input[name="keep"]')).to.have.length(1);
            expect(this.node.find('input[name="keep"]').prop('checked')).to.be.true;
            expect(this.node.find('input[name="active"]')).to.have.length(1);
            expect(this.node.find('input[name="active"]').prop('checked')).to.be.false;
        });

        it('should create the filtermodel', function () {
            expect(model.get('active')).to.be.false;
            expect(model.get('keep')).to.be.true;
            expect(model.get('forwardmail')).to.equal('tester@open-xchange.com');
            expect(model.get('position')).to.equal(0);
        });

        it('should set a new forwardmail', function () {
            this.node.find('input[name="forwardmail"]').val('tester1@open-xchange.com').change();
            model.get('forwardmail').should.be.equal('tester1@open-xchange.com');
        });

        it('should set the rule to active', function () {
            this.node.find('input[type="checkbox"]').click();
            model.get('active').should.be.equal(true);
        });

    });

});
