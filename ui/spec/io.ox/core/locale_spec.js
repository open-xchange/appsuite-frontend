/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define([
    'io.ox/core/locale',
    'io.ox/core/locale/postal-address',
    'settings!io.ox/core'
], function (locale, postal, settings) {

    describe('Postal address', function () {

        var data = {
            street_home: '  street  ',
            postal_code_home: '  code  ',
            city_home: '  city  ',
            state_home: '  state  ',
            country_home: '  country  '
        };

        describe('identifies country code', function () {

            it('based on country-part of address', function () {
                expect(postal.getCountryCode('Deutschland')).to.equal('DE');
                expect(postal.getCountryCode('USA')).to.equal('US');
                expect(postal.getCountryCode('Großbritannien')).to.equal('GB');
                expect(postal.getCountryCode('Niederlande')).to.equal('NL');
                // fallback
                expect(postal.getCountryCode('Dorne')).to.be.equal('');
            });

        });

        describe('returns', function () {

            it('formated address', function () {
                var countrycode = 'BO';
                expect(postal.format(data, 'home', countrycode)).to.equal('street\ncode city state\ncountry');
                countrycode = 'US';
                expect(postal.format(data, 'home', countrycode)).to.equal('street\ncity state code\ncountry');
                countrycode = 'GB';
                expect(postal.format(data, 'home', countrycode)).to.equal('street\ncity\nstate code\ncountry');
            });

            it('formated address without needless whitespace', function () {
                var countrycode = 'BO';
                expect(postal.format(_.omit(data, 'city_home'), 'home', countrycode)).to.equal('street\ncode state\ncountry');
                expect(postal.format(_.pick(data, 'street_home', 'country_home'), 'home', countrycode)).to.equal('street\ncountry');
            });

            it('formated address with ommited STATE for specific countries', function () {
                var countrycode = 'DE';
                expect(postal.format(data, 'home', countrycode)).to.equal('street\ncode city\ncountry');
            });

            it('formated address with a valid fallback countrycode (US)', function () {
                var loc = ox.locale;
                ox.locale = undefined;
                expect(postal.format(data, 'home')).to.equal('street\ncode city\nstate\ncountry');
                ox.locale = loc;
            });
        });

    });

    describe('Locale', function () {

        after(function (done) {
            var id = 'de_DE';
            // finally change back to de_DE
            ox.once('change:locale:' + id, done);
            settings.set('language', id);
        });

        it('set proper date format', function () {
            var m = moment([2019, 5, 5, 13, 37]);
            expect(m.format('L')).to.equal('5.6.2019');
            expect(m.format('LL')).to.equal('5. Juni 2019');
            expect(m.format('LLL')).to.equal('5.6.2019 13:37');
            expect(m.format('LT')).to.equal('13:37');
        });

        it('formats number with 0 fraction digits correctly', function () {
            expect(locale.number(111)).to.equal('111');
            expect(locale.number(123.5)).to.equal('124');
            expect(locale.number(1234.56)).to.equal('1.235');
            expect(locale.number(1234.567)).to.equal('1.235');
        });

        it('formats number with 2 fraction digits correctly', function () {
            expect(locale.number(111, 2)).to.equal('111,00');
            expect(locale.number(123.5, 2)).to.equal('123,50');
            expect(locale.number(1234.56, 2)).to.equal('1.234,56');
            expect(locale.number(1234.567, 2)).to.equal('1.234,57');
        });

        it('formats percentages correctly', function () {
            expect(locale.percent(1234.51, 1)).to.equal('1.234,5 %');
        });

        it('formats currency correctly', function () {
            expect(locale.currency(1234)).to.equal('1.234,00 €');
        });

        it('return correct default format', function () {
            expect(locale.getDefaultNumberFormat()).to.equal('1.234,56');
        });

        it('returns localeData correctly', function () {
            expect(locale.getLocaleData()).to.deep.equal({
                date: 'd.M.yyyy',
                dateFull: 'EEEE, d. MMMM yyyy',
                dateLong: 'd. MMMM yyyy',
                dateMedium: 'd.M.yyyy',
                dateShort: 'd.M.yyyy',
                firstDayOfWeek: 'monday',
                firstDayOfYear: 4,
                number: '1.234,56',
                time: 'HH:mm',
                timeLong: 'HH:mm:ss'
            });
        });

        it('sets custom formats correctly', function () {
            locale.setLocaleData({ timeLong: 'HH.mm.ss', date: 'dd-MM-yyyy' });
            var m = moment([2019, 5, 5, 13, 37]);
            expect(m.format('L')).to.equal('05-06-2019');
            expect(m.format('LL')).to.equal('5. Juni 2019');
            expect(m.format('LLL')).to.equal('05-06-2019 13.37');
            expect(m.format('LT')).to.equal('13.37');
        });

        it('resets custom formats correctly', function () {
            locale.resetLocaleData();
            var m = moment([2019, 5, 5, 13, 37]);
            expect(m.format('L')).to.equal('5.6.2019');
            expect(m.format('LL')).to.equal('5. Juni 2019');
            expect(m.format('LLL')).to.equal('5.6.2019 13:37');
            expect(m.format('LT')).to.equal('13:37');
        });

        it('return start of week', function () {
            expect(locale.getFirstDayOfWeek()).to.equal('Montag');
        });

        it('returns default locale', function () {
            expect(locale.meta.getDefaultLocale()).to.equal('de_DE');
        });

        it('returns default locale from cookie', function () {
            _.setCookie('locale', 'de_CH');
            expect(locale.meta.getValidDefaultLocale()).to.equal('de_CH');
        });

        it('returns valid default locale', function () {
            _.setCookie('locale', 'de_DE');
            ox.serverConfig.languages = _(locale.meta.getLocales()).omit('de_DE');
            expect(locale.meta.getValidDefaultLocale()).to.equal('en_US');
        });

        it('returns valid default locale if en_US is not listed', function () {
            _.setCookie('locale', 'en_US');
            ox.serverConfig.languages = _(locale.meta.getLocales()).omit('en_US');
            expect(locale.meta.getValidDefaultLocale()).to.equal('bg_BG');
        });

        it('changes locale (de_CH)', function (done) {
            var id = 'de_CH';
            ox.once('change:locale:' + id, function () {
                expect(locale.number(1234.56, 2)).to.equal('1’234.56');
                var m = moment([2019, 5, 5, 13, 37]);
                expect(m.format('L')).to.equal('5.6.2019');
                done();
            });
            settings.set('language', id);
        });

        // works locally but breaks CI
        it.skip('changes locale (es_US)', function (done) {
            var id = 'es_US';
            ox.once('change:locale:' + id, function () {
                // currently output misses separating comma caused by a chromium bug
                expect(locale.number(123456.56, 2)).to.equal('123456.56');
                var m = moment([2019, 5, 5, 13, 37]);
                expect(m.format('L')).to.equal('06/05/2019');
                done();
            });
            settings.set('language', 'es_US');
        });
    });
});
