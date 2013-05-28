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
            }
        }
        sharedExamplesFor(api, options);

        describe('creating a task', function () {
            beforeEach(function () {
                this.server = sinon.fakeServer.create();
                this.server.respondWith('PUT', /api\/tasks\?action=new/, function (xhr) {
                    xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"}, '{"timestamp":1368791630910,"data":{"id":45}}');
                });
            });
            afterEach(function () {
                this.server.restore();
            });
            it('should add a new task', function () {
                var result = api.create(options.testData);
                expect(result).toBeDeferred();
                expect(result.state()).toBe('pending');
                this.server.respond();
                expect(result.state()).toBe('resolved');
            });
            it('should trigger a create event', function () {
                expect(api).toTrigger('create');
                var result = api.create(options.testData);
                this.server.respond();
            });
        });
    });
});
