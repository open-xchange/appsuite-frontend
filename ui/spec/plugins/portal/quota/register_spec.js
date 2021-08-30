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
    'plugins/portal/quota/register',
    'io.ox/core/extensions',
    'io.ox/core/api/quota',
    'io.ox/core/capabilities'
], function (quotaPlugin, ext, quotaAPI, capabilities) {

    'use strict';

    describe('Portal Quota plugin', function () {

        let capStub;

        beforeEach(function () {
            this.server.responses = this.server.responses.filter(function (r) {
                return r.method !== 'PUT' || String(r.url) !== '/api\\/multiple\\?/';
            });
            capStub = sinon.stub(capabilities, 'has');
            //Default
            capStub.returns(true);
            // we are not a guest
            capStub.withArgs('guest').returns(false);
        });

        afterEach(function () {
            capStub.restore();
        });

        function drawQuotaTo(node) {
            var def = ext.point('io.ox/portal/widget/quota').invoke('preview', node, {});
            return def._wrapped[0];
        }

        const node = $('<div>');

        describe('with user below quota', function () {

            beforeEach(function () {
                this.server.respondWith('PUT', /api\/multiple/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                        '[{ "timestamp":1368791630910,"data": {"quota":1200, "countquota":50, "use":1200, "countuse":5}},' +
                        '{ "timestamp":1368791630910,"data": {"quota":' + 100 * 1024 * 1024 + ', "use":' + 91 * 1024 * 1024 + '} }]');
                });
                return drawQuotaTo(node.empty());
            });

            it('should draw content', function () {
                expect(node.children()).to.have.length(1);
            });

            it('should have 3 bars', function () {
                expect(node.find('li.paragraph')).to.have.length(3);
                expect(node.find('.progress')).to.have.length(3);
            });

            it('should show correct values', function () {
                expect(node.find('li:nth-child(1) .numbers', 'File quota numbers').text()).to.equal('91 MB von 100 MB');
                expect(node.find('li:nth-child(2) .numbers', 'Mail quota numbers').text()).to.equal('1 KB von 1 KB');
                expect(node.find('li:nth-child(3) .numbers', 'Mail count quota numbers').text()).to.equal('5 von 50');
            });

            it('show show correct bar colors and lengths', function () {
                expect(node.find('li:nth-child(1) .progress-bar').hasClass('bar-danger'), 'File quota bar has danger class').to.be.true;
                expect(node.find('li:nth-child(1) .progress-bar').css('width'), 'File quota bar width').to.equal('91%');

                expect(node.find('li:nth-child(2) .progress-bar').hasClass('bar-danger'), 'Mail quota bar has danger class').to.be.true;
                expect(node.find('li:nth-child(2) .progress-bar').css('width'), 'Mail quota bar width').to.equal('100%');

                expect(node.find('li:nth-child(3) .progress-bar').hasClass('bar-danger'), 'Mail count bar has class danger').to.be.false;
                expect(node.find('li:nth-child(3) .progress-bar').css('width'), 'Mail count bar width').to.equal('10%');
            });
        });

        describe('with unlimited quota', function () {

            before(function () {
                quotaAPI.mailQuota.fetched = false;
                quotaAPI.fileQuota.fetched = false;
            });

            beforeEach(function () {
                this.server.respondWith('PUT', /api\/multiple/, function (xhr) {
                    if (xhr.requestBody.indexOf('mail') < 0) {
                        //for whatever reason, the request is fired separately during this test
                        xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                            '[{ "timestamp":1368791630910,"data": {"quota":-1024, "use":' + -91 * 1024 * 1024 + '}}]');
                    } else {
                        xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                            '[{ "timestamp":1368791630910,"data": {"quota":0, "countquota":-1, "use":0, "countuse":5}},' +
                            '{ "timestamp":1368791630910,"data": {"quota":-1024, "use":' + -91 * 1024 * 1024 + '} }]');
                    }
                });

                return drawQuotaTo(node.empty());
            });

            it('show correct unlimited values', function () {
                expect(node.find('li.paragraph')).to.have.length(3);
                expect(node.find('.progress')).to.have.length(0);

                expect(node.find('li:nth-child(1) .numbers').text(), 'File quota text').to.equal('unbegrenzt');
                expect(node.find('li:nth-child(2) .numbers').length, 'Mail quota numbers rendered').to.equal(0);
                expect(node.find('li:nth-child(3) .numbers').length, 'Mail count quota numbers rendered').to.equal(0);
            });
        });

        describe('without infostore capability', function () {

            before(function () {
                quotaAPI.mailQuota.fetched = false;
                //quotaAPI.fileQuota.fetched = true;
            });

            beforeEach(function () {
                this.server.respondWith('PUT', /api\/multiple/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                        '[{ "timestamp":1368791630910,"data": {"quota":0, "countquota":-1, "use":0, "countuse":5}}]');
                });
                capStub.withArgs('infostore').returns(false);
                return drawQuotaTo(node.empty());
            });

            it('react to missing infostore capability', function () {
                expect(node.find('li.paragraph')).to.have.length(2);
                expect(node.find('.progress')).to.have.length(0);
            });
        });
    });
});
