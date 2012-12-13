/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define("io.ox/calendar/edit/recurrence-view", ["io.ox/calendar/model", "io.ox/core/tk/config-sentence", "io.ox/core/date", 'io.ox/core/tk/keys', 'gettext!io.ox/calendar/edit/main', 'less!io.ox/calendar/edit/style.less'], function (model, ConfigSentence, dateAPI, KeyListener, gt) {
    "use strict";
    var DAYS = model.DAYS;
    var RECURRENCE_TYPES = model.RECURRENCE_TYPES;

    var CalendarWidgets = {
        dayInMonth: function ($anchor, attribute, options) {
            var self = this;
            var $dayPicker = $('<table>');
            var $row;

            function clickHandler(i) {
                return function (e) {
                    e.preventDefault();
                    self[attribute] = i;
                    $anchor.popover("hide");
                    self.trigger("change", self);
                    self.trigger("change:" + attribute, self);
                };
            }

            for (var i = 1; i < 32; i++) {
                if (!$row) {
                    $row = $('<tr>').appendTo($dayPicker);
                }

                $row.append(
                    $('<td>').append(
                        $('<a href="#">').text(i).on('click', clickHandler(i)).css({marginRight: "11px"})
                    )
                );

                if (i % 7 === 0) {
                    $row = null;
                }
            }

            function drawState() {
                $anchor.text(self[attribute]);
                self.trigger("redraw", self);
            }

            $anchor.popover({
                placement: 'top',
                content: function () {
                    return $dayPicker;
                }
            });

            $anchor.on('click', function (e) { e.preventDefault(); });

            drawState();

            this.on("change:" + attribute, drawState);
        },

        days: function ($anchor, attribute, options) {
            // TODO: Modal close. But how?!?
            var self = this;
            var $dayList = $('<ul class="io-ox-recurrence-day-picker no-clone">');
            var nodes = {};

            this[attribute] = 1;

            _(DAYS.values).each(function (day) {
                nodes[day] = $('<li>').append(
                    $('<b>').text(DAYS.i18n[day]).hide(),
                    $('<span>').text(DAYS.i18n[day]).hide()
                ).on("click", function () {
                    var bitmask = self[attribute];
                    bitmask = bitmask ^ DAYS[day];
                    if (bitmask) {
                        self[attribute] = bitmask;
                        self.trigger("change", self);
                        self.trigger("change:" + attribute, self);
                    }
                }).appendTo($dayList);
            });

            $dayList.append($('<li>').append(
                gt("Close"),
                $('<i class="icon-remove">')
            ).on("click", function () {
                $anchor.popover('hide');
            }).css({
                marginTop: "11px",
                fontStyle: 'italic'
            }));

            function drawState() {
                var value = DAYS.unpack(self[attribute]);
                _(nodes).each(function (node, day) {
                    if (value[day]) {
                        node.find('b').show();
                        node.find('span').hide();
                    } else {
                        node.find('b').hide();
                        node.find('span').show();
                    }
                });
                var selectedDays = [];
                _(DAYS.values).each(function (day) {
                    if (value[day]) {
                        selectedDays.push(DAYS.i18n[day]);
                    }
                });
                $anchor.text(selectedDays.join(", "));
                self.trigger("redraw", self);
            }

            $anchor.popover({
                placement: 'top',
                content: function () {
                    return $dayList;
                }
            });

            $anchor.on("click", function (e) {
                e.preventDefault();
            });

            drawState();

            this.on("change:" + attribute, drawState);
        },
        dateFormat: dateAPI.getFormat(dateAPI.DATE).replace(/\by\b/, 'yyyy').toLowerCase(),
        datePicker: function ($anchor, attribute, options) {
            var self = this;
            var originalContent = $anchor.html();
            self[attribute] = options.initial || _.now();

            function renderDate() {
                var value = self[attribute];
                if (value) {
                    var myTime = dateAPI.Local.localTime(parseInt(value, 10));
                    if (_.isNull(myTime)) {
                        value = '';
                    } else {
                        value = new dateAPI.Local(myTime).format(dateAPI.DATE);
                    }
                } else {
                    value = '';
                }
                return value;
            }

            function drawState() {
                var value = renderDate();
                $anchor.text(value);
                self.trigger("redraw", self);
            }

            $anchor.on('click', function (e) {
                e.preventDefault();
                var $dateInput = $('<input type="text" class="input-small no-clone">').css({
                    marginBottom: 0
                }).val(renderDate());
                var keys = new KeyListener($dateInput);

                $dateInput.datepicker({format: CalendarWidgets.dateFormat, parentEl: $anchor.parent()});

                $anchor.after($dateInput);
                $anchor.hide();

                $dateInput.select();
                keys.include();

                // On change
                function updateValue() {
                    var value = dateAPI.Local.parse($dateInput.val(), dateAPI.DATE);
                    if (!_.isNull(value) && value.getTime() !== 0) {
                        self[attribute] = dateAPI.Local.utc(value.getTime());
                        self.trigger("change", self);
                        self.trigger("change:" + attribute, self);
                    }
                    keys.destroy();
                    try {
                        $dateInput.datepicker("hide");
                        $dateInput.remove();
                    } catch (e) { }
                    $anchor.show();

                }
                $dateInput.on("change", function () {
                    updateValue();
                });

                // Enter
                $dateInput.on("enter", function () {
                    updateValue();
                });

                // Escape
                keys.on("esc", function () {
                    $dateInput.val(self[attribute]);
                    keys.destroy();
                    try {
                        $dateInput.remove();
                    } catch (e) { }
                    $anchor.show();
                });
            });

            drawState();

            this.on("change:" + attribute, drawState);
        }
    };

    // Mark a few translations, so the buildsystem picks up on them
    gt.ngettext("every day", "every %1$d days", 2);
    gt.ngettext("every week", "every %1$d weeks", 2);
    gt.ngettext("every month", "every %1$d months", 2);
    gt.ngettext("after %1$d appointment", 'after %1$d appointments', 2);


    var RecurrenceView = function (options) {
        _.extend(this, {
            init: function () {
                var self = this;
                this.$el.addClass("io-ox-recurrence-view");

                // Construct the UI
                this.controls = {
                    checkbox: $('<input type="checkbox">'),
                    detailToggle: $('<a href="#" class="recurrence-detail-toggle">').css({'float': 'right'}).text(gt("Edit")).hide(),
                    typeRadios: {
                        daily: $('<input type="radio" name="recurrence_type" value="daily">'),
                        weekly: $('<input type="radio" name="recurrence_type" value="weekly">'),
                        monthly: $('<input type="radio" name="recurrence_type" value="monthly">'),
                        yearly: $('<input type="radio" name="recurrence_type" value="yearly">')
                    }
                };

                this.nodes = {
                    summary: $('<span>'),
                    typeChoice: $('<div class="row-fluid inset">').hide(),
                    hint: $('<div class="row-fluid muted inset">').hide(),
                    alternative1: $('<div class="row-fluid inset">').hide(),
                    alternative2: $('<div class="row-fluid inset">').hide(),
                    endsChoice: $('<div class="row-fluid inset">').hide()
                };

                this.nodes.typeChoice.append(
                    $('<label class="span3 radio control-label desc">').append(this.controls.typeRadios.daily).append(gt("Daily")),
                    $('<label class="span3 radio control-label desc">').append(this.controls.typeRadios.weekly).append(gt("Weekly")),
                    $('<label class="span3 radio control-label desc">').append(this.controls.typeRadios.monthly).append(gt("Monthly")),
                    $('<label class="span3 radio control-label desc">').append(this.controls.typeRadios.yearly).append(gt("Yearly"))
                );

                // UI state

                this.more = false;

                // Config Sentences

                this.sentences = {
                    daily: new ConfigSentence(gt('The appointment is repeated <a href="#"  data-widget="number" data-attribute="interval">every <span class="number-control">2</span> days</a>. '), {
                        id: 'daily',
                        phrase: function (n) {
                            //#. as in: The appointment is repeated every day, or The appointment is repeated every %1$d days.
                            //#. This is inserted into an HTML construct.
                            gt.format(gt.ngettext('every day',
                                'every %1$d days', n), n);

                            return gt.format(gt.ngettext('every day',
                                'every %1$d days', n), n);
                        },
                        initial: 1,
                        gt: gt
                    }),
                    weekly: new ConfigSentence(gt('The appointment is repeated <a href="#"  data-widget="number" data-attribute="interval">every <span class="number-control">2</span> weeks</a> on <a href="#"  data-widget="custom" data-attribute="days">monday</a>. '), {
                        id: 'weekly',
                        interval: {
                            phrase: function (n) {
                                //#. as in: The appointment is repeated every week, or The appointment is repeated every %1$d weeks.
                                //#. This is inserted into an HTML construct.
                                gt.format(gt.ngettext('every week',
                                    'every %1$d weeks', n), n);

                                return gt.format(gt.ngettext('every week',
                                    'every %1$d weeks', n), n);
                            },
                            initial: 1,
                            gt: gt
                        },
                        days: CalendarWidgets.days
                    }),
                    monthlyDate: new ConfigSentence(gt('The appointment is repeated on day <a href="#"  data-widget="custom" data-attribute="dayInMonth">10</a> <a href="#"  data-widget="number" data-attribute="interval">every <span class="number-control">2</span> months</a>. '), {
                        id: 'monthlyDate',
                        interval: {
                            phrase: function (n) {
                                //#. as in: The appointment is repeated on day 12 every month, or The appointment is repeated on day 12 every %1$d months.
                                //#. This is inserted into an HTML construct.
                                gt.format(gt.ngettext('every month',
                                    'every %1$d months', n), n);
                                return gt.format(gt.ngettext('every month',
                                    'every %1$d months', n), n);
                            },
                            initial: 1,
                            gt: gt
                        },
                        dayInMonth: CalendarWidgets.dayInMonth
                    }),
                    monthlyDay: new ConfigSentence(gt('The appointment is repeated the <a href="#" data-widget="options" data-attribute="ordinal">second</a> <a href="#" data-widget="options" data-attribute="day">wednesday</a> <a href="#" data-widget="number" data-attribute="interval">every <span class="number-control">2</span> months</a>. '), {
                        id: 'monthlyDay',
                        ordinal: {
                            options: {
                                1:  //#. As in first monday, tuesday, wednesday ... , day of the week, day of the weekend
                                    gt("first"),

                                2:  //#. As in second monday, tuesday, wednesday ... , day of the week, day of the weekend
                                    gt("second"),

                                3:  //#. As in third monday, tuesday, wednesday ... , day of the week, day of the weekend
                                    gt("third"),

                                4:  //#. As in fourth monday, tuesday, wednesday ... , day of the week, day of the weekend
                                    gt("fourth"),

                                5:  //#. As in last monday, tuesday, wednesday ... , day of the week, day of the weekend
                                    gt("last")
                            }
                        },
                        day: {
                            options: {
                                1: gt("Sunday"),
                                2: gt("Monday"),
                                4: gt("Tuesday"),
                                8: gt("Wednesday"),
                                16: gt("Thursday"),
                                32: gt("Friday"),
                                64: gt("Saturday"),
                                62: gt("day of the week"),
                                65: gt("day of the weekend")
                            },
                            initial: 2
                        },
                        interval: {
                            phrase: function (n) {
                                return gt.format(gt.ngettext('every month', 'every %1$d months', n), n);
                            },
                            initial: 1,
                            gt: gt
                        }
                    }),
                    yearlyDate: new ConfigSentence(gt('The appointment is repeated every year on day <a href="#"  data-widget="custom" data-attribute="dayInMonth">10</a> of <a href="#" data-widget="options" data-attribute="month">october</a>. '), {
                        id: 'yearlyDate',
                        dayInMonth: CalendarWidgets.dayInMonth,
                        month: {
                            options: {
                                0: gt("January"),
                                1: gt("February"),
                                2: gt("March"),
                                3: gt("April"),
                                4: gt("May"),
                                5: gt("June"),
                                6: gt("July"),
                                7: gt("August"),
                                8: gt("September"),
                                9: gt("October"),
                                10: gt("November"),
                                11: gt("December")
                            },
                            initial: 2
                        }
                    }),
                    yearlyDay: new ConfigSentence(gt('The appointment is repeated every <a href="#" data-widget="options" data-attribute="ordinal">first</a> <a href="#" data-widget="options" data-attribute="day">wednesday</a> in <a href="#" data-widget="options" data-attribute="month">october</a>. '), {
                        id: 'yearlyDay',
                        ordinal: {
                            options: {
                                1:  //#. as in: first week or first Monday
                                    gt("first"),
                                2:  //#. as in: second week or second Monday
                                    gt("second"),
                                3:  //#. as in: third week or third Monday
                                    gt("third"),
                                4:  //#. as in: fourth week or fourth Monday
                                    gt("fourth"),
                                5:  //#. as in: last week or last Monday
                                    gt("last")
                            }
                        },
                        day: {
                            options: {
                                1: gt("Sunday"),
                                2: gt("Monday"),
                                4: gt("Tuesday"),
                                8: gt("Wednesday"),
                                16: gt("Thursday"),
                                32: gt("Friday"),
                                64: gt("Saturday"),
                                62: gt("day of the week"),
                                65: gt("day of the weekend")
                            },
                            initial: 2
                        },
                        month: {
                            options: {
                                0: gt("january"),
                                1: gt("february"),
                                2: gt("march"),
                                3: gt("april"),
                                4: gt("may"),
                                5: gt("june"),
                                6: gt("july"),
                                7: gt("august"),
                                8: gt("september"),
                                9: gt("october"),
                                10: gt("november"),
                                11: gt("december")
                            },
                            initial: 2
                        }
                    })
                };

                var endingOptions = {
                    options: {
                        1: gt('never ends'),
                        2: gt('ends on a specific date'),
                        3: gt('ends after a certain number of appointments')
                    },
                    chooseLabel: function (value) {
                        return gt('ends');
                    }
                };

                this.ends = {
                    never: new ConfigSentence(gt('The series <a href="#" data-attribute="ending" data-widget="options">never ends</a>.'), {
                        id: 'never',
                        ending: _.extend({}, endingOptions, {
                            chooseLabel: function (value) {
                                return gt('never ends');
                            }
                        })
                    }),
                    date: new ConfigSentence(gt('The series <a href="#" data-attribute="ending" data-widget="options">ends</a> on <a href="#" data-attribute="until" data-widget="custom">11/03/2013</a>.'), {
                        id: 'date',
                        ending: endingOptions,
                        until: CalendarWidgets.datePicker
                    }),
                    after: new ConfigSentence(gt('The series <a href="#" data-attribute="ending" data-widget="options">ends</a> <a href="#" data-attribute="occurrences" data-widget="number">after <span class="number-control">2</span> appointments</a>.'), {
                        id: 'after',
                        ending: endingOptions,
                        occurrences: {
                            phrase: function (n) {
                                return gt.format(gt.ngettext(
                                    'after %1$d appointment',
                                    'after %1$d appointments', n), n);
                            },
                            initial: 3,
                            gt: gt
                        }
                    })
                };


                // Events

                this.controls.checkbox.on("change", function () {
                    if (self.controls.checkbox.is(":checked")) {
                        if (self.lastConfiguration) {
                            self.model.set(self.lastConfiguration);
                        } else {
                            self.model.set({
                                recurrence_type: RECURRENCE_TYPES.WEEKLY,
                                interval: self.sentences.weekly.interval,
                                days: self.sentences.weekly.days
                            });
                        }
                        self.showMore();
                    } else {
                        self.updateModel();
                        self.showLess();
                    }
                });

                this.controls.detailToggle.on('click', function (e) {
                    e.preventDefault();
                    if (self.more) {
                        self.showLess();
                    } else {
                        self.showMore();
                    }
                });

                _(this.controls.typeRadios).each(function ($radioButton) {
                    $radioButton.on("change", function () {
                        self.updateModel();
                    });
                });

                _("recurrence_type days month day_in_month interval occurrences until".split(" ")).each(function (attr) {
                    self.observeModel("change:" + attr, self.modelChanged, self);
                });

                self.observeModel("change:start_date", self.updateSuggestions, self);

                this.modelChanged();
                this.updateSuggestions();


            },
            setHint: function (string) {
                this.nodes.hint.empty().append($('<small>').text(string));
            },
            modelChanged: function () {
                var self = this;
                if (this.updatingModel) {
                    return;
                }
                this.updatingState = true;
                var type = this.model.get('recurrence_type');
                if (type === RECURRENCE_TYPES.NO_RECURRENCE) {
                    this.controls.checkbox.removeAttr("checked");
                    this.nodes.summary.empty().text(gt("Repeat"));
                    this.controls.detailToggle.hide();
                } else {
                    this.controls.detailToggle.show();
                    this.controls.checkbox.attr('checked', 'checked');
                    this.lastConfiguration = {};

                    _(["recurrence_type", "days", "day_in_month", "interval", "occurrences", "until"]).each(function (attr) {
                        if (self.model.isSet(attr)) {
                            self.lastConfiguration[attr] = self.model.get(attr);
                        }
                    });

                    var useLinksHint = gt("Click on the links to change the values.");
                    var chooseSentenceHint = gt("Click on a sentence to choose when to repeat the appointment.");

                    this.nodes.alternative1.children().detach();
                    this.nodes.alternative2.children().detach();
                    switch (type) {
                    case RECURRENCE_TYPES.DAILY:
                        this.controls.typeRadios.daily.attr('checked', 'checked');
                        this.nodes.alternative1.append(this.sentences.daily.$el);
                        this.setChoice(this.sentences.daily);
                        this.choice.set('interval', this.model.get('interval') || 1);
                        this.setHint(useLinksHint);
                        break;
                    case RECURRENCE_TYPES.WEEKLY:
                        this.controls.typeRadios.weekly.attr('checked', 'checked');
                        this.nodes.alternative1.append(this.sentences.weekly.$el);
                        this.setChoice(this.sentences.weekly);
                        if (this.model.isSet("interval")) {
                            this.choice.set('interval', this.model.get('interval'));
                        }
                        if (this.model.isSet('days')) {
                            this.choice.set('days', this.model.get('days'));
                        }
                        this.setHint(useLinksHint);
                        break;
                    case RECURRENCE_TYPES.MONTHLY:
                        this.controls.typeRadios.monthly.attr('checked', 'checked');
                        this.nodes.alternative1.append(
                            this.createGhost(this.sentences.monthlyDay)
                        );
                        this.nodes.alternative2.append(
                            this.createGhost(this.sentences.monthlyDate)
                        );
                        this.setHint(useLinksHint);
                        if (this.model.isSet("days")) {
                            this.setChoice(this.sentences.monthlyDay);
                            this.choice.set("ordinal", this.model.get("day_in_month"));
                            this.choice.set("day", this.model.get("days"));
                            this.choice.set("interval", this.model.get("interval"));
                            this.nodes.alternative1.children().detach();
                            this.nodes.alternative1.append(this.sentences.monthlyDay.$el);
                        } else if (this.model.isSet("day_in_month")) {
                            this.setChoice(this.sentences.monthlyDate);
                            this.choice.set("dayInMonth", this.model.get("day_in_month"));
                            this.choice.set("interval", this.model.get("interval"));
                            this.nodes.alternative2.children().detach();
                            this.nodes.alternative2.append(this.sentences.monthlyDate.$el);
                        } else {
                            this.setHint(chooseSentenceHint);
                            this.nodes.alternative1.find(".muted").removeClass("muted");
                            this.nodes.alternative2.find(".muted").removeClass("muted");
                            this.setChoice(null);
                        }
                        break;
                    case RECURRENCE_TYPES.YEARLY:
                        this.controls.typeRadios.yearly.attr('checked', 'checked');
                        this.nodes.alternative1.append(
                            this.createGhost(this.sentences.yearlyDay)
                        );
                        this.nodes.alternative2.append(
                            this.createGhost(this.sentences.yearlyDate)
                        );
                        this.setHint(useLinksHint);
                        if (this.model.isSet("days")) {
                            this.setChoice(this.sentences.yearlyDay);
                            this.choice.set("ordinal", this.model.get("day_in_month"));
                            this.choice.set("day", this.model.get("days"));
                            this.choice.set("month", this.model.get("month"));
                            this.nodes.alternative1.children().detach();
                            this.nodes.alternative1.append(this.sentences.yearlyDay.$el);
                        } else if (this.model.isSet("day_in_month")) {
                            this.setChoice(this.sentences.yearlyDate);
                            this.choice.set("month", this.model.get("month"));
                            this.choice.set("dayInMonth", this.model.get("day_in_month"));
                            this.nodes.alternative2.children().detach();
                            this.nodes.alternative2.append(this.sentences.yearlyDate.$el);
                        } else {
                            this.setHint(chooseSentenceHint);
                            this.nodes.alternative1.find(".muted").removeClass("muted");
                            this.nodes.alternative2.find(".muted").removeClass("muted");
                            this.setChoice(null);
                        }
                        break;

                    }

                    this.nodes.endsChoice.children().detach();


                    if (this.model.get('occurrences')) {
                        this.nodes.endsChoice.append(this.ends.after.$el);
                        // workaround: swapped lines to avoid problems via endingChanged (see bug 24138)
                        this.endsChoice.set('occurrences', this.model.get("occurrences"));
                        this.setEnding(this.ends.after);
                    } else if (this.model.get('until')) {
                        this.nodes.endsChoice.append(this.ends.date.$el);
                        // workaround: swapped lines to avoid problems via endingChanged (see bug 24138)
                        this.endsChoice.set("until", this.model.get("until"));
                        this.setEnding(this.ends.date);
                    } else {
                        this.nodes.endsChoice.append(this.ends.never.$el);
                        this.setEnding(this.ends.never);
                    }
                    this.nodes.summary.empty();
                    if (this.choice.id === "no-choice") {
                        this.nodes.summary.append(this.choice.ghost(), $("<span>&nbsp;</span>"));
                    } else {
                        this.nodes.summary.append(
                            this.choice.ghost(),
                            this.endsChoice.ghost(),
                            $("<span>&nbsp;</span>")
                        );
                    }

                }

                this.updatingState = false;
            },
            updateModel: function () {
                if (this.updatingState) {
                    return;
                }
                this.updatingModel = true;

                this.model.unset('recurrence_type');
                this.model.unset('interval');
                this.model.unset('days');
                this.model.unset('day_in_month');
                this.model.unset('month');
                this.model.unset('occurrences');
                this.model.unset('until');

                if (this.controls.checkbox.is(":checked")) {
                    if (this.controls.typeRadios.daily.is(":checked")) {
                        var daily =  {
                            recurrence_type: RECURRENCE_TYPES.DAILY,
                            interval: this.sentences.daily.interval
                        };
                        this.model.set(daily);
                    } else if (this.controls.typeRadios.weekly.is(":checked")) {
                        var weekly =  {
                            recurrence_type: RECURRENCE_TYPES.WEEKLY,
                            interval: this.sentences.weekly.interval,
                            days: this.sentences.weekly.days
                        };
                        this.model.set(weekly);
                    } else if (this.controls.typeRadios.monthly.is(":checked")) {
                        var monthly =  {
                            recurrence_type: RECURRENCE_TYPES.MONTHLY
                        };
                        if (this.choice.id === "monthlyDay") {
                            _.extend(monthly, {
                                day_in_month: this.choice.ordinal,
                                days: this.choice.day,
                                interval: this.choice.interval
                            });
                        } else if (this.choice.id === "monthlyDate") {
                            _.extend(monthly, {
                                recurrence_type: RECURRENCE_TYPES.MONTHLY,
                                day_in_month: this.choice.dayInMonth,
                                interval: this.choice.interval
                            });
                        }
                        this.model.set(monthly);
                    } else if (this.controls.typeRadios.yearly.is(":checked")) {

                        var yearly =  {
                            recurrence_type: RECURRENCE_TYPES.YEARLY
                        };

                        if (this.choice.id === "yearlyDay") {
                            _.extend(yearly, {
                                day_in_month: this.choice.ordinal,
                                days: this.choice.day,
                                month: this.choice.month,
                                interval: 1
                            });
                        } else if (this.choice.id === "yearlyDate") {
                            _.extend(yearly, {
                                day_in_month: this.choice.dayInMonth,
                                month: this.choice.month,
                                interval: 1
                            });
                        }

                        this.model.set(yearly);
                    }

                    if (this.endsChoice) {
                        switch (this.endsChoice.id) {
                        case "never":
                            break;
                        case "date":
                            this.model.set({
                                until: this.endsChoice.until
                            });
                            break;
                        case "after":
                            this.model.set({
                                occurrences: this.endsChoice.occurrences
                            });
                            break;
                        }
                    }
                } else {
                    // No Recurrence
                    this.model.set({recurrence_type: RECURRENCE_TYPES.NO_RECURRENCE});
                }

                this.updatingModel = false;

                this.modelChanged();
            },

            createGhost: function (sentence) {
                var self = this;
                var $ghost = $('<span class="muted">').append(sentence.ghost());
                $ghost.on('click', function () {
                    self.setChoice(sentence);
                    self.updateModel();
                });
                $ghost.css({cursor: 'pointer'});
                return $ghost;
            },
            setEnding: function (sentence) {
                if (this.endsChoice) {
                    this.endsChoice.off("change");
                }
                this.endsChoice = sentence;
                this.endsChoice.on("change", this.endingChanged, this);
            },
            endingChanged: function () {
                switch (this.endsChoice.ending) {
                case "1":
                    this.setEnding(this.ends.never);
                    break;
                case "2":
                    this.setEnding(this.ends.date);
                    break;
                case "3":
                    this.setEnding(this.ends.after);
                    break;
                }
                this.updateModel();
            },
            setChoice: function (sentence) {
                if (this.choice) {
                    this.choice.off('change');
                }
                if (sentence === null) {
                    this.choice = {
                        id: 'no-choice',
                        ghost: function () {
                            return $('<span>').text(gt("Please choose a sentence below."));
                        },
                        on: $.noop,
                        off: $.noop
                    };
                    return;
                }
                this.choice = sentence;
                this.choice.on("change", this.updateModel, this);
            },
            showMore: function () {
                this.more = true;
                this.$el.addClass("io-ox-recurrence-view-active");
                this.controls.detailToggle.show();
                this.controls.detailToggle.empty().append($('<i class="icon-remove">'));
                this.nodes.summary.show();
                this.nodes.typeChoice.show();
                this.nodes.hint.show();
                this.nodes.alternative1.show();
                this.nodes.alternative2.show();
                this.nodes.endsChoice.show();
            },
            showLess: function () {
                this.more = false;
                this.$el.removeClass("io-ox-recurrence-view-active");
                this.controls.detailToggle.text(gt("Edit"));
                this.nodes.typeChoice.hide();
                this.nodes.hint.hide();
                this.nodes.alternative1.hide();
                this.nodes.alternative2.hide();
                this.nodes.endsChoice.hide();
            },
            // determineSentenceConcordance: function () {
            //     if (this.choice.id === 'no-choice' || this.choice.id === 'daily') {
            //         return false;
            //     }

            //     var startDate = new dateAPI.Local(dateAPI.Local.utc(this.model.get("start_date")));

            //     var dayBits = 1 << startDate.getDay();
            //     var dayInMonth = startDate.getDate();
            //     var month = startDate.getMonth();
            //     var ordinal = Math.ceil(startDate.getDate() / 7);

            //     // Weekly
            //     if (this.choice.id === 'weekly') {
            //         // Concordance: if the start dates day is one of the selected days
            //         return !!(dayBits & this.choice.days);
            //     }

            //     // Monthly
            //     if (this.choice.id === 'monthlyDay') {
            //         // Concordance: if the date matches the start date
            //         return dayInMonth === this.choice.dayInMonth;
            //     }

            //     if (this.choice.id === 'monthlyDate') {
            //         // Concordance: if days and day_in_month point to the same day as the start date
            //         return (dayBits === this.choice.day && ordinal === this.choice.ordinal);
            //     }

            //     // Yearly
            //     if (this.choice.id === 'yearlyDay') {
            //         // Concordance: if the date matches the start date
            //         return (dayInMonth === this.choice.dayInMonth && month === this.choice.month);
            //     }

            //     if (this.choice.id === 'yearlyDate') {
            //         // Concordance: if days and day_in_month point to the same day as the start date
            //         return (dayBits === this.choice.day && ordinal === this.choice.ordinal && month === this.choice.month);
            //     }

            //     return false;
            // },
            // magicStartDate: function () {
            //     if (!this.concordance) {
            //         return;
            //     }
            //     if (this.determineSentenceConcordance()) {
            //         return;
            //     }
            //     var startDate = new dateAPI.Local(dateAPI.Local.utc(this.model.get("start_date")));

            //     switch (this.choice.id) {
            //     case "weekly":
            //         // A different set of days was selected
            //         // That doesn't include the current day anymore
            //         // So, select the next day from the old start date that actually works here
            //         while (true) {
            //             startDate.add(dateAPI.DAY);
            //             if ((1 << startDate.getDay()) & this.choice.days) {
            //                 this.model.set("start_date", dateAPI.Local.utc(startDate));
            //             }
            //         }
            //         break;
            //     case "monthlyDay":
            //         break;
            //     case "monthlyDate":
            //         break;
            //     case "yearlyDay":
            //         break;
            //     case "yearlyDate":
            //         break;
            //     }
            // },
            updateSuggestions: function () {
                var self = this;
                var startDate = new dateAPI.Local(dateAPI.Local.utc(this.model.get("start_date")));

                var dayBits = 1 << startDate.getDay();
                var dayInMonth = startDate.getDate();
                var month = startDate.getMonth();
                var ordinal = Math.ceil(startDate.getDate() / 7);

                var canUpdate = function (sentence) {
                    // Don't update the chosen sentence carelessly
                    return sentence !== self.choice;
                };

                if (this.previousStartDate) {
                    var previousAttributes = {
                        dayBits: 1 << this.previousStartDate.getDay(),
                        dayInMonth: this.previousStartDate.getDate(),
                        month: this.previousStartDate.getMonth(),
                        ordinal: Math.ceil(this.previousStartDate.getDate() / 7)
                    };
                    canUpdate = function (sentence) {
                        if (sentence !== self.choice) {
                            // Not the chosen sentence, so update the suggestion
                            return true;
                        }

                        // Update the current choice only if it was similar to the previously chosen date
                        if (!_.isUndefined(sentence.days) && ! (sentence.days & previousAttributes.dayBits)) {
                            return false;
                        }
                        if (!_.isUndefined(sentence.day) &&  (sentence.day !== previousAttributes.dayBits)) {
                            return false;
                        }
                        if (!_.isUndefined(sentence.dayInMonth) && (sentence.dayInMonth !== previousAttributes.dayInMonth)) {
                            return false;
                        }
                        if (!_.isUndefined(sentence.month) && (sentence.month !== previousAttributes.month)) {
                            return false;
                        }
                        if (!_.isUndefined(sentence.ordinal) &&  (sentence.ordinal !== previousAttributes.ordinal)) {
                            return false;
                        }
                        return true;
                    };
                }


                // Weekly

                if (canUpdate(this.sentences.weekly)) {
                    if (! (this.sentences.weekly.days & dayBits)) {
                        this.sentences.weekly.set('days', dayBits);
                    }
                }

                // Monthly
                if (canUpdate(this.sentences.monthlyDay)) {
                    this.sentences.monthlyDay.set('day', dayBits);
                    this.sentences.monthlyDay.set('ordinal', ordinal);
                }

                if (canUpdate(this.sentences.monthlyDate)) {
                    this.sentences.monthlyDate.set('dayInMonth', dayInMonth);
                }

                // Yearly

                if (canUpdate(this.sentences.yearlyDay)) {
                    this.sentences.yearlyDay.set('day', dayBits);
                    this.sentences.yearlyDay.set('ordinal', ordinal);
                    this.sentences.yearlyDay.set('month', month);
                }

                if (canUpdate(this.sentences.yearlyDate)) {
                    this.sentences.yearlyDate.set('dayInMonth', dayInMonth);
                    this.sentences.yearlyDate.set('month', month);
                }

                this.previousStartDate = startDate;

            },
            render: function () {
                this.$el.append(
                    $('<div class="row-fluid">').append(
                        $('<label class="checkbox control-label desc">').append(
                            this.controls.checkbox,
                            this.nodes.summary,
                            this.controls.detailToggle
                        )
                    ),
                    $('<div class="row-fluid">&nbsp;</div>'),
                    this.nodes.typeChoice,
                    this.nodes.hint,
                    this.nodes.alternative1,
                    this.nodes.alternative2,
                    $('<div class="row-fluid">&nbsp;</div>'),
                    this.nodes.endsChoice
                );
            }
        }, options);
    };

    return RecurrenceView;
});
