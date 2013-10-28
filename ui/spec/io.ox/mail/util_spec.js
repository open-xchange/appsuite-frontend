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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['io.ox/mail/util',
        'io.ox/core/capabilities'], function (util, capabilities) {

    describe('Utilities for mail:', function () {
        //guarantee same number of arguments for wrapper functions
        describe('has some msisdn methods and', function () {

            beforeEach(function () {
                cap = sinon.stub(capabilities, 'has');
                cap.withArgs('msisdn').returns(true);
            });

            afterEach(function () {
                capabilities.has.restore();
            });

            it('should correctly identify channel "email" or "phone"', function () {

                //without considering activated capability
                expect(util.getChannel(util.getChannelSuffixes().msisdn)).toEqual('phone');
                expect(util.getChannel('017012345678' + util.getChannelSuffixes().msisdn)).toEqual('phone');
                expect(util.getChannel('horst.matuschek@' + util.getChannelSuffixes().msisdn)).toEqual('phone');

                expect(util.getChannel('017012345678', false)).toEqual('phone');
                expect(util.getChannel('+17012345678', false)).toEqual('phone');
                expect(util.getChannel('(01701) 23456-78', false)).toEqual('phone');
                expect(util.getChannel('office (01701) 23456-78', false)).toEqual('email');

                if (capabilities.has('msisdn')) {
                    expect(util.getChannel('017012345678')).toEqual('phone');
                    expect(util.getChannel('+17012345678')).toEqual('phone');
                    expect(util.getChannel('(01701) 23456-78')).toEqual('phone');
                } else {
                    expect(util.getChannel('017012345678')).toEqual('email');
                    expect(util.getChannel('+17012345678')).toEqual('email');
                    expect(util.getChannel('(01701) 23456-78')).toEqual('email');
                }
            });
            it('should correctly remove inalid chars from phone numbers', function () {
                expect(util.cleanupPhone('+17012345678')).toEqual('+17012345678');
                expect(util.cleanupPhone('(01701) 23456-78')).toEqual('017012345678');
                expect(util.cleanupPhone('01701/2345678')).toEqual('017012345678');
            });
            //FIXME: capability in utils is stored on lib load
            xit('should correctly remove "' + util.getChannelSuffixes().msisdn +  '" typesuffix from data', function () {
                if (capabilities.has('msisdn')) {
                    var suffix = util.getChannelSuffixes().msisdn,
                        mail = {
                            from: [
                                ['017012345678', '017012345678' + suffix]
                            ],
                            to: [
                                ['017012345678', '017012345678' + suffix],
                                ['017012345678', '017012345678' + suffix]
                            ]
                        };
                    expect(util.removeChannelSuffix('017012345678' + suffix + ',asdadjaldk,017012345678' + suffix + ',asduhadsasd'))
                    .toEqual('017012345678,asdadjaldk,017012345678,asduhadsasd');
                    expect(util.removeChannelSuffix(mail))
                    .toEqual({
                            from: [
                                ['017012345678', '017012345678']
                            ],
                            to: [
                                ['017012345678', '017012345678'],
                                ['017012345678', '017012345678']
                            ]
                        });
                }
            });
            //FIXME: capability in utils is stored on lib load
            xit('should handle empty from fields', function () {
                if (capabilities.has('msisdn')) {
                    var mail = {
                        from: [],
                        to: [
                            ['017012345678', '017012345678' + util.getChannelSuffixes().msisdn]
                        ]
                    };
                    expect(util.removeChannelSuffix(mail))
                        .toEqual({from: [], to: [['017012345678', '017012345678']]});
                }
            });
        });

        describe('parse recepient', function () {
            it('should work with plain mail address strings', function () {
                var result = util.parseRecipient('julian.baeume@open-xchange.com');
                expect(result).toEqual(['julian.baeume', 'julian.baeume@open-xchange.com']);
            });

            it('should work with display name and mail address strings', function () {
                var result = util.parseRecipient('"Julian Bäume" <julian.baeume@open-xchange.com>');
                expect(result).toEqual(['Julian Bäume', 'julian.baeume@open-xchange.com']);
            });
        });

        describe('display name', function () {
            var name = 'pierce hawthorne',
                email = 'pierce.hawthorne@greendalecommunitycollege.com';
            it('should return empty string if data is invalid or empty', function () {
                var expect = chai.expect;
                //not array
                expect(util.getDisplayName(email)).to.be.empty;
                expect(util.getDisplayName('')).to.be.empty;
                expect(util.getDisplayName({})).to.be.empty;
                expect(util.getDisplayName(undefined)).to.be.empty;
                expect(util.getDisplayName(null)).to.be.empty;
                //invalid
                expect(util.getDisplayName([])).to.be.empty;

            });
            it('should return email if name is not set', function () {
                //fallback
                expect(util.getDisplayName(['', email])).toEqual(email);
                expect(util.getDisplayName([undefined, email])).toEqual(email);
                expect(util.getDisplayName([null, email])).toEqual(email);
            });
            it('should return the unescaped name', function () {
                //workin
                expect(util.getDisplayName([name, email])).toEqual(name);
                expect(util.getDisplayName([name, ''])).toEqual(name);
                expect(util.getDisplayName([name, undefined])).toEqual(name);
                expect(util.getDisplayName([name, null])).toEqual(name);
            });

        });

        describe('from check', function () {
            it('should return false on invalid data', function () {
                //invalid
                expect(util.hasFrom('')).toBeFalsy();
                expect(util.hasFrom(null)).toBeFalsy();
                expect(util.hasFrom(undefined)).toBeFalsy();
                expect(util.hasFrom({})).toBeFalsy();
                expect(util.hasFrom([])).toBeFalsy();
                expect(util.hasFrom({ from: [[undefined, '']]})).toBeFalsy();
                //valid
                expect(util.hasFrom({ from: [[undefined, 'some email']]})).toBeTruthy();
            });

        });

        describe('from getter', function () {
            it('should return jquery span node', function () {
                var result = util.getFrom('');
                expect(result).toBeJquery();
                expect(result.is('span')).toBeTruthy();
            });
        });

        describe('format sender', function () {
            it('should return a nicely formated string', function () {
                expect(util.formatSender('""""name""""', 'address', false)).toEqual('name <address>');
                expect(util.formatSender('""""name""""', 'address')).toEqual('"name" <address>');
                expect(util.formatSender(undefined, 'address')).toEqual('address');
                expect(util.formatSender('', 'address')).toEqual('address');
            });
        });

        describe('getPriority', function () {
            it('should return a jquery node', function () {
                var result;
                result = util.getPriority(undefined);
                expect(result).toBeJquery();
                expect(result.is('span')).toBeTruthy();

                result = util.getPriority({priority: 3});
                expect(result).toBeEmptyJquery();
            });
        });

        describe('getAccountName', function () {
            var expect = chai.expect;
            var account_name = 'Pierce Hawthorne';
            it('should return a fallback string for invalid data', function () {
                expect(util.getAccountName(undefined)).to.be.equal('N/A');
            });
            it('should return the account name for all ids others than primary', function () {
                expect(util.getAccountName({id: '553', account_name: account_name})).to.be.equal(account_name);
            });
            it('should return not the account name for the id of the primary account', function () {
                expect(util.getAccountName({id: 'default0', account_name: account_name}))
                    .to.be.a('string').and
                    .not.to.be.equal(account_name);
            });
        });

        describe('timestamp functions', function () {
            var expect = chai.expect;
            it('should return "unknown" for invalid data', function () {
                expect(util.getTime(undefined), 'getTime').to.be.equal('unbekannt');
                expect(util.getDateTime(undefined), 'getDateTime').to.be.equal('unbekannt');
                expect(util.getFullDate(undefined), 'getFullDate').to.be.equal('unbekannt');
                expect(util.getSmartTime(undefined), 'getSmartTime').to.be.equal('unbekannt');
            });
            it('should return a date string for valid data', function () {
                expect(util.getTime(1379508350), 'getTime').to.be.equal('16.1.1970');
                expect(util.getDateTime(1379508350), 'getDateTime').to.be.equal('16.1.1970 23:11');
                expect(util.getFullDate(1379508350), 'getFullDate').to.be.equal('16.1.1970 23:11');
            });
        });

        describe('some of the check functions', function () {
            //TODO: use chai-all plugin
            var expect = chai.expect;
            it('should return "undefined" for invalid data', function () {
                //invalid: returns undefined
                expect(util.isUnseen(undefined), 'isUnseen').is.undefined;
                expect(util.isDeleted(undefined), 'isDeleted').is.undefined;
                expect(util.isSpam(undefined), 'isSpam').is.undefined;
                expect(util.byMyself(undefined), 'byMyself').is.undefined;
                expect(util.getInitialDefaultSender(undefined), 'getInitialDefaultSender').is.undefined;
            });
            it('should return "false" for invalid data', function () {
                expect(util.isAnswered(undefined), 'isAnswered').is.false;
                expect(util.isForwarded(undefined), 'isForwarded').is.false;
                expect(util.isAttachment(undefined), 'isAttachment').is.false;
                expect(util.isAttachment([]), 'isAttachment').is.false;
                expect(util.hasOtherRecipients(undefined), 'hasOtherRecipients').is.false;
            });
            it('should return "0" for invalid data', function () {
                expect(util.count(undefined), 'count').to.be.a('number').and.to.be.equal(0);
            });
            it('should return an empty array for invalid data', function () {
                expect(util.getAttachments(undefined), 'getInitialDefaultSender')
                    .to.be.an('array').and
                    .to.be.empty;
            });
            it('should return a boolean for valid data', function () {
                //valid: returns true
                expect(util.isUnseen({flags: 16}), 'isUnseen').is.true;
                expect(util.isDeleted({flags: 2}), 'isDeleted').is.true;
                expect(util.isSpam({flags: 128}), 'isSpam').is.true;
                expect(util.isAnswered({flags: 1}), 'isAnswered').is.true;
                expect(util.isForwarded({flags: 256}), 'isForwarded').is.true;
                expect(util.isAttachment({id: 4711, parent: {}}), 'isAttachment').is.true;
                expect(util.hasOtherRecipients({to: [['', 'some address']], cc: '', bcc: ''}), 'hasOtherRecipients').is.true;
                //valid: returns false
                expect(util.isUnseen({flags: 32}), 'isUnseen').is.false;
                expect(util.isDeleted({flags: 1}), 'isDeleted').is.false;
                expect(util.isSpam({flags: 64}), 'isSpam').is.false;
                expect(util.isAnswered({flags: 2}), 'isAnswered').is.false;
                expect(util.isAttachment({id: 4711}), 'isAttachment').is.false;
                expect(util.isForwarded({flags: 128}), 'isForwarded').is.false;
            });
            it('should return a number for valid data', function () {
                expect(util.count([{}, {}, {thread: [1, 2]}]))
                    .to.be.a('number').and
                    .to.equal(4);
            });
        });
    });
});
