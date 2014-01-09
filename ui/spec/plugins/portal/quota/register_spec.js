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
define(['plugins/portal/quota/register',
        'io.ox/core/extensions',
        'spec/shared/capabilities'], function (quotaPlugin, ext, caputil) {

    var capabilities = caputil.preset('common').init('plugins/portal/quota/register', quotaPlugin);

    describe('portal Quota plugin', function () {
        beforeEach(function () {
            capabilities.reset();
        });

        describe('should', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/multiple/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                            '[{ "timestamp":1368791630910,"data": {"quota":1200, "countquota":50, "use":1200, "countuse":5}},' +
                             '{ "timestamp":1368791630910,"data": {"quota":' + 100 * 1024 * 1024 + ', "use":' + 91 * 1024 * 1024 + '} }]');
                });
                this.node = $('<div>');

                ext.point('io.ox/portal/widget/quota').invoke('preview', this.node, {});
                waitsFor(function () {//wait till its actually drawn
                    return this.node.children().length === 1;
                });
            });

            afterEach(function () {
                this.node.remove();
            });

            it('draw content', function () {
                expect(this.node.children().length).toEqual(1);
            });
            it('have 3 bars', function () {
                expect(this.node.find('li.paragraph').length).toEqual(3);
                expect(this.node.find('.progress').length).toEqual(3);
            });
            it('show correct values', function () {
                expect(this.node.find('.quota-memory-mail').text()).toEqual('100%');
                expect(this.node.find('.quota-memory-file').text()).toEqual('91 MB von 100 MB');
                expect(this.node.find('.quota-mailcount').text()).toEqual('5 von 50');
            });
            it('show correct bar colors and lengths', function () {
                expect(this.node.find('.plugins-portal-quota-memory-filebar').children().first().hasClass('bar-danger')).toBeTruthy();
                expect(this.node.find('.plugins-portal-quota-memory-filebar').children().first().css('width')).toEqual('91%');
                expect(this.node.find('.plugins-portal-quota-memory-mailbar').children().first().hasClass('bar-danger')).toBeTruthy();
                expect(this.node.find('.plugins-portal-quota-memory-mailbar').children().first().css('width')).toEqual('100%');
                expect(this.node.find('.plugins-portal-quota-mailcountbar').children().first().hasClass('bar-danger')).toBeFalsy();
                expect(this.node.find('.plugins-portal-quota-mailcountbar').children().first().css('width')).toEqual('10%');
            });
        });
        describe('should', function () {
            beforeEach(function () {
                this.server.respondWith('PUT', /api\/multiple/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                            '[{ "timestamp":1368791630910,"data": {"quota":0, "countquota":-1, "use":0, "countuse":5}},' +
                             '{ "timestamp":1368791630910,"data": {"quota":-1024, "use":' + -91 * 1024 * 1024 + '} }]');
                });
                this.node = $('<div>');

                ext.point('io.ox/portal/widget/quota').invoke('preview', this.node, {});
                waitsFor(function () {//wait till its actually drawn
                    return this.node.children().length === 1;
                });
            });
            it('show correct unlimited values', function () {
                expect(this.node.find('li.paragraph').length).toEqual(3);
                expect(this.node.find('.progress').length).toEqual(0);

                expect(this.node.find('.quota-memory-mail').text()).toEqual('unbegrenzt');
                expect(this.node.find('.quota-memory-file').text()).toEqual('unbegrenzt');
                expect(this.node.find('.quota-mailcount').text()).toEqual('unbegrenzt');
            });
        });
        describe('should', function () {
            beforeEach(function () {
                capabilities.disable('infostore');
                this.server.respondWith('PUT', /api\/multiple/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                            '[{ "timestamp":1368791630910,"data": {"quota":0, "countquota":-1, "use":0, "countuse":5}},' +
                             '{ "timestamp":1368791630910,"data": {"quota":-1024, "use":' + -91 * 1024 * 1024 + '} }]');
                });
                this.node = $('<div>');

                ext.point('io.ox/portal/widget/quota').invoke('preview', this.node, {});
                waitsFor(function () {//wait till its actually drawn
                    return this.node.children().length === 1;
                });
            });
            it('react to missing infostore capability', function () {
                expect(this.node.find('li.paragraph').length).toEqual(2);
                expect(this.node.find('.progress').length).toEqual(0);
            });
        });
    });
});
