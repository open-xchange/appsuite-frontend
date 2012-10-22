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
     'io.ox/core/http'], function (View, api, util, date, http) {

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
        tops: {},           // scrollTop positions of the shown weeks
        fisrtWeek: 0,       // timestamp of the first week
        lastWeek: 0,        // timestamp of the last week
        initLoad: 20,       // amount of preloaded weeks
        updateCount: 6,     // amount of weeks to be loaded on scroll events
        scrollOffset: 10,   // offset space to trigger update event on scroll stop

        collections: {},

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

        updateWeek: function (start, end) {
            // fetch appointments
            var self = this,
                collection = self.collections[start];
            if (collection) {
                api.getAll({ start: start, end: end }).done(function (list) {
                    collection.reset(_(list).map(function (obj) {
                        var m = new Backbone.Model(obj);
                        m.id = _.cid(obj);
                        return m;
                    }));
                    collection = null;
                });
            }
            this.getFirsts();
        },

        drawWeek: function (day, pos) {
            pos = pos || false;
            this.collections[day] = new Backbone.Collection([]);
            var view = new View({ collection: this.collections[day], day: day });
            // add and render view
            this.pane[(pos ? 'pre' : 'ap') + 'pend'](view.render().el);
            view.on('showAppoinment', this.showAppointment, this);
            // update collection
            this.updateWeek(day, day + date.WEEK);
        },

        drawWeeks: function (start, end, pos) {
            pos = pos || false;
            var weeks = 0;
            if (pos) {
                for (var i = end; i > start; i -= date.WEEK) {
                    weeks++;
                    this.drawWeek(i, pos);
                }
                this.scrollTop($('.week:first', this.pane).height() * weeks);
            } else {
                for (var i = start; i < end; i += date.WEEK) {
                    this.drawWeek(i, pos);
                }
            }
        },

        scrollTop: function (top) {
            // scrollTop checks arity, so just passing an undefined top does not work here
            return top === undefined ? this.pane.scrollTop() : this.pane.scrollTop(top);
        },

        update: function () {
            this.updateWeek(this.firstWeek, this.lastWeek + date.WEEK);
        },

        getFirsts: function (e) {
            this.tops = {};
            var self = this,
                top = this.scrollTop() - 150; /* cheap trick */
            $('.first', this.pane).each(function () {
                var spDate = $(this).attr('date').split("-");
                self.tops[Math.max(0, $(this).position().top + top)] = spDate[0] + '-' + spDate[1];
            });
        },

        render: function (app) {

            var start = new date.Local(),
                year = start.getYear(),
                month = start.getMonth();
            start = util.getWeekStart(new date.Local(year, month - 1, 1));
            this.scaffold = View.drawScaffold();
            this.pane = this.scaffold.find('.scrollpane');

            this.firstWeek = start;
            this.lastWeek = start + (this.initLoad * date.WEEK);
            this.drawWeeks(this.firstWeek, this.lastWeek);

            this.main.addClass('month-view').empty().append(this.scaffold);

            // set initial scroll position
            this.scrollTop(0); // esp. for firefox
            this.scrollTop(this.main.find('[date="' + year + '-' + month + '-1"]').position().top);
            //this.pane.on('scroll', magneticScroll).on('scroll', getLastScrollTop);

            $(window).on('resize', this.getFirsts);

            var currentMonth = '';

            this.pane
                .on('scrollstop', $.proxy(function (e) {
                    var top = this.scrollTop();
                    // check position for infinite scroll
                    if (this.pane[0].offsetHeight + top >= this.pane[0].scrollHeight - this.scrollOffset) {
                        this.drawWeeks(this.lastWeek, this.lastWeek += date.WEEK * this.updateCount);
                    }
                    if (top <= this.scrollOffset) {
                        var first = this.firstWeek - date.WEEK;
                        this.drawWeeks(first - date.WEEK * this.updateCount, first,  true);
                        this.firstWeek -= date.WEEK * this.updateCount;
                    }
                }, this))
                .on('scroll', $.proxy(function (e) {
                    var top = this.scrollTop(),
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
                    if (month !== currentMonth) {
                        $('.day', this.pane).addClass('out');
                        $('[date^="' + month + '-"]', this.pane).removeClass('out');
                        currentMonth = month;
                    }
                }, this));

            this.pane.find('[date^="' + year + '-' + month + '"]').removeClass('out');
            this.getFirsts();

            var refresh = $.proxy(function () {
                this.update();
                this.getFirsts();
                var first = this.main.find('[date="' + year + '-' + month + '-1"]'),
                    top = this.scrollTop() + first.position().top;
                this.scrollTop(top);
            }, this);

            // watch for api refresh
            api.on('refresh.all', refresh);
            app.getWindow().on('show', refresh);
        }
    });

    return perspective;
});
