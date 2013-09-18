/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(['shared/examples/for/api',
       'io.ox/tasks/api'
], function (sharedExamplesFor, api) {

    describe('tasks API', function () {
        var options = {
            markedPending: {},
            testData: {
                "status": 1,
                "priority": 2,
                "percent_completed": 0,
                "folder_id": 29,
                "recurrence_type": 0,
                "private_flag": false,
                "notification": true,
                "title": "Test Title"
            },
            testDataUpdate: {
                "id": 45,
                "folder_id": 29,
                "title": "Neuer Test Title"
            },
            tempTestData: {
                "tempAttachmentIndicator": true,
                "alarm": null,
                "folder_id": 29,
                "notification": true,
                "title": "Temp Test Title"
            }
        }
        sharedExamplesFor(api, options);

        describe('creating a task', function () {
            beforeEach(function () {
                this.server = ox.fakeServer;
                this.server.autoRespond = false;
                this.server.respondWith('PUT', /api\/tasks\?action=new/, function (xhr) {
                    xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"}, '{"timestamp":1368791630910,"data":{"id":45}}');
                });
            });
            afterEach(function () {
                this.server.autoRespond = true;
            });
            it('should add a new task', function () {
                var result = api.create(options.testData);
                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');
                this.server.respond();
                expect(result).toResolve();
            });
            it('should trigger a create event', function () {
                expect(api).toTrigger('create');
                var result = api.create(options.testData);
                this.server.respond();
                expect(result).toResolve();
            });
            it('should remove temporary attributes', function () {
                //make copy of testData
                var testCopy = _.copy(options.tempTestData, true),
                    result = api.create(testCopy);
                expect(testCopy).not.hasKey("tempAttachmentIndicator");
            });
            it('should remove alarm if it\'s null', function () {
                //make copy of testData
                var testCopy = _.copy(options.tempTestData, true),
                    result = api.create(testCopy);
                expect(testCopy).not.hasKey("alarm");
            });
            it('should be added to \"Attachment upload in progress\" list if attachments are present', function () {
              //make copy of testData
                var testCopy = _.copy(options.tempTestData, true),
                    result = api.create(testCopy);
                this.server.respond();
                expect(result).toResolve();
                result.done(function () {
                    expect(api.uploadInProgress(testCopy.folder_id + ':45')).toBeTruthy();
                })
            });
        });
        describe('updating a task', function () {
            beforeEach(function () {
                this.server = ox.fakeServer;
                this.server.autoRespond = false;
                this.server.respondWith('PUT', /api\/tasks\?action=update/, function (xhr) {
                    xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"}, '{"timestamp":1368791630910,"data":{}}');
                });
            });
            afterEach(function () {
                this.server.autoRespond = true;
            });
            it('should update a task', function () {
                var result = api.update(options.testDataUpdate);
                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');
                this.server.respond();
                expect(result).toResolve();
            });
            it('should trigger an update event', function () {
                expect(api).toTrigger('update:29:45');
                var result = api.update(options.testDataUpdate);
                this.server.respond();
                expect(result).toResolve();
            });
        });
    });
});
