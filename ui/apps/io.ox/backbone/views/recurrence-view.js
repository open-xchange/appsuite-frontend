/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
define('io.ox/backbone/views/recurrence-view', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views',
    'io.ox/backbone/mini-views/datepicker',
    'gettext!io.ox/calendar/edit/main',
    'less!io.ox/backbone/views/recurrence-view'
], function (ext, ModalDialog, mini, MiniDatepickerView, gt) {

    var momentShorthands = ['d', 'w', 'M', 'y'],
        INDEX = 0;

    ext.point('io.ox/backbone/views/recurrence-view/dialog').extend({
        index: INDEX += 100,
        id: 'repeat',
        render: (function () {
            var NumberSelectView = mini.SelectView.extend({
                onChange: function () {
                    this.model.set(this.name, parseInt(this.$el.val(), 10));
                }
            });

            return function () {
                var guid = _.uniqueId('form-control-label-'),
                    input = new NumberSelectView({
                        model: this.model,
                        name: 'recurrence_type',
                        id: guid,
                        list: [{
                            value: 1,
                            label: gt('Daily')
                        }, {
                            value: 2,
                            label: gt('Weekly')
                        }, {
                            value: 3,
                            label: gt('Monthly')
                        }, {
                            value: 4,
                            label: gt('Yearly')
                        }]
                    }),
                    update = function (model) {
                        var type = model.get('recurrence_type'),
                            startAttribute = model.get('start_time') || model.get('start_date'),
                            startDate = moment(startAttribute),
                            day_in_month = model.get('day_in_month'),
                            days = model.get('days');

                        if (!day_in_month) {
                            day_in_month = startDate.date();
                            days = undefined;
                        }

                        if (type === 1) {
                            model.set({
                                days: undefined,
                                day_in_month: undefined,
                                month: undefined
                            });
                        } else if (type === 2) {
                            model.set({
                                days: model.has('days') ? model.get('days') : 1 << startDate.day(),
                                day_in_month: undefined,
                                month: undefined
                            });
                        } else if (type === 3) {
                            model.set({
                                days: days,
                                day_in_month: day_in_month,
                                month: undefined
                            });
                        } else if (type === 4) {
                            model.set({
                                days: days,
                                day_in_month: day_in_month,
                                month: model.has('month') ? model.get('month') : startDate.month(),
                                interval: 1
                            });
                        }
                    };

                input.listenTo(this.model, 'change:recurrence_type', update);

                this.$body.append(
                    $('<div class="form-group">').append(
                        $('<label class="control-label col-sm-4">').attr('for', guid).text(gt('Repeat')),
                        $('<div class="col-sm-6">').append(
                            input.render().$el
                        )
                    )
                );
            };
        })()
    });

    ext.point('io.ox/backbone/views/recurrence-view/dialog').extend({
        index: INDEX += 100,
        id: 'interval',
        render: function () {
            var guid = _.uniqueId('form-control-label-'),
                list = [gt('day(s)'), gt('week(s)'), gt('month(s)'), gt('year(s)')],
                input = new mini.InputView({
                    model: this.model,
                    name: 'interval',
                    id: guid
                }), formGroup, label,
                update = function (model) {
                    var type = model.get('recurrence_type');
                    formGroup.toggleClass('hidden', type === 0 || type === 4);
                    label.text(list[type - 1]);
                };

            input.listenTo(this.model, 'change:recurrence_type', update);

            this.$body.append(
                formGroup = $('<div class="form-group">').append(
                    $('<label class="control-label col-sm-4 col-xs-12">').attr('for', guid).text(gt('Interval')),
                    $('<div class="col-xs-8">').append(
                        input.render().$el.addClass('small'),
                        label = $('<span class="extra-label">'),
                        new mini.ErrorView({
                            model: this.model,
                            name: 'interval'
                        }).render().$el
                    )
                )
            );
            update(this.model);
        }
    });

    ext.point('io.ox/backbone/views/recurrence-view/dialog').extend({
        index: INDEX += 100,
        id: 'repeat-by',
        render: (function () {
            var RadioSerializeView = mini.RadioView.extend({
                setup: function (opt) {
                    this.serialize = opt.serialize;
                    this.deserialize = opt.deserialize;
                    this.listenTo(this.model, 'change:' + (this.listenTo || this.name), this.update);
                },
                onChange: function () {
                    var selected = this.$el.find('[name="' + this.name + '"]:checked').val();
                    this.serialize(selected);
                },
                update: function () {
                    var value = this.deserialize();
                    _.each(this.$el.find('[name="' + this.name + '"]'), function (option) {
                        if (value === option.value) $(option).prop('checked', true);
                    });
                }
            });

            return function () {
                var guid = _.uniqueId('form-control-label-'),
                    input = new RadioSerializeView({
                        model: this.model,
                        id: guid,
                        name: 'day-of-week-or-month',
                        listenTo: 'days',
                        list: [{
                            label: gt('Date'),
                            value: 'date'
                        }, {
                            label: gt('Weekday'),
                            value: 'weekday'
                        }],
                        serialize: function (selection) {
                            var startAttribute = this.model.get('start_time') || this.model.get('start_date'),
                                day = moment(startAttribute),
                                type = this.model.get('recurrence_type');

                            if (selection === 'date') {
                                this.model.set({
                                    month: type === 4 ? day.month() : undefined,
                                    days: undefined,
                                    'day_in_month': day.date()
                                });
                            } else {
                                this.model.set({
                                    month: type === 4 ? day.month() : undefined,
                                    day_in_month: ((day.date() - 1) / 7 >> 0) + 1,
                                    days: 1 << day.day()
                                });
                            }
                        },
                        deserialize: function () {
                            if (this.model.has('days')) return 'weekday';
                            return 'date';
                        }
                    }),
                    formGroup,
                    update = function (model) {
                        var type = model.get('recurrence_type'),
                            monthly = type === 3,
                            yearly = type === 4,
                            visible = monthly || yearly;
                        formGroup.toggleClass('hidden', !visible);
                        if (visible) input.update();
                    };

                input.listenTo(this.model, 'change:recurrence_type', update);

                this.$body.append(
                    formGroup = $('<div class="form-group">').append(
                        $('<label class="control-label col-sm-4">').attr('for', guid).text(gt('Repeat by')),
                        $('<div class="btn-group col-sm-8">').append(
                            input.render().$el
                        )
                    )
                );
                update(this.model);
            };
        })()
    });

    ext.point('io.ox/backbone/views/recurrence-view/dialog').extend({
        index: INDEX += 100,
        id: 'repeat-on-checkbox',
        render: (function () {
            var BitmaskCheckbox = mini.CheckboxView.extend({
                    setup: function (opt) {
                        this.bitmask = opt.bitmask;
                        mini.CheckboxView.prototype.setup.apply(this, arguments);
                    },
                    onChange: function () {
                        var value = this.model.get(this.name);
                        if (this.$el.prop('checked')) value |= this.bitmask;
                        else value &= ~this.bitmask;
                        this.model.set(this.name, value);
                    },
                    update: function () {
                        var checked = this.isModelChecked();
                        this.$el.prop('checked', checked);
                        this.$el.parent().toggleClass('active', checked);
                    },
                    isModelChecked: function () {
                        return (this.model.get(this.name) & this.bitmask) !== 0;
                    }
                }),
                CheckboxButtonsView = Backbone.View.extend({
                    initialize: function (opt) {
                        this.list = opt.list;
                    },
                    render: function () {
                        var self = this;
                        this.$el.attr('data-toggle', 'buttons').append(
                            _(this.list).map(function (obj) {
                                var View = obj.view || mini.CheckboxView,
                                    view = new View(_.extend({
                                        model: self.model
                                    }, obj.options)).render();
                                return $('<label class="btn btn-default">').toggleClass('active', view.$el.prop('checked')).append(
                                    view.$el,
                                    obj.label
                                );
                            })
                        );
                        return this;
                    }
                });

            return function () {
                var days = _(_.range(7)).map(function (num) {
                        return moment().weekday(num).format('dd');
                    }),
                    firstDayOfWeek = moment.localeData().firstDayOfWeek(),
                    list = _(days).map(function (str, index) {
                        return {
                            view: BitmaskCheckbox,
                            options: {
                                bitmask: 1 << ((index + firstDayOfWeek) % 7),
                                name: 'days'
                            },
                            label: str
                        };
                    }),
                    input = new CheckboxButtonsView({
                        className: 'btn-group col-sm-8',
                        model: this.model,
                        list: list
                    }),
                    formGroup,
                    update = function (model) {
                        var type = model.get('recurrence_type'),
                            visible = (type === 2);
                        formGroup.toggleClass('hidden', !visible);
                    };

                input.listenTo(this.model, 'change:recurrence_type', update);

                this.$body.append(
                    formGroup = $('<div class="form-group hidden">').append(
                        $('<label class="control-label col-sm-4">').text(gt('Weekday')),
                        input.render().$el
                    )
                );
                update(this.model);
            };
        })()
    });

    ext.point('io.ox/backbone/views/recurrence-view/dialog').extend({
        index: INDEX += 100,
        id: 'summary',
        render: (function () {
            var SimpleTextView = mini.AbstractView.extend({
                className: 'simple-text-view col-sm-8 col-sm-offset-4',
                setup: function () {
                    this.listenTo(this.model, 'change', this.update);
                },
                update: function () {
                    if (!this.model.checkValidation()) return;

                    var baton = new ext.Baton({ view: this, model: this.model });
                    ext.point('io.ox/backbone/views/recurrence-view/recurrence-string').invoke('action', null, baton);
                    this.$el.text(baton.text);
                },
                render: function () {
                    this.update();
                    return this;
                }
            });

            return function () {
                var view = new SimpleTextView({
                    model: this.model
                });
                this.$body.append(
                    $('<div class="form-group text-group">').append(
                        view.render().$el
                    )
                );
            };
        })()
    });

    ext.point('io.ox/backbone/views/recurrence-view/dialog').extend({
        index: INDEX += 100,
        id: 'ends',
        render: (function () {
            var EndsSelectView = mini.SelectView.extend({
                onChange: function () {
                    var selection = this.$el.val(),
                        old = this.getValue();
                    if (old === selection) return;

                    var start = this.model.get('start_time') || this.model.get('start_date');

                    if (selection === 'never') {
                        this.model.set({
                            'until': undefined,
                            'occurrences': undefined
                        });
                    } else if (selection === 'until') {
                        var date = moment(start).add(1, momentShorthands[this.model.get('recurrence_type') - 1]);
                        if (old === 'occurrences') {
                            // set date to have the same amount as occurrences
                            date = moment(start).add(
                                this.model.get('occurrences') - 1,
                                momentShorthands[this.model.get('recurrence_type') - 1]
                            );
                            date = moment.max(moment(start), date);
                        }
                        this.model.set({
                            'occurrences': undefined,
                            'until': date.valueOf()
                        });
                    } else {
                        // selection === 'occurrences'
                        var occurrences = 1;
                        if (old === 'until') {
                            var until = moment(this.model.get('until'));
                            occurrences = Math.ceil(until.diff(
                                moment(start),
                                momentShorthands[this.model.get('recurrence_type') - 1],
                                true
                            )) + 1;
                            occurrences = Math.max(1, occurrences);
                        }
                        this.model.set({
                            'until': undefined,
                            'occurrences': occurrences
                        });
                    }
                },
                update: function () {
                    this.$el.val(this.getValue());
                },
                getValue: function () {
                    if (this.model.has('occurrences')) return 'occurrences';
                    if (this.model.has('until')) return 'until';
                    return 'never';
                }
            });

            return function () {
                var guid = _.uniqueId('form-control-label-'),
                    input = new EndsSelectView({
                        model: this.model,
                        id: guid,
                        name: 'until change:occurrences',
                        list: [{
                            label: gt('Never'),
                            value: 'never'
                        }, {
                            label: gt('After a number of occurrences'),
                            value: 'occurrences'
                        }, {
                            label: gt('On specific date'),
                            value: 'until'
                        }]
                    }),
                    formGroup,
                    update = function (model) {
                        var type = model.get('recurrence_type');
                        formGroup.toggleClass('hidden', type <= 0);
                    };

                input.listenTo(this.model, 'change:recurrence_type', update);
                this.$body.append(
                    formGroup = $('<div class="form-group">').append(
                        $('<label class="control-label col-sm-4">').attr('for', guid).text(gt('Ends')),
                        $('<div class="col-sm-6">').append(
                            input.render().$el
                        )
                    )
                );
                update(this.model);
            };
        })()
    });

    ext.point('io.ox/backbone/views/recurrence-view/dialog').extend({
        index: INDEX += 100,
        id: 'occurrences',
        render: function () {
            var guid = _.uniqueId('form-control-label-'),
                input = new mini.InputView({
                    model: this.model,
                    name: 'occurrences',
                    id: guid
                }), formGroup,
                update = function (model) {
                    var type = model.get('recurrence_type'),
                        visible = type > 0 && model.has('occurrences');
                    formGroup.toggleClass('hidden', !visible);
                };

            input.listenTo(this.model, 'change:recurrence_type change:occurrences', update);

            this.$body.append(
                formGroup = $('<div class="form-group hidden">').append(
                    $('<label class="control-label col-sm-4">').attr('for', guid).text(gt('Occurrences')),
                    $('<div class="col-sm-8">').append(
                        input.render().$el.addClass('small'),
                        new mini.ErrorView({
                            model: this.model,
                            name: 'interval'
                        }).render().$el
                    )
                )
            );
            update(this.model);
        }
    });

    ext.point('io.ox/backbone/views/recurrence-view/dialog').extend({
        index: INDEX += 100,
        id: 'until',
        render: (function () {
            var DatepickerView = MiniDatepickerView.extend({
                onError: $.noop
            });

            return function () {
                var guid = _.uniqueId('form-control-label-'),
                    input = new DatepickerView({
                        model: this.model,
                        attribute: 'until',
                        clearButton: true,
                        display: 'DATE'
                    }), formGroup,
                    update = function (model) {
                        var type = model.get('recurrence_type'),
                            visible = type > 0 && model.has('until');
                        formGroup.toggleClass('hidden', !visible);
                    };

                input.listenTo(this.model, 'change:recurrence_type change:until', update);

                this.$body.append(
                    formGroup = $('<div class="form-group">').append(
                        $('<label class="control-label col-sm-4">').attr('for', guid).text(gt('Ends on')),
                        $('<div class="col-sm-8">').append(
                            input.render().$el,
                            new mini.ErrorView({
                                model: this.model,
                                name: 'until'
                            }).render().$el
                        )
                    )
                );
                input.$('.simple.control-label').remove();
                update(this.model);
            };
        })()
    });

    var nth = [
        //#. used in concatenated string. Example: Every month on the first Tuesday
        gt('first'),
        //#. used in concatenated string. Example: Every month on the second Tuesday
        gt('second'),
        //#. used in concatenated string. Example: Every month on the third Tuesday
        gt('third'),
        //#. used in concatenated string. Example: Every month on the fourth Tuesday
        gt('fourth'),
        //#. used in concatenated string. Example: Every month on the fifth / last Tuesday
        gt('fifth / last')
    ];

    ext.point('io.ox/backbone/views/recurrence-view/recurrence-string').extend({
        index: 100,
        id: 'daily',
        action: function (baton) {
            if (baton.model.get('recurrence_type') !== 1) return;
            var interval = baton.model.get('interval');

            baton.text = gt.format(gt.ngettext('Every day.', 'Every %1$s days.', interval), interval);
        }
    });

    ext.point('io.ox/backbone/views/recurrence-view/recurrence-string').extend({
        index: 200,
        id: 'weekly',
        action: function (baton) {
            if (baton.model.get('recurrence_type') !== 2) return;
            var interval = baton.model.get('interval'),
                days = baton.model.get('days'),
                firstDayOfWeek = moment.localeData().firstDayOfWeek(),
                formattedDays = _(_.range(7)).chain().map(function (index) {
                    var mask = 1 << ((index + firstDayOfWeek) % 7);
                    if ((days & mask) !== 0) return moment().weekday(index).format('dddd');
                }).compact().value().join(
                    //#. This delimiter is used to concatenate a list of string
                    //#. Example: Monday, Tuesday, Wednesday
                    gt(', ')
                );

            if (interval === 1) {
                //#. %1$s list of days
                //#. Example: Every Monday, Wednesday, Friday
                baton.text = gt('Every %1$s.', formattedDays);
            } else {
                //#. %1$s interval, when the appointment / task is repeated
                //#. %2$s list of days
                //#. Example: Every 3 weeks on Monday, Thursday
                baton.text = gt('Every %1$s weeks on %2$s.', interval, formattedDays);
            }
        }
    });

    ext.point('io.ox/backbone/views/recurrence-view/recurrence-string').extend({
        index: 300,
        id: 'monthly',
        action: function (baton) {
            if (baton.model.get('recurrence_type') !== 3) return;

            var interval = baton.model.get('interval'),
                date = baton.model.get('day_in_month');

            if (baton.model.has('days')) {
                // repeat by weekday
                var days = baton.model.get('days'),
                    firstDayOfWeek = moment.localeData().firstDayOfWeek(),
                    formattedDay = _(_.range(7)).chain().map(function (index) {
                        var mask = 1 << ((index + firstDayOfWeek) % 7);
                        if ((days & mask) !== 0) return moment().weekday(index).format('dddd');
                    }).compact().first().value();

                if (interval === 1) {
                    //#. %1$s first, second, third, fourth or fifth / last
                    //#. %2$s a day of the week
                    //#. Example: Every month on the second Monday
                    baton.text = gt('Every month on the %1$s %2$s.', nth[date - 1], formattedDay);
                } else {
                    //#. %1$s interval, how often appointment / task is repeated
                    //#. %2$s first, second, third, fourth or fifth / last
                    //#. %3$s a day of the week
                    //#. Example Every 3 months on the second Tuesday
                    baton.text = gt('Every %1$s months on the %2$s %3$s.', interval, nth[date - 1], formattedDay);
                }
            } else if (interval === 1) {
                //#. %1$s day in the month
                //#. Example: Every month on day 5
                baton.text = gt('Every month on day %1$s.', date);
            } else {
                //#. %1$s interval, how often appointment / task is repeated
                //#. %2$s day in the month
                //#. Example: Every 5 months on day 18
                baton.text = gt('Every %1$s months on day %2$s.', interval, date);
            }
        }
    });

    ext.point('io.ox/backbone/views/recurrence-view/recurrence-string').extend({
        index: 400,
        id: 'yearly',
        action: function (baton) {
            if (baton.model.get('recurrence_type') !== 4) return;

            var month = moment().month(baton.model.get('month')).format('MMMM');

            if (baton.model.has('days')) {
                var date = baton.model.get('day_in_month'),
                    days = baton.model.get('days'),
                    firstDayOfWeek = moment.localeData().firstDayOfWeek(),
                    formattedDay = _(_.range(7)).chain().map(function (index) {
                        var mask = 1 << ((index + firstDayOfWeek) % 7);
                        if ((days & mask) !== 0) return moment().weekday(index).format('dddd');
                    }).compact().first().value();

                //#. %1$s first, second, third, fourth or fifth / last
                //#. %2$s a day of the week
                //#. %3$s the month
                //#. Example: Every year on the first Tuesday in December
                baton.text = gt('Every year on the %1$s %2$s in %3$s.', nth[date - 1], formattedDay, month);
            } else {
                var day = baton.model.get('day_in_month');

                //#. %1$s the month
                //#. %2$s the day
                //#. Example: Every year in December on day 3
                baton.text = gt('Every year in %1$s on day %2$s.', month, day);
            }
        }
    });

    ext.point('io.ox/backbone/views/recurrence-view/end-string').extend({
        index: 100,
        id: 'never',
        action: function (baton) {
            if (baton.model.has('occurrences') || baton.model.has('until')) return;

            baton.text = gt('The series never ends.');
        }
    });

    ext.point('io.ox/backbone/views/recurrence-view/end-string').extend({
        index: 200,
        id: 'occurrences',
        action: function (baton) {
            if (!baton.model.has('occurrences')) return;

            var occurrences = parseInt(baton.model.get('occurrences'), 10);
            //#. %1$s The amount of occurrences, after the series ends
            baton.text = gt.format(gt.ngettext('The series ends after one occurrence.', 'The series ends after %1$s occurrences.', occurrences), occurrences);
        }
    });

    ext.point('io.ox/backbone/views/recurrence-view/end-string').extend({
        index: 300,
        id: 'until',
        action: function (baton) {
            if (!baton.model.has('until')) return;

            //#. %1$s The date when the series ends
            baton.text = gt('The series ends on %1$s.', moment(baton.model.get('until')).format('l'));
        }
    });

    var SerializeCheckboxView = mini.CheckboxView.extend({
            onChange: function () {
                var val = this.$el.prop('checked'),
                    old = this.model.get('recurrence_type') > 0;
                if (!old && val) {
                    this.model.set('recurrence_type', 1);
                    this.model.set('interval', 1);
                }
                if (old && !val) {
                    // cleanup
                    this.model.set('recurrence_type', 0);
                    this.model.unset('interval');
                    this.model.unset('days');
                    this.model.unset('day_in_month');
                    this.model.unset('month');
                    this.model.unset('occurrences');
                    this.model.unset('until');
                }
            },
            update: function () {
                this.$el.prop('checked', this.model.get('recurrence_type') > 0);
            }
        }),
        RecurrenceModel = Backbone.Model.extend({
            initialize: function () {
                this.on('change', this.checkValidation);
            },
            checkValidation: function () {
                // check if interval is number
                var interval = String(this.get('interval')),
                    validInterval = (interval.match(/^\d+$/) && parseInt(interval, 10) > 0);
                if (validInterval) this.trigger('valid:interval');
                else this.trigger('invalid:interval', gt('Please enter a positive number'));

                // check if occurrences is number
                var occurrences = String(this.get('occurrences')),
                    validOccurrences = !this.has('occurrences') || (occurrences.match(/^\d+$/) && parseInt(occurrences, 10) > 0);
                if (validOccurrences) this.trigger('valid:occurrences');
                else this.trigger('invalid:occurrences', gt('Please enter a positive number'));

                var until = moment(this.get('until')),
                    start = moment(this.get('start_time') || this.get('start_date')),
                    validUntil = !this.has('until') || until.isAfter(start, 'day') || until.isSame(start, 'day');
                if (validUntil) this.trigger('valid:until');
                else this.trigger('invalid:until', gt('Please insert a date after the start date'));

                return validInterval && validOccurrences && validUntil;
            }
        });

    return Backbone.View.extend({

        className: 'recurrence-view',

        events: {
            'click .summary': 'onOpenDialog'
        },

        initialize: function () {
            this.listenTo(this.model, 'change:recurrence_type change:interval change:days change:day_in_month change:month change:occurrences change:until', this.updateSummary);
            this.listenTo(this.model, 'change:start_time change:start_date', this.onChangeStart);
        },

        onOpenDialog: function () {
            var self = this;
            new ModalDialog({
                title: gt('Edit recurrence'),
                width: 560,
                point: 'io.ox/backbone/views/recurrence-view/dialog',
                async: true,
                model: new RecurrenceModel(this.model.pick(
                    'recurrence_type',
                    'interval',
                    'days',
                    'day_in_month',
                    'month',
                    'occurrences',
                    'until',
                    'start_time',
                    'start_date'
                )),
                focus: 'select'
            })
            .build(function () {
                this.$el.addClass('recurrence-view-dialog');
                this.$body.addClass('form-horizontal');
            })
            .addCancelButton()
            .addButton({ label: gt('Apply'), action: 'apply' })
            .on('apply', function () {
                if (!this.model.checkValidation()) {
                    this.idle();
                    // focus first element which has error
                    $('.has-error input').first().focus();
                    return;
                }

                self.model.set(this.model.toJSON());
                this.close();
            })
            .open();
        },

        render: function () {
            this.$el.append(
                $('<div class="checkbox">').append(
                    $('<label>').append(
                        new SerializeCheckboxView({
                            model: this.model,
                            name: 'recurrence_type'
                        }).render().$el,
                        gt('Repeat')
                    ),
                    $('<a href="#" class="summary">').append(
                        $('<span class="recurrence-summary">'),
                        ' ', // add a space here between. if use padding/margin, the text decoration is splitted
                        $('<span class="ends-summary">')
                    )
                )
            );
            this.updateSummary();
            return this;
        },

        updateSummary: function () {
            var $recSummary = this.$('.recurrence-summary'),
                $endSummary = this.$('.ends-summary'),
                visible = this.model.get('recurrence_type') > 0;
            this.$('.summary').toggleClass('hidden', !visible);
            if (visible) {
                var baton = new ext.Baton({ view: this, model: this.model });
                ext.point('io.ox/backbone/views/recurrence-view/recurrence-string').invoke('action', null, baton);
                $recSummary.text(baton.text);
                ext.point('io.ox/backbone/views/recurrence-view/end-string').invoke('action', null, baton);
                $endSummary.text(baton.text);
            }
        },

        onChangeStart: function () {
            var type = this.model.get('recurrence_type');
            if (type === 0) return;
            var oldDate = moment(this.model.previous('start_time') || this.model.previous('start_date')),
                date = moment(this.model.get('start_time') || this.model.get('start_date'));

            // if weekly and only single day selected
            if (type === 2 && this.model.get('days') === 1 << oldDate.day()) {
                this.model.set('days', 1 << date.day());
            }

            // if monthly or yeary, adjust date/day of week
            if (type === 3 || type === 4) {
                if (this.model.has('days')) {
                    // repeat by weekday
                    this.model.set({
                        day_in_month: ((date.date() - 1) / 7 >> 0) + 1,
                        'days': 1 << date.day()
                    });
                } else {
                    // repeat by date
                    this.model.set('day_in_month', date.date());
                }
            }

            // if yearly, adjust month
            if (type === 4) {
                this.model.set('month', date.month());
            }

            // change until
            if (this.model.get('until') && moment(this.model.get('until')).isBefore(date)) {
                this.model.set('until', date.add(1, momentShorthands[this.model.get('recurrence_type') - 1]).valueOf());
            }
        }

    });

});
