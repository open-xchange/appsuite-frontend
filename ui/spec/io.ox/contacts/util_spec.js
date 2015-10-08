/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
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
    /*
    testDistList = {
        mark_as_distributionlist: true
    },

    testPersonHttps = {
        image1_url: 'https://www.test.de/ajax/image/contact/picture?folder=11179&id=510778&timestamp=1379590562489',
    };
    */

    describe('Contact util', function () {

        it('should return a prepared full contact name for sorting purpose', function () {
            expect(util.getSortName(testPerson)).to.equal('tester, georg');
            expect(util.getSortName({})).to.be.empty;
        });

        it('should return a object containing the format ', function () {
            expect(util.getFullNameFormat(testPerson)).to.deep.equal({ format: '%2$s, %1$s', params: [ 'Georg', 'Tester' ] });
        });

        it('should return the prepared full name ', function () {
            expect(util.getFullName(testPerson)).to.equal('Tester, Georg');
            expect(util.getFullName({})).to.be.empty;
        });

        it('should return the display name if available otherwise combine first and last name ', function () {
            expect(util.getDisplayName(testPerson)).to.equal('Dr. Tester, Georg');
            expect(util.getDisplayName(testPersonWOPic)).to.equal('Tester, Georg');
        });

        it('should return a object containing the format ', function () {
            expect(util.getMailFullNameFormat(testPerson)).to.deep.equal({ format: '%1$s %2$s', params: [ 'Georg', 'Tester' ] });
        });

        it('should return the display name if available otherwise combine first and last name ', function () {
            expect(util.getMailFullName(testPerson)).to.equal('Georg Tester');
        });

        it('should return a object containing the format ', function () {
            expect(util.getMailFormat(testPerson)).to.deep.equal({ format: '%1$s', params: [ 'georg1@tester.com' ] });
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
    });
});
