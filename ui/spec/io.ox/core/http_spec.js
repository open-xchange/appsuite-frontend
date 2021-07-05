/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define([
    'io.ox/core/http'
], function (http) {
    'use strict';

    describe('Core HTTP API wrapper', function () {
        describe('non-JSON response (callback)', function () {
            it('should reject the deferred object if request failed', function () {
                this.server.respondWith('POST', /api\/test\?action=fail/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/html;charset=UTF-8' }, '<!DOCTYPE html><html><head><META http-equiv="Content-Type" content="text/html; charset=UTF-8"><script type="text/javascript">(parent["callback_new"] || window.opener && window.opener["callback_new"])({"error":"Test error message"})</script></head></html>');
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
                    console.info(arguments);
                    return $.Deferred().reject({ error: 'expected to fail' });
                }, function (result) {
                    expect(result).to.be.an('object');
                    expect(result.error).to.equal('Test error message');
                    return $.when();
                });
            });
        });

        describe('disconnect mode', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/needs_auth\?action=wait/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'application/json' }, '{ "data": { "status": "success" } }');
                });
            });

            it('should not fulfill promise until reconnected', function () {
                expect(http.isDisconnected()).to.equal(false);
                http.disconnect();
                var def = http.GET({
                    module: 'needs_auth',
                    params: { action: 'wait' }
                }).then(function (result) {
                    expect(result.status).to.equal('success');
                });
                expect(def.state(), 'request in pending state').to.equal('pending');
                expect(http.isDisconnected()).to.equal(true);
                http.reconnect();
                return def;
            });

            describe('events triggered on http module', function () {
                it('should be synchronuous if no requests happened', function () {
                    var spy = sinon.spy();
                    http.on('disconnect', spy);
                    http.on('reconnect', spy);
                    http.disconnect();
                    expect(spy.calledOnce, 'event handler called once').to.equal(true);
                    http.reconnect();
                    expect(spy.calledTwice, 'event handler called twice').to.equal(true);
                });

                it('should defer reconnect event until after pending requests finished', function () {
                    var spy = sinon.spy(),
                        def = $.Deferred();
                    http.on('disconnect', spy);
                    http.on('reconnect', def.resolve);
                    http.disconnect();

                    http.GET({
                        module: 'needs_auth',
                        params: { action: 'wait' }
                    }).then(function (result) {
                        expect(result.status).to.equal('success');
                    });
                    expect(spy.calledOnce, 'event handler called once').to.equal(true);
                    http.reconnect();
                    return def;
                });
            });
        });
    });
});
