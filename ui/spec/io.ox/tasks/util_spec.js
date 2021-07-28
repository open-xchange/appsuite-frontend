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

define(['io.ox/tasks/util', 'gettext!io.ox/tasks', 'io.ox/core/moment', 'settings!io.ox/core'
], function (util, gt, moment, coreSettings) {
    describe('Tasks Utilities', function () {
        var options = {
            testData: {
                status: 2,
                title: undefined,
                start_time: 0,
                end_time: 1484031600000,
                alarm: 1484024400000
            },
            testDataFulltime: {
                status: 2,
                title: 'Fulltime Task',
                start_time: 1484006400000,
                end_time: 1484092800000,
                alarm: 1484024400000,
                full_time: true
            },
            testDataArray: [
                {
                    status: 3,
                    title: 'Top Test'
                }, {
                    end_time: 1895104800000,
                    status: 1,
                    title: 'Blabla'
                },
                {
                    end_time: 1895104800000,
                    status: 1,
                    title: 'Abc'
                }, {
                    end_time: 1384999200000,
                    status: 1,
                    title: 'Test Title'
                }
            ]
        };
        describe('interpreting a task', function () {

            it('should work on a copy', function () {
                util.interpretTask(options.testData);
                expect(options.testData).not.to.contain.key('badge');
            });

            it('should add badge', function () {
                var result = util.interpretTask(options.testData);
                expect(result).to.contain.key('badge');
            });

            it('should change status to a string', function () {
                var result = util.interpretTask(options.testData);
                expect(result.status).to.be.a('String');
            });

            it('should add \u2014 if title is empty', function () {
                var result = util.interpretTask(options.testData);
                expect(result.title).to.equal('\u2014');
            });

            it('should handle 1.1.1970 correctly', function () {
                var result = util.interpretTask(options.testData);
                expect(result.title).to.equal('\u2014');
            });

            it('should format times correctly', function () {
                var result = util.interpretTask(options.testData), oldTimezone = coreSettings.get('timezone');
                expect(result.end_time).to.equal(moment.tz(1484031600000, coreSettings.get('timezone')).format('l, LT'));
                // timestamp 0
                expect(result.start_time).to.equal(moment.tz(0, coreSettings.get('timezone')).format('l, LT'));
                expect(result.alarm).to.equal(moment.tz(1484024400000, coreSettings.get('timezone')).format('l, LT'));

                // set to timezone with negative offset. This way we can see if start and end time are treated timezone independent in fulltime mode (negative offset changes date if it is applied)
                // see Bug 50918
                coreSettings.set('timezone', 'Etc/GMT-8');
                result = util.interpretTask(options.testDataFulltime);

                expect(result.end_time).to.equal(moment.utc(1484092800000).format('l'));
                expect(result.start_time).to.equal(moment.utc(1484006400000).format('l'));
                expect(result.alarm).to.equal(moment.tz(1484024400000, coreSettings.get('timezone')).format('l, LT'));

                coreSettings.set('timezone', oldTimezone);
            });
        });

        describe('buildOptionArray', function () {
            it('should return an array', function () {
                var result = util.buildOptionArray();
                expect(result).to.be.an('Array');
            });

            it('should only contain full days if parameter is set', function () {
                var result = _.object(util.buildOptionArray({ daysOnly: true }));
                expect(result[5]).not.to.exist;
                result = _.object(util.buildOptionArray());
                expect(result[5]).to.equal(gt('in 5 minutes'));
            });
        });

        describe('buildDropdownMenu', function () {

            it('should return an array', function () {
                var result = util.buildDropdownMenu();
                expect(result).to.be.an('Array');
            });

            it('should return correct nodeTypes', function () {
                var result = util.buildDropdownMenu();
                expect(result[0].is('option')).be.true;
                result = util.buildDropdownMenu({ bootstrapDropdown: true });
                expect(result[0].is('li')).to.be.true;
            });
        });

        describe('computePopupTime', function () {

            it('should only return full days', function () {
                var result = moment.utc(util.computePopupTime('t').endDate);

                expect(result.hours()).to.equal(0);
                expect(result.minutes()).to.equal(0);
                expect(result.seconds()).to.equal(0);
                expect(result.milliseconds()).to.equal(0);
            });
        });

        describe('sortTasks', function () {

            it('should work on a copy', function () {
                util.sortTasks(options.testDataArray);
                expect(options.testDataArray[0]).to.deep.equal({ 'status': 3, 'title': 'Top Test' });
            });

            it('should sort overdue tasks to first position', function () {
                var result = util.sortTasks(options.testDataArray);
                expect(result[0]).to.deep.equal({ 'status': 1, 'title': 'Test Title', 'end_time': 1384999200000 });
            });

            it('should sort done tasks to last position', function () {
                var result = util.sortTasks(options.testDataArray);
                expect(result[3]).to.deep.equal({ 'status': 3, 'title': 'Top Test' });
            });

            it('should sort same dates alphabetically', function () {
                var result = util.sortTasks(options.testDataArray);
                expect(result[1]).to.deep.equal({ 'end_time': 1895104800000, 'status': 1, 'title': 'Abc' });
                expect(result[2]).to.deep.equal({ 'end_time': 1895104800000, 'status': 1, 'title': 'Blabla' });
            });
        });
    });
});
