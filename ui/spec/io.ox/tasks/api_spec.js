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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
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
            });
            it('should add a new task', function (done) {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataCreate, true),
                    result = api.create(testCopy);
                //expect(result).toBeDeferred();
                expect(result.state()).to.equal('pending');
                this.server.respond();
                result.done(function () {
                    done();
                });
            });
            it('should trigger a create event', function () {
                var spy = sinon.spy();

                api.on('create', spy);
                //make copy of testDatatoHaveKey
                var testCopy = _.copy(apiTestData.testDataCreate, true),
                    result = api.create(testCopy);
                this.server.respond();
                return result.then(function () {
                    api.off('create', spy);
                    expect(spy.called).to.be.true;
                });
            });
            it('should remove temporary attributes', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestData, true),
                    result = api.create(testCopy);
                expect(testCopy).not.to.contain.key('tempAttachmentIndicator');
            });
            it('should remove alarm if it\'s null', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestData, true),
                    result = api.create(testCopy);
                expect(testCopy).not.to.contain.key('alarm');
            });
            it('should be added to \"Attachment upload in progress\" list if attachments are present', function (done) {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestData, true),
                    result;

                testCopy.testDescr = this.description;
                result = api.create(testCopy);
                this.server.respond();
                result.done(function () {
                    expect(api.uploadInProgress(testCopy.folder_id + ':122')).to.exist;
                    done();
                });
            });
            it('should add date_completed if status = 3', function (done) {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataCreate, true),
                    result = api.create(testCopy);

                this.server.respond();
                result.done(function () {
                    expect(testCopy).to.contain.key('date_completed');
                    done();
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
                this.server.autoRespond = false;
            });
            it('should update a task', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataUpdate, true),
                    result = api.update(testCopy),
                    spy = sinon.spy();

                api.on('update', spy);
                expect(result.state()).to.equal('pending');
                this.server.respond();//respond to update call
                this.server.respond();//respond to get after update call
                return result.done(function () {
                    api.off('update', spy);
                    expect(spy.called, '"update" event triggered').to.be.true;
                });
            });
            it('should trigger an update event', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataUpdate, true);
                var result = api.update(testCopy);
                var spy = sinon.spy();
                api.on('update:555123456:122', spy);
                this.server.respond();//respond to update call
                this.server.respond();//respond to get after update call
                return result.done(function () {
                    api.off('update:555123456:122', spy);
                    expect(spy.called, '"update:555123456:122" event triggered').to.be.true;
                });
            });
            it('should remove temporary attributes', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestDataUpdate, true),
                    result = api.update(testCopy);
                expect(testCopy).not.to.contain.key('tempAttachmentIndicator');
            });
            it('should be added to \"Attachment upload in progress\" list if attachments are present', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestDataUpdate, true),
                    result;

                testCopy.testDescr = this.test.title;
                result = api.update(testCopy);

                this.server.respond();
                this.server.respond();
                return result.then(function () {
                    expect(api.uploadInProgress(testCopy.folder_id + ':122')).to.exist;
                });
            });
            it('should add date_completed if status = 3', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataUpdate, true),
                    result = api.update(testCopy);
                expect(testCopy).to.contain.key('date_completed');
            });
            it('should set date_completed to null if status != 3', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestDataUpdate, true),
                    result = api.update(testCopy);
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
                this.server.respond();
                return result;
            });
            it('should trigger mark:task:confirmed event', function () {
                var spy = sinon.spy();
                api.on('mark:task:confirmed', spy);
                var result = api.confirm(apiTestData.testDataConfirm);
                this.server.respond();
                return result.done(function () {
                    expect(spy.called, '"mark:task:confirmed" event triggered').to.be.true;
                });
            });
        });
        describe.skip('getting Task Notifications', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/tasks\?action=all/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"timestamp":1368791630910,"data": []}');
                });
            });
            it('should trigger new-tasks event', function () {
                var spy = sinon.spy();
                api.on('new-tasks', spy);
                var result = api.getTasks();
                this.server.respond();
                return result.done(function () {
                    api.off('new-tasks', spy);
                    expect(spy.called, '"new-tasks" event triggered').to.be.true;
                });
            });
            it('should trigger set:tasks:to-be-confirmed event', function () {
                var spy = sinon.spy();
                api.on('set:tasks:to-be-confirmed', spy);
                var result = api.getTasks();
                this.server.respond();
                return result.done(function () {
                    api.off('set:tasks:to-be-confirmed', spy);
                    expect(spy.called, '"set:tasks:to-be-confirmed').to.be.true;
                });
            });
        });
    });
});
