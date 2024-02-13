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

define('shared/examples/for/api', [], function () {
    return function (api, options) {
        options = _.extend({
            markedPending: {},
            testData: {},
            args: {}
        }, options);

        afterEach(function () {
            //FIXME: handle marked as pending
        });

        describe.skip('a basic API class', function () {
            describe('has some get methods', function () {
                it('should define a getAll method', function () {
                    expect(api.getAll).to.be.a('function');
                });

                it('should return a deferred object for getAll', function () {
                    expect(api.getAll(options.args.getAll || {})).to.exist;//FIXME: check for deferred
                });

                it('should define a getList method', function () {
                    expect(api.getList).to.be.a('function');
                });

                it('should return a deferred object for getList', function () {
                    expect(api.getList({})).to.exist;//FIXME: check for deferred
                });

                it('should define a get method', function () {
                    expect(api.get).to.be.a('function');
                });

                it('should return a deferred object for get', function () {
                    var result = api.get({});
                    expect(result).to.exist;//FIXME: check for deferred
                });

            });

            describe('implements an event system', function () {
                it('should define a trigger method', function () {
                    expect(api.trigger).to.be.a('function');
                });

                it('should define an on method', function () {
                    expect(api.on).to.be.a('function');
                });
                describe.skip('with default events', function () {
                    beforeEach(function () {
                        this.server.autoRespond = false;
                        this.server.respondWith('PUT', /.*action=new&/, function (xhr) {
                            xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"data": 1337}');
                        });
                    });

                    it('should trigger refresh:all after create', function () {
                        var data = options.testData.create || {};

                        expect(api).toTrigger('refresh:all');
                        api.create(data);
                        this.server.respond();
                    });

                    it('should trigger refresh:list after create', function () {
                        var data = options.testData.create || {};

                        expect(api).toTrigger('refresh:list');

                        api.create(data);
                        this.server.respond();
                    });
                });
            });
        });
    };
});
