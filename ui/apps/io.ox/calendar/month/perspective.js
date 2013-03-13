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
     'io.ox/core/date',
     'io.ox/core/extensions',
     'io.ox/core/tk/dialogs',
     'io.ox/calendar/view-detail',
     'io.ox/calendar/conflicts/conflictList',
     'io.ox/core/print',
     'settings!io.ox/calendar',
     'gettext!io.ox/calendar'], function (View, api, date, ext, dialogs, detailView, conflictView, print, settings, gt) {
    'use strict';

    var perspective = new ox.ui.Perspective('month');

    _.extend(perspective, {

        scaffold: $(),      // perspective
        pane: $(),          // scrollpane
        monthInfo: $(),     //
        showAll: $(),       // show all folders check-box
        showAllCon: $(),    // container
        tops: {},           // scrollTop positions of the shown weeks
        fisrtWeek: 0,       // timestamp of the first week
        lastWeek: 0,        // timestamp of the last week
        updateLoad: 8,      // amount of weeks to be loaded on scroll events
        initLoad: 2,        // amount of initial called updates
        scrollOffset: 250,  // offset space to trigger update event on scroll stop
        collections: {},    // all week collections of appointments
        current: null,      // current month as date object
        folder: null,
        app: null,          // the current application
        dialog: $(),        // sidepopup
        isScrolling: false, // scrolling

        showAppointment: function (e, obj) {
            // open appointment details
            var self = this;
            api.get(obj).done(function (data) {
                self.dialog
                    .show(e, function (popup) {
                        popup.append(detailView.draw(data));
                    });
            });
        },

        createAppointment: function (e, startTS) {
            // add current time to start timestamp
            var now = new date.Local(),
                offset = 30 * date.MINUTE;
            startTS += Math.ceil((now.getHours() * date.HOUR + now.getMinutes() * date.MINUTE) / offset) * offset;
            ext.point('io.ox/calendar/detail/actions/create')
                .invoke('action', this, {app: this.app}, {start_date: startTS, end_date: startTS + date.HOUR});
        },

        openEditAppointment: function (e, obj) {
            ext.point('io.ox/calendar/detail/actions/edit')
                .invoke('action', this, {data: obj});
        },

        updateAppointment: function (obj) {
            var self = this;
            _.each(obj, function (el, i) {
                if (el === null) {
                    delete obj[i];
                }
            });

            var apiUpdate = function (obj) {
                api.update(obj).fail(function (con) {
                    if (con.conflicts) {
                        new dialogs.ModalDialog()
                            .append(conflictView.drawList(con.conflicts))
                            .addDangerButton('ignore', gt('Ignore conflicts'))
                            .addButton('cancel', gt('Cancel'))
                            .show()
                            .done(function (action) {
                                if (action === 'cancel') {
                                    self.update();
                                    return;
                                }
                                if (action === 'ignore') {
                                    obj.ignore_conflicts = true;
                                    apiUpdate(obj);
                                }
                            });
                    }
                });
            };

            if (obj.recurrence_type > 0) {
                new dialogs.ModalDialog()
                    .text(gt('By changing the date of this appointment you are creating an appointment exception to the series. Do you want to continue?'))
                    .addButton('appointment', gt('Yes'))
                    .addButton('cancel', gt('No'))
                    .show()
                    .done(function (action) {
                        if (action === 'appointment') {
                            apiUpdate(api.removeRecurrenceInformation(obj));
                        } else {
                            self.update();
                        }
                    });
            } else {
                apiUpdate(obj);
            }
        },

        updateWeeks: function (obj) {
            // fetch appointments
            var self = this;
            obj = $.extend({
                weeks: this.updateLoad
            }, obj);
            // do folder magic
            if (this.folder.type !== 1 || !settings.get('showAllPrivateAppointments', false)) {
                obj.folder = this.folder.id;
            }
            obj.end = obj.start + obj.weeks * date.WEEK;
            return api.getAll(obj).done(function (list) {
                if (list.length > 0) {
                    // update single week view collections
                    var start = obj.start;
                    for (var i = 1; i <= obj.weeks; i++) {
                        var end = start + date.WEEK,
                            collection = self.collections[start];
                        if (collection) {
                            var retList = [];
                            for (var j = 0; j < list.length; j++) {
                                var mod = list[j];
                                if ((mod.start_date > start && mod.start_date < end) || (mod.end_date > start && mod.end_date < end) || (mod.start_date < start && mod.end_date > end)) {
                                    var m = new Backbone.Model(mod);
                                    m.id = _.cid(mod);
                                    retList.push(m);
                                }
                            }
                            collection.reset(retList);
                        }
                        start += date.WEEK;
                        collection = null;
                    }
                }
            });
        },

        drawWeeks: function (opt) {
            var param = $.extend({
                    up: false,
                    multi: 1
                }, opt),
                self = this,
                views = [],
                weeks = param.multi * self.updateLoad,
                day = param.up ? self.firstWeek -= (weeks) * date.WEEK : self.lastWeek,
                start = day;
            // draw all weeks
            for (var i = 1; i <= weeks; i++, day += date.WEEK) {
                // add collection for week
                self.collections[day] = new Backbone.Collection([]);
                // new view
                var view = new View({ collection: self.collections[day], day: day, folder: self.folder, pane: this.pane });
                view.on('showAppointment', self.showAppointment, self)
                    .on('createAppoinment', self.createAppointment, self)
                    .on('openEditAppointment', self.openEditAppointment, self)
                    .on('updateAppointment', self.updateAppointment, self);
                views.push(view.render().el);
            }

            if (!param.up) {
                self.lastWeek += date.WEEK * weeks;
            }

            // add and render view
            if (param.up) {
                var firstWeek = $('.week:first', this.pane),
                    curOffset = firstWeek.offset().top - this.scrollTop();
                this.pane.prepend(views).scrollTop(firstWeek.offset().top - curOffset);
            } else {
                this.pane.append(views);
            }
            // update first positions
            self.getFirsts();
            return this.updateWeeks({start: start, weeks: weeks});
        },

        scrollTop: function (top) {
            // scrollTop checks arity, so just passing an undefined top does not work here
            return top === undefined ? this.pane.scrollTop() : this.pane.scrollTop(top);
        },

        update: function () {
            var today = new date.Local(),
                day = $('#' + today.getYear() + '-' + today.getMonth() + '-' + today.getDate(), this.pane);
            if (!day.hasClass('today')) {
                $('.day.today', this.pane).removeClass('today');
                day.addClass('today');
            }
            this.showAll.prop('checked', settings.get('showAllPrivateAppointments', false));
            var weeks = (this.lastWeek - this.firstWeek) / date.WEEK;
            this.updateWeeks({start: this.firstWeek, weeks: weeks});
        },

        getFirsts: function (e) {
            this.tops = {};
            var self = this;
            if (this.pane) {
                $('.day.first', this.pane).each(function () {
                    self.tops[($(this).position().top + self.pane.scrollTop()) >> 0] = $(this).data('date');
                });
            }
        },

        gotoMonth: function (opt) {
            if (!this.isScrolling) {
                this.isScrolling = true;
                var self = this,
                    param = $.extend({
                        date: self.app.refDate || new date.Local(),
                        duration: 0
                    }, opt);

                if (typeof param.date === 'string') {
                    if (param.date === 'today') {
                        param.date = new date.Local();
                    } else {
                        param.date = new date.Local(self.current).addMonths(param.date === 'prev' ? -1 : 1);
                    }
                }

                var firstDay = $('#' + param.date.getYear() + '-' + param.date.getMonth() + '-1', self.pane),
                    scrollToDate = function (pos) {
                        // scroll to position
                        if (param.duration === 0) {
                            self.scrollTop(pos);
                            self.isScrolling = false;
                        } else {
                            self.pane.animate({scrollTop : pos}, param.duration, function () {
                                self.isScrolling = false;
                            });
                        }
                    };

                if (firstDay.length > 0) {
                    scrollToDate(firstDay.position().top  + this.scrollTop() + 2);
                } else {
                    if (param.date.getTime() < self.current.getTime()) {
                        this.drawWeeks({up: true}).done(function () {
                            firstDay = $('#' + param.date.getYear() + '-' + param.date.getMonth() + '-1', self.pane);
                            scrollToDate(firstDay.position().top  + self.scrollTop() + 2);
                        });
                    } else {
                        self.isScrolling = false;
                    }
                }
            }
        },

        getFolder: function () {
            var self = this,
                def = $.Deferred();
            self.app.folder.getData().done(function (data) {
                // switch only visible on private folders
                self.showAllCon[data.type === 1 ? 'show' : 'hide']();
                self.folder = data;
                def.resolve();
            });
            return def;
        },

        save: function (e, p) {
            // save scrollposition
        },

        restore: function () {
            // goto current date position
            this.gotoMonth();
        },

        print: function () {
            var end = new date.Local(this.current.getYear(), this.current.getMonth() + 1, 1),
                self = this;
            print.open('printCalendar', null, {
                template: 'cp_monthview_table.tmpl',
                usertemplate: 'infostore://69805',
                start: self.current.local,
                end: end.local
            });
        },

        render: function (app) {

            var start = app.refDate || new date.Local(),
                year = start.getYear(),
                month = start.getMonth(),
                self = this;

            this.app = app;
            this.current = new date.Local(year, month, 1);
            this.lastWeek = this.firstWeek = new date.Local(year, month - 1, 1).setStartOfWeek().getTime();

            this.main
                .addClass('month-view')
                .empty()
                .append(this.scaffold = View.drawScaffold());

            this.pane = $('.scrollpane', this.scaffold).before(
                $('<div>')
                    .addClass('toolbar')
                    .append(
                        this.monthInfo = $('<div>').addClass('info').text(gt.noI18n(this.current.format('MMMM y'))),
                        this.showAllCon = $('<div>').addClass('showall')
                            .append(
                                $('<label>')
                                    .addClass('checkbox')
                                    .text(gt('show all'))
                                    .prepend(
                                        this.showAll = $('<input type="checkbox">')
                                            .prop('checked', settings.get('showAllPrivateAppointments', false))
                                            .on('change', $.proxy(function (e) {
                                                settings.set('showAllPrivateAppointments', this.showAll.prop('checked')).save();
                                                this.app.trigger('folder:change');
                                            }, this))
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
                                            ).on('click', $.proxy(function (e) {
                                                e.preventDefault();
                                                this.gotoMonth({
                                                    duration: 400,
                                                    date: 'prev'
                                                });
                                            }, this)),
                                        $('<li>').append(
                                            $('<a href="#">').addClass('link today').text(gt('Today'))
                                        ).on('click', $.proxy(function (e) {
                                            e.preventDefault();
                                            this.gotoMonth({
                                                duration: 800,
                                                date: 'today'
                                            });
                                        }, this)),
                                        $('<li>')
                                            .append(
                                                    $('<a href="#">').addClass('control next').append($('<i>').addClass('icon-chevron-right'))
                                            ).on('click', $.proxy(function (e) {
                                                e.preventDefault();
                                                this.gotoMonth({
                                                    duration: 400,
                                                    date: 'next'
                                                });
                                            }, this))
                                    )
                            )
                    )
            );

            this.pane
                .on('scrollstop', $.proxy(function (e) {
                    var top = this.scrollTop(),
                        month = false;

                    // check position for infinite scroll
                    if (this.pane[0].offsetHeight + top >= this.pane[0].scrollHeight - this.scrollOffset) {
                        this.drawWeeks();
                    }
                    if (top <= this.scrollOffset) {
                        this.drawWeeks({up: true});
                    }

                    // find first visible month on scroll-position
                    for (var y in this.tops) {
                        if (!month || top + this.scrollOffset >= y) {
                            month = this.tops[y];
                        } else {
                            break;
                        }
                    }

                    // highlight current visible month
                    if (month !== this.current.getTime()) {
                        this.current.setTime(month);
                        self.app.refDate.setYear(this.current.getYear(), this.current.getMonth(), self.app.refDate.getDate());
                        $('.day:not(.out)', this.pane)
                            .add($('[id^="' + this.current.getYear() + '-' + this.current.getMonth() + '-"]', this.pane))
                            .toggleClass('out');
                        self.monthInfo.text(gt.noI18n(this.current.format('MMMM y')));
                    }
                }, this));

            $(window).on('resize', this.getFirsts);

            self.getFolder().done(function () {
                self.drawWeeks({multi: self.initLoad}).done(function () {
                    $('[id^="' + self.current.getYear() + '-' + self.current.getMonth() + '-"]', self.pane).toggleClass('out');
                    self.gotoMonth();
                });
            });

            // define default sidepopup dialog
            this.dialog = new dialogs.SidePopup()
                .on('close', function () {
                    $('.appointment', this.main).removeClass('opac current');
                });

            var refresh = function () {
                self.getFolder().done(function () {
                    self.update();
                });
            };

            // watch for api refresh
            api.on('create update', refresh)
                .on('delete', function () {
                    // Close dialog after delete
                    self.dialog.close();
                    refresh();
                });
            app.on('folder:change', refresh)
                .getWindow()
                .on('show', refresh)
                .on('show', $.proxy(this.restore, this))
                .on('beforehide', $.proxy(this.save, this))
                .on('change:perspective', function () {
                    self.dialog.close();
                });
        }
    });

    return perspective;
});
