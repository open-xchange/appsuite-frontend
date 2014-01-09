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
define(['plugins/portal/birthdays/register',
        'io.ox/core/extensions',
        'io.ox/core/date',
        'fixture!plugins/portal/birthdays/birthdaysTestData.json'], function (birthdayPlugin, ext, date, testData) {

    //update testdata
    testData[0].birthday = new date.UTC().getTime() - date.DAY;//yesterday
    testData[1].birthday = new date.UTC().getTime();//today
    testData[2].birthday = new date.UTC().getTime() + date.DAY;//tomorrow

    describe('portal Birthday plugin', function () {
        
        describe('should', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/contacts\?action=birthdays/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                            '{ "timestamp":1368791630910,"data": ' + JSON.stringify(testData) + '}');
                });
                this.node = $('<div>');
                this.baton  = ext.Baton();
                var def = ext.point('io.ox/portal/widget/birthdays').invoke('load', this.node, this.baton);
                waitsFor(function () {
                    return def._wrapped[0].state() === 'resolved';
                });
                runs(function () {
                    def = ext.point('io.ox/portal/widget/birthdays').invoke('preview', this.node, this.baton);
                });
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
            it('draw all birthdays', function () {
                expect(this.node.find('li').length).toEqual(5);
            });
            it('not draw year if its year 1', function () {
                expect($(this.node.find('.accent')[4]).text()).toEqual('10.6.');
            });
            it('recognize yesterday/today/tomorrow', function () {
                expect($(this.node.find('.accent')[0]).text()).toEqual('Gestern');
                expect($(this.node.find('.accent')[1]).text()).toEqual('Heute');
                expect($(this.node.find('.accent')[2]).text()).toEqual('Morgen');
            });
            describe('have', function () {
                it('a sidepopup', function () {
                    ext.point('io.ox/portal/widget/birthdays').invoke('draw', this.node, this.baton);
                    waitsFor(function () {
                        return this.node.find('.io-ox-portal-birthdays').length === 1;
                    }, 'open popup', ox.testTimeout);
                });
            });
        });
        describe('should', function () {
            beforeEach(function () {
                this.server.respondWith('GET', /api\/contacts\?action=birthdays/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'},
                            '{ "timestamp":1368791630910,"data": []}');
                });
                this.node = $('<div>');
                var baton  = ext.Baton();
                var def = ext.point('io.ox/portal/widget/birthdays').invoke('load', this.node, baton);
                waitsFor(function () {
                    return def._wrapped[0].state() === 'resolved';
                });
                runs(function () {
                    def = ext.point('io.ox/portal/widget/birthdays').invoke('preview', this.node, baton);
                });
                waitsFor(function () {//wait till its actually drawn
                    return this.node.children().length === 1;
                });
            });

            afterEach(function () {
                this.node.remove();
            });

            it('draw correct empty message', function () {
                expect(this.node.children().length).toEqual(1);
                expect(this.node.children().first().is('ul')).toBeTruthy();
                expect(this.node.children().children().first().is('li')).toBeTruthy();
                expect(this.node.find('li').children().length).toEqual(0);
                expect(this.node.find('li').first().text()).toEqual('Keine Geburtstage in den nächsten 12 Wochen');
            });
        });
    });
});
