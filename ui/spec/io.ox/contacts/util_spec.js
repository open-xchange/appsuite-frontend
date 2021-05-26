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

define(['io.ox/contacts/util'], function (util) {
    'use strict';

    var testPerson = {
            image1_url: '/ajax/image/contact/picture?folder=11179&id=510778&timestamp=1379590562489',
            first_name: 'Georg',
            last_name: 'Tester',
            display_name: 'Dr. Tester, Georg',
            email1: 'georg1@tester.com',
            email2: 'georg@2tester.com',
            email3: 'georg3@tester.com',
            company: 'company',
            department: 'department',
            position: 'position',
            city_business: 'city_business',
            city_home: 'city_home'
        },
        testPersonWOPic = {
            first_name: 'Georg',
            last_name: 'Tester'
        };

    describe('Contact util', function () {

        it('should return a prepared full contact name for sorting purpose', function () {
            expect(util.getSortName(testPerson)).to.equal('tester, georg');
            expect(util.getSortName({})).to.be.empty;
        });

        it('should return a object containing the format ', function () {
            expect(util.getFullNameFormat(testPerson)).to.deep.equal({ format: '%2$s, %1$s', params: ['Georg', 'Tester'] });
        });

        it('should return the prepared full name', function () {
            var a = { first_name: ' ', last_name: 'Tester', display_name: 'Dr. Tester, Georg' },
                b = { first_name: 'Georg', last_name: ' ', display_name: 'Dr. Tester, Georg' },
                c = { first_name: ' ', last_name: ' ', display_name: 'Dr. Tester, Georg' };
            expect(util.getFullName(a)).to.equal('Tester');
            expect(util.getFullName(b)).to.equal('Georg');
            expect(util.getFullName(c)).to.equal('Dr. Tester, Georg');
        });

        it('should ignore first and last name if it just contains blanks', function () {
            expect(util.getFullName(testPerson)).to.equal('Tester, Georg');
        });

        it('should return the display name if available otherwise combine first and last name ', function () {
            expect(util.getDisplayName(testPerson)).to.equal('Dr. Tester, Georg');
            expect(util.getDisplayName(testPersonWOPic)).to.equal('Tester, Georg');
        });

        it('should return a object containing the format ', function () {
            expect(util.getMailFullNameFormat(testPerson)).to.deep.equal({ format: '%1$s %2$s', params: ['Georg', 'Tester'] });
        });

        it('should return the display name if available otherwise combine first and last name ', function () {
            expect(util.getMailFullName(testPerson)).to.equal('Georg Tester');
        });

        it('should return a object containing the format ', function () {
            expect(util.getMailFormat(testPerson)).to.deep.equal({ format: '%1$s', params: ['georg1@tester.com'] });
        });

        it('should return the first available mail address ', function () {
            expect(util.getMail(testPerson)).to.equal('georg1@tester.com');
        });

        it('should return a combined string of position and company', function () {
            expect(util.getJob(testPerson)).to.equal('company, position');
        });

        it('should return the mailfield ID of a selected E-Mail', function () {
            expect(util.calcMailField(testPerson, testPerson.email2)).to.equal(2);
            expect(util.calcMailField(testPerson, testPerson.email1)).to.equal(1);
            expect(util.calcMailField(testPerson, testPerson.email3)).to.equal(3);
        });

        it('should correctly convert birthdays to Gregorian calendar', function () {
            expect(util.julianToGregorian(-62122809600000))//May 29 Year 1
                .to.equal(-62122636800000);//May 31 Year 1
        });

        it('should correctly convert birthdays to Julian calendar', function () {
            expect(util.gregorianToJulian(-62122636800000))//May 31 Year 1
                .to.equal(-62122809600000);//May 29 Year 1
        });
        it('should correctly choose correct format for birthdays in year 1', function () {
            expect(util.getBirthday(-62122809600000)).to.equal(
                moment.utc(-62122809600000).format(moment.localeData().longDateFormat('l').replace(/[/-]*Y+[/-]*/, ''))
            );
            expect(util.getBirthday(-62135856000000)).to.equal(
                moment.utc(-62135856000000).format(moment.localeData().longDateFormat('l').replace(/[/-]*Y+[/-]*/, ''))
            );
        });
    });
});
