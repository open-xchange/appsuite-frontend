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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define([
    'io.ox/find/date/patterns',
    'gettext!io.ox/core'
], function (patterns, gt) {

    'use strict';

    describe('Find\u0027s patterns:', function () {
        var year = window.moment().year(),
            m = window.moment('2014-06-02'),
            mto = window.moment('2015-08-04'),
            mcurrent = m.clone().year(year);
        it('number of matches can be limited by option', function () {
            // default 3
            expect(patterns.getMatches('20')).to.have.length(3);
            expect(patterns.getMatches('20', { limit: 2 })).to.have.length(2);
        });

        describe('identifies', function () {

            describe('months/weekdays -', function () {
                it('weekdays (max)', function () {
                    window.moment.weekdays().forEach(function (val) {
                        expect(_.first(patterns.getMatches(val))).to.have.property('id', val.toLowerCase());
                    });
                });
                it('weekdays (min)', function () {
                    window.moment.weekdaysMin().forEach(function (val) {
                        expect(_.first(patterns.getMatches(val))).to.have.property('id')
                                                                 .to.have.string(val.toLowerCase());
                    });
                });
                it('months (max)', function () {
                    window.moment.months().forEach(function (val) {
                        expect(_.first(patterns.getMatches(val))).to.have.property('id')
                                                                 .to.have.string(val.toLowerCase());
                    });
                });
                it('months (min)', function () {
                    window.moment.months().forEach(function (val) {
                        val = val.slice(0,2);
                        expect(_.first(patterns.getMatches(val))).to.have.property('id')
                                                                 .to.have.string(val.toLowerCase());
                    });
                });
            });

            describe('date range by keyword -', function () {
                it('today', function () {
                    var val = gt('Today');
                    expect(_.first(patterns.getMatches(val))).to.have.property('id', val.toLowerCase());
                });
                it('yesterday', function () {
                    var values = [ gt('Yesterday'), gt('Last day') ];
                    values.forEach(function (val) {
                        expect(_.first(patterns.getMatches(val))).to.have.property('id', val.toLowerCase());
                    });
                });
                it('last week', function () {
                    var values = [ gt('Last week'), gt('Previous week') ];
                    values.forEach(function (val) {
                        expect(_.first(patterns.getMatches(val))).to.have.property('id', val.toLowerCase());
                    });
                });
                it('last month', function () {
                    var values = [ gt('Last month'), gt('Previous month') ];
                    values.forEach(function (val) {
                        expect(_.first(patterns.getMatches(val))).to.have.property('id', val.toLowerCase());
                    });
                });
                it('last year', function () {
                    var values = [ gt('Last year'), gt('Previous year') ];
                    values.forEach(function (val) {
                        expect(_.first(patterns.getMatches(val))).to.have.property('id', val.toLowerCase());
                    });
                });
            });

            describe('date range until now by keyword -', function () {
                it('last 7 days', function () {
                    var val = gt('Last 7 days');
                    expect(_.first(patterns.getMatches(val))).to.have.property('id', val.toLowerCase());
                });
                it('last 30 days', function () {
                    var val = gt('Last 30 days');
                    expect(_.first(patterns.getMatches(val))).to.have.property('id', val.toLowerCase());
                });
                it('last 365 days', function () {
                    var val = gt('Last 365 days');
                    expect(_.first(patterns.getMatches(val))).to.have.property('id', val.toLowerCase());
                });
            });

            describe('year -', function () {
                it('current', function () {
                    var val = window.moment().year();
                    expect(_.first(patterns.getMatches(val))).to.have.property('id', String(val));
                });
            });

            describe('format', function () {
                function validate (val) {
                    var match = _.first(patterns.getMatches(val));
                    expect(match).to.exist;
                    expect(match).to.have.property('id', 'format-full-date');
                    expect(match.start.diff(val.length > 6 ? m : mcurrent, 'days')).to.equal(0);
                }

                describe('hyphon -', function () {
                    // f.e. sweden
                    it('YYYY-MM-DD', function () {
                        validate('2014-06-02');
                        validate('2014-06-2');
                        validate('2014-6-02');
                        validate('2014-6-2');
                    });
                    // f.e. ireland
                    it('DD-MM-YYYY', function () {
                        validate('02-06-2014');
                        validate('2-06-2014');
                        validate('02-6-2014');
                        validate('2-6-2014');
                    });
                });
                describe('dot -', function () {
                    // f.e. korea
                    it('YYYY.MM.DD', function () {
                        validate('2014.06.02');
                        validate('2014.06.2');
                        validate('2014.6.02');
                        validate('2014.6.2');
                    });
                    // f.e. germany
                    it('DD.MM.YYYY', function () {
                        validate('02.06.2014');
                        validate('2.06.2014');
                        validate('02.6.2014');
                        validate('2.6.2014');
                    });
                });
                describe('slash -', function () {
                    // f.e. iran
                    it('YYYY/MM/DD', function () {
                        validate('2014/06/02');
                        validate('2014/6/02');
                        validate('2014/06/2');
                        validate('2014/6/2');
                    });
                    // f.e. usa
                    it('MM/DD/YYYY', function () {
                        validate('06/02/2014');
                        validate('06/2/2014');
                        validate('6/02/2014');
                        validate('6/2/2014');
                    });
                });
            });

            describe('range', function () {
                function validate (val) {
                    var match = _.first(patterns.getMatches(val));
                    expect(match).to.exist;
                    expect(match).to.have.property('id', 'range');
                    expect(match.start.diff(m, 'days')).to.equal(0);
                    expect(match.end.diff(mto, 'days')).to.equal(0);
                }
                describe('hyphon -', function () {
                    it('DD-MM-YYYY-DD-MM-YYYY', function () {
                        validate('02-06-2014-04-08-2015');
                    });
                });
                describe('dot -', function () {
                    it('DD.MM.YYYY-DD.MM.YYYY', function () {
                        validate('02.06.2014-04.08.2015');
                    });
                });
                describe('slash -', function () {
                    it('MM/DD/YYYY-MM/DD/YYYY', function () {
                        validate('06/02/2014-08/04/2015');
                    });
                });
                describe('connectors -', function () {
                    it('" - "', function () {
                        validate('02.06.2014-04.08.2015');
                        validate('02.06.2014 - 04.08.2015');
                    });
                    it('" to "', function () {
                        validate('02.06.2014to04.08.2015');
                        validate('02.06.2014 to 04.08.2015');
                    });
                    it('" bis "', function () {
                        validate('02.06.2014bis04.08.2015');
                        validate('02.06.2014 bis 04.08.2015');
                    });
                    it('" à "', function () {
                        validate('02.06.2014à04.08.2015');
                        validate('02.06.2014 à 04.08.2015');
                    });
                    it('" au "', function () {
                        validate('02.06.2014au04.08.2015');
                        validate('02.06.2014 au 04.08.2015');
                    });
                    it('" a "', function () {
                        validate('02.06.2014a04.08.2015');
                        validate('02.06.2014 a 04.08.2015');
                    });
                });
                describe('specials - ', function () {
                    it('wrong order', function () {
                        validate('04.08.2015 - 02.06.2014');
                    });
                    it('one day range', function () {
                        var match = _.first(patterns.getMatches('02.06.2014 - 02.06.2014'));
                        expect(match).to.exist;
                        expect(match).to.have.property('id', 'range');
                        expect(match.start.diff(m, 'days')).to.equal(0);
                        expect(match.end.diff(m, 'days')).to.equal(0);
                    });
                });
            });

        });

        describe('ignores', function () {
            describe('format', function () {
                function validate (val) {
                    var match = _.first(patterns.getMatches(val));
                    expect(match).to.not.exist;
                }
                describe('hyphon -', function () {
                    it('YY-MM-DD', function () {
                        validate('14-06-02');
                        validate('06-02-');
                        validate('06-02');
                    });
                    it('DD-MM-YY', function () {
                        validate('02-06-14');
                        validate('02-06-');
                        validate('02-06');
                    });
                });
                describe('dot -', function () {
                    it('YY.MM.DD', function () {
                        validate('14.06.02');
                        validate('06.02.');
                    });
                    it('DD.MM.YY', function () {
                        validate('02.06.14');
                        validate('02.06.');
                    });
                });
                describe('slash -', function () {
                    it('YY/MM/DD', function () {
                        validate('14/06/02');
                        validate('06/02/');
                        validate('06/02');
                    });
                    it('DD/MM/YY', function () {
                        validate('02/06/20');
                        validate('02/06/');
                        validate('02/06');
                    });
                });
                describe('slash -', function () {
                    it('YY/MM/DD', function () {
                        validate('14/06/02');
                        validate('06/02/');
                        validate('06/02');
                    });
                    it('DD/MM/YY', function () {
                        validate('02/06/20');
                        validate('02/06/');
                        validate('02/06');
                    });
                });
            });
        });

    });
});
