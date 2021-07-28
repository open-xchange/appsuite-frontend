/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define([
    'plugins/portal/birthdays/register',
    'io.ox/core/extensions',
    'io.ox/core/moment',
    'waitsFor',
    'fixture!plugins/portal/birthdays/birthdaysTestData.json'
], function (birthdayPlugin, ext, moment, waitsFor, testData) {
    'use strict';

    describe('Portal Birthday plugin', function () {

        function invokeDraw() {
            //FIXME: uuuuugly API
            var def = ext.point('io.ox/portal/widget/birthdays').invoke('load', this.node, this.baton)._wrapped[0];
            return def.then(function () {
                return ext.point('io.ox/portal/widget/birthdays').invoke('preview', this.node, this.baton).value();
            }.bind(this));
        }

        beforeEach(function () {
            //update testdata
            testData[0].birthday = new moment.utc(1483574400000).subtract(1, 'day').valueOf();   //yesterday
            testData[1].birthday = new moment.utc(1483574400000).valueOf();                      //today
            testData[2].birthday = new moment.utc(1483574400000).add(1, 'day').valueOf();        //tomorrow
            this.node = $('<div>');
            this.baton = ext.Baton();
        });

        afterEach(function () {
            this.node.remove();
        });

        describe('with a list of birthdays', function () {
            var clock;
            beforeEach(function () {
                clock = sinon.useFakeTimers({ now: 1483574400000, toFake: ['Date'] });
                this.server.respondWith('GET', /api\/contacts\?action=birthdays/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                        '{ "timestamp":1368791630910,"data": ' + JSON.stringify(testData) + '}');
                });
                return invokeDraw.call(this);
            });
            afterEach(function () {
                clock.restore();
            });

            it('should draw content', function () {
                expect(this.node.children()).to.have.length(1);
            });
            it('should draw all birthdays', function () {
                expect(this.node.find('li')).to.have.length(5);
            });
            it('should not draw year if its year 1', function () {
                expect($(this.node.find('.accent')[4]).text()).to.equal('12.6.');
            });
            it('should recognize yesterday/today/tomorrow', function () {
                expect($(this.node.find('.accent')[0]).text()).to.equal('Gestern');
                expect($(this.node.find('.accent')[1]).text()).to.equal('Heute');
                expect($(this.node.find('.accent')[2]).text()).to.equal('Morgen');
            });

            it.skip('should should have a sidepopup drawn', function () {
                ext.point('io.ox/portal/widget/birthdays').invoke('draw', this.node, this.baton);
                return waitsFor(function () {
                    return this.node.find('.io-ox-portal-birthdays').length === 1;
                }.bind(this));
            });
        });
        describe('with empty list of birtdays', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/contacts\?action=birthdays/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                        '{ "timestamp":1368791630910,"data": []}');
                });
                return invokeDraw.call(this);
            });

            it('should draw correct empty message', function () {
                expect(this.node.children()).to.have.length(1);
                expect(this.node.children().first().is('ul')).to.be.true;
                expect(this.node.children().children().first().is('li')).to.be.true;
                expect(this.node.find('li').children()).to.have.length(0);
                expect(this.node.find('li').first().text()).to.equal('Keine Geburtstage in den nächsten 12 Wochen');
            });
        });
    });
});
