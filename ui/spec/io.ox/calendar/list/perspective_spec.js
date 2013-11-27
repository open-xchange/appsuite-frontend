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
 * @author Alexander Quast <alexander.quast@open-xchange.com>
 */

define(['io.ox/calendar/main'], function (main) {

    function Done() {
        var f = function () {
            return f.value;
        };
        f.value = false;
        f.yep = function () {
            f.value = true;
        };
        return f;
    };

    var responseAll = {
        "timestamp":1385041701149,
        "data":[
            [268565,21401,false,null,null,1385042400000,"Termin 1",1385046000000,"Confroom 1",false,1,[{"id":249,"confirmation":1}],"alexander.quast@open-xchange.com",249,249,null,null,null,null,null,null,null,[{"id":249,"type":1}]],
            [268566,21401,false,null,null,1385128800000,"Termin 2",1385132400000,"Confroom 2",false,4,[{"id":249,"confirmation":1}],"alexander.quast@open-xchange.com",249,249,null,null,null,null,null,null,null,[{"id":249,"type":1}]]
        ]
    };

    describe('calendar app and the corresponding listview ', function () {

        beforeEach(function () {
            this.server = ox.fakeServer.create();
            this.server.autoRespond = true;
            this.server.respondWith('GET', /api\/calendar\?action=all/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(responseAll));
            });
        });

        afterEach(function () {
            // cleanup
            this.server.restore();
        });

        it('should provide a getApp function ', function () {
            expect(main.getApp).toBeTruthy();
        });

        it('should provide a launch function ', function () {
            var app = main.getApp();
            expect(app.launch).toBeTruthy();
        });

        it('should open the calendar app ', function () {
            var loaded = new Done();
            waitsFor(loaded, ' calendar app did not start', ox.TestTimeout);
            main.getApp().launch().done(function () {
                var app = this;
                loaded.yep();
                expect(app.get('state')).toBe('running');
            });
        });

        it('should open the listview perspective', function () {
            var app = main.getApp(),
                loaded = new Done();
            waitsFor(loaded, ' change perspective to listview not completed', ox.TestTimeout);
            ox.ui.Perspective.show(app, 'list').done(function () {
                loaded.yep();
                var perspective = app.attributes.window.currentPerspective;
                expect(perspective).toBe('list');
            });

        });

        it('should get all appointments', function () {
            this.grid = main.getApp().getGrid();
            waitsFor(function () {
                return this.grid.getIds().length > 0;
            }, 'no data in grid');

            runs(function () {
                expect(this.grid.getIds().length).toBe(2);
            })
        });

        it('should show 2 appointments in the grid', function () {
            var c = main.getApp().getGrid().getContainer(),
                length = $('.vgrid-cell.calendar', c).length;
            expect(length).toBe(2);

        });

        it('should show 2 label cells in the grid', function () {
            var c = main.getApp().getGrid().getContainer(),
                length = $('.vgrid-cell.vgrid-label', c).length;
            expect(length).toBe(2);

        });

        it('should show 1 tail cell in the grid', function () {
            var c = main.getApp().getGrid().getContainer(),
                length = $('.vgrid-cell.tail', c).length;
            expect(length).toBe(1);

        });

        it('should have a text in its grid-label cells', function () {
            var c = main.getApp().getGrid().getContainer(),
                cells = $('.vgrid-cell.vgrid-label', c),
                textLength1 = $(cells[0]).text().length,
                textLength2 = $(cells[1]).text().length;
            expect(textLength1).toBeGreaterThan(0);
            expect(textLength2).toBeGreaterThan(0);
        });

        it('should have all from and to time fields in an appointment cells', function () {
            var c = main.getApp().getGrid().getContainer(),
                cells = $('.vgrid-cell.calendar', c);

            var fromToTime = $(cells).find('.fragment');

            expect($(fromToTime[0]).text().length).toBeGreaterThan(0);
            expect($(fromToTime[1]).text().length).toBeGreaterThan(0);
            expect($(fromToTime[2]).text().length).toBeGreaterThan(0);
            expect($(fromToTime[3]).text().length).toBeGreaterThan(0);
        });

        it('should have all title fields in its appointment cells', function () {
            var c = main.getApp().getGrid().getContainer(),
                cells = $('.vgrid-cell.calendar', c);
            var titles = $(cells).find('.title');
            expect($(titles[0]).text()).toBe('Termin 1');
            expect($(titles[1]).text()).toBe('Termin 2');
        });

        it('should have all locations fields in its appointment cells', function () {
            var c = main.getApp().getGrid().getContainer(),
                cells = $('.vgrid-cell.calendar', c);
            var locations = $(cells).find('.location');
            expect($(locations[0]).text()).toBe('Confroom 1');
            expect($(locations[1]).text()).toBe('Confroom 2');
        });

        it('should have the right colors in the time divider bars', function () {
            var c = main.getApp().getGrid().getContainer(),
                cells = $('.vgrid-cell.calendar', c);
            var timebars = $(cells).find('.time');
            expect($(timebars[0]).hasClass('reserved')).toBe(true);
            expect($(timebars[1]).hasClass('free')).toBe(true);

        });

    });
});

