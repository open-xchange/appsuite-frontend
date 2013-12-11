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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define(['io.ox/tasks/util', 'gettext!io.ox/tasks', 'io.ox/core/date'
], function (util, gt, date) {
    describe('tasks utility', function () {
        var options = {
                testData: {
                    'status': 2,
                    'title': undefined
                },
                testDataArray: [
                    {
                        'status': 3,
                        'title': 'Top Test'
                    }, {
                        'end_date': 1895104800000,
                        'status': 1,
                        'title': 'Blabla'
                    },
                    {
                        'end_date': 1895104800000,
                        'status': 1,
                        'title': 'Abc'
                    }, {
                        'status': 1,
                        'title': 'Test Title',
                        'end_date': 1384999200000
                    }
                    ]
            };
        describe('interpreting a task', function () {

            it('should work on a copy', function () {
                util.interpretTask(options.testData);
                expect(options.testData).not.toHaveKey('badge');
            });

            it('should add badge', function () {
                var result = util.interpretTask(options.testData);
                expect(result).toHaveKey('badge');
            });

            it('should change status to a string', function () {
                var result = util.interpretTask(options.testData);
                expect(result.status).toEqual(jasmine.any(String));
            });

            it('should add \u2014 if title is empty', function () {
                var result = util.interpretTask(options.testData);
                expect(result.title).toEqual('\u2014');
            });

            it('should add badges if detail parameter is set', function () {
                var result = util.interpretTask(options.testData, true);
                expect(result.badge).toEqual('badge');
            });
        });

        describe('buildOptionArray', function () {

            it('should return an array', function () {
                var result = util.buildOptionArray();
                expect(result).toEqual(jasmine.any(Array));
            });

            it('should only contain full days if parameter is set', function () {
                var result = util.buildOptionArray({daysOnly: true});
                expect(result).not.toContain([5, gt('in 5 minutes')]);
                result = util.buildOptionArray();
                expect(result).toContain([5, gt('in 5 minutes')]);
            });

            it('should not contain past daytimes', function () {
                var myDate = new date.Local(),
                    result,
                    stub;
                myDate.setHours(7);
                //super special UI time hack
                stub = sinon.stub(date, "Local");
                stub.returns(myDate);

                result = util.buildOptionArray();
                expect(result).not.toContain(['d0', gt('this morning')]);
                myDate.setHours(13);
                result = util.buildOptionArray();
                expect(result).not.toContain(['d1', gt('by noon')]);
                myDate.setHours(16);
                result = util.buildOptionArray();
                expect(result).not.toContain(['d2', gt('this afternoon')]);
                myDate.setHours(19);
                result = util.buildOptionArray();
                expect(result).not.toContain(['d3', gt('tonight')]);
                myDate.setHours(23);
                result = util.buildOptionArray();
                expect(result).not.toContain(['d4', gt('late in the evening')]);

                this.after(function () {stub = null});
            });

            it('should set weekdays correctly', function () {
                var myDate = new date.Local(),//stub is still working in this test
                    result;

                //today and tomorrow are special and should not be included in standard next ...day
                myDate.setDate(myDate.getDate() - myDate.getDay());//sunday
                result = util.buildOptionArray();
                expect(result).not.toContain(['w0', gt('next Sunday')]);
                expect(result).not.toContain(['w1', gt('next Monday')]);
                myDate.setDate(myDate.getDate() + 1);//monday
                result = util.buildOptionArray();
                expect(result).not.toContain(['w1', gt('next Monday')]);
                expect(result).not.toContain(['w2', gt('next Tuesday')]);
                myDate.setDate(myDate.getDate() + 1);//tuesday
                result = util.buildOptionArray();
                expect(result).not.toContain(['w2', gt('next Tuesday')]);
                expect(result).not.toContain(['w3', gt('next Wednesday')]);
                myDate.setDate(myDate.getDate() + 1);//wednesday
                result = util.buildOptionArray();
                expect(result).not.toContain(['w3', gt('next Wednesday')]);
                expect(result).not.toContain(['w4', gt('next Thursday')]);
                myDate.setDate(myDate.getDate() + 1);//thursday
                result = util.buildOptionArray({time: myDate});
                expect(result).not.toContain(['w4', gt('next Thursday')]);
                expect(result).not.toContain(['w4', gt('next Friday')]);
                myDate.setDate(myDate.getDate() + 1);//friday
                result = util.buildOptionArray();
                expect(result).not.toContain(['w4', gt('next Friday')]);
                expect(result).not.toContain(['w4', gt('next Saturday')]);
                myDate.setDate(myDate.getDate() + 1);//saturday
                result = util.buildOptionArray();
                expect(result).not.toContain(['w4', gt('next Saturday')]);
                expect(result).not.toContain(['w0', gt('next Sunday')]);

                this.after(function () {stub = null});
            });
        });

        describe('buildDropdownMenu', function () {

            it('should return an array', function () {
                var result = util.buildDropdownMenu();
                expect(result).toEqual(jasmine.any(Array));
            });

            it('should return correct nodeTypes', function () {
                var result = util.buildDropdownMenu();
                expect(result[0].is('option')).toBeTruthy();
                result = util.buildDropdownMenu({bootstrapDropdown: true});
                expect(result[0].is('li')).toBeTruthy();
            });
        });
        describe('computePopupTime', function () {

            it('should only return full days', function () {
                var result = new date.Local(util.computePopupTime('t').endDate);

                expect(result.getHours()).toEqual(0);
                expect(result.getMinutes()).toEqual(0);
                expect(result.getSeconds()).toEqual(0);
                expect(result.getMilliseconds()).toEqual(0);
            });
        });
        describe('sortTasks', function () {

            it('should work on a copy', function () {
                util.sortTasks(options.testDataArray);
                expect(options.testDataArray[0]).toEqual({'status': 3, 'title': 'Top Test'});
            });

            it('should sort overdue tasks to first position', function () {
                var result = util.sortTasks(options.testDataArray);
                expect(result[0]).toEqual({'status': 1, 'title': 'Test Title','end_date': 1384999200000 });
            });

            it('should sort done tasks to last position', function () {
                var result = util.sortTasks(options.testDataArray);
                expect(result[3]).toEqual({'status': 3, 'title': 'Top Test'});
            });
            
            it('should sort same dates alphabetically', function () {
                var result = util.sortTasks(options.testDataArray);
                expect(result[1]).toEqual({'end_date': 1895104800000, 'status': 1, 'title': 'Abc'});
                expect(result[2]).toEqual({'end_date': 1895104800000, 'status': 1, 'title': 'Blabla'});
            });
        });
    });
});
