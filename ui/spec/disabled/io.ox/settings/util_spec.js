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
    'io.ox/settings/util',
    'waitsFor'
], function (util, waitsFor) {

    describe('Settings Utilities', function () {

        describe('yellOnReject function', function () {

            it('should always return a deferred', function () {
                expect(util.yellOnReject(undefined)).to.exist; //FIXME: check for deferred
            });

            describe('reject should trigger a notification', function () {

                var def, text;

                // reset deferred
                beforeEach(function () {
                    def = new $.Deferred();
                    util.destroy();
                });

                it('with default message (reject without args)', function () {
                    return util.yellOnReject(def.reject()).then(_.noop, function () {
                        //yell defers appending of the message, so we need to busy wait
                        return waitsFor(function () {
                            return $('.io-ox-alert-error > .message > div').length > 0;
                        });
                    }).then(function () {
                        text = $('.io-ox-alert-error > .message > div').text();
                        expect(text).to.equal('unknown');
                    });
                });

                it('with custom error message for MAIL_FILTER-0015', function () {
                    var e = { code: 'MAIL_FILTER-0015' };
                    return util.yellOnReject(def.reject(e)).then(_.noop, function () {
                        //yell defers appending of the message, so we need to busy wait
                        return waitsFor(function () {
                            return $('.io-ox-alert-error > .message > div').length > 0;
                        });
                    }).then(function () {
                        text = $('.io-ox-alert-error').find('.message').find('div').text();
                        expect(text).not.to.be.empty;
                        expect(text).not.to.equal('unknown');
                    });
                });
            });
        });
    });
});
