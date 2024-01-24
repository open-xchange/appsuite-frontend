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

define(['shared/examples/for/api',
    'io.ox/tasks/api',
    'fixture!io.ox/tasks/apiTestData.json'
], function (sharedExamplesFor, api, apiTestData) {
    'use strict';

    describe('Tasks API', function () {

        describe('creating a task', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/tasks\?action=new/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data":{"id":122}}');
                });
                this.server.respondWith('GET', /api\/tasks\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data":{"id":122}}');
                });
            });
            it('should add a new task', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataCreate, true),
                    result = api.create(testCopy);
                //expect(result).toBeDeferred();
                expect(result.state()).to.equal('pending');
                return result;
            });
            it('should trigger a create event', function () {
                var spy = sinon.spy();

                api.on('create', spy);
                //make copy of testDatatoHaveKey
                var testCopy = _.copy(apiTestData.testDataCreate, true);
                return api.create(testCopy).then(function () {
                    api.off('create', spy);
                    expect(spy.called).to.be.true;
                });
            });
            it('should remove temporary attributes', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestData, true);
                api.create(testCopy);
                expect(testCopy).not.to.contain.key('tempAttachmentIndicator');
            });
            it('should remove alarm if it\'s null', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestData, true);
                api.create(testCopy);
                expect(testCopy).not.to.contain.key('alarm');
            });
            it('should be added to "Attachment upload in progress" list if attachments are present', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestData, true);
                testCopy.testDescr = this.description;

                return api.create(testCopy).then(function () {
                    expect(api.uploadInProgress(testCopy.folder_id + ':122')).to.exist;
                });
            });
            it('should add date_completed if status = 3', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataCreate, true);

                return api.create(testCopy).then(function () {
                    expect(testCopy).to.contain.key('date_completed');
                });
            });
        });
        describe('updating a task', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/tasks\?action=update/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data":{}}');
                });
                this.server.respondWith('GET', /api\/tasks\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data": ' + JSON.stringify(apiTestData.testDataUpdate) + '}');
                });
            });
            it('should update a task', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataUpdate, true),
                    result = api.update(testCopy),
                    spy = sinon.spy();
                api.on('update', spy);
                expect(result.state()).to.equal('pending');
                return result.then(function () {
                    api.off('update', spy);
                    expect(spy.called, '"update" event triggered').to.be.true;
                });
            });
            it('should trigger an update event', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataUpdate, true);
                var spy = sinon.spy();
                api.on('update:555123456:122', spy);
                return api.update(testCopy).then(function () {
                    api.off('update:555123456:122', spy);
                    expect(spy.called, '"update:555123456:122" event triggered').to.be.true;
                });
            });
            it('should remove temporary attributes', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestDataUpdate, true);
                api.update(testCopy);
                expect(testCopy).not.to.contain.key('tempAttachmentIndicator');
            });
            it('should be added to "Attachment upload in progress" list if attachments are present', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestDataUpdate, true);

                testCopy.testDescr = this.test.title;

                return api.update(testCopy).then(function () {
                    expect(api.uploadInProgress(testCopy.folder_id + ':122')).to.exist;
                });
            });
            it('should add date_completed if status = 3', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataUpdate, true);
                api.update(testCopy);
                expect(testCopy).to.contain.key('date_completed');
            });
            it('should set date_completed to null if status != 3', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestDataUpdate, true);
                api.update(testCopy);
                expect(testCopy.date_completed).to.be.null;
            });
        });
        describe('confirming a task', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/tasks\?action=confirm/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data":{}}');
                });
            });
            it('should confirm a task', function () {
                var result = api.confirm(apiTestData.testDataConfirm);
                expect(result.state()).to.equal('pending');
                return result;
            });
            it('should trigger mark:task:confirmed event', function () {
                var spy = sinon.spy();
                api.on('mark:task:confirmed', spy);
                return api.confirm(apiTestData.testDataConfirm).done(function () {
                    expect(spy.called, '"mark:task:confirmed" event triggered').to.be.true;
                });
            });
        });
        describe('getting Task Notifications', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/tasks\?action=all/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data": []}');
                });
            });
            it('should trigger new-tasks event', function () {
                var spy = sinon.spy(),
                    stub = sinon.stub(api, 'getDefaultFolder');

                stub.returns('1337');
                api.on('new-tasks', spy);
                return api.getTasks().done(function () {
                    api.off('new-tasks', spy);
                    expect(spy.called, '"new-tasks" event triggered').to.be.true;
                    stub.restore();
                });
            });
            it('should trigger set:tasks:to-be-confirmed event', function () {
                var spy = sinon.spy(),
                    stub = sinon.stub(api, 'getDefaultFolder');

                stub.returns('1337');
                api.on('new-tasks', spy);
                api.on('set:tasks:to-be-confirmed', spy);
                return api.getTasks().done(function () {
                    api.off('set:tasks:to-be-confirmed', spy);
                    expect(spy.called, '"set:tasks:to-be-confirmed').to.be.true;
                    stub.restore();
                });
            });
        });
    });
});
