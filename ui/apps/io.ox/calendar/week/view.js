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

define('io.ox/calendar/week/view', [
    'io.ox/core/extensions',
    'io.ox/calendar/perspective',
    'io.ox/calendar/util',
    'io.ox/core/util',
    'io.ox/calendar/api',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar',
    'settings!io.ox/core',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/capabilities',
    'io.ox/core/print',
    'io.ox/backbone/views/disposable',
    'io.ox/calendar/extensions',
    'io.ox/calendar/week/extensions',
    'less!io.ox/calendar/week/style'
], function (ext, PerspectiveView, util, coreUtil, api, folderAPI, gt, settings, coreSettings, Dropdown, capabilities, print, DisposableView) {

    'use strict';

    var BasicView = DisposableView.extend({

        constructor: function (opt) {
            this.opt = _.extend({}, this.options || {}, opt);
            Backbone.View.prototype.constructor.call(this, opt);
        },

        mouseDragHelper: function (opt) {
            var self = this,
                e = opt.event,
                context = _.uniqueId('.drag-'),
                // need this active tracker since mousemove events are throttled and may trigger the mousemove event
                // even after the undelegate function has been called
                active = true;
            if (e.which !== 1) return;
            opt.start.call(this, opt.event);

            this.delegate('mousemove' + context, opt.updateContext, _.throttle(function (e) {
                if (e.which !== 1) return;
                if (!active) return;
                opt.update.call(self, e);
            }, 100));

            function clear() {
                active = false;
                self.undelegate('mousemove' + context);
                self.undelegate('focusout' + context);
                $(document).off('mouseup' + context);
                if (opt.clear) opt.clear.call(self);
            }

            if (opt.clear) this.delegate('focusout' + context, clear);
            $(document).on('mouseup' + context, function (e) {
                clear();
                opt.end.call(self, e);
            });
        }

    });

    var WeekViewHeader = BasicView.extend({

        className: 'header',

        attributes: {
            role: 'toolbar'
        },

        events: {
            'click .control.next, .control.prev': 'onClickControl',
            'click .merge-split': 'onMergeSplit'
        },

        initialize: function () {
            this.listenTo(this.model, 'change:startDate', this.update);
            if (!_.device('smartphone')) this.listenTo(this.opt.app.props, 'change:showMiniCalendar change:folderview', this.onToggleDatepicker);
            if (this.model.get('mode') === 'day') this.listenTo(this.model, 'change:mergeView', this.updateMergeview);

            this.monthText = $('<span>');
            this.cw = $('<span class="cw">');
        },

        update: function () {
            var startDate = this.model.get('startDate');
            if (this.model.get('numColumns') > 1) {
                // one day less than number of columns or the end date is actually the first day of next week instead of last day of this week
                var endDate = moment(startDate).add(this.model.get('numColumns') - 1, 'days'),
                    fromMonth = startDate.format('MMMM'),
                    toMonth = endDate.format('MMMM'),
                    fromYear = startDate.format('YYYY'),
                    toYear = endDate.format('YYYY');

                if (fromMonth === toMonth) {
                    this.monthText.text(startDate.formatCLDR('yMMMM'));
                } else if (fromYear === toYear) {
                    //#. %1$s A month name
                    //#. %2$s Another month name
                    //#. %3$s A four digit year
                    //#. Example: January - February 2019
                    this.monthText.text(gt('%1$s - %2$s %3$s', fromMonth, toMonth, fromYear));
                } else {
                    //#. %1$s A month name
                    //#. %2$s A four digit year
                    //#. %3$s Another month name
                    //#. %4$s Another year
                    //#. Example: December 2019 - January 2020
                    this.monthText.text(gt('%1$s %2$s - %3$s %4$s', fromMonth, fromYear, toMonth, toYear));
                }
            } else {
                this.monthText.text(startDate.format('ddd, l'));
            }
            this.cw.text(
                //#. %1$d = Calendar week
                gt('CW %1$d', startDate.format('w'))
            );
            if (_.device('smartphone')) {
                // change navbar title
                var app = this.opt.app;
                app.pages.getNavbar('week:day').setTitle(
                    this.model.get('numColumns') > 1
                        ? startDate.formatInterval(moment(startDate).add(this.model.get('numColumns'), 'days'))
                        : startDate.format('ddd, l')
                );
            }
        },

        render: function () {
            var self = this,
                nextStr = this.model.get('numColumns') === 1 ? gt('Next Day') : gt('Next Week'),
                prevStr = this.model.get('numColumns') === 1 ? gt('Previous Day') : gt('Previous Week');

            this.monthInfo = _.device('smartphone') ? $('<div class="info">') : $('<button class="info btn btn-link" tabindex="-1">');

            this.$el.empty().append(
                $('<button href="#" class="control prev">').attr({
                    title: prevStr, // TODO: Aria title vs. aria-label
                    'aria-label': prevStr
                })
                .append($('<i class="fa fa-chevron-left" aria-hidden="true">')),
                $('<button href="#" class="control next" tabindex="-1">').attr({
                    title: nextStr, // TODO: Aria title vs. aria-label
                    'aria-label': nextStr
                })
                .append($('<i class="fa fa-chevron-right" aria-hidden="true">')),
                this.monthInfo
                    .attr({
                        'aria-label': gt('Use cursor keys to change the date. Press ctrl-key at the same time to change year or shift-key to change month. Close date-picker by pressing ESC key.')
                    })
                    .append(
                        this.monthText,
                        $.txt(' '),
                        this.cw,
                        $('<i class="fa fa-caret-down fa-fw" aria-hidden="true">')
                    )
            );
            this.update();

            if (!_.device('smartphone')) {
                require(['io.ox/backbone/views/datepicker'], function (Picker) {
                    new Picker({ date: self.model.get('startDate').clone() })
                        .attachTo(self.monthInfo)
                        .on('select', function (date) {
                            self.model.set('date', date);
                        })
                        .on('before:open', function () {
                            this.setDate(self.model.get('startDate'));
                        });
                    self.onToggleDatepicker();
                });
            }

            if (this.model.get('mode') === 'day' && this.opt.app.folders.list().length > 1) {
                this.$el.append(
                    $('<button href="#" class="btn btn-link merge-split" data-placement="bottom" tabindex="-1">')
                );
                this.updateMergeview();
            }

            return this;
        },

        onToggleDatepicker: function () {
            var props = this.opt.app.props;
            this.monthInfo.prop('disabled', props.get('folderview') && props.get('showMiniCalendar'));
        },

        updateMergeview: function () {
            var node = this.$('.merge-split');
            //#. Should appointments of different folders/calendars be shown in the same column (merge) or in seperate ones (split)
            node.text(this.model.get('mergeView') ? gt('Merge') : gt('Split'))
                .tooltip('hide')
                .attr('data-original-title', this.model.get('mergeView') ? gt('Click to merge all folders into one column') : gt('Click to split all folders into separate columns'))
                .tooltip('fixTitle');
        },

        onClickControl: function (e) {
            var target = $(e.currentTarget);
            this.opt.view.setStartDate(target.hasClass('next') ? 'next' : 'prev');
        },

        onMergeSplit: function () {
            settings.set('mergeview', !settings.get('mergeview')).save();
        }

    });

    var WeekViewToolbar = BasicView.extend({

        className: 'weekview-toolbar',

        events: {
            'click .weekday': 'onCreateAppointment'
        },

        attributes: {
            role: 'toolbar'
        },

        initialize: function (opt) {
            this.$el.css('margin-right', coreUtil.getScrollBarWidth());
            this.listenTo(this.model, 'change:startDate', this.render);
            this.listenTo(this.model, 'change:additionalTimezones', this.updateTimezones);
            this.listenTo(folderAPI, 'before:update', this.beforeUpdateFolder);
            if (this.model.get('mode') === 'day') {
                this.listenTo(this.model, 'change:mergeView', this.updateMergeview);
                this.listenTo(opt.app, 'folders:change', this.onFoldersChange);
            }
        },

        options: {
            todayClass: 'today'
        },

        render: function () {
            var self = this,
                tmpDate = moment(this.model.get('startDate')),
                columns = this.model.get('mode') === 'day' ? this.opt.app.folders.list() : _.range(this.model.get('numColumns'));

            this.$el.empty();
            columns.forEach(function (c, index) {
                var day = $('<button href="#" class="weekday" tabindex="-1">')
                    .attr({
                        date: self.model.get('mergeView') ? 0 : index,
                        // # TODO
                        'aria-label': gt('%s %s, create all-day appointment', tmpDate.format('ddd'), tmpDate.format('D')),
                        tabindex: index === 0 ? '' : '-1'
                    })
                    .append(
                        $('<span aria-hidden="true">').attr('title', gt('Create all-day appointment')).append(
                            $.txt(tmpDate.format('ddd ')),
                            $('<span aria-hidden="true" class="number">').text(tmpDate.format('D'))
                        )
                    );

                if (_(c).isString()) {
                    day
                        .addClass('merge-view-label')
                        .attr({
                            'data-folder-cid': c, // need this when inserting events in this column
                            'data-folder': c // this is used when folder color changes
                        })
                        .css('width', 'calc(' + day.css('width') + ' - 2px)');
                    folderAPI.get(c).done(function (folder) {
                        day
                            .css({
                                'border-color': util.getFolderColor(folder)
                            })
                            .text(folder.display_title || folder.title);
                    });
                }

                // mark today
                if (util.isToday(tmpDate)) {
                    var todayContainer;
                    if (self.model.get('mode') === 'day') {
                        todayContainer = $('.week-container .day', self.pane).first();
                    } else {
                        todayContainer = $('.week-container .day[date="' + index + '"]', self.pane);
                        if (self.model.get('numColumns') > 1) todayContainer.addClass(self.opt.todayClass);
                        day
                            .addClass(self.opt.todayClass)
                            .attr('aria-label', function () {
                                return gt('Today,') + ' ' + $(this).attr('aria-label');
                            });
                    }
                }
                self.$el.append(day);

                if (self.model.get('mode') !== 'day') tmpDate.add(1, 'day');
            });

            this.updateTimezones();
            if (self.model.get('mode') === 'day') this.updateMergeview();

            return this;
        },

        updateTimezones: function () {
            var numTZs = this.model.get('additionalTimezones').length;
            this.$el.css('margin-left', numTZs > 0 ? (numTZs + 1) * 80 : '');
        },

        updateMergeview: function () {
            this.$el.css({
                visibility: this.model.get('mergeView') ? '' : 'hidden',
                height: this.model.get('mergeView') ? '' : '27px'
            });
        },

        onFoldersChange: function () {
            if (this.model.get('mergeView')) this.render();
        },

        beforeUpdateFolder: function (id, model) {
            var color = color = util.getFolderColor(model.attributes);
            this.$('[data-folder="' + model.get('id') + '"]').css({
                'border-color': color
            });
        },

        onCreateAppointment: function (e) {
            if ($(e.target).closest('.appointment').length > 0) return;

            e.preventDefault();

            var index = this.$('.weekday').index($(e.currentTarget)),
                startDate = this.model.get('startDate').clone(),
                folder = this.opt.app.folder.get();

            if (this.model.get('mergeView')) folder = this.opt.app.folders.list()[index];
            else startDate.add(index, 'days');

            this.opt.view.createAppointment({
                startDate: { value: startDate.format('YYYYMMDD') },
                endDate: { value: startDate.format('YYYYMMDD') },
                folder: folder
            });
        }

    });

    var AppointmentContainer = BasicView.extend({

        initialize: function (opt) {
            var self = this;
            this.on('collection:add', this.onAddAppointment);
            this.on('collection:change', this.onChangeAppointment);
            this.on('collection:remove', this.onRemoveAppointment);
            this.on('collection:before:reset', this.onBeforeReset);
            this.on('collection:after:reset', this.onAfterReset);

            this.listenTo(opt.app.props, 'change:layout', this.adjustPlacement);
            this.listenTo(ox.ui.windowManager, 'window.show', function (e, window) {
                if (window.app.get('id') === self.opt.app.get('id')) self.adjustPlacement();
            });

            if (this.model.get('mode') === 'day') {
                this.listenTo(this.model, 'change:mergeView', this.render);
                this.listenTo(opt.app, 'folders:change', this.onFoldersChange);
            }

            this.listenTo(this.model, 'change:gridSize', this.render);
        },

        renderAppointment: function (model) {
            // do not use a button here even if it's correct from a11y perspective. This breaks resize handles (you cannot make appointments longer/shorter) and hover styles on firefox.
            // it is fine in month perspective as there are no resize handles there.
            var node = this.$('[data-cid="' + model.cid + '"]').empty();
            if (node.length === 0) node = $('<div role="button" class="appointment">');
            node.attr({
                'data-cid': model.cid,
                'data-master-id': util.cid({ id: model.get('id'), folder: model.get('folder') }),
                'data-extension-point': 'io.ox/calendar/appointment',
                'data-composite-id': model.cid,
                'data-folder': null // reset folder in case of reuse
            });

            ext.point('io.ox/calendar/appointment')
                .invoke('draw', node, ext.Baton(_.extend({}, this.opt, { model: model, folders: this.opt.app.folders.list() })));
            return node;
        },

        onFoldersChange: function () {
            if (this.model.get('mergeView')) this.render();
        },

        onAddAppointment: function (model) {
            if (settings.get('showDeclinedAppointments', false) === false && util.getConfirmationStatus(model) === 'DECLINED') return;
            var node = this.renderAppointment(model);
            this.$appointmentContainer.append(node.hide());
            if (!this.onReset) this.adjustPlacement();
        },

        onChangeAppointment: function (model) {
            this.onReset = true;
            this.onAddAppointment(model);
            this.onReset = false;
            this.adjustPlacement();
        },

        onRemoveAppointment: function (model) {
            this.$('[data-cid="' + model.cid + '"]').remove();
            if (!this.onReset) this.adjustPlacement();
        },

        onBeforeReset: function () {
            this.$('.appointment').remove();
            this.onReset = true;
        },

        onAfterReset: function () {
            this.adjustPlacement();
            this.onReset = false;
        }

    });

    var FulltimeView = AppointmentContainer.extend({

        className: 'fulltime-container',

        events: function () {
            var events = {};
            if (_.device('touch')) {
                _.extend(events, {
                    'taphold .appointment-panel': 'onCreateAppointment'
                });
            } else {
                _.extend(events, {
                    'dblclick .appointment-panel': 'onCreateAppointment'
                });
                if (_.device('desktop')) {
                    _.extend(events, {
                        'mousedown .appointment.modify': 'onDrag',
                        'mousedown .resizable-handle': 'onResize'
                    });
                }
            }
            return events;
        },

        options: {
            fulltimeHeight: 20,     // height of full-time appointments in px
            fulltimeMax:    5       // threshold for visible full-time appointments in scrollpane header
        },

        initialize: function (opt) {
            AppointmentContainer.prototype.initialize.call(this, opt);

            this.listenTo(this.model, 'change:additionalTimezones', this.updateTimezones);
            this.listenTo(settings, 'change:favoriteTimezones', this.updateFavoriteTimezones);

            this.$appointmentContainer = $('<div class="appointment-panel">');
        },

        drawDropdown: (function () {
            var self, hasDouble;

            function drawOption() {
                // this = timezone name (string)
                // we may have a daylight saving change
                var startTimezone = moment(self.model.get('startDate')).tz(this),
                    endTimezone = moment(self.model.get('startDate')).add(Math.max(0, self.model.get('numColumns') - 1), 'days').endOf('day').tz(this);

                if (startTimezone.zoneAbbr() !== endTimezone.zoneAbbr()) hasDouble = true;

                return startTimezone.zoneAbbr() === endTimezone.zoneAbbr() ? [
                    $('<span class="offset">').text(startTimezone.format('Z')),
                    $('<span class="timezone-abbr">').text(startTimezone.zoneAbbr()),
                    _.escape(this)
                ] : [
                    $('<span class="offset">').text(startTimezone.format('Z') + '/' + endTimezone.format('Z')),
                    $('<span class="timezone-abbr">').text(startTimezone.zoneAbbr() + '/' + endTimezone.zoneAbbr()),
                    _.escape(this)
                ];
            }

            var TimezoneModel = Backbone.Model.extend({
                defaults: {
                    'default': true
                },
                initialize: function (obj) {
                    var self = this;

                    _(obj).each(function (value, key) {
                        self[key] = value;
                    });
                }
            });

            return function () {
                self = this;

                var list = _.intersection(
                        settings.get('favoriteTimezones', []),
                        settings.get('renderTimezones', [])
                    ),
                    favorites = _(settings.get('favoriteTimezones', [])).chain().map(function (fav) {
                        return [fav, list.indexOf(fav) >= 0];
                    }).object().value(),
                    // we may have a daylight saving change
                    startTimezone = moment(self.model.get('startDate')).tz(coreSettings.get('timezone')),
                    endTimezone = moment(self.model.get('startDate')).add(Math.max(0, self.model.get('numColumns') - 1), 'days').endOf('day').tz(coreSettings.get('timezone')),
                    model = new TimezoneModel(favorites),
                    dropdown = new Dropdown({
                        className: 'dropdown timezone-label-dropdown',
                        model: model,
                        // must use start of view to get correct daylight saving timezone names (cet vs cest)
                        label: startTimezone.zoneAbbr() === endTimezone.zoneAbbr() ? startTimezone.zoneAbbr() : startTimezone.zoneAbbr() + '/' + endTimezone.zoneAbbr(),
                        tagName: 'div'
                    }),
                    render = function () {
                        hasDouble = false;
                        dropdown.header(gt('Standard timezone'))
                            .option('default', true, drawOption.bind(coreSettings.get('timezone')));

                        if (settings.get('favoriteTimezones', []).length > 0) {
                            dropdown.header(gt('Favorites'));
                        }
                        $('li[role="presentation"]', dropdown.$ul).first().addClass('disabled');
                        $('a', dropdown.$ul).first().removeAttr('data-value').removeData('value');
                        _(settings.get('favoriteTimezones', [])).each(function (fav) {
                            if (fav !== coreSettings.get('timezone')) {
                                dropdown.option(fav, true, drawOption.bind(fav));
                            }
                        });
                        // add keep open for all timezone options, *not* the link to settings (Bug 53471)
                        $('a', dropdown.$ul).attr('data-keep-open', 'true');

                        dropdown.divider();
                        dropdown.link('settings', gt('Manage favorites'), function () {
                            var options = { id: 'io.ox/timezones' };
                            ox.launch('io.ox/settings/main', options).done(function () {
                                this.setSettingsPane(options);
                            });
                        });

                        dropdown.$el.toggleClass('double', hasDouble);
                    };

                render();

                model.on('change', function (model) {
                    var list = [];

                    _(model.attributes).each(function (value, key) {
                        if (value && key !== 'default') {
                            list.push(key);
                        }
                    });

                    settings.set('renderTimezones', list);
                    settings.save();
                });

                // update on startdate change to get daylight savings right
                this.model.on('change:startDate', function () {
                    var startTimezone = moment(self.model.get('startDate')).tz(coreSettings.get('timezone')),
                        endTimezone = moment(self.model.get('startDate')).add(Math.max(0, self.model.get('numColumns') - 1), 'days').endOf('day').tz(coreSettings.get('timezone'));

                    dropdown.$el.find('.dropdown-label').empty().append(startTimezone.zoneAbbr() === endTimezone.zoneAbbr() ? startTimezone.zoneAbbr() : startTimezone.zoneAbbr() + '/' + endTimezone.zoneAbbr(), $('<i class="fa fa-caret-down" aria-hidden="true">'));
                    dropdown.$ul.empty();
                    render();
                });

                return dropdown;
            };
        }()),

        render: function () {
            if (!_.device('smartphone')) {
                var dropdown = this.drawDropdown(),
                    self = this;

                this.$el.empty().append(
                    $('<div class="time-label-bar">').append(
                        $('<div class="timezone">'),
                        dropdown.render().$el
                    )
                );

                $('.dropdown-label', dropdown.$el).append($('<i class="fa fa-caret-down" aria-hidden="true">'));
                this.updateTimezones();
                // update on startdate change to get daylight savings right
                this.model.on('change:startDate', function () {
                    self.updateTimezones();
                });
            }

            this.$el.append(this.$appointmentContainer);
            // render appointments
            this.onReset = true;
            this.opt.view.collection.filter(util.isAllday.bind(util)).forEach(this.onAddAppointment.bind(this));
            this.adjustPlacement();
            this.onReset = false;
            return this;
        },

        updateTimezones: function () {
            var timezoneLabels = this.model.get('additionalTimezones'),
                self = this;
            this.$('.timezone').remove();
            this.$('.time-label-bar')
                .prepend(
                    _(timezoneLabels).map(function (tz) {
                        return $('<div class="timezone">').text(moment(self.model.get('startDate')).tz(tz).zoneAbbr());
                    })
                )
                .css('width', timezoneLabels.length > 0 ? (timezoneLabels.length + 1) * 80 : '');
        },

        updateFavoriteTimezones: function () {
            var dropdown = this.drawDropdown();
            this.$('.dropdown').replaceWith(dropdown.render().$el);
            $('.dropdown-label', dropdown.$el).append($('<i class="fa fa-caret-down" aria-hidden="true">'));
        },

        onCreateAppointment: function (e) {
            if ($(e.target).closest('.appointment').length > 0) return;
            var numColumns = this.model.get('mergeView') ? this.opt.app.folders.list().length : this.model.get('numColumns'),
                slotWidth = this.$('.appointment-panel').width() / numColumns,
                left = e.pageX - $(e.target).offset().left,
                index = (left / slotWidth) >> 0,
                startDate = this.model.get('startDate').clone(),
                folder = this.opt.app.folder.get();

            if (this.model.get('mergeView')) folder = this.opt.app.folders.list()[index];
            else startDate.add(index, 'days');

            this.opt.view.createAppointment({
                startDate: { value: startDate.format('YYYYMMDD') },
                endDate: { value: startDate.format('YYYYMMDD') },
                folder: folder
            });
        },

        onResize: function (e) {
            var node, model, startDate, endDate, maxStart, minEnd;

            this.mouseDragHelper({
                event: e,
                updateContext: '.appointment-panel',
                start: function (e) {
                    var target = $(e.target);
                    node = target.closest('.appointment');
                    model = this.opt.view.collection.get(node.attr('data-cid'));
                    this.$('[data-cid="' + model.cid + '"]').addClass('resizing').removeClass('current hover');

                    if (target.hasClass('resizable-w')) {
                        maxStart = model.getMoment('endDate').subtract(1, 'day');
                        minEnd = model.getMoment('endDate');
                    } else if (target.hasClass('resizable-e')) {
                        maxStart = model.getMoment('startDate');
                        minEnd = model.getMoment('startDate').add(1, 'day');
                    }

                    startDate = model.getMoment('startDate');
                    endDate = model.getMoment('endDate');

                    this.$el.addClass('no-select');
                },
                update: function (e) {
                    var numColumns = this.model.get('mergeView') ? this.opt.app.folders.list().length : this.model.get('numColumns'),
                        slotWidth = this.$('.appointment-panel').width() / numColumns,
                        left = e.pageX - $(e.currentTarget).offset().left,
                        index = (left / slotWidth) >> 0,
                        date = this.model.get('startDate').clone().add(index, 'days');

                    startDate = moment.min(maxStart, date);
                    endDate = moment.max(minEnd, date.clone().add(1, 'day'));

                    var pos = startDate.diff(this.model.get('startDate'), 'days'),
                        width = Math.max(0, endDate.diff(startDate, 'days'));

                    node.css({
                        left: (100 / numColumns) * pos + '%',
                        width: (100 / numColumns) * width + '%'
                    });
                },
                end: function () {
                    if (node) node.removeClass('resizing');
                    this.$el.removeClass('no-select');
                    this.opt.view.updateAppointment(model, {
                        startDate: { value: startDate.format('YYYYMMDD') },
                        endDate: { value: endDate.format('YYYYMMDD') }
                    });
                }
            });
        },

        onDrag: function (e) {
            var node, model, startDate, endDate, offset, slotWidth, numColumns;
            if (this.model.get('mergeView')) return;
            if ($(e.target).is('.resizable-handle')) return;

            this.mouseDragHelper({
                event: e,
                updateContext: '.appointment-panel',
                start: function (e) {
                    node = $(e.target).closest('.appointment');
                    model = this.opt.view.collection.get(node.attr('data-cid'));
                    this.$('[data-cid="' + model.cid + '"]').addClass('resizing').removeClass('current hover');

                    startDate = model.getMoment('startDate');
                    endDate = model.getMoment('endDate');

                    numColumns = this.model.get('mergeView') ? this.opt.app.folders.list().length : this.model.get('numColumns');
                    slotWidth = this.$('.appointment-panel').width() / numColumns;
                    offset = Math.floor((e.pageX - $(e.currentTarget).offset().left) / slotWidth) * slotWidth;
                },
                update: function (e) {
                    var left = e.pageX - offset - $(e.currentTarget).offset().left,
                        index = (left / slotWidth) >> 0,
                        startIndex = model.getMoment('startDate').diff(this.model.get('startDate'), 'days'),
                        diff = index - startIndex;

                    if (diff !== 0) this.$el.addClass('no-select');

                    startDate = model.getMoment('startDate').add(diff, 'days');
                    endDate = model.getMoment('endDate').add(diff, 'days');

                    var pos = startDate.diff(this.model.get('startDate'), 'days'),
                        width = Math.max(0, endDate.diff(startDate, 'days'));
                    pos = Math.max(pos, 0);
                    width = Math.min(numColumns - pos, width);

                    node.css({
                        left: (100 / numColumns) * pos + '%',
                        width: (100 / numColumns) * width + '%'
                    });
                },
                end: function () {
                    if (node) node.removeClass('resizing');
                    this.$el.removeClass('no-select');
                    this.opt.view.updateAppointment(model, {
                        startDate: { value: startDate.format('YYYYMMDD') },
                        endDate: { value: endDate.format('YYYYMMDD') }
                    });
                }
            });
        },

        adjustPlacement: (function () {

            /*
             * Simple algorithm to find free space for appointment. Works as follows:
             * 1) Has a table with slots which are empty by default
             * 2) Requests a certain column and width
             * 3) Search for first row, where all these fields are empty
             * 4) Mark these cells in the table as reserved
             * 5) Calculate maximum number of rows as a side-effect
             */
            function reserveRow(start, width, table) {
                var row = 0, column, empty;
                start = Math.max(0, start);
                width = Math.min(table.length, start + width) - start;
                // check for free space
                while (!empty) {
                    empty = true;
                    for (column = start; column < start + width; column++) {
                        if (table[column][row]) {
                            empty = false;
                            break;
                        }
                    }
                    row++;
                }
                // reserve free space
                for (column = start; column < start + width; column++) table[column][row - 1] = true;
                return row - 1;
            }

            return function () {
                var maxRow = 0,
                    numColumns = this.model.get('mergeView') ? this.opt.app.folders.list().length : this.model.get('numColumns'),
                    table = _.range(numColumns).map(function () { return []; });
                this.opt.view.collection.each(function (model) {
                    if (!util.isAllday(model)) return;
                    if (settings.get('showDeclinedAppointments', false) === false && util.getConfirmationStatus(model) === 'DECLINED') return;

                    var startDate = model.getMoment('startDate').startOf('day'),
                        fulltimePos = this.model.get('mergeView') ? this.opt.app.folders.list().indexOf(model.get('folder')) : startDate.diff(this.model.get('startDate'), 'days'),
                        // calculate difference in utc, otherwhise we get wrong results if the appointment starts before a daylight saving change and ends after
                        fulltimeWidth = this.model.get('mergeView') ? 1 : Math.max(model.getMoment('endDate').diff(startDate, 'days') + Math.min(0, fulltimePos), 1),
                        row = reserveRow(fulltimePos, fulltimeWidth, table),
                        numColumns = this.model.get('mergeView') ? this.opt.app.folders.list().length : this.model.get('numColumns'),
                        node = this.$appointmentContainer.find('[data-cid="' + model.cid + '"]');

                    // append it again to stick to the order of the collection
                    node.parent().append(node);
                    node.show().css({
                        height: this.opt.fulltimeHeight,
                        lineHeight: this.opt.fulltimeHeight + 'px',
                        width: (100 / numColumns) * fulltimeWidth + '%',
                        left: (100 / numColumns) * Math.max(0, fulltimePos) + '%',
                        top: row * (this.opt.fulltimeHeight + 1)
                    });

                    maxRow = Math.max(maxRow, row + 1);
                }.bind(this));

                var height = (maxRow <= this.opt.fulltimeMax ? maxRow : (this.opt.fulltimeMax + 0.5)) * (this.opt.fulltimeHeight + 1);
                this.$el.css('height', height);
                // enable/disable scrollbar
                if (maxRow > this.opt.fulltimeMax) this.$appointmentContainer.css({ 'overflow-y': 'scroll', 'margin-right': '' });
                else this.$appointmentContainer.css({ 'overflow-y': 'hidden', 'margin-right': coreUtil.getScrollBarWidth() });
            };
        }())

    });

    var AppointmentView = AppointmentContainer.extend({

        className: 'appointment-container',

        options: {
            overlap: 0.35, // visual overlap of appointments [0.0 - 1.0]
            minCellHeight:  24
        },

        events: function () {
            var events = {};
            if (_.device('touch')) {
                _.extend(events, {
                    'taphold .timeslot': 'onCreateAppointment'
                });
            } else {
                _.extend(events, {
                    'dblclick .timeslot': 'onCreateAppointment'
                });
                if (_.device('desktop')) {
                    _.extend(events, {
                        'mouseenter .appointment': 'onHover',
                        'mouseleave .appointment': 'onHover',
                        'mousedown .timeslot': 'onLasso',
                        'mousedown .resizable-handle': 'onResize',
                        'mousedown .appointment.modify': 'onDrag'
                    });
                }
            }
            return events;
        },

        initialize: function (opt) {
            AppointmentContainer.prototype.initialize.call(this, opt);

            this.listenTo(this.model, 'change:additionalTimezones', this.updateTimezones);
            this.listenTo(this.model, 'change:startDate', this.updateToday);
            this.listenTo(this.model, 'change:startDate', this.updateTimezones);
            this.listenToDOM(window, 'resize', _.throttle(this.onWindowResize, 50));

            this.$hiddenIndicators = $('<div class="hidden-appointment-indicator-container">');
            this.initCurrentTimeIndicator();
        },

        initCurrentTimeIndicator: function () {
            this.lastDate = moment();
            this.$currentTimeIndicator = $('<div class="current-time-indicator">');
            window.setInterval(this.updateCurrentTimeIndicator.bind(this), 60000);
            this.updateCurrentTimeIndicator();
        },

        updateCurrentTimeIndicator: function () {
            var self = this,
                minutes = moment().diff(moment().startOf('day'), 'minutes'),
                top = minutes / 24 / 60,
                columnIndex = moment().startOf('day').diff(this.model.get('startDate'), 'days'),
                parent;
            this.$currentTimeIndicator.css({
                top: top * 100 + '%'
            }).data('top', top);
            if (columnIndex < 0 || columnIndex >= this.model.get('numColumns')) return this.$currentTimeIndicator.remove();
            // insert into right container
            if (this.model.get('mergeView')) parent = this.$('.day');
            else parent = this.$('.day').eq(columnIndex);
            // attach to one or multiple parents
            this.$currentTimeIndicator.detach();
            this.$currentTimeIndicator = this.$currentTimeIndicator.eq(0);
            parent.each(function (index) {
                var indicator = self.$currentTimeIndicator.eq(index);
                if (!self.$currentTimeIndicator.get(index)) {
                    indicator = self.$currentTimeIndicator.eq(0).clone();
                    self.$currentTimeIndicator = self.$currentTimeIndicator.add(indicator);
                }
                $(this).append(indicator);
            });

            if (!this.lastDate.isSame(moment(), 'day')) {
                this.lastDate = moment();
                this.opt.view.render();
            }
        },

        renderTimeLabel: function (timezone, className) {
            var timeLabel = $('<div class="week-container-label" aria-hidden="true">').addClass(className),
                self = this;

            timeLabel.append(
                _(_.range(24)).map(function (i) {
                    var number = moment(self.model.get('startDate')).startOf('day').hours(i).tz(timezone).format('LT');

                    return $('<div class="time">')
                        .addClass((i >= self.model.get('workStart') && i < self.model.get('workEnd')) ? 'in' : '')
                        .addClass((i + 1 === self.model.get('workStart') || i + 1 === self.model.get('workEnd')) ? 'working-time-border' : '')
                        .append($('<div class="number">').text(number.replace(/^(\d\d?):00 ([AP]M)$/, '$1 $2')));
                })
            );

            return timeLabel;
        },

        renderColumn: function (index) {
            var column = $('<div class="day">');
            if (this.model.get('mergeView')) column.attr('data-folder-cid', index);
            for (var i = 1; i <= this.getNumTimeslots(); i++) {
                column.append(
                    $('<div>')
                    .addClass('timeslot')
                    .addClass((i <= (this.model.get('workStart') * this.model.get('gridSize')) || i > (this.model.get('workEnd') * this.model.get('gridSize'))) ? 'out' : '')
                    .addClass((i === (this.model.get('workStart') * this.model.get('gridSize')) || i === (this.model.get('workEnd') * this.model.get('gridSize'))) ? 'working-time-border' : '')
                );
            }
            return column;
        },

        updateToday: function () {
            if (this.model.get('mode') === 'day') return;
            var start = this.model.get('startDate');
            this.$('>> .day').each(function (index) {
                $(this).toggleClass('today', util.isToday(start.clone().add(index, 'days')));
            });
        },

        render: function () {
            this.updateCellHeight();
            var pane = this.$('.scrollpane'),
                scrollRatio = pane.scrollTop() / pane.height(),
                range = this.model.get('mergeView') ? this.opt.app.folders.list() : _.range(this.model.get('numColumns')),
                height = this.getContainerHeight();
            this.$el.empty().append(
                pane = $('<div class="scrollpane f6-target" tabindex="-1">').append(
                    this.renderTimeLabel(coreSettings.get('timezone')),
                    range.map(this.renderColumn.bind(this))
                ).on('scroll', this.updateHiddenIndicators.bind(this)),
                this.$hiddenIndicators.css('right', coreUtil.getScrollBarWidth())
            );
            if (!_.device('Smartphone')) this.updateTimezones();
            this.updateToday();
            pane.children().css('height', height);
            this.applyTimeScale();
            this.updateCurrentTimeIndicator();
            // update scrollposition
            pane.scrollTop(
                _.isNaN(scrollRatio) ?
                    // dont user current time indicator top here because that only works when today is visible
                    // set to 2 hours before current time. Past events are less important
                    (moment().diff(moment().startOf('day'), 'minutes') / 24 / 60) * height - 2 * height / 24 :
                    scrollRatio * pane.height()
            );
            // render appointments
            this.onReset = true;
            this.opt.view.collection.reject(util.isAllday.bind(util)).forEach(this.onAddAppointment.bind(this));
            this.adjustIndendation();
            this.onReset = false;
            return this;
        },

        getNumTimeslots: function () {
            return this.opt.slots * this.model.get('gridSize');
        },

        updateCellHeight: function () {
            var cells = Math.min(Math.max(4, (this.model.get('workEnd') - this.model.get('workStart') + 1)), 18),
                // try to estimate the height, the container will have when drawn. Is only needed sometimes as a fallback, when the element is not in the dom yet
                height = this.$el.height() || (window.innerHeight - 250),
                cellHeight = Math.floor(
                    Math.max(height / (cells * this.model.get('gridSize')), this.options.minCellHeight)
                );
            this.model.set('cellHeight', cellHeight);
        },

        getContainerHeight: function () {
            return this.model.get('cellHeight') * this.getNumTimeslots();
        },

        applyTimeScale: function () {
            // remove all classes like time-scale-*
            this.$el.removeClass(function (index, css) {
                return (css.match(/(^|\s)time-scale-\S+/g) || []).join(' ');
            });
            this.$el.addClass('time-scale-' + this.model.get('gridSize'));
        },

        updateTimezones: function () {
            var self = this,
                height = this.getContainerHeight(),
                timezones = this.model.get('additionalTimezones');
            this.$('.secondary-timezone').remove();
            this.$('.scrollpane')
                .prepend(
                    timezones.map(function (tz) {
                        return self.renderTimeLabel(tz)
                            .addClass('secondary-timezone')
                            .css('height', height);
                    })
                )
                .toggleClass('secondary', timezones.length > 0);
            var left = timezones.length > 0 ? ((timezones.length + 1) * 80) + 'px' : '';
            self.$hiddenIndicators.css('left', left);
            self.$currentTimeIndicator.css('left', this.model.get('mergeView') ? left : '');
        },

        updateHiddenIndicators: (function () {
            function indicatorButton(column, width) {
                return $('<span>')
                        .addClass('more-appointments fa')
                        .css({
                            left: (column * width) + '%',
                            width: width + '%'
                        });
            }

            return _.throttle(function () {
                var pane = this.$('.scrollpane'),
                    min = pane.scrollTop(),
                    max = pane.scrollTop() + pane.height(),
                    threshold = 3,
                    columns = this.$('.day'),
                    columnWidth = 100 / columns.length,
                    container = this.$hiddenIndicators;

                container.empty();
                columns.each(function (i) {
                    // node height 0 means the page is not visible yet. Prevent wrong calculations
                    var appointments = $(this).find(' > .appointment').filter(function (index, node) {
                            return $(node).height() > 0;
                        }),
                        earlier = appointments.filter(function (index, el) {
                            el = $(el);
                            return el.position().top + el.height() - threshold < min;
                        }).length,
                        later = appointments.filter(function (index, el) {
                            el = $(el);
                            return el.position().top + threshold > max;
                        }).length;
                    if (earlier > 0) container.append(indicatorButton(i, columnWidth).addClass('earlier fa-caret-up'));
                    if (later > 0) container.append(indicatorButton(i, columnWidth).addClass('later fa-caret-down'));
                });
            }, 100);
        }()),

        onCreateAppointment: function (e) {
            var target = $(e.currentTarget),
                index = this.$('.day').index(target.parent()),
                startDate = this.model.get('startDate').clone(),
                folder = this.opt.app.folder.get();

            if (this.model.get('mergeView')) folder = this.opt.app.folders.list()[index];
            else startDate.add(index, 'days');

            startDate.add(60 / this.model.get('gridSize') * target.index(), 'minutes');

            this.opt.view.createAppointment({
                startDate: { value: startDate.format('YYYYMMDD[T]HHmmss'), tzid:  startDate.tz() },
                endDate: { value: startDate.add(1, 'hour').format('YYYYMMDD[T]HHmmss'), tzid:  startDate.tz() },
                folder: folder
            });
        },

        onAddAppointment: function (model) {
            if (settings.get('showDeclinedAppointments', false) === false && util.getConfirmationStatus(model) === 'DECLINED') return;

            var appointmentStartDate = model.getMoment('startDate'),
                startLocal = moment.max(appointmentStartDate, moment(this.model.get('startDate'))).local().clone(),
                endLocal = model.getMoment('endDate').local(),
                start = moment(startLocal).startOf('day'),
                end = moment(endLocal).startOf('day'),
                startOfNextWeek = moment(this.model.get('startDate')).startOf('day').add(this.model.get('numColumns'), 'days'),
                maxCount = 0;

            // draw across multiple days
            while (maxCount <= this.model.get('numColumns')) {
                var node = this.renderAppointment(model).addClass('border');

                if (!start.isSame(end, 'day')) {
                    endLocal = moment(startLocal).endOf('day').local();
                } else {
                    endLocal = model.getMoment('endDate').local();
                }

                // kill overlap appointments with length null
                if (startLocal.isSame(endLocal) && maxCount > 0) {
                    break;
                }

                // break if appointment overlaps into next week
                if (start.isSame(startOfNextWeek)) {
                    break;
                }

                // check if we have a node for this day, if not create one by cloning the first (we need one node for each day when an appointment spans multiple days)
                node = node.get(maxCount) ? $(node.get(maxCount)) : $(node).first().clone();

                // daylight saving time change?
                var offset = start._offset - model.getMoment('startDate').tz(start.tz())._offset;

                node
                    .addClass(endLocal.diff(startLocal, 'minutes') < 120 / this.model.get('gridSize') ? 'no-wrap' : '')
                    .css({
                        top: (Math.max(0, startLocal.diff(moment(start), 'minutes') - offset)) / 24 / 60 * 100 + '%',
                        height: 'calc( ' + endLocal.diff(startLocal, 'minutes') / 24 / 60 * 100 + '% - 2px)',
                        lineHeight: this.opt.minCellHeight + 'px'
                    });

                var index = startLocal.day() - this.model.get('startDate').day();
                if (index < 0) index += 7;
                if (this.model.get('mergeView')) index = this.opt.app.folders.list().indexOf(model.get('folder'));
                // append at the right place
                this.$('.day').eq(index).append(node);
                ext.point('io.ox/calendar/week/view/appointment').invoke('draw', node, ext.Baton({ model: model, date: start, view: this }));

                // do incrementation
                if (!start.isSame(end, 'day')) {
                    start = startLocal.add(1, 'day').startOf('day').clone();
                    maxCount++;
                } else {
                    break;
                }
            }

            if (!this.onReset) this.adjustPlacement();
        },

        onAfterReset: function () {
            AppointmentContainer.prototype.onAfterReset.call(this);
            this.updateCurrentTimeIndicator();
        },

        adjustPlacement: function () {
            this.adjustIndendation();
            this.updateHiddenIndicators();
        },

        adjustIndendation: (function () {
            function setIndex(total, node) {
                var width = Math.min((100 / total) * (1 + (this.opt.overlap * (total - 1))), 100),
                    left = total > 1 ? ((100 - width) / (total - 1)) * node.viewIndex : 0;
                node.css({
                    left: 'calc(' + left + '% - 1px)',
                    width: 'calc(' + width + '% - 10px)'
                });
            }
            function insertIntoSlot(node, slots) {
                var i, start = node.offset().top;
                for (i = 0; i < slots.length; i++) {
                    if (slots[i].topPlusHeight <= start) {
                        node.viewIndex = i;
                        slots[i] = node;
                        return;
                    }
                }
                node.viewIndex = slots.length;
                slots.push(node);
            }
            return function () {
                // Simple algorithm to compute the indendation which works as follows
                // 1) Keep track of intersecting appointments with a slot array
                // 2) Try to find first possible spot in the slots array by comparing end and start position
                // 3) If an appointment is after the maximum time, apply slot indendation
                var self = this;

                // keep order of collection
                this.opt.view.collection.each(function (model) {
                    if (util.isAllday(model)) return;
                    self.$('[data-cid="' + model.cid + '"]').each(function () {
                        var $this = $(this);
                        $this.parent().append($this);
                    });
                });

                this.$('.day').each(function () {
                    var list = [],
                        slots = [],
                        maxEnd = 0;

                    $('.appointment', this).each(function () {
                        var node = $(this);
                        if (node.offset().top >= maxEnd) {
                            list.forEach(setIndex.bind(self, slots.length));
                            list = [];
                            slots = [];
                        }

                        insertIntoSlot(node, slots);
                        list.push(node);
                        node.topPlusHeight = node.offset().top + node.height();
                        maxEnd = Math.max(maxEnd, node.topPlusHeight);
                    });

                    list.forEach(setIndex.bind(self, slots.length));
                });
            };
        }()),

        onHover: function (e) {
            if (!this.model.get('lasso')) {
                var cid = util.cid(String($(e.currentTarget).data('cid'))),
                    el = this.$('[data-master-id="' + cid.folder + '.' + cid.id + '"]'),
                    bg = el.data('background-color');
                switch (e.type) {
                    case 'mouseenter':
                        if (e.relatedTarget && e.relatedTarget.tagName !== 'TD') {
                            el.addClass('hover');
                            if (bg) el.css('background-color', util.lightenDarkenColor(bg, 0.9));
                        }
                        break;
                    case 'mouseleave':
                        el.removeClass('hover');
                        if (bg) el.css('background-color', bg);
                        break;
                    default:
                        break;
                }
            }
        },

        onLasso: (function () {

            function isBefore(elem, other) {
                if (other.parent().index() < elem.parent().index()) return true;
                if (!elem.parent().is(other.parent())) return false;
                return other.index() < elem.index();
            }

            function fixFolder(folder) {
                if (folderAPI.can('create', folder)) return folder;
                return folderAPI.get(settings.get('chronos/defaultFolderId'));
            }

            function cont(e, f) {
                var pivot, folder, startDate, endDate;

                this.mouseDragHelper({
                    event: e,
                    updateContext: '.timeslot',
                    start: function (e) {
                        pivot = $(e.target);
                        folder = f;
                        this.$el.addClass('no-select');
                    },
                    update: function (e) {
                        var start = pivot, end = $(e.target), day, days = this.$('.day');
                        if (this.model.get('mode') === 'day') {
                            days = pivot.parent();
                            start = days.children().eq(start.index());
                            end = days.children().eq(end.index());
                        }
                        // switch start and temp
                        if (isBefore(start, end)) {
                            start = end;
                            end = pivot;
                        }
                        // loop over the days
                        for (day = start.parent(); day.index() <= end.parent().index() && day.length > 0; day = day.next()) {
                            var numTimeslots = this.getNumTimeslots(),
                                top = start.parent().is(day) ? start.index() : 0,
                                bottom = end.parent().is(day) ? end.index() + 1 : numTimeslots,
                                node = day.find('.lasso');
                            if (node.length === 0) node = $('<div class="lasso">').appendTo(day);
                            node.css({
                                top: (top / numTimeslots * 100) + '%',
                                height: ((bottom - top) / numTimeslots * 100) + '%'
                            });
                            if (start.parent().is(day)) startDate = this.model.get('startDate').clone().add(days.index(day), 'days').add(top / numTimeslots * 24 * 60, 'minutes');
                            if (end.parent().is(day)) endDate = this.model.get('startDate').clone().add(days.index(day), 'days').add(bottom / numTimeslots * 24 * 60, 'minutes');
                        }
                        start.parent().prevAll().find('.lasso').remove();
                        day.nextAll().addBack().find('.lasso').remove();
                    },
                    clear: function () {
                        this.$('.lasso').remove();
                        this.$el.removeClass('no-select');
                    },
                    end: function () {
                        if (!startDate || !endDate) return;
                        this.opt.view.createAppointment({
                            startDate: { value: startDate.format('YYYYMMDD[T]HHmmss'), tzid: startDate.tz() },
                            endDate: { value: endDate.format('YYYYMMDD[T]HHmmss'), tzid: endDate.tz() },
                            folder: folder.id
                        });
                    }
                });
            }

            return function (e) {
                // needless for guests
                if (capabilities.has('guest')) return;

                if (e.type === 'mousedown') {
                    var app = this.opt.app;
                    if (this.model.get('mergeView')) {
                        var folderId = $(e.target).closest('.day').attr('data-folder-cid');
                        folderAPI.get(folderId || app.folder.get()).then(fixFolder).done(cont.bind(this, e));
                    } else {
                        app.folder.getData().done(cont.bind(this, e));
                    }
                    return;
                }

                cont.call(this, e);
            };
        }()),

        onResize: (function () {
            function isBefore(elem, other) {
                if (other.parent().index() < elem.parent().index()) return true;
                if (!elem.parent().is(other.parent())) return false;
                return other.index() < elem.index();
            }

            function getPivot(model, name) {
                var date = model.getMoment(name).subtract(name === 'endDate' ? 1 : 0).local(),
                    startOfDay = date.clone().startOf('day'),
                    day = date.diff(this.model.get('startDate'), 'days'),
                    minutes = date.diff(startOfDay, 'minutes');
                var index = (minutes / 60 * this.model.get('gridSize')) >> 0;
                return this.$('.day').eq(day).find('.timeslot').eq(index);
            }

            return function (e) {
                var pivot, node, model, startDate, endDate, startOffset, endOffset;

                this.mouseDragHelper({
                    event: e,
                    updateContext: '.timeslot',
                    start: function (e) {
                        var target = $(e.target);
                        node = target.closest('.appointment');
                        model = this.opt.view.collection.get(node.attr('data-cid'));
                        this.$('[data-cid="' + model.cid + '"]').addClass('resizing').removeClass('current hover');
                        // get pivot point
                        if (target.hasClass('resizable-s')) pivot = getPivot.call(this, model, 'startDate');
                        else if (target.hasClass('resizable-n')) pivot = getPivot.call(this, model, 'endDate');
                        // offset in minutes in relation to the current grid size
                        startOffset = model.getMoment('startDate').minutes() % (60 / this.model.get('gridSize'));
                        endOffset = model.getMoment('endDate').minutes() % (60 / this.model.get('gridSize'));
                        this.$el.addClass('no-select');
                    },
                    update: function (e) {
                        var start = pivot, end = $(e.target), day, days = this.$('.day');
                        if (this.model.get('mode') === 'day') {
                            days = pivot.parent();
                            start = days.children().eq(start.index());
                            end = days.children().eq(end.index());
                        }
                        // switch start and temp
                        if (isBefore(start, end)) {
                            start = end;
                            end = pivot;
                        }
                        // loop over the days
                        for (day = start.parent(); day.index() <= end.parent().index() && day.length > 0; day = day.next()) {
                            var numTimeslots = this.getNumTimeslots(),
                                top = start.parent().is(day) ? start.index() : 0,
                                bottom = end.parent().is(day) ? end.index() + 1 : numTimeslots,
                                slot = day.find('.resizing'),
                                startOfDay = this.model.get('startDate').clone().add(days.index(day), 'days');

                            // set defaults if not set yet
                            if (!startDate) startDate = startOfDay;
                            if (!endDate) endDate = startOfDay.clone().add(1, 'day');
                            // set start/end date if it is on the current date
                            if (start.parent().is(day)) startDate = startOfDay.clone().add(top / numTimeslots * 24 * 60 + startOffset, 'minutes');
                            if (end.parent().is(day)) endDate = startOfDay.clone().add(bottom / numTimeslots * 24 * 60 - endOffset, 'minutes');

                            if (slot.length === 0) slot = node.clone().appendTo(day);
                            var offsetTop = startDate.diff(startOfDay, 'minutes') / 60 / 24 * 100;
                            slot.css({
                                top: offsetTop + '%',
                                height: Math.min(100 - offsetTop, endDate.diff(startDate, 'minutes') / 60 / 24 * 100) + '%'
                            });
                        }
                        start.parent().prevAll().find('.resizing').remove();
                        day.nextAll().addBack().find('.resizing').remove();
                    },
                    end: function () {
                        this.$el.removeClass('no-select');
                        this.$('.resizing').removeClass('resizing');
                        if (!startDate || !endDate) return;
                        startDate.tz(model.getMoment('startDate').tz());
                        endDate.tz(model.getMoment('endDate').tz());
                        this.opt.view.updateAppointment(model, {
                            'startDate': { value: startDate.format('YYYYMMDD[T]HHmmss'), tzid: startDate.tz() },
                            'endDate': { value: endDate.format('YYYYMMDD[T]HHmmss'), tzid: endDate.tz() }
                        });
                    }
                });
            };
        }()),

        onDrag: function (e) {
            var target = $(e.target), model, node, offsetSlots, startDate, endDate, days, mousedownOrigin, cellHeight, sameDay, startOffset, numTimeslots;
            if (target.is('.resizable-handle')) return;

            this.mouseDragHelper({
                event: e,
                updateContext: '.day',
                start: function (e) {
                    node = target.closest('.appointment');
                    model = this.opt.view.collection.get(node.attr('data-cid'));
                    startDate = model.getMoment('startDate');
                    endDate = model.getMoment('endDate');
                    days = this.$('.day');
                    cellHeight = this.model.get('cellHeight');
                    mousedownOrigin = { x: e.pageX, y: e.pageY };
                    sameDay = model.getMoment('startDate').local().isSame(model.getMoment('endDate').local(), 'day');
                    // check if end date is right at midnight at the same day (this would lead to an incorrect sameDay check)
                    if (!sameDay) {
                        var tempMoment = moment(model.getMoment('endDate').local()).startOf('day');
                        // end date is right at midnight, so it might still be the same day
                        if (tempMoment.isSame(moment(model.getMoment('endDate').local()))) {
                            tempMoment.subtract(1, 'seconds');
                            sameDay = model.getMoment('startDate').local().isSame(tempMoment, 'day');
                        }
                    }
                    // offset in minutes in relation to the current grid size
                    startOffset = model.getMoment('startDate').local().minutes() % (60 / this.model.get('gridSize'));
                    numTimeslots = this.getNumTimeslots();
                    offsetSlots = Math.floor((e.pageY - $(e.currentTarget).offset().top) / cellHeight);

                    this.$('[data-cid="' + model.cid + '"]').addClass('resizing').removeClass('hover');
                },
                update: function (e) {
                    if (!this.$el.hasClass('no-select')) {
                        var deltaX = mousedownOrigin.x - e.pageX,
                            deltaY = mousedownOrigin.y - e.pageY;
                        if (deltaX * deltaX + deltaY * deltaY < cellHeight * cellHeight / 2) return;
                        this.$el.addClass('no-select');
                    }

                    var target = $(e.target);
                    if (!target.hasClass('timeslot')) return;

                    var index = days.index(target.parent()),
                        startIndex = model.getMoment('startDate').diff(this.model.get('startDate'), 'days'),
                        diffDays = index - startIndex,
                        diffMinutes = 0, i;

                    if (this.model.get('mergeView')) diffDays = 0;

                    var top = target.index() - offsetSlots,
                        minutes = top / numTimeslots * 24 * 60 + startOffset,
                        // yeah this tz construct looks strange but works (local() will not work in some edge cases)
                        startMinutes = model.getMoment('startDate').diff(model.getMoment('startDate').tz(moment().tz()).startOf('day'), 'minutes');
                    diffMinutes = minutes - startMinutes;

                    startDate = model.getMoment('startDate').tz(moment().tz()).add(diffDays, 'days').add(diffMinutes, 'minutes');
                    endDate = model.getMoment('endDate').tz(moment().tz()).add(diffDays, 'days').add(diffMinutes, 'minutes');

                    startIndex = Math.max(0, startDate.diff(this.model.get('startDate'), 'days'));
                    var endIndex = Math.min(this.model.get('numColumns'), endDate.diff(this.model.get('startDate'), 'days'));

                    // if the end date falls exactly on the start of a day we need to decrease the index by one
                    // otherwise we would draw a node on the next day when the appointment ends on midnight
                    var endsOnMidnight = endDate.isSame(endDate.clone().startOf('day'));
                    if (endsOnMidnight) endIndex--;

                    // loop over the days
                    for (i = startIndex; i <= endIndex; i++) {
                        var day = days.eq(i),
                            pos = i === startIndex ? startDate.diff(startDate.clone().startOf('day'), 'minutes') : 0,
                            bottom = i === endIndex && !endsOnMidnight ? endDate.diff(endDate.clone().startOf('day'), 'minutes') : 24 * 60,
                            slot = day.find('.resizing');

                        if (slot.length === 0) slot = node.clone().appendTo(day);
                        slot.css({
                            top: pos / 60 / 24 * 100 + '%',
                            height: (bottom - pos) / 60 / 24 * 100 + '%'
                        });
                    }
                    days.eq(startIndex).prevAll().find('.resizing').remove();
                    days.eq(endIndex).nextAll().find('.resizing').remove();
                },
                end: function () {
                    this.$el.removeClass('no-select');
                    this.$('.resizing').removeClass('resizing');
                    startDate.tz(model.getMoment('startDate').tz());
                    endDate.tz(model.getMoment('endDate').tz());
                    if (startDate.isSame(model.getMoment('startDate'))) return;
                    this.opt.view.updateAppointment(model, {
                        'startDate': { value: startDate.format('YYYYMMDD[T]HHmmss'), tzid: startDate.tz() },
                        'endDate': { value: endDate.format('YYYYMMDD[T]HHmmss'), tzid: endDate.tz() }
                    });
                }
            });
        },

        onWindowResize: function () {
            this.updateCellHeight();
            var height = this.getContainerHeight();
            this.$('.scrollpane').children().css('height', height);
        }

    });

    return PerspectiveView.extend({

        className: 'weekview-container',

        options: {
            showFulltime: true,
            slots: 24,
            limit: 1000
        },

        initialize: function (opt) {
            this.mode = opt.mode || 'day';
            this.app = opt.app;

            this.model = new Backbone.Model({
                additionalTimezones: this.getTimezoneLabels(),
                workStart: settings.get('startTime', 8) * 1,
                workEnd: settings.get('endTime', 18) * 1,
                gridSize: 60 / settings.get('interval', 30),
                mergeView: _.device('!smartphone') && this.mode === 'day' && this.app.folders.list().length > 1 && settings.get('mergeview'),
                date: opt.startDate || moment(this.app.getDate()),
                mode: this.mode
            });
            this.updateNumColumns();
            this.initializeSubviews();

            this.$el.addClass(this.mode);
            this.setStartDate(this.model.get('date'), { silent: true });

            this.listenTo(api, 'process:create update delete', this.onUpdateCache);

            this.listenTo(settings, 'change:renderTimezones change:favoriteTimezones', this.onChangeTimezones);
            this.listenTo(settings, 'change:startTime change:endTime', this.getCallback('onChangeWorktime'));
            this.listenTo(settings, 'change:interval', this.getCallback('onChangeInterval'));

            if (this.model.get('mode') === 'day') this.listenTo(settings, 'change:mergeview', this.onChangeMergeView);
            if (this.model.get('mode') === 'workweek') this.listenTo(settings, 'change:numDaysWorkweek change:workweekStart', this.getCallback('onChangeWorkweek'));

            PerspectiveView.prototype.initialize.call(this, opt);
        },

        initializeSubviews: function () {
            var opt = _.extend({
                app: this.app,
                view: this,
                model: this.model
            }, this.options);
            this.weekViewHeader = new WeekViewHeader(opt);
            this.weekViewToolbar = new WeekViewToolbar(opt);
            this.fulltimeView = new FulltimeView(opt);
            this.appointmentView = new AppointmentView(opt);
            this.$el.append(
                this.weekViewHeader.$el,
                this.weekViewToolbar.$el,
                this.fulltimeView.$el,
                this.appointmentView.$el
            );
        },

        getTimezoneLabels: function () {

            var list = _.intersection(
                settings.get('favoriteTimezones', []),
                settings.get('renderTimezones', [])
            );

            // avoid double appearance of default timezone
            return _(list).without(coreSettings.get('timezone'));
        },

        updateNumColumns: function () {
            var columns;
            switch (this.mode) {
                case 'day':
                    if (this.model.get('mergeView')) this.$el.addClass('merge-view');
                    columns = 1;
                    break;
                case 'workweek':
                    columns = settings.get('numDaysWorkweek');
                    break;
                default:
                case 'week':
                    columns = 7;
            }
            this.model.set('numColumns', columns);
        },

        onChangeDate: function (model, date) {
            date = moment(date);
            this.model.set('date', date);
            this.setStartDate(date);
        },

        onWindowShow: function () {
            if (this.$el.is(':visible')) this.trigger('show');
        },

        onChangeTimezones: function () {
            this.model.set('additionalTimezones', this.getTimezoneLabels());
        },

        /**
         * set week reference start date
         * @param { Moment } value
         *        moment: moment date object in the reference week
         * @param { object } options
         *        propagate (boolean): propagate change
         */
        setStartDate: function (value, options) {
            if (_.isString(value)) {
                var mode = value === 'next' ? 'add' : 'subtract',
                    type = this.model.get('mode') === 'day' ? 'day' : 'week';
                value = this.model.get('startDate').clone()[mode](1, type);
            }

            var previous = moment(this.model.get('startDate')),
                opt = _.extend({ propagate: true, silent: false }, options),
                date = moment(value);

            // normalize startDate to beginning of the week or day
            switch (this.mode) {
                case 'day':
                    date.startOf('day');
                    break;
                case 'workweek':
                    // settings independent, set startDate to Monday of the current week
                    date.startOf('week').day(settings.get('workweekStart'));
                    break;
                default:
                case 'week':
                    date.startOf('week');
                    break;
            }

            // only trigger change event if start date has changed
            if (date.isSame(previous)) return;
            this.model.set('startDate', date, { silent: opt.silent });
            if (opt.propagate) this.app.setDate(moment(value));
            if (ox.debug) console.log('refresh calendar data');
            this.refresh();
        },

        render: function () {
            this.weekViewHeader.render();
            this.weekViewToolbar.render();
            this.fulltimeView.render();
            this.appointmentView.render();
            return this;
        },

        getRequestParam: function () {
            var params = {
                start: this.model.get('startDate').valueOf(),
                end: moment(this.model.get('startDate')).add(this.model.get('numColumns'), 'days').valueOf(),
                view: 'week',
                folders: this.app.folders.list()
            };
            return params;
        },

        refresh: function (useCache) {
            var self = this,
                obj = this.getRequestParam(),
                collection = api.getCollection(obj);

            // set manually to expired to trigger reload on next opening
            if (useCache === false) {
                api.pool.grep('view=week').forEach(function (c) {
                    c.expired = true;
                });
            }

            this.setCollection(collection);
            $.when(this.app.folder.getData(), this.app.folders.getData()).done(function (folder, folders) {
                self.model.set('folders', folders);
                collection.folders = _(folders).pluck('id');
                collection.sync();
            });
        },

        onUpdateCache: function () {
            var collection = this.collection;
            // set all other collections to expired to trigger a fresh load on the next opening
            api.pool.grep('view=week').forEach(function (c) {
                if (c !== collection) c.expired = true;
            });
            collection.sync();
        },

        onPrevious: function () {
            this.weekViewHeader.$('.prev').trigger('click');
        },

        onNext: function () {
            this.weekViewHeader.$('.next').trigger('click');
        },

        onChangeMergeView: function () {
            this.model.set('mergeView', _.device('!smartphone') && this.mode === 'day' && this.app.folders.list().length > 1 && settings.get('mergeview'));
        },

        onChangeInterval: function () {
            this.model.set('gridSize', 60 / settings.get('interval', 30));
        },

        onAddAppointment: function (model) {
            if (util.isAllday(model) && this.options.showFulltime) this.fulltimeView.trigger('collection:add', model);
            else this.appointmentView.trigger('collection:add', model);
        },

        onChangeWorkweek: function () {
            this.setStartDate(this.model.get('startDate'));
            this.updateNumColumns();
            this.render();
        },

        onChangeWorktime: function () {
            this.model.set({
                workStart: settings.get('startTime', 8) * 1,
                workEnd: settings.get('endTime', 18) * 1
            });
            this.render();
        },

        onChangeAppointment: function (model) {
            var isAllday = util.isAllday(model);
            if (model.changed.startDate) this.collection.sort();
            if (isAllday !== util.isAllday(model.previousAttributes())) {
                var prevView = isAllday ? this.appointmentView : this.fulltimeView,
                    nextView = isAllday ? this.fulltimeView : this.appointmentView;
                prevView.trigger('collection:remove', model);
                nextView.trigger('collection:add', model);
                return;
            }
            if (util.isAllday(model) && this.options.showFulltime) this.fulltimeView.trigger('collection:change', model);
            else this.appointmentView.trigger('collection:change', model);
        },

        onRemoveAppointment: function (model) {
            if (util.isAllday(model) && this.options.showFulltime) this.fulltimeView.trigger('collection:remove', model);
            else this.appointmentView.trigger('collection:remove', model);
        },

        onResetAppointments: function () {
            this.fulltimeView.trigger('collection:before:reset');
            this.appointmentView.trigger('collection:before:reset');
            this.collection.forEach(function (model) {
                if (util.isAllday(model) && this.options.showFulltime) this.fulltimeView.trigger('collection:add', model);
                else this.appointmentView.trigger('collection:add', model);
            }.bind(this));
            this.fulltimeView.trigger('collection:after:reset');
            this.appointmentView.trigger('collection:after:reset');
        },

        getName: function () {
            return 'week';
        },

        // called when an appointment detail-view opens the according appointment
        selectAppointment: function (model) {
            // use start of appointment in calendar timezone
            this.setStartDate(model.getMoment('startDate').clone().tz(this.model.get('startDate').tz()));
            // check if there is a node drawn yet. If yes click it. if not, draw without arrow
            var target = this.$el.find('.appointment[data-cid="' + util.cid(model) + '"] .appointment-content');
            if (target.length) {
                var e = new jQuery.Event('click');
                e.pageX = target.offset().left + target.width() / 2;
                target.trigger(e);
                return;
            }
            this.showAppointment($.Event('click', { target: this.$el }), model, { arrow: false });
        },

        print: function () {
            var folders = this.model.get('folders'),
                title = gt('Appointments');
            if (folders.length === 1) title = folders[0].display_title || folders[0].title;
            print.request('io.ox/calendar/week/print', {
                start: this.model.get('startDate').valueOf(),
                end: this.model.get('startDate').clone().add(this.model.get('numColumns'), 'days').valueOf(),
                folders: _(folders).pluck('id'),
                title:  title,
                numberOfColumns: this.model.get('numColumns')
            });
        }

    });

});
