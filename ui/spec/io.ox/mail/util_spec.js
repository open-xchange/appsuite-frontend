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
define([
    'io.ox/mail/util',
    'spec/shared/capabilities'
], function (util, caputil) {

    'use strict';

    var capabilities = caputil.preset('common').init('io.ox/mail/util', util);

    describe('Utilities for mail:', function () {

        describe('has some capability depending msisdn methods that', function () {

            beforeEach(function (done) {
                capabilities.reset().done(function () {
                    done();
                });
            });

            describe('work with disabled capability and', function () {

                beforeEach(function () {
                    capabilities.enable('msisdn');
                });

                it('should correctly identify channel "email" or "phone"', function () {
                    expect(util.getChannel('017012345678')).to.equal('phone');
                    expect(util.getChannel('+17012345678')).to.equal('phone');
                    expect(util.getChannel('(01701) 23456-78')).to.equal('phone');
                });

                it('should correctly remove "' + util.getChannelSuffixes().msisdn +  '" typesuffix from data', function () {

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
                    .to.deep.equal('017012345678,asdadjaldk,017012345678,asduhadsasd');
                    expect(util.removeChannelSuffix(mail))
                    .to.deep.equal({
                            from: [
                                ['017012345678', '017012345678']
                            ],
                            to: [
                                ['017012345678', '017012345678'],
                                ['017012345678', '017012345678']
                            ]
                        });
                });
                it('should handle empty from fields', function () {
                    var mail = {
                        from: [],
                        to: [
                            ['017012345678', '017012345678' + util.getChannelSuffixes().msisdn]
                        ]
                    };
                    expect(util.removeChannelSuffix(mail))
                        .to.deep.equal({from: [], to: [['017012345678', '017012345678']]});
                });
            });

            describe('work with enabled capability and', function () {

                beforeEach(function () {
                    capabilities.disable('msisdn');
                });

                it('should correctly identify channel "email" or "phone"', function () {
                    expect(util.getChannel('017012345678')).to.equal('email');
                    expect(util.getChannel('+17012345678')).to.equal('email');
                    expect(util.getChannel('(01701) 23456-78')).to.equal('email');
                });
            });
        });

        describe('has some capability independent msisdn methods and', function () {

            it('should correctly identify channel "email" or "phone"', function () {

                //without considering activated capability
                expect(util.getChannel(util.getChannelSuffixes().msisdn)).to.equal('phone');
                expect(util.getChannel('017012345678' + util.getChannelSuffixes().msisdn)).to.equal('phone');
                expect(util.getChannel('horst.matuschek@' + util.getChannelSuffixes().msisdn)).to.equal('phone');

                expect(util.getChannel('017012345678', false)).to.equal('phone');
                expect(util.getChannel('+17012345678', false)).to.equal('phone');
                expect(util.getChannel('(01701) 23456-78', false)).to.equal('phone');
                expect(util.getChannel('office (01701) 23456-78', false)).to.equal('email');
            });

            it('should correctly remove inalid chars from phone numbers', function () {
                expect(util.cleanupPhone('+17012345678')).to.equal('+17012345678');
                expect(util.cleanupPhone('(01701) 23456-78')).to.equal('017012345678');
                expect(util.cleanupPhone('01701/2345678')).to.equal('017012345678');
            });
        });

        describe('parse recepient', function () {
            it('should work with plain mail address strings', function () {
                var result = util.parseRecipient('julian.baeume@open-xchange.com');
                expect(result).to.deep.equal(['julian.baeume', 'julian.baeume@open-xchange.com']);
            });

            it('should work with display name and mail address strings', function () {
                var result = util.parseRecipient('"Julian Bäume" <julian.baeume@open-xchange.com>');
                expect(result).to.deep.equal(['Julian Bäume', 'julian.baeume@open-xchange.com']);
            });
        });

        describe('display name', function () {

            var name = 'pierce hawthorne',
                email = 'pierce.hawthorne@greendalecommunitycollege.com';

            it('should return empty string if data is invalid or empty', function () {
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
                expect(util.getDisplayName(['', email])).to.equal(email);
                expect(util.getDisplayName([undefined, email])).to.equal(email);
                expect(util.getDisplayName([null, email])).to.equal(email);
            });

            it('should return the unescaped name', function () {
                //workin
                expect(util.getDisplayName([name, email])).to.equal(name);
                expect(util.getDisplayName([name, ''])).to.equal(name);
                expect(util.getDisplayName([name, undefined])).to.equal(name);
                expect(util.getDisplayName([name, null])).to.equal(name);
            });
        });

        describe('from check', function () {

            it('should return false on invalid date', function () {
                //invalid
                //FIXME: API seems "wrong" to me. hasFrom should return boolean, always.
                expect(util.hasFrom('')).to.be.empty;
                expect(util.hasFrom(null)).to.be.null;
                expect(util.hasFrom(undefined)).to.be.undefined;
                expect(util.hasFrom({})).to.be.empty;
                expect(util.hasFrom([])).to.be.empty;
                expect(util.hasFrom({ from: [[undefined, '']]})).to.be.false;
                //valid
                expect(util.hasFrom({ from: [[undefined, 'some email']]})).to.be.true;
            });
        });

        describe('getFrom()', function () {

            var data = { from: [['Foo', 'foo@domain.tld']] };

            it('should return jQuery instance', function () {
                var result = util.getFrom(data);
                expect(result).to.be.an.instanceof($);
            });

            it('should be a span node', function () {
                var result = util.getFrom(data);
                expect($(result).first().is('span')).to.be.true;
            });

            it('should have proper class', function () {
                var result = util.getFrom(data);
                expect($(result).first().hasClass('person')).to.be.true;
            });

            it('should have proper text', function () {
                var result = util.getFrom(data);
                expect($(result).text()).to.equal('Foo');
            });

            it('should respond to missing data (from)', function () {
                var result = util.getFrom();
                expect($(result).text()).to.equal('Unbekannter Absender');
            });

            it('should respond to missing data (others)', function () {
                var result = util.getFrom({}, 'to');
                expect($(result).text()).to.equal('Keine Empfänger');
            });

            it('should list multiple persons comma-separated', function () {
                var result = util.getFrom({ from: [['Foo', 'foo@domain.tld'], ['Anna', 'a@domain.tld'], [null, 'address@only.tld']] });
                expect($(result).text()).to.equal('Foo, Anna, address@only.tld');
            });
        });

        describe('format sender', function () {

            it('should return a nicely formated string', function () {
                expect(util.formatSender('""""name""""', 'address', false)).to.equal('name <address>');
                expect(util.formatSender('""""name""""', 'address')).to.equal('"name" <address>');
                expect(util.formatSender(undefined, 'address')).to.equal('address');
                expect(util.formatSender('', 'address')).to.equal('address');
            });
        });

        describe('getPriority', function () {

            it('should return a jquery node', function () {
                var result;
                result = util.getPriority(undefined);
                expect(result.is('span')).to.be.true;
                result = util.getPriority({priority: 3});
                expect(result).to.have.length(0);
            });
        });

        describe('getAccountName', function () {

            var account_name = 'Pierce Hawthorne';

            it('should return a fallback string for invalid date', function () {
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

            it('should return "unknown" for invalid date', function () {
                expect(util.getTime(undefined), 'getTime').to.be.equal('unbekannt');
                expect(util.getDateTime(undefined), 'getDateTime').to.be.equal('unbekannt');
                expect(util.getFullDate(undefined), 'getFullDate').to.be.equal('unbekannt');
            });

            it('should return a date string for valid date', function () {
                expect(util.getTime(1379508350), 'getTime').to.be.equal('16.1.1970');
                expect(util.getDateTime(1379508350), 'getDateTime').to.be.equal('16.1.1970 23:11');
                expect(util.getFullDate(1379508350), 'getFullDate').to.be.equal('16.1.1970 23:11');
            });
        });

        describe('some of the check functions', function () {

            it('should return "undefined" for invalid date', function () {
                //invalid: returns undefined
                expect(util.isUnseen(undefined), 'isUnseen').is.undefined;
                expect(util.isDeleted(undefined), 'isDeleted').is.undefined;
                expect(util.isSpam(undefined), 'isSpam').is.undefined;
                expect(util.byMyself(undefined), 'byMyself').is.undefined;
                expect(util.getInitialDefaultSender(undefined), 'getInitialDefaultSender').is.undefined;
            });

            it('should return "false" for invalid date', function () {
                expect(util.isAnswered(undefined), 'isAnswered').is.false;
                expect(util.isForwarded(undefined), 'isForwarded').is.false;
                expect(util.isAttachment(undefined), 'isAttachment').is.false;
                expect(util.isAttachment([]), 'isAttachment').is.false;
                expect(util.hasOtherRecipients(undefined), 'hasOtherRecipients').is.false;
            });

            it('should return "0" for invalid date', function () {
                expect(util.count(undefined), 'count').to.be.a('number').and.to.be.equal(0);
            });

            it('should return an empty array for invalid date', function () {
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

        describe('signature handling', function () {
            describe('for HTML mails', function () {
                it('should clean plain text signatures containing < and >', function () {
                    var clean = util.signatures.cleanAdd('Test <test@example.com>', true);
                    expect(clean).to.equal('Test &lt;test@example.com&gt;');
                });
                it('should clean HTML signatures', function () {
                    var clean = util.signatures.cleanAdd('<p>Test &lt;test@example.com&gt;</p>', true);
                    expect(clean).to.equal('<p>Test &lt;test@example.com&gt;</p>');
                });
            });
            describe('for text mails', function () {
                it('should clean plain text signatures containing < and >', function () {
                    var clean = util.signatures.cleanAdd('Test <test@example.com>', false);
                    expect(clean).to.equal('Test <test@example.com>');
                });

                it('should clean HTML signatures', function () {
                    var clean = util.signatures.cleanAdd('<p>Test &lt;test@example.com&gt;</p>', false);
                    expect(clean).to.equal('Test <test@example.com>');
                });

                it('should "trim" signatures (remove trailing white-space)', function () {
                    var clean = util.signatures.cleanAdd('<p>Test &lt;test@example.com&gt;</p>\n ', false);
                    expect(clean).to.equal('Test <test@example.com>');
                });
            });
        });
    });
});
