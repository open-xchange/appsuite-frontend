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

define(["io.ox/contacts/util"], function (util) {

    "use strict";

    var testPerson = {
        image1_url: "/ajax/image/contact/picture?folder=11179&id=510778&timestamp=1379590562489",
        first_name: 'Georg',
        last_name: 'Tester',
        display_name: 'Dr. Tester, Georg',
        email1: 'georg1@tester.com',
        email2: 'georg@2tester.com',
        email3: 'georg3@tester.com',
        company: 'conpany',
        department: 'department',
        position: 'position',
        city_business: 'city_business',
        city_home: 'city_home'
    },
        testPersonWOPic = {
        first_name: 'Georg',
        last_name: 'Tester',
    },
        testDistList = {
        mark_as_distributionlist: true
    },
        testPersonHttps = {
        image1_url: "https://www.test.de/ajax/image/contact/picture?folder=11179&id=510778&timestamp=1379590562489",
    };

    describe("Contact util", function () {

        it('should return a proper image path ', function () {
            expect(util.getImage(testPerson)).toEqual(ox.apiRoot + '/image/contact/picture?folder=11179&id=510778&timestamp=1379590562489');
            expect(util.getImage(testPersonWOPic)).toEqual(ox.base + '/apps/themes/default/dummypicture.png');
            expect(util.getImage(testDistList)).toEqual(ox.base + '/apps/themes/default/dummypicture_group.png');
            expect(util.getImage(testPersonHttps)).toEqual(ox.apiRoot + '/image/contact/picture?folder=11179&id=510778&timestamp=1379590562489');
        });

        it('should return a prepared full contact name for sorting purpose ', function () {
            expect(util.getSortName(testPerson)).toEqual('tester, georg');
            expect(util.getSortName({})).toEqual('');
        });

        it('should return a object containing the format ', function () {
            expect(util.getFullNameFormat(testPerson)).toEqual({ format : '%2$s, %1$s', params : [ 'Georg', 'Tester' ] });
        });

        it('should return the prepared full name ', function () {
            expect(util.getFullName(testPerson)).toEqual('Tester, Georg');
            expect(util.getFullName({})).toEqual('');
        });

        it('should return the display name if available otherwise combine first and last name ', function () {
            expect(util.getDisplayName(testPerson)).toEqual('Dr. Tester, Georg');
            expect(util.getDisplayName(testPersonWOPic)).toEqual('Tester, Georg');
        });

        it('should return a object containing the format ', function () {
            expect(util.getMailFullNameFormat(testPerson)).toEqual({ format : '%1$s %2$s', params : [ 'Georg', 'Tester' ] });
        });

        it('should return the display name if available otherwise combine first and last name ', function () {
            expect(util.getMailFullName(testPerson)).toEqual('Georg Tester');
        });

        it('should return a object containing the format ', function () {
            expect(util.getMailFormat(testPerson)).toEqual({ format : '%1$s', params : [ 'georg1@tester.com' ] });
        });

        it('should return the first available mail address ', function () {
            expect(util.getMail(testPerson)).toEqual('georg1@tester.com');
        });

        it('should return a descriptiv string for the contact', function () {
            expect(util.getDescription(testPerson)).toEqual('conpany, department, position, city_business, city_home');
        });

        it('should return a combined string of position and company', function () {
            expect(util.getJob(testPerson)).toEqual('position, conpany');
        });

//            nameSort is not used any more

        it('should return the mailfield ID of a selected E-Mail', function () {
            expect(util.calcMailField(testPerson, testPerson.email2)).toEqual(2);
            expect(util.calcMailField(testPerson, testPerson.email1)).toEqual(1);
            expect(util.calcMailField(testPerson, testPerson.email3)).toEqual(3);
        });

    });

});
