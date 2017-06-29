/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
define(['io.ox/calendar/chronos-model'], function (models) {

    describe('Calendar chronos API', function () {

        describe('Event Collection', function () {

            describe('Computes range diffs', function () {

                it('should return same range if there was no range before', function () {
                    var c = new models.Collection(),
                        result = c.getRangeDiff({ start: 1, end: 2 });
                    result.should.deep.equal([{ start: 1, end: 2 }]);
                });

                it('with a single disjoint range', function () {
                    var c = new models.Collection();
                    c.ranges = [{ start: 1, end: 3 }];
                    var result = c.getRangeDiff({ start: 5, end: 10 });
                    result.should.deep.equal([{ start: 5, end: 10 }]);
                });

                it('with a single connecting range', function () {
                    var c = new models.Collection();
                    c.ranges = [{ start: 1, end: 3 }];
                    var result = c.getRangeDiff({ start: 3, end: 5 });
                    result.should.deep.equal([{ start: 3, end: 5 }]);
                });

                it('with duplicate calls', function () {
                    var c = new models.Collection();
                    c.ranges = [{ start: 1, end: 3 }];
                    var result = c.getRangeDiff({ start: 1, end: 3 });
                    result.should.have.length(0);
                });

                it('should return range diffs, non-overlapping', function () {
                    var c = new models.Collection();
                    c.ranges = [{
                        start: 1, end: 3
                    }, {
                        start: 6, end: 8
                    }, {
                        start: 11, end: 13
                    }];
                    var result = c.getRangeDiff({ start: 5, end: 10 });
                    result.should.deep.equal([{
                        start: 5, end: 6
                    }, {
                        start: 8, end: 10
                    }]);
                });

                it('should return range diffs with overlaps', function () {
                    var c = new models.Collection();
                    c.ranges = [{
                        start: 3, end: 6
                    }, {
                        start: 7, end: 9
                    }, {
                        start: 11, end: 17
                    }];
                    var result = c.getRangeDiff({ start: 5, end: 16 });
                    result.should.deep.equal([{
                        start: 6, end: 7
                    }, {
                        start: 9, end: 11
                    }]);
                });

            });

            describe('Get ranges for api and updates existing ranges', function () {

                it('without preset range', function () {
                    var c = new models.Collection(),
                        result = c.getRanges({ start: 1, end: 2, useCache: true });
                    result.should.deep.equal([{ start: 1, end: 2 }]);
                    c.ranges.should.deep.equal([{ start: 1, end: 2 }]);
                });

                it('with preset range (no overlaps)', function () {
                    var c = new models.Collection();
                    c.ranges = [{
                        start: 1, end: 3
                    }, {
                        start: 6, end: 8
                    }, {
                        start: 11, end: 13
                    }];
                    var result = c.getRanges({ start: 5, end: 10, useCache: true });
                    result.should.deep.equal([{
                        start: 5, end: 6
                    }, {
                        start: 8, end: 10
                    }]);
                    c.ranges.should.deep.equal([{
                        start: 1, end: 3
                    }, {
                        start: 5, end: 10
                    }, {
                        start: 11, end: 13
                    }]);
                });

                it('with preset range (and overlaps)', function () {
                    var c = new models.Collection();
                    c.ranges = [{
                        start: 3, end: 6
                    }, {
                        start: 7, end: 9
                    }, {
                        start: 11, end: 17
                    }];
                    var result = c.getRanges({ start: 5, end: 16, useCache: true });
                    result.should.deep.equal([{
                        start: 6, end: 7
                    }, {
                        start: 9, end: 11
                    }]);
                    c.ranges.should.deep.equal([{
                        start: 3, end: 17
                    }]);
                });

            });

        });

    });

});
