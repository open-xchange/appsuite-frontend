/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['io.ox/settings/util'], function (util) {

    describe('Utilities for settings:', function () {
        describe('yellOnReject function', function () {
            it('should always return a deferred', function () {
                expect(util.yellOnReject(undefined)).toBeDeferred();
            });

            describe('reject should trigger a notification', function () {
                var expect = chai.expect,
                    e = {
                        error: 'test error message',
                        error_params: ['test error param']
                    }, def, text;

                //reset deferred
                beforeEach(function () {
                    def = new $.Deferred();
                    $(document.body).empty();
                });

                it('with default message (reject without args)', function () {
                    util.yellOnReject(def.reject());
                    text = $(document.body).find('.io-ox-alert-error').find('.message').find('div').text();
                    expect('unknown').to.equal(text);
                });
                it('with custom error message for MAIL_FILTER-0015', function () {
                    var e = {
                            code: 'MAIL_FILTER-0015'
                        };
                    util.yellOnReject(def);
                    def.reject(e);
                    text = $(document.body).find('.io-ox-alert-error').find('.message').find('div').text();
                    expect(text).not.to.equal('unknown');
                });

                describe('with the submitted main error message', function () {
                    afterEach(function () {
                        text = $(document.body).find('.io-ox-alert-error').find('.message').find('div').text();
                        expect(text).to.equal(e.error);
                    });

                    it('if error_params is undefined', function () {
                        var e = {
                                error: 'test error message',
                                error_params: []
                            };
                        def.reject(e);
                        util.yellOnReject(def);
                    });
                    it('if options is disabled', function () {
                        var e = {
                                error: 'test error message',
                                error_params: ['test error param']
                            };
                        def.reject(e);
                        util.yellOnReject(def, {details: false});
                    });
                });

                describe('with a detailed error message', function () {
                    afterEach(function () {
                        def.reject(e);
                        text = $(document.body).find('.io-ox-alert-error').find('.message').find('div').text();
                        expect(text).to.equal(e.error_params[0]);
                    });

                    it('if options is enabled', function () {
                        util.yellOnReject(def, {details: true});
                    });
                    it('if options is undefined', function () {
                        util.yellOnReject(def, {details: undefined});
                    });
                    it('if options is unset', function () {
                        util.yellOnReject(def, {});
                    });

                });
            });
        });
    });
});
