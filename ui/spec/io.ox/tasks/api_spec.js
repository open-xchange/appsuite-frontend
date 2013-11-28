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

    describe('tasks API', function () {
        sharedExamplesFor(api, apiTestData);

        beforeEach(function () {
            this.server = ox.fakeServer.create();
        });
        afterEach(function () {
            this.server.restore();
        });

        describe('creating a task', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/tasks\?action=new/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data":{"id":122}}');
                });
            });
            it('should add a new task', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataCreate, true),
                    result = api.create(testCopy);
                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');
                this.server.respond();
                expect(result).toResolve();
            });
            it('should trigger a create event', function () {
                expect(api).toTrigger('create');
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataCreate, true),
                    result = api.create(testCopy);
                this.server.respond();
                expect(result).toResolve();
            });
            it('should remove temporary attributes', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestData, true),
                    result = api.create(testCopy);
                expect(testCopy).not.toHaveKey('tempAttachmentIndicator');
            });
            it('should remove alarm if it\'s null', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestData, true),
                    result = api.create(testCopy);
                expect(testCopy).not.toHaveKey('alarm');
            });
            it('should be added to \"Attachment upload in progress\" list if attachments are present', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestData, true),
                    result;

                testCopy.testDescr = this.description;
                result = api.create(testCopy);
                this.server.respond();
                expect(result).toResolve();
                result.done(function () {
                    expect(api.uploadInProgress(testCopy.folder_id + ':122')).toBeTruthy();
                });
            });
            it('should add date_completed if status = 3', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataCreate, true),
                    result = api.create(testCopy);
                expect(testCopy).toHaveKey('date_completed');
            });
        });
        describe('updating a task', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/tasks\?action=update/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data":{}}');
                });
                this.server.autoRespond = false;
            });
            it('should update a task', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataUpdate, true),
                    result = api.update(testCopy);
                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');
                this.server.respond();
                expect(result).toResolve();
            });
            it('should trigger an update event', function () {
                expect(api).toTrigger('update:555123456:122');
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataUpdate, true);
                var result = api.update(testCopy);
                this.server.respond();
                expect(result).toResolve();
            });
            it('should remove temporary attributes', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestDataUpdate, true),
                    result = api.update(testCopy);
                expect(testCopy).not.toHaveKey('tempAttachmentIndicator');
            });
            it('should be added to \"Attachment upload in progress\" list if attachments are present', function () {
              //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestDataUpdate, true),
                    result;

                testCopy.testDescr = this.description;
                result = api.update(testCopy);
                this.server.respond();
                expect(result).toResolve();
                result.done(function () {
                    expect(api.uploadInProgress(testCopy.folder_id + ':122')).toBeTruthy();
                });
            });
            it('should add date_completed if status = 3', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.testDataUpdate, true),
                    result = api.update(testCopy);
                expect(testCopy).toHaveKey('date_completed');
            });
            it('should set date_completed to null if status != 3', function () {
                //make copy of testData
                var testCopy = _.copy(apiTestData.tempTestDataUpdate, true),
                    result = api.update(testCopy);
                expect(testCopy.date_completed).toBe(null);
            });
        });
        describe('confirming a task', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/tasks\?action=confirm/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data":{}}');
                });
            });
            it('should confirm a task', function () {
                var result = api.confirm(apiTestData.testDataConfirm);
                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');
                this.server.respond();
                expect(result).toResolve();
            });
            it('should trigger mark:task:confirmed event', function () {
                expect(api).toTrigger('mark:task:confirmed');
                var result = api.confirm(apiTestData.testDataConfirm);
                this.server.respond();
                expect(result).toResolve();
            });
        });
        describe('getting Task Notifications', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/tasks\?action=all/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, '{"timestamp":1368791630910,"data": []}');
                });
            });
            it('should trigger new-tasks event', function () {
                expect(api).toTrigger('new-tasks');
                var result = api.getTasks();
                this.server.respond();
                expect(result).toResolve();
            });
            it('should trigger set:tasks:to-be-confirmed event', function () {
                expect(api).toTrigger('set:tasks:to-be-confirmed');
                var result = api.getTasks();
                this.server.respond();
                expect(result).toResolve();
            });
        });
    });
});
