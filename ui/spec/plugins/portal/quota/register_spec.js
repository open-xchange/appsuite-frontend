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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */
define([
    'plugins/portal/quota/register',
    'io.ox/core/extensions',
    'spec/shared/capabilities'
], function (quotaPlugin, ext, caputil) {
    'use strict';

    var capabilities = caputil.preset('common').init('plugins/portal/quota/register', quotaPlugin);

    describe('portal Quota plugin', function () {
        beforeEach(function (done) {
            this.server.responses = this.server.responses.filter(function (r) {
                return r.method !== 'PUT' || String(r.url) !== '/api\\/multiple\\?/';
            });
            capabilities.reset().then(function () {
                done();
            });
        });

        describe('should', function () {
            beforeEach(function (done) {
                this.server.respondWith('PUT', /api\/multiple/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                            '[{ "timestamp":1368791630910,"data": {"quota":1200, "countquota":50, "use":1200, "countuse":5}},' +
                             '{ "timestamp":1368791630910,"data": {"quota":' + 100 * 1024 * 1024 + ', "use":' + 91 * 1024 * 1024 + '} }]');
                });
                this.node = $('<div>');

                var def = ext.point('io.ox/portal/widget/quota').invoke('preview', this.node, {});

                def._wrapped[0].done(function () {
                    done();
                });
            });

            afterEach(function () {
                this.node.remove();
            });

            it('draw content', function () {
                expect(this.node.children()).to.have.length(1);
            });
            it('have 3 bars', function () {
                expect(this.node.find('li.paragraph')).to.have.length(3);
                expect(this.node.find('.progress')).to.have.length(3);
            });
            it('show correct values', function () {
                expect(this.node.find('.quota-memory-mail').text()).to.equal('100%');
                expect(this.node.find('.quota-memory-file').text()).to.equal('91 MB von 100 MB');
                expect(this.node.find('.quota-mailcount').text()).to.equal('5 von 50');
            });
            it('show correct bar colors and lengths', function () {
                expect(this.node.find('.plugins-portal-quota-memory-filebar').children().first().hasClass('bar-danger')).to.be.true;
                expect(this.node.find('.plugins-portal-quota-memory-filebar').children().first().css('width')).to.equal('91%');
                expect(this.node.find('.plugins-portal-quota-memory-mailbar').children().first().hasClass('bar-danger')).to.be.true;
                expect(this.node.find('.plugins-portal-quota-memory-mailbar').children().first().css('width')).to.equal('100%');
                expect(this.node.find('.plugins-portal-quota-mailcountbar').children().first().hasClass('bar-danger')).to.be.false;
                expect(this.node.find('.plugins-portal-quota-mailcountbar').children().first().css('width')).to.equal('10%');
            });
        });
        describe('should', function () {
            beforeEach(function (done) {
                this.server.respondWith('PUT', /api\/multiple/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                            '[{ "timestamp":1368791630910,"data": {"quota":0, "countquota":-1, "use":0, "countuse":5}},' +
                             '{ "timestamp":1368791630910,"data": {"quota":-1024, "use":' + -91 * 1024 * 1024 + '} }]');
                });
                this.node = $('<div>');

                var def = ext.point('io.ox/portal/widget/quota').invoke('preview', this.node, {});
                def._wrapped[0].done(function () {//wait till its actually drawn
                    done();
                });
            });
            it('show correct unlimited values', function () {
                expect(this.node.find('li.paragraph')).to.have.length(3);
                expect(this.node.find('.progress')).to.have.length(0);

                expect(this.node.find('.quota-memory-mail').text()).to.equal('unbegrenzt');
                expect(this.node.find('.quota-memory-file').text()).to.equal('unbegrenzt');
                expect(this.node.find('.quota-mailcount').text()).to.equal('unbegrenzt');
            });
        });
        describe('should', function () {
            beforeEach(function (done) {
                capabilities.disable('infostore');
                this.server.respondWith('PUT', /api\/multiple/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' },
                            '[{ "timestamp":1368791630910,"data": {"quota":0, "countquota":-1, "use":0, "countuse":5}},' +
                             '{ "timestamp":1368791630910,"data": {"quota":-1024, "use":' + -91 * 1024 * 1024 + '} }]');
                });
                this.node = $('<div>');

                var def = ext.point('io.ox/portal/widget/quota').invoke('preview', this.node, {});
                def._wrapped[0].done(function () {//wait till its actually drawn
                    done();
                });
            });
            it('react to missing infostore capability', function () {
                expect(this.node.find('li.paragraph')).to.have.length(2);
                expect(this.node.find('.progress')).to.have.length(0);
            });
        });
    });
});
