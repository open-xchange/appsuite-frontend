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
define('shared/examples/for/api', [], function () {
    return function (api, options) {
        options = _.extend({
            markedPending: {},
            testData: {}
        }, options);

        afterEach(function () {
            this.server.restore();
            this.handleExpectedFail(options.markedPending);
        });

        beforeEach(function () {
            this.server = sinon.fakeServer.create();
        });

        describe('a basic API class', function () {
            describe('has some get methods', function () {
                it('should define a getAll method', function () {
                    expect(api.getAll).toBeDefined();
                });

                it('should return a deferred object for getAll', function () {
                    expect(api.getAll()).toBeDeferred();
                });

                it('should define a getList method', function () {
                    expect(api.getList).toBeDefined();
                });

                it('should return a deferred object for getList', function () {
                    expect(api.getList({})).toBeDeferred();
                });

                it('should define a get method', function () {
                    expect(api.get).toBeDefined();
                });

                it('should return a deferred object for get', function () {
                    var result = api.get({});
                    expect(result).toBeDeferred();
                });

            });

            describe('implements an event system', function () {
                it('should define a trigger method', function () {
                    expect(api.trigger).toBeDefined();
                });

                it('should define an on method', function () {
                    expect(api.on).toBeDefined();
                });
                xdescribe('with default events', function () {
                    beforeEach(function () {
                        this.server.respondWith("PUT", /.*action=new&/, function (xhr) {
                            xhr.respond(200, { "Content-Type": "text/javascript;charset=UTF-8"}, '{"data": 1337}');
                        });
                    });

                    it('should trigger refresh:all after create', function () {
                        var data = options.testData['create'] || {};

                        expect(api).toTrigger('refresh:all');
                        api.create(data);
                        this.server.respond();
                    });

                    it('should trigger refresh:list after create', function () {
                        var data = options.testData['create'] || {};

                        expect(api).toTrigger('refresh:list');

                        api.create(data);
                        this.server.respond();
                    });
                });
            });
        });
    };
});
