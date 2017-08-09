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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define(['io.ox/calendar/chronos-util'], function (util) {

    // partial user object
    var testUser = {
            contact_id: 123456,
            display_name: 'Test, Miss',
            email1: 'miss.test@test.com',
            first_name: 'Miss',
            folder_id: 123,
            id: 1337,
            last_name: 'Test',
            user_id: 1337
        },
        testUserResult = {
            cuType: 'INDIVIDUAL',
            cn: 'Test, Miss',
            partStat: 'NEEDS-ACTION',
            comment: '',
            entity: 1337,
            email: 'miss.test@test.com',
            uri: 'mailto:miss.test@test.com',
            contactInformation: {
                folder: 123,
                contact_id: 123456
            }
        },
        // test resource object
        testResource = {
            description: 'Now with 20% more PEW PEW',
            display_name: 'Deathstar',
            email1: '',
            id: 319,
            type: 3
        },
        testResourceResult = {
            cn: 'Deathstar',
            comment: 'Now with 20% more PEW PEW',
            cuType: 'RESOURCE',
            entity: 319,
            partStat: 'ACCEPTED'
        },
        // test contact object
        testContact = {
            display_name: 'Smith, Hannibal',
            email1: 'hannibal@a.team',
            first_name: 'Hannibal',
            folder_id: 123,
            id: 1337,
            internal_userid: 0,
            last_name: 'Smith',
            type: 5
        },
        testContactResult = {
            cn: 'Smith, Hannibal',
            comment: '',
            cuType: 'INDIVIDUAL',
            email: 'hannibal@a.team',
            partStat: 'NEEDS-ACTION',
            uri: 'mailto:hannibal@a.team',
            contactInformation: {
                folder: 123,
                contact_id: 1337
            }
        },
        // input from addParticipants for external contacts not in your gab
        inputFragment = {
            display_name: 'vader',
            email1: 'vader@dark.side',
            field: 'email1',
            type: 5
        };

    return describe('Chronos util', function () {

        describe('createAttendee', function () {

            it('should return undefined if no argument is given', function () {
                expect(util.createAttendee()).to.equal(undefined);
            });

            it('should work with user object', function () {
                util.createAttendee(testUser).should.deep.equal(testUserResult);
            });

            it('should work with user model', function () {
                util.createAttendee(new Backbone.Model(testUser)).should.deep.equal(testUserResult);
            });

            it('should work with contact object', function () {
                util.createAttendee(testContact).should.deep.equal(testContactResult);
            });

            it('should work with contact model', function () {
                util.createAttendee(new Backbone.Model(testContact)).should.deep.equal(testContactResult);
            });

            it('should handle resources correctly', function () {
                util.createAttendee(testResource).should.deep.equal(testResourceResult);
                util.createAttendee(new Backbone.Model(testResource)).should.deep.equal(testResourceResult);
            });

            it('should add predefined values', function () {
                var result = _.copy(testUserResult);
                result.partStat = 'ACCEPTED';
                util.createAttendee(testUser, { partStat: 'ACCEPTED' }).should.deep.equal(result);
            });

            it('should resolve distribution lists', function () {
                util.createAttendee({ mark_as_distributionlist: true, distribution_list: [testUser, testContact] }, { partStat: 'ACCEPTED' }).should.deep.equal([testUserResult, testContactResult]);
            });

            it('should work with input fragments created by addParticipants autocomplete', function () {
                util.createAttendee(inputFragment).should.deep.equal({
                    cn: 'vader',
                    comment: '',
                    cuType: 'INDIVIDUAL',
                    email: 'vader@dark.side',
                    partStat: 'NEEDS-ACTION',
                    uri: 'mailto:vader@dark.side',
                    contactInformation: {
                        folder: undefined,
                        contact_id: undefined
                    }
                });
            });
        });
    });
});
