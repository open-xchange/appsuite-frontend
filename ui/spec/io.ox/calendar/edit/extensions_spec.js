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

define(['io.ox/core/extensions',
    'fixture!browser_support/userAgents.json',
    'io.ox/core/capabilities',
    'io.ox/calendar/edit/extensions'], function (ext, userAgents, capabilities) {
    'use strict';

    describe('Edit extensions ', function () {
        describe('find a free time link', function () {
            let capStub;
            beforeEach(function () {
                this.server.responses = this.server.responses.filter(function (r) {
                    return r.method !== 'PUT' || String(r.url) !== '/api\\/multiple\\?/';
                });
                capStub = sinon.stub(capabilities, 'has');
                capStub.withArgs('freebusy !alone !guest').returns(true);
            });

            afterEach(function () {
                capStub.restore();
                // reset memoization cache
                _.device.cache = {};
                _.device.loadUA(window.navigator);
            });
            it('should appear on desktop devices', function () {
                _.device.loadUA(userAgents.valid.Chrome[64]);
                var node = $('<div>');
                ext.point('io.ox/calendar/edit/section').get('find-free-time-1', function (extension) {
                    extension.draw.call(node, {});
                    expect(node.find('.find-free-time').length).to.equal(1);
                });
            });

            it('should not appear on smartphones', function () {
                _.device.loadUA(userAgents.valid.iOS[10]);
                var node = $('<div>');
                ext.point('io.ox/calendar/edit/section').get('find-free-time-1', function (extension) {
                    extension.draw.call(node, {});
                    expect(node.find('.find-free-time').length).to.equal(0);
                });
            });

            it('should appear not appear on tablets ', function () {
                _.device.loadUA(userAgents.valid.iOS[11]);
                var node = $('<div>');
                ext.point('io.ox/calendar/edit/section').get('find-free-time-1', function (extension) {
                    extension.draw.call(node, {});
                    expect(node.find('.find-free-time').length).to.equal(0);
                });
            });
        });
    });
});
