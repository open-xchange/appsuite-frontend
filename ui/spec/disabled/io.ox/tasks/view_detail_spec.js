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
    'io.ox/tasks/view-detail',
    'io.ox/core/extensions',
    'fixture!io.ox/tasks/defaultTestData.json',
    'waitsFor'
], function (detailView, ext, testData, waitsFor) {
    'use strict';

    describe('Tasks DetailView', function () {
        var multipleData = {
            folders: {
                get: {
                    id: '555123456',
                    title: 'some title'
                }
            }
        };
        describe('content', function () {
            var node;
            beforeEach(function () {
                this.server.responses = this.server.responses.filter(function (r) {
                    return !(r.method === 'PUT' && String(r.url) === '/api\\/multiple\\?/');
                });
                this.server.respondWith('PUT', /api\/multiple\?/, function (xhr) {
                    var actions = JSON.parse(xhr.requestBody),
                        result = new Array(actions.length);

                    actions.forEach(function (action, index) {
                        result[index] = {
                            data: multipleData[action.module][action.action]
                        };
                    });
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(result));
                });
                this.server.respondWith('GET', /api\/attachment\?action=all/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data": ' + JSON.stringify(testData.testAttachments) + '}');
                });
                this.server.respondWith('PUT', /api\/user\?action=list/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data": ' + JSON.stringify(testData.testUserList) + '}');
                });
            });
            //clean up the dom
            afterEach(function () {
                node.remove();
            });

            it('should draw the whole content', function () {
                var baton = ext.Baton({ data: testData.testData });
                node = detailView.draw(baton);
                expect(node.find('.title')).to.have.length(1);
                expect(node.find('.priority')).to.have.length(1);
                expect(node.find('.end-date')).to.have.length(1);
                expect(node.find('.alarm-date')).to.have.length(1);
                expect(node.find('.task-progress')).to.have.length(1);
                expect(node.find('.state')).to.have.length(1);
                expect(node.find('.note')).to.have.length(1);
                // recurrence/datecompleted, start_date, target_duration, actual_duration, target_costs, actual_costs, trip_meter, billing_information, companies
                expect(node.find('.task-details').children()).to.have.length(16);
            });

            it('should draw every participant', function (done) { // find out why this fails in phantom, chrome is fine

                var baton = ext.Baton({ data: testData.testData });
                node = detailView.draw(baton);

                waitsFor(function () {
                    return node.find('.participant').length === 2;
                }).then(function () {
                    expect(node.find('.participant').length).to.equal(2); // one external and one internal participant
                    done();
                });
            });

            it('should draw every attachment', function (done) {
                var baton = ext.Baton({ data: testData.testData });
                node = detailView.draw(baton);
                waitsFor(function () {
                    return node.find('.attachments-container').children().length === 4;
                }).then(function () {
                    expect(node.find('.attachments-container').children().length).to.equal(4); // one label, two attachments, one all dropdown
                    done();
                });
            });
        });
    });
});
