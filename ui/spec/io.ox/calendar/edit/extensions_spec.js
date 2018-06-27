/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
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
