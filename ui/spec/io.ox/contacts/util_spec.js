/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
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
        email1: 'georg@tester.com'
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
        });

        it('should return a prepared full contact name for sorting purpose ', function () {
            expect(util.getSortName(testPerson)).toEqual('tester, georg');
        });

//            it ('should return a string combined from titel, last name and first menu ', function () {
//                expect(util.getFullNameFormat(testPerson)).toEqual('tester, georg');
//            });

        it('should return the prepared full name ', function () {
            expect(util.getFullName(testPerson)).toEqual('Tester, Georg');
        });

        it('should return the display name if available otherwise combine first and last name ', function () {
            expect(util.getDisplayName(testPerson)).toEqual('Dr. Tester, Georg');
            expect(util.getDisplayName(testPersonWOPic)).toEqual('Tester, Georg');
        });

//            getMailFullNameFormat

        it('should return the display name if available otherwise combine first and last name ', function () {
            expect(util.getMailFullName(testPerson)).toEqual('Georg Tester');
        });

//            getMailFormat

        it('should return the first available mail address ', function () {
            expect(util.getMail(testPerson)).toEqual('georg@tester.com');
        });

    });

});
