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

define(['io.ox/calendar/main',
    'fixture!io.ox/calendar/list/calendar-list.json'], function (main, fixture) {

    function Done() {
        var f = function () {
            return f.value;
        };
        f.value = false;
        f.yep = function () {
            f.value = true;
        };
        return f;
    }

    describe('calendar app and the corresponding listview ', function () {

        beforeEach(function () {
            this.server.respondWith('GET', /api\/calendar\?action=all/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(fixture.getList));
            });
            this.server.respondWith('GET', /api\/calendar\?action=get.+id=1337/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(fixture.get1337));
            });


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
            });
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

        describe(' should show the right data in detailview ', function () {
            beforeEach(function () {
                this.gc = main.getApp().getGrid().getContainer();
                this.g = main.getApp().getGrid();
                this.app = main.getApp();
                this.nodes = this.app.getWindow().nodes;
                this.g.selection.selectFirst();

                this.server.respondWith('GET', /api\/calendar\?action=get.+id=1337/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(fixture.get1337));
                });

                this.server.respondWith('PUT', /api\/user\?action=list/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(fixture.userList));
                });

                this.server.respondWith('GET', /api\/user\?action=get/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8'}, JSON.stringify(fixture.userGet));
                });
            });

            it(' and should show an appointment in detail view if something is selected in list', function () {
                var right = this.nodes.body.find('.rightside');
                expect(right.length).toBeGreaterThan(0);
            });

            it(' and it should show the title of the appointment', function () {
                var right = this.nodes.body.find('.rightside');
                waitsFor(function () {
                    return right.find('.title').text() === 'Termin 1';
                }, 'did not find rightside content');

                runs(function () {
                    expect(right.find('.title').text()).toBe('Termin 1');
                });
            });

            it('and it should show the locations of the appointment', function () {
                var right = this.nodes.body.find('.rightside');
                expect(right.find('.location').text()).toBe('Confroom');
            });

            it('and it should show the day and date of the appointment', function () {
                var right = this.nodes.body.find('.rightside');
                expect(right.find('.day').text()).toBe('Do., 28.11.2013');
            });

            it('and it should show the duration of the appointment', function () {
                var right = this.nodes.body.find('.rightside');
                expect(right.find('.interval').text()).toBe('13:00-14:00 UTC');
            });

            it('and it should show the notes of the appointment', function () {
                var right = this.nodes.body.find('.rightside');
                expect(right.find('.note').text()).toBe('Some Text');
            });

            it('and it should show the participants of the appointment', function () {
                var right = this.nodes.body.find('.rightside');
                waitsFor(function () {
                    return right.find('.person').length > 0;
                }, 'could not find participants');
                runs(function () {
                    expect($(right.find('.person')[0]).text()).toBe('Horst Hrubesch');
                    expect($(right.find('.person')[1]).text()).toBe('Karl Napp');
                });
            });
            it('and it should show the participants confirm message for the appointment', function () {
                var right = this.nodes.body.find('.rightside');
                waitsFor(function () {
                    return right.find('.comment').length > 0;
                }, 'could not find comment');
                runs(function () {
                    expect($(right.find('.comment')[0]).text()).toBe('super');
                    expect($(right.find('.comment')[1]).text()).toBe('immer gerne');
                });
            });

            it('and it should show the details section for the appointment', function () {
                var right = this.nodes.body.find('.rightside');
                waitsFor(function () {
                    return right.find('.organizer').text().length > 0;
                }, 'could not find details');
                runs(function () {
                    var d = right.find('.details');
                    var orga = d.find('.organizer').text();
                    var shown_as = d.find('.shown_as').hasClass('reserved');
                    var created = d.find('.created').text();
                    var modified = d.find('.modified').text();
                    expect(orga).toBe('Horst Hrubesch');
                    expect(shown_as).toBe(true);
                    expect(created).toBe('Do., 28.11.2013 – Horst Hrubesch');
                    expect(modified).toBe('Do., 28.11.2013 – Horst Hrubesch');
                });
            });
        });

    });

});

