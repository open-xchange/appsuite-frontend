/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'io.ox/core/http'
], function (http) {
    'use strict';

    describe('Core HTTP API wrapper', function () {
        describe('non-JSON response (callback)', function () {
            it('should reject the deferred object if request failed', function () {
                this.server.respondWith('POST', /api\/test\?action=fail/, function (xhr) {
                    xhr.respond(200, 'text/html;charset=UTF-8', '<!DOCTYPE html><html><head><META http-equiv="Content-Type" content="text/html; charset=UTF-8"><script type="text/javascript">(parent["callback_new"] || window.opener && window.opener["callback_new"])({"error":"Test error message"})</script></head></html>');
                });
                return http.UPLOAD({
                    module: 'test',
                    params: {
                        action: 'fail'
                    },
                    data: new FormData(),
                    fixPost: true,
                    dataType: 'json'
                }).then(function () {
                    return $.Deferred().reject({ error: 'expected to fail' });
                }, function (result) {
                    expect(result).to.be.an('object');
                    expect(result.error).to.equal('Test error message');
                    return $.when();
                });
            });
        });
    });
});
