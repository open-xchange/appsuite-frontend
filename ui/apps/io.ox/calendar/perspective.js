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

define('io.ox/calendar/perspective', [
    'io.ox/core/extensions',
    'io.ox/calendar/api',
    'io.ox/calendar/model',
    'io.ox/calendar/util',
    'io.ox/calendar/view-detail',
    'io.ox/core/tk/dialogs',
    'io.ox/core/yell',
    'gettext!io.ox/calendar',
    'io.ox/core/capabilities',
    'settings!io.ox/calendar',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/disposable'
], function (ext, api, calendarModel, util, detailView, dialogs, yell, gt, capabilities, settings, folderAPI, DisposableView) {

    'use strict';

    var Perspective = DisposableView.extend({

        clickTimer:     null, // timer to separate single and double click
        clicks:         0, // click counter

        events: function () {
            var events = {
                'click .appointment': 'onClickAppointment',
                'dblclick .appointment': 'onDoubleClick'
            };
            if (_.device('touch')) {
                _.extend(events, {
                    'swipeleft': 'onNext',
                    'swiperight': 'onPrevious'
                });
            }
            return events;
        },

        initialize: function (options) {
            this.listenTo(this.model, 'change:date', this.onChangeDate);
            this.listenTo(api, 'refresh.all', this.refresh.bind(this, true));
            this.listenTo(this.app, 'folders:change', this.refresh);
            this.listenTo(this.app.props, 'change:date', this.getCallback('onChangeDate'));
            this.app.getWindow().on('show', this.onWindowShow.bind(this));
            this.listenTo(settings, 'change:showDeclinedAppointments', this.getCallback('onResetAppointments'));
            this.listenTo(folderAPI, 'before:update', this.beforeUpdateFolder);

            _.defer(this.followDeepLink.bind(this, options.deepLink));
        },

        // needs to be implemented by the according view
        render: $.noop,
        refresh: $.noop,
        onWindowShow: $.noop,
        onChangeDate: $.noop,

        setCollection: function (collection) {
            if (this.collection === collection) return;

            if (this.collection) this.stopListening(this.collection);
            this.collection = collection;

            this.onResetAppointments();

            this
                .listenTo(this.collection, 'add', this.onAddAppointment)
                .listenTo(this.collection, 'change', this.onChangeAppointment)
                .listenTo(this.collection, 'remove', this.onRemoveAppointment)
                .listenTo(this.collection, 'reset', this.onResetAppointments)
                .listenTo(this.collection, 'load:fail', this.onLoadFail);
        },

        onAddAppointment: $.noop,
        onChangeAppointment: $.noop,
        onRemoveAppointment: $.noop,
        onResetAppointments: $.noop,

        getName: $.noop,

        onLoadFail: function (err) {
            // see Bug 68641
            if (err.code === 'CAL-5072') {
                //#.Error message shown to user if there are too many selected appointments in a timeframe
                yell('error', gt('Your current selection contains too many appointments for the chosen timeframe.'));
            }
        },

        showAppointment: (function () {
            function failHandler(e) {
                // CAL-4040: Appointment not found
                if (e && e.code === 'CAL-4040') {
                    yell(e);
                } else {
                    yell('error', gt('An error occurred. Please try again.'));
                }
                this.dialog.close();
                this.$('.appointment').removeClass('opac current');
                this.trigger('show:appointment:fail');
                if (_.device('smartphone')) {
                    this.app.pages.getPage('detailView').idle();
                    this.app.pages.goBack();
                }
            }

            return function (e, obj) {
                // open appointment details
                var self = this, dialog = this.getDialog();

                if (_.device('smartphone')) {
                    self.app.pages.changePage('detailView');
                    self.app.pages.getPage('detailView').busy();
                }

                self.detailCID = api.cid(obj);

                if (_.device('smartphone')) {
                    var p = self.app.pages.getPage('detailView');
                    api.get(obj).then(function (model) {
                        var b = new ext.Baton({ data: model.toJSON(), model: model });
                        p.idle().empty().append(detailView.draw(b));
                        self.app.pages.getToolbar('detailView').setBaton(b);
                    }, failHandler.bind(self));
                } else {
                    dialog.show(e, function (popup) {
                        popup
                        .busy()
                        .attr({
                            'role': 'complementary',
                            'aria-label': gt('Appointment Details')
                        });

                        api.get(obj).then(function (model) {
                            if (model.cid !== self.detailCID) {
                                // this appointment was changed to an exception in the meantime, probably by another calendar client
                                // switch to updated data, send info message and clean up
                                if (model.get('seriesId') && model.get('seriesId') === obj.id) {
                                    _(api.pool.getByFolder(model.get('folder'))).each(function (collection) {
                                        collection.expired = true;
                                        collection.sync();
                                    });
                                    self.detailCID = model.cid;
                                    yell('warning', gt('Appointment was changed in the meantime and was updated accordingly.'));
                                } else {
                                    // close the dialog correctly and show an error message. Avoid never ending busy spinner.
                                    failHandler.call(self);
                                    return;
                                }
                            }
                            popup.idle().append(detailView.draw(new ext.Baton({ model: model })));
                        }, failHandler.bind(self));
                    });
                }
            };
        }()),

        closeAppointment: function () {
            this.$('.appointment').removeClass('opac current');
        },

        getDialog: function () {
            if (!this.dialog) {
                // define default sidepopup dialog
                this.dialog = new dialogs.SidePopup({ tabTrap: true, preserveOnAppchange: true })
                .on('close', this.closeAppointment.bind(this));
            }
            return this.dialog;
        },

        onClickAppointment: function (e) {
            this.lock = false;
            var target = $(e[(e.type === 'keydown') ? 'target' : 'currentTarget']);
            if (target.hasClass('appointment') && !this.model.get('lasso') && !target.hasClass('disabled')) {
                if (!target.hasClass('current') || _.device('smartphone')) {
                    _.delay(function () {
                        if (this.lock) return;
                        var obj = util.cid(String(target.data('cid')));
                        // ignore the "current" check on smartphones
                        this.$('.appointment')
                            .removeClass('current opac')
                            .not(this.$('[data-master-id="' + obj.folder + '.' + obj.id + '"]'))
                            .addClass((this.collection.length > this.limit || _.device('smartphone')) ? '' : 'opac'); // do not add opac class on phones or if collection is too large
                        this.$('[data-master-id="' + obj.folder + '.' + obj.id + '"]').addClass('current');
                        this.showAppointment(e, obj);
                    }.bind(this), 200);
                } else {
                    this.$('.appointment').removeClass('opac');
                }
            }
        },

        onDoubleClick: function (e) {
            var target = $(e.currentTarget), self = this;
            if (!target.hasClass('appointment') || this.model.get('lasso') || target.hasClass('disabled')) return;

            if (!target.hasClass('modify')) return;

            var obj = util.cid(String(target.data('cid')));

            this.lock = true;
            api.get(obj).done(function (model) {
                if (self.dialog) self.dialog.close();
                ext.point('io.ox/calendar/detail/actions/edit')
                    .invoke('action', self, new ext.Baton({ data: model.toJSON() }));
            });
        },

        createAppointment: function (data) {
            ext.point('io.ox/calendar/detail/actions/create')
            .invoke('action', this, { app: this.app }, data);
        },

        updateAppointment: function (model, updates) {
            var prevStartDate = model.getMoment('startDate'),
                prevEndDate = model.getMoment('endDate'),
                prevFolder = model.get('folder');

            var hasChanges = _(updates).reduce(function (memo, value, key) {
                return memo || !_.isEqual(model.get(key), value);
            }, false);
            if (!hasChanges) return;

            model.set(updates);
            var nodes = this.$('[data-master-id="' + api.cid({ id: model.get('id'), folder: model.get('folder') }) + '"]').busy();

            function reset() {
                model.set({
                    startDate: model.previous('startDate'),
                    endDate: model.previous('endDate'),
                    folder: prevFolder
                });
                nodes.idle();
            }

            function apiUpdate(model, options) {
                var obj = _(model.toJSON()).pick('id', 'folder', 'recurrenceId', 'seriesId', 'rrule', 'startDate', 'endDate', 'timestamp');

                api.update(obj, options).then(function success(data) {
                    if (!data || !data.conflicts) return nodes.idle();

                    ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                        conflictView.dialog(data.conflicts)
                            .on('cancel', reset)
                            .on('ignore', function () {
                                apiUpdate(model, _.extend(options || {}, { checkConflicts: false }));
                            });
                    });
                }, function fail(error) {
                    reset();
                    yell(error);
                });
            }

            util.showRecurrenceDialog(model)
                .done(function (action, masterModel) {
                    switch (action) {
                        case 'series':
                            // calculate new dates if old dates are available
                            var oldStartDate = masterModel.getMoment('startDate');
                            if (model.hasFlag('overridden')) {
                                masterModel.set({
                                    startDate: model.get('startDate'),
                                    endDate: model.get('endDate')
                                });
                            } else {
                                var startDate = masterModel.getMoment('startDate').add(model.getMoment('startDate').diff(prevStartDate, 'ms'), 'ms'),
                                    endDate = masterModel.getMoment('endDate').add(model.getMoment('endDate').diff(prevEndDate, 'ms'), 'ms'),
                                    format = util.isAllday(model) ? 'YYYYMMDD' : 'YYYYMMDD[T]HHmmss';
                                masterModel.set({
                                    startDate: { value: startDate.format(format), tzid: masterModel.get('startDate').tzid },
                                    endDate: { value: endDate.format(format), tzid: masterModel.get('endDate').tzid }
                                });
                            }

                            util.updateRecurrenceDate(masterModel, oldStartDate);
                            apiUpdate(masterModel, _.extend(util.getCurrentRangeOptions(), {
                                checkConflicts: true
                            }));
                            break;
                        case 'thisandfuture':
                            // calculate new dates if old dates are available use temporary new model to store data before the series split
                            var updateModel = new calendarModel.Model(util.createUpdateData(masterModel, model));

                            updateModel.set({
                                startDate: model.get('startDate'),
                                endDate: model.get('endDate')
                            });

                            // only if there is a new rrule set (if this and future is called on an exception we don't want to use the rrule from the master)
                            if (model.get('rrule')) {
                                updateModel.set('rrule', model.get('rrule'));
                            }

                            util.updateRecurrenceDate(updateModel, prevStartDate);
                            apiUpdate(updateModel, _.extend(util.getCurrentRangeOptions(), {
                                checkConflicts: true,
                                recurrenceRange: 'THISANDFUTURE'
                            }));
                            break;
                        case 'appointment':
                            apiUpdate(model, _.extend(util.getCurrentRangeOptions(), { checkConflicts: true }));
                            break;
                        default:
                            reset();
                            return;
                    }
                });
        },

        // /*
        //  * Returns a function which will execute the requested function of the view
        //  * as soon as the view is visible
        //  */
        getCallback: function (name) {
            var last;
            return function () {
                var func = this[name], args = _(arguments).toArray();
                if (last) this.off('show', last);
                last = undefined;
                if (this.$el.is(':visible')) return func.apply(this, args);
                this.once('show', last = function () {
                    func.apply(this, args);
                });
            }.bind(this);
        },

        beforeUpdateFolder: function (id, model) {
            if (model.get('module') !== 'calendar') return;
            if (!model.changed['com.openexchange.calendar.extendedProperties']) return;

            var color = util.getFolderColor(model.attributes),
                appointments = this.$('.appointment[data-folder="' + model.get('id') + '"]');

            appointments
                .css({
                    'background-color': color,
                    'color': util.getForegroundColor(color)
                })
                .data('background-color', color)
                .removeClass('black white')
                .addClass(util.getForegroundColor(color) === 'white' ? 'white' : 'black');
        },

        // id must be set in URL
        followDeepLink: function (cid) {
            if (this.disposed) return;
            if (!cid) return;
            var e, self = this;

            api.get(api.cid(cid)).done(function (model) {
                // list perspective doesn't have a setStartDate function
                if (self.setStartDate) self.setStartDate(model.getMoment('startDate'));

                if (_.device('smartphone')) {
                    ox.launch('io.ox/calendar/detail/main', { cid: cid });
                } else {
                    e = $.Event('click', { target: self.$el });
                    self.showAppointment(e, util.cid(cid), { arrow: false });
                }
            });
        }

    });

    var DragHelper = DisposableView.extend({

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
                active = true,
                started = false,
                updated = false,
                stopped = false,
                delay = opt.delay || 0;

            if (e.which !== 1) return;

            _.delay(function () {
                if (stopped) return;
                opt.start.call(this, opt.event);
                started = true;
            }.bind(this), delay);

            this.delegate('mousemove' + context, opt.updateContext, _.throttle(function (e) {
                if (!started) return;
                if (e.which !== 1) return;
                if (!active) return;
                updated = true;
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
                stopped = true;
                if (!started) opt.start.call(self, opt.event);
                if (!updated && delay > 0) opt.update.call(self, e);
                clear();
                opt.end.call(self, e);
            });
        }

    });

    return {
        View: Perspective,
        DragHelper: DragHelper
    };

});
