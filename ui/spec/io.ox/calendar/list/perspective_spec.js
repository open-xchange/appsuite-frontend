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

define([
    'io.ox/calendar/main',
    'fixture!io.ox/calendar/list/calendar-list.json',
    'waitsFor',
    //pre-load list perspective for faster tests
    'io.ox/calendar/list/perspective'
], function (main, fixture, waitsFor) {
    'use strict';

    describe('calendar app and the corresponding listview', function () {

        beforeEach(function () {
            this.server.respondWith('GET', /api\/calendar\?action=all/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixture.getList));
            });

            this.server.respondWith('GET', /api\/calendar\?action=get.+id=1337/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixture.get1337));
            });

            this.server.respondWith('PUT', /api\/user\?action=list/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixture.userList));
            });

            this.server.respondWith('GET', /api\/user\?action=get/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixture.userGet));
            });
        });

        it('should provide a getApp function', function () {
            expect(main.getApp).to.exist;
        });

        it('should provide a launch function', function () {
            var app = main.getApp();
            expect(app.launch).to.be.a('function');
        });

        it('should open the calendar app', function (done) {
            main.getApp().launch().done(function () {
                var app = this;
                expect(app.get('state')).to.equal('running');
                done();
            });
        });

        it('should open the listview perspective', function () {
            var app = main.getApp();
            return app.launch().then(function () {
                return ox.ui.Perspective.show(app, 'list');
            })
            .done(function (perspective) {
                expect(perspective.name).to.equal('list');
                expect(perspective.rendered).to.be.true;
            });
        });

        describe('is running with list perspective', function () {

            beforeEach(function (done) {
                this.app = main.getApp();
                this.app.launch().then(function () {
                    return ox.ui.Perspective.show(this.app, 'list');
                }.bind(this)).then(function () {
                    this.grid = this.app.getGrid();
                    var container = this.grid.getContainer();
                    return waitsFor(function () {
                        return $('.vgrid-cell.calendar', container).length !== 200;
                    });
                }.bind(this)).done(function () {
                    done();
                });
            });

            it('should get all appointments', function () {
                expect(this.grid.getIds()).to.have.length(2);
            });

            it('should show 2 appointments in the grid', function () {
                var c = this.grid.getContainer(),
                    cells = $('.vgrid-cell.calendar', c);
                expect(cells).to.have.length(2);
            });

            it('should show 2 label cells in the grid', function () {
                var c = this.grid.getContainer(),
                    labelCells = $('.vgrid-cell.vgrid-label', c);
                expect(labelCells).to.have.length(2);
            });

            it('should show 1 tail cell in the grid', function () {
                var c = this.grid.getContainer(),
                    tailCell = $('.vgrid-cell.tail', c);
                expect(tailCell).to.have.length(1);
            });

            it('should have a text in its grid-label cells', function () {
                var c = this.grid.getContainer(),
                    cells = $('.vgrid-cell.vgrid-label', c),
                    textLength1 = $(cells[0]).text().length,
                    textLength2 = $(cells[1]).text().length;
                expect(textLength1).to.be.above(0);
                expect(textLength2).to.be.above(0);
            });

            it('should have all from and to time fields in an appointment cells', function () {
                var c = this.grid.getContainer(),
                    cells = $('.vgrid-cell.calendar', c);

                var fromToTime = $(cells).find('.fragment');

                expect($(fromToTime[0]).text().length).to.be.above(0);
                expect($(fromToTime[1]).text().length).to.be.above(0);
                expect($(fromToTime[2]).text().length).to.be.above(0);
                expect($(fromToTime[3]).text().length).to.be.above(0);
            });

            it('should have all title fields in its appointment cells', function () {
                var c = main.getApp().getGrid().getContainer(),
                    cells = $('.vgrid-cell.calendar', c);
                var titles = $(cells).find('.title');
                expect($(titles[0]).text()).to.equal('Termin 1');
                expect($(titles[1]).text()).to.equal('Termin 2');
            });

            it('should have all locations fields in its appointment cells', function () {
                var c = main.getApp().getGrid().getContainer(),
                    cells = $('.vgrid-cell.calendar', c);
                var locations = $(cells).find('.location');
                expect($(locations[0]).text()).to.equal('Confroom 1');
                expect($(locations[1]).text()).to.equal('Confroom 2');
            });

            it('should have the right colors in the time divider bars', function () {
                var c = main.getApp().getGrid().getContainer(),
                    cells = $('.vgrid-cell.calendar', c);
                var timebars = $(cells).find('.time');

                //TODO: use jquery matchers
                expect($(timebars[0]).hasClass('reserved')).to.be.true;
                expect($(timebars[1]).hasClass('free')).to.be.true;
            });

            describe('should show the right data in detailview', function () {
                beforeEach(function () {
                    this.gc = this.grid.getContainer();
                    this.nodes = this.app.getWindow().nodes;
                    this.grid.selection.selectFirst();
                });

                it('and should show an appointment in detail view if something is selected in list', function () {
                    var right = this.nodes.body.find('.rightside');

                    expect(right.length).to.be.above(0);
                });

                it(' and it should show the title of the appointment', function () {
                    var right = this.nodes.body.find('.rightside');

                    expect(right.find('.subject').text()).to.equal('Termin 1');
                });

                it('and it should show the locations of the appointment', function () {
                    var right = this.nodes.body.find('.rightside');
                    expect(right.find('.location').text()).to.equal('Confroom');
                });

                it('and it should show the day and date of the appointment', function () {
                    var right = this.nodes.body.find('.rightside');
                    expect(right.find('.date').text()).to.equal('Do., 28.11.2013');
                });

                it('and it should show the duration of the appointment', function () {
                    var right = this.nodes.body.find('.rightside');
                    expect(right.find('.time').text()).to.equal('14:00–15:00');
                });

                it('and it should show the notes of the appointment', function () {
                    var right = this.nodes.body.find('.rightside');

                    expect(right.find('.note').text()).to.equal('Some Text');
                });

                it('and it should show the participants of the appointment', function () {
                    var right = this.nodes.body.find('.rightside');

                    expect($(right.find('.person')[0]).text()).to.equal('Hrubesch, Horst');
                    expect($(right.find('.person')[1]).text()).to.equal('Napp, Karl');
                });
                it('and it should show the participants confirm message for the appointment', function () {
                    var right = this.nodes.body.find('.rightside');

                    expect($(right.find('.comment')[0]).text()).to.equal('super');
                    expect($(right.find('.comment')[1]).text()).to.equal('immer gerne');
                });

                it('and it should show the details section for the appointment', function () {
                    var right = this.nodes.body.find('.rightside');

                    var d = right.find('.details');
                    var orga = d.find('.organizer').text();
                    var shown_as = d.find('.shown_as').hasClass('reserved');
                    var created = d.find('.created').text();
                    var modified = d.find('.modified').text();
                    expect(orga, 'organizer text').to.equal('Horst Hrubesch');
                    expect(shown_as, 'shown as reserved').to.be.true;
                    expect(created, 'created date').to.equal('Do., 28.11.2013 – Horst Hrubesch');
                    expect(modified, 'modified date').to.equal('Do., 28.11.2013 – Horst Hrubesch');
                });
            });
        });
    });
});
