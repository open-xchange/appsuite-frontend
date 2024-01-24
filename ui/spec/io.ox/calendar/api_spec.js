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

define(['io.ox/calendar/api'], function (api) {

    'use strict';

    describe('Calendar API requests', function () {

        beforeEach(function () {
            this.server.respondWith('PUT', /api\/chronos\?action=all/, function (xhr) {
                xhr.respond(
                    200,
                    { 'Content-Type': 'text/javascript;charset=UTF-8' },
                    JSON.stringify({ timestamp: 1378223251586, data: [
                        {
                            folder: 'cal://0/123',
                            error: {
                                error: 'Too many appointments are queried. Please choose a shorter timeframe.',
                                error_params: [],
                                categories: 'USER_INPUT',
                                category: 1,
                                code: 'CAL-5072',
                                error_id: '328960372-2086285',
                                error_desc: 'Too many events are queried. Please choose a shorter timeframe.'
                            }
                        }]
                    })
                );
            });
        });

        it('should stop requests for too many appointments in a chosen timeframe', function () {
            var self = this;

            return api.request({
                module: 'chronos',
                params: {
                    action: 'all',
                    rangeEnd: '20191229T003000Z',
                    rangeStart: '20191228T230000Z',
                    fields: api.defaultFields,
                    order: 'asc',
                    sort: 'startDate',
                    expand: true
                },
                data: { folders: ['cal://0/123'] }
            }, 'PUT').then(function succes() {
            }, function fail() {
                expect(self.server.requests.length).to.equal(2);
            });
        });
    });

    describe('Calendar API', function () {

        var HOUR = 1000 * 60 * 60,
            DAY = HOUR * 24,
            WEEK = DAY * 7;

        function getDatetime(timestamp) {
            return {
                value: moment(timestamp).format('YYYYMMDD[T]HHmmss'),
                tzid: 'Europe/Berlin'
            };
        }

        beforeEach(function () {
            // mark all collections as expired
            api.pool.gc();
            // cleanup pool
            api.pool.gc();
        });

        it('should return a new collection with models from other collections in that range', function () {
            // fill pool with collections
            var c1, c2, m1, m2, m3;
            c1 = api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f2'], view: 'week' });
            c1.reset([
                m1 = { id: '1', cid: 'f1.1', folder: 'f1', startDate: getDatetime(HOUR), endDate: getDatetime(2 * HOUR) },
                m2 = { id: '2', cid: 'f2.2', folder: 'f2', startDate: getDatetime(2 * HOUR), endDate: getDatetime(3 * HOUR) }
            ], { silent: true });
            c2 = api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f3'], view: 'week' });
            c2.reset([
                m1,
                m3 = { id: '3', cid: 'f3.3', folder: 'f3', startDate: getDatetime(2 * HOUR), endDate: getDatetime(3 * HOUR) }
            ], { silent: true });

            c1.toJSON().should.deep.equal([m1, m2]);
            c2.toJSON().should.deep.equal([m1, m3]);

            var c3 = api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f3', 'f4'], view: 'week' });
            c3.toJSON().should.deep.equal([m1, m3]);
        });


        describe('pool', function () {
            it('should get collection by folder id', function () {
                api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f2', 'f3'], view: 'week' });
                api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f4'], view: 'week' });
                api.getCollection({ start: 0, end: WEEK, folders: ['f2', 'f3'], view: 'week' });

                var collections = api.pool.getByFolder('f1');
                collections.should.have.length(2);
                collections[0].cid.should.equal('start=0&end=604800000&folders=["f1","f2","f3"]&view=week');
                collections[1].cid.should.equal('start=0&end=604800000&folders=["f1","f4"]&view=week');
            });

            it('should get a list of collections by a model cid', function () {
                var c1, c2, m1;
                c1 = api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f2'], view: 'week' });
                c1.reset([
                    m1 = { id: '1', cid: 'f1.1', folder: 'f1', startDate: getDatetime(HOUR), endDate: getDatetime(2 * HOUR) },
                    { id: '2', cid: 'f2.2', folder: 'f2', startDate: getDatetime(2 * HOUR), endDate: getDatetime(3 * HOUR) }
                ], { silent: true });
                c2 = api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f3'], view: 'week' });
                c2.reset([
                    m1 = { id: '1', cid: 'f1.1', folder: 'f1', startDate: getDatetime(HOUR), endDate: getDatetime(2 * HOUR) },
                    { id: '3', cid: 'f2.3', folder: 'f2', startDate: getDatetime(2 * HOUR), endDate: getDatetime(3 * HOUR) }
                ], { silent: true });
                api.getCollection({ start: WEEK, end: 2 * WEEK, folders: ['f1', 'f2'], view: 'week' });

                var collections = api.pool.getCollectionsByCID(m1.cid);
                collections.should.have.length(2);
                collections[0].cid.should.equal('start=0&end=604800000&folders=["f1","f2"]&view=week');
                collections[1].cid.should.equal('start=0&end=604800000&folders=["f1","f3"]&view=week');
            });

            it('should return a list of collections containing a specific model', function () {
                var c1, c2, m1;
                c1 = api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f2'], view: 'week' });
                c1.reset([
                    m1 = { id: '1', cid: 'f1.1', folder: 'f1', startDate: getDatetime(HOUR), endDate: getDatetime(2 * HOUR) },
                    { id: '2', cid: 'f2.2', folder: 'f2', startDate: getDatetime(2 * HOUR), endDate: getDatetime(3 * HOUR) }
                ], { silent: true });
                c2 = api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f3'], view: 'week' });
                c2.reset([
                    m1 = { id: '1', cid: 'f1.1', folder: 'f1', startDate: getDatetime(HOUR), endDate: getDatetime(2 * HOUR) },
                    { id: '3', cid: 'f2.3', folder: 'f2', startDate: getDatetime(2 * HOUR), endDate: getDatetime(3 * HOUR) }
                ], { silent: true });
                api.getCollection({ start: WEEK, end: 2 * WEEK, folders: ['f1', 'f2'], view: 'week' });

                var collections = api.pool.getCollectionsByModel(m1);
                collections.should.have.length(2);
                collections[0].cid.should.equal('start=0&end=604800000&folders=["f1","f2"]&view=week');
                collections[1].cid.should.equal('start=0&end=604800000&folders=["f1","f3"]&view=week');
            });

            it('should propagate changes', function () {
                var c1 = api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f2'], view: 'week' }),
                    c2 = api.getCollection({ start: 0, end: 4 * WEEK, folders: ['f1', 'f2'], view: 'month' }),
                    c3 = api.getCollection({ start: WEEK, end: 2 * WEEK, folders: ['f1', 'f2'], view: 'week' }),
                    c4 = api.getCollection({ start: 0, end: WEEK, folders: ['f2'], view: 'week' }),
                    m1;

                c1.should.have.length(0);
                c2.should.have.length(0);
                c3.should.have.length(0);
                c4.should.have.length(0);

                api.pool.propagateAdd(m1 = { id: '1', cid: 'f1.1', folder: 'f1', startDate: getDatetime(HOUR), endDate: getDatetime(2 * HOUR) });

                c1.toJSON().should.deep.equal([m1]);
                c2.toJSON().should.deep.equal([m1]);
                c3.should.have.length(0);
                c4.should.have.length(0);

                api.pool.propagateUpdate(m1 = { id: '1', cid: 'f1.1', folder: 'f1', startDate: getDatetime(2 * HOUR), endDate: getDatetime(3 * HOUR) });

                c1.toJSON().should.deep.equal([m1]);
                c2.toJSON().should.deep.equal([m1]);
                c3.should.have.length(0);
                c4.should.have.length(0);
            });

            describe('should return a backbone model of the pool when receiving a json object', function () {

                it('without collections in pool from the detail collection', function () {
                    var d1, m1;
                    m1 = api.pool.getModel(d1 = { id: '1', cid: 'f1.1', folder: 'f1', startDate: getDatetime(HOUR), endDate: getDatetime(2 * HOUR) });

                    api.pool.getCollections().detail.collection.toJSON().should.deep.equal([d1]);
                    m1.toJSON().should.deep.equal(d1);
                });

                it('with collections in pool', function () {
                    var c1 = api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f2'], view: 'week' }),
                        d1, m1;
                    c1.reset([
                        d1 = { id: '1', cid: 'f1.1', folder: 'f1', startDate: getDatetime(HOUR), endDate: getDatetime(2 * HOUR) }
                    ], { silent: true });
                    m1 = api.pool.getModel(d1);

                    api.pool.getCollections().detail.collection.should.have.length(0);
                    m1.toJSON().should.deep.equal(d1);
                });

            });

            it('should find all recurring appointments of a series', function () {
                var c1 = api.getCollection({ start: 0, end: WEEK, folders: ['f1', 'f2'], view: 'week' }),
                    c2 = api.getCollection({ start: WEEK, end: 2 * WEEK, folders: ['f1', 'f2'], view: 'week' }),
                    c3 = api.getCollection({ start: 2 * WEEK, end: 3 * WEEK, folders: ['f1', 'f2'], view: 'week' }),
                    m1, m2, m3;

                c1.reset([
                    m1 = { id: '1', seriesId: '0', cid: 'f1.1', folder: 'f1', startDate: getDatetime(HOUR), endDate: getDatetime(2 * HOUR) }
                ], { silent: true });
                c2.reset([
                    m2 = { id: '2', seriesId: '0', cid: 'f1.2', folder: 'f1', startDate: getDatetime(WEEK + HOUR), endDate: getDatetime(WEEK + 2 * HOUR) }
                ], { silent: true });
                c3.reset([
                    m3 = { id: '3', seriesId: '0', cid: 'f1.3', folder: 'f1', startDate: getDatetime(2 * WEEK + HOUR), endDate: getDatetime(2 * WEEK + 2 * HOUR) }
                ], { silent: true });

                _(api.pool.findRecurrenceModels({ id: '0', folder: 'f1' })).invoke('toJSON').should.deep.equal([m1, m2, m3]);
            });
        });

    });

});
