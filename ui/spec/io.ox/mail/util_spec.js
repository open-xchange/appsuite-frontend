/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
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
    'io.ox/mail/util'
], function (util) {

    'use strict';

    describe('Mail Utilities:', function () {

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
                expect(util.hasFrom({})).to.be.false;
                expect(util.hasFrom([])).to.be.false;
                expect(util.hasFrom({ from: [[undefined, '']] })).to.be.false;
                //valid
                expect(util.hasFrom({ from: [[undefined, 'some email']] })).to.be.true;
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
                var result = util.getFrom({}, { field: 'to' });
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

                result = util.getPriority({ priority: 3 });
                expect(result).to.have.length(0);
            });
        });

        describe('getAccountName', function () {

            var account_name = 'Pierce Hawthorne';

            it('should return a fallback string for invalid date', function () {
                expect(util.getAccountName(undefined)).to.be.equal('N/A');
            });

            it('should return the account name for all ids others than primary', function () {
                expect(util.getAccountName({ id: '553', account_name: account_name })).to.be.equal(account_name);
            });

            it('should return not the account name for the id of the primary account', function () {
                expect(util.getAccountName({ id: 'default0', account_name: account_name }))
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
                moment.tz.setDefault('Europe/Berlin');
                expect(util.getTime(1379508350), 'getTime').to.be.equal('17.1.1970');
                expect(util.getDateTime(1379508350), 'getDateTime').to.be.equal('17.1.1970 00:11');
                expect(util.getFullDate(1379508350), 'getFullDate').to.be.equal('17.1.1970 00:11');
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

            it('should normalize a string-based list of domains and mail addresses', function () {
                var list = ' alice@example.com,  ,      \nexample.de\nbob@example.org ';
                expect(util.asList(list)).to.include('alice@example.com');
                expect(util.asList(list)).to.include('example.de');
                expect(util.asList(list)).to.include('bob@example.org');
                expect(util.asList(list)).to.be.an('array').and.has.lengthOf(3);
            });

            it('should identify whitelisted mail addresses', function () {
                var whitelist = 'alice@example.com, example.de, bob@example.org';
                // empty
                expect(util.isWhiteListed('bob@example.com')).is.false;
                expect(util.isWhiteListed('bob@example.com', '')).is.false;
                // strings
                expect(util.isWhiteListed('alice@example.com', whitelist)).is.true;
                expect(util.isWhiteListed('bob@example.de', whitelist)).is.true;
                expect(util.isWhiteListed('alice@example.org', whitelist)).is.false;
                expect(util.isWhiteListed('bob@example.com', whitelist)).is.false;
                // mail object
                expect(util.isWhiteListed({ from: [['', 'alice@example.com']] }, whitelist)).is.true;
                expect(util.isWhiteListed({ from: [['', 'bob@example.com']] }, whitelist)).is.false;
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
                expect(util.isUnseen({ flags: 16 }), 'isUnseen').is.true;
                expect(util.isDeleted({ flags: 2 }), 'isDeleted').is.true;
                expect(util.isSpam({ flags: 128 }), 'isSpam').is.true;
                expect(util.isAnswered({ flags: 1 }), 'isAnswered').is.true;
                expect(util.isForwarded({ flags: 256 }), 'isForwarded').is.true;
                expect(util.isAttachment({ id: 4711, parent: {} }), 'isAttachment').is.true;
                expect(util.hasOtherRecipients({ to: [['', 'some address']], cc: '', bcc: '' }), 'hasOtherRecipients').is.true;
                //valid: returns false
                expect(util.isUnseen({ flags: 32 }), 'isUnseen').is.false;
                expect(util.isDeleted({ flags: 1 }), 'isDeleted').is.false;
                expect(util.isSpam({ flags: 64 }), 'isSpam').is.false;
                expect(util.isAnswered({ flags: 2 }), 'isAnswered').is.false;
                expect(util.isAttachment({ id: 4711 }), 'isAttachment').is.false;
                expect(util.isForwarded({ flags: 128 }), 'isForwarded').is.false;
            });

            it('should return a number for valid data', function () {
                expect(util.count([{}, {}, { thread: [1, 2] }]))
                    .to.be.a('number').and
                    .to.equal(4);
            });
        });
    });
});
