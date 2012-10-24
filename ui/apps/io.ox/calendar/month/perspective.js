/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/month/perspective',
    ['io.ox/calendar/month/view',
     'io.ox/calendar/api',
     'io.ox/calendar/util',
     'io.ox/core/date',
     'gettext!io.ox/calendar',
     'io.ox/core/http'], function (View, api, util, date, gt, http) {

    'use strict';

    var perspective = new ox.ui.Perspective('month');

    // TODO: Do this properly - too much flicker right now
//    var lastScrollTop = 0,
//
//        scrollAhead = true,
//
//        getLastScrollTop = function () {
//            var top = $(this).scrollTop();
//            scrollAhead = lastScrollTop < top;
//            lastScrollTop = top;
//        },
//
//        magneticScroll = _.debounce(function () {
//            var self = $(this),
//                weeks = self.find('.week'),
//                height = weeks.outerHeight(),
//                top = self.scrollTop(),
//                y = Math[scrollAhead ? 'ceil' : 'floor'](top / height),
//                delta = (weeks.eq(y).position() || { top: 0 }).top;
//            // adjust scroll position
//            self.off('scroll', magneticScroll)
//                .stop()
//                .animate({ scrollTop: top + delta }, 100, function () {
//                    self.on('scroll', magneticScroll);
//                    self = weeks = null;
//                });
//        }, 50);

    _.extend(perspective, {

        scaffold: $(),      // perspective
        pane: $(),          // scrollpane
        kwInfo: $('<div>'), //
        tops: {},           // scrollTop positions of the shown weeks
        fisrtWeek: 0,       // timestamp of the first week
        lastWeek: 0,        // timestamp of the last week
        initLoad: 20,       // amount of preloaded weeks
        updateLoad: 8,      // amount of weeks to be loaded on scroll events
        scrollOffset: 250,  // offset space to trigger update event on scroll stop
        collections: {},    // all week collections of appointments
        folder: 0,

        showAppointment: function (e, obj) {
            // open appointment details
            api.get(obj).done(function (data) {
                require(["io.ox/core/tk/dialogs", "io.ox/calendar/view-detail"])
                .done(function (dialogs, detailView) {
                    new dialogs.SidePopup().show(e, function (popup) {
                        popup.append(detailView.draw(data));
                    });
                });
            });
        },

        updateWeek: function (obj) {
//            console.log('updateWeek', (obj.end - obj.start) / date.WEEK);
            // fetch appointments
            obj.folder = this.folder;
            var self = this,
                collection = self.collections[obj.start];
            if (collection) {
                var def = api.getAll(obj);
                def.done(function (list) {
                    collection.reset(_(list).map(function (obj) {
                        var m = new Backbone.Model(obj);
                        m.id = _.cid(obj);
                        return m;
                    }));
                    collection = null;
                });
                return def;
            }
        },

        drawWeeks: function (weeks, up) {
            up = up || false;
            var def = $.Deferred(),
                self = this,
                views = [],
                updateWeek = function (day) {
                    return function () {
                        return self.updateWeek({start: day, end: day + date.WEEK});
                    };
                };
            def.resolve();

            // draw all weeks
            for (var i = 1; i <= weeks; i++) {
                var day = self.firstWeek;
                if (up) {
                    self.firstWeek -= date.WEEK;
                } else {
                    self.lastWeek += date.WEEK;
                    day = self.lastWeek;
                }
                self.collections[day] = new Backbone.Collection([]);
                var view = new View({ collection: self.collections[day], day: day });
                views[up ? 'unshift' : 'push'](view.render().el);
                view.on('showAppoinment', self.showAppointment, self);
                def = def.pipe(updateWeek(day, up));
            }

            // add and render view
            if (up) {
                var firstMsg = $('.week:first', this.pane);
                var curOffset = firstMsg.offset().top - this.scrollTop();
                this.pane.prepend(views).scrollTop(firstMsg.offset().top - curOffset);
            } else {
                this.pane.append(views);
            }

            // when all updates finished
            def.done(function () {
                // update first positions
                self.getFirsts();
            });
            return def;
        },

        scrollTop: function (top) {
            // scrollTop checks arity, so just passing an undefined top does not work here
            return top === undefined ? this.pane.scrollTop() : this.pane.scrollTop(top);
        },

        update: function () {
            console.log('update');
            for (var i = this.firstWeek; i <= this.lastWeek; i += date.WEEK) {
                this.updateWeek({ start: i, end: i + date.WEEK});
            }
        },

        getFirsts: function (e) {
            this.tops = {};
            var self = this;
            $('.day.first', this.pane).each(function () {
                var spDate = $(this).attr('date').split("-");
                self.tops[($(this).position().top + self.scrollTop()) >> 0] = spDate[0] + '-' + spDate[1];
            });
        },

        gotoMonth: function () {
            var today = new date.Local();
            // set initial scroll position
            this.scrollTop(0); // esp. for firefox
            this.scrollTop($('[date="' + today.getYear() + '-' + today.getMonth() + '-1"]', this.pane).position().top - 23);
            //this.pane.on('scroll', magneticScroll).on('scroll', getLastScrollTop);
        },

        render: function (app) {
            var start = new date.Local(),
                year = start.getYear(),
                month = start.getMonth(),
                curMonth = '',
                self = this;

            this.lastWeek = this.firstWeek = util.getWeekStart(new date.Local(year, month - 1, 1));

            this.main
                .addClass('month-view')
                .empty()
                .append(this.scaffold = View.drawScaffold());

            this.pane = $('.scrollpane', this.scaffold).before(
                $('<div>')
                    .addClass('toolbar')
                    .append(
                        this.kwInfo.addClass('info'),
                        $('<div>').addClass('showall')
                            .append(
                                $('<label>')
                                    .addClass('checkbox')
                                    .text(gt('show all'))
                                    .prepend(
                                        $('<input type="checkbox">')
                                            .prop('checked', true)
                                    )
                            ),
                        $('<div>')
                            .addClass('pagination')
                            .append(
                                $('<ul>')
                                    .append(
                                        $('<li>')
                                            .append(
                                                $('<a href="#">').addClass('control prev').append($('<i>').addClass('icon-chevron-left'))
                                            ),
                                        $('<li>').append(
                                            $('<a>').addClass('link today').text(gt('Today'))
                                        ),
                                        $('<li>')
                                            .append(
                                                    $('<a href="#">').addClass('control next').append($('<i>').addClass('icon-chevron-right'))
                                            )
                                    )
                            )
                    )
            );

            app.folder.getData().done(function (data) {
                self.folder = data.id;
                self.drawWeeks(self.initLoad).done(function () {
                    self.gotoMonth();
                    $('[date^="' + year + '-' + month + '"]', self.pane).removeClass('out');
                });
            });

            this.pane
                .on('scrollstop', $.proxy(function (e) {
                    var top = this.scrollTop();
                    // check position for infinite scroll
                    if (this.pane[0].offsetHeight + top >= this.pane[0].scrollHeight - this.scrollOffset) {
                        this.drawWeeks(this.updateLoad);
                    }
                    if (top <= 0) {
                        this.drawWeeks(this.updateLoad,  true);
                    }
                }, this))
                .on('scroll', $.proxy(function (e) {
                    var top = this.scrollTop() + 200,
                        first = true,
                        month = '';
                    // find first visible month on scroll-position
                    for (var y in this.tops) {
                        if (first || top >= y) {
                            month = this.tops[y];
                            first = false;
                        } else {
                            break;
                        }
                    }

                    // highlight current visible month
                    if (month !== curMonth) {
                        $('.day:not(.out)', this.pane).addClass('out');
                        $('[date^="' + month + '-"]', this.pane).removeClass('out');
//                        console.log(month);
                        curMonth = month;
                    }
                }, this));

            $(window).on('resize', this.getFirsts);

            var refresh = $.proxy(function () {
                var self = this;
                app.folder.getData().done(function (data) {
                    self.folder = data.id;
                    self.update();
//                    // switch only visible on private folders
//                    self.view.setShowAllVisibility(data.type === 1);
//                    // set folder data to view
//                    self.view.setFolder(data);
//                    // do folder magic
//                    if (data.type > 1 || self.view.getShowAllStatus() === false) {
//                        obj.folder = data.id;
//                    }
//                    self.getAppointments(obj);
                });
            }, this);

            // watch for api refresh
            api.on('refresh.all', refresh);
            app.on('folder:change', refresh)
                .getWindow()
                .on('show', refresh);
        }
    });

    return perspective;
});
