/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
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
                                ['017012345678','017012345678' + suffix]
                            ],
                            to: [
                                ['017012345678','017012345678' + suffix],
                                ['017012345678','017012345678' + suffix]
                            ]
                        };
                    expect(util.removeChannelSuffix('017012345678' + suffix + ',asdadjaldk,017012345678' + suffix + ',asduhadsasd'))
                    .toEqual('017012345678,asdadjaldk,017012345678,asduhadsasd');
                    expect(util.removeChannelSuffix(mail))
                    .toEqual({from: [['017012345678','017012345678']],to: [['017012345678','017012345678'],['017012345678','017012345678']]})
                }
            });
            //FIXME: capability in utils is stored on lib load
            xit('should handle empty from fields', function () {
                if (capabilities.has('msisdn')) {
                    var mail = {
                        from: [],
                        to: [
                            ['017012345678','017012345678' + util.getChannelSuffixes().msisdn]
                        ]
                    }
                    expect(util.removeChannelSuffix(mail))
                        .toEqual({from: [], to: [['017012345678','017012345678']]});
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
                //not array
                expect(util.getDisplayName(email)).toBeEmpty();
                expect(util.getDisplayName('')).toBeEmpty();
                expect(util.getDisplayName({})).toBeEmpty();
                expect(util.getDisplayName(undefined)).toBeEmpty();
                expect(util.getDisplayName(null)).toBeEmpty();
                //invalid
                expect(util.getDisplayName([])).toBeEmpty();

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
            it('should return a string', function () {
                var result;
                //fallback
                result = util.getAccountName(undefined);
                expect(result).toEqual('N/A');
                //not primary
                result = util.getAccountName({id: '553', account_name: 'Pierce'});
                expect(result).toEqual('Pierce');
                //primary
                result = util.getAccountName({id: 'default0'});
                expect(result).toBeString();
            });
        });


        describe('timestamp functions', function () {
            it('should return a string', function () {
                var result;
                //invalid
                result = util.getTime(undefined);
                expect(result).toBeString();
                result = util.getDateTime(undefined);
                expect(result).toBeString();
                result = util.getFullDate(undefined);
                expect(result).toBeString();
                result = util.getSmartTime(undefined);
                expect(result).toBeString();
                //valid
                result = util.getTime(1379508350);
                expect(result).toEqual('16.1.1970');
                result = util.getDateTime(1379508350);
                expect(result).toEqual('16.1.1970 23:11');
                result = util.getFullDate(1379508350);
                expect(result).toEqual('16.1.1970 23:11');
                result = util.getSmartTime(new Date().getTime());
                expect(result).toEqual('2 hours ago');
            });
        });

        describe('check functions', function () {
            it('should return "undefined", "false" or "0" for invalid data', function () {
                var result;
                //invalid: returns undefined
                result = util.count(undefined);
                expect(result).toEqual(0);
                result = util.isUnseen(undefined);
                expect(result).toEqual(undefined);
                result = util.isDeleted(undefined);
                expect(result).toEqual(undefined);
                result = util.isSpam(undefined);
                expect(result).toEqual(undefined);
                result = util.byMyself(undefined);
                expect(result).toEqual(undefined);
                result = util.getInitialDefaultSender(undefined);
                expect(result).toEqual(undefined);
                result = util.getInitialDefaultSender();
                expect(result).toEqual(undefined);
                //invalid: returns false
                result = util.isAnswered(undefined);
                expect(result).toEqual(false);
                result = util.isForwarded(undefined);
                expect(result).toEqual(false);
                result = util.hasOtherRecipients(undefined);
                expect(result).toEqual(false);
                result = util.getAttachments(undefined);
                expect(result).toBeArray();
            });
            it('should return a boolean for valid data', function () {
                var result;
                result = util.count([{},{}, {thread: [1,2]}]);
                expect(result).toEqual(4);

                result = util.isUnseen({flags: 16});
                expect(result).toEqual(true);
                result = util.isUnseen({flags: 32});
                expect(result).toEqual(false);

                result = util.isDeleted({flags: 2});
                expect(result).toEqual(true);
                result = util.isDeleted({flags: 1});
                expect(result).toEqual(false);

                result = util.isSpam({flags: 128});
                expect(result).toEqual(true);
                result = util.isSpam({flags: 64});
                expect(result).toEqual(false);

                result = util.isAnswered({flags: 1});
                expect(result).toEqual(true);
                result = util.isAnswered({flags: 2});
                expect(result).toEqual(false);

                result = util.isForwarded({flags: 256});
                expect(result).toEqual(true);
                result = util.isForwarded({flags: 128});
                expect(result).toEqual(false);

                result = util.hasOtherRecipients({to: [['', 'some address']], cc: '', bcc: ''});
                expect(result).toEqual(true);
            });
        });
    });
});
