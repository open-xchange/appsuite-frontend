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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/calendar/freetime/main', [
    'io.ox/backbone/disposable',
    'io.ox/calendar/freetime/model',
    'io.ox/calendar/freetime/participantsView',
    'io.ox/calendar/freetime/timeView',
    'gettext!io.ox/calendar',
    'settings!io.ox/calendar',
    'less!io.ox/calendar/freetime/style',
    'less!io.ox/calendar/style'
], function (DisposableView, FreetimeModel, ParticipantsView, TimeView, gt, settings) {

    'use strict';

    //
    // Freetimeview. Simple view used to coordinate appointments with multiple participants
    //

    var freetimeView = DisposableView.extend({
            className: 'freetime-view',
            initialize: function (options) {
                var self = this;

                this.options = options || {};
                this.parentModel = options.parentModel;
                if (options.parentModel) {
                    this.model.get('participants').add(options.parentModel.get('participants'));
                    this.model.set('currentWeek', moment(options.parentModel.get('start_date')).startOf('week'));
                } else {
                    if (options.startDate) {
                        this.model.set('currentWeek', moment(options.startDate).startOf('week'));
                    }
                    if (options.participants) {
                        this.model.get('participants').add(options.participants);
                    }
                }

                this.participantsSubview = new ParticipantsView({ model: this.model, parentView: this });
                this.timeSubview = new TimeView({ model: this.model, parentModel: options.parentModel, parentView: this });

                this.model.on('change:zoom', self.updateZoom.bind(this));
                this.model.on('change:compact', self.updateCompact.bind(this));
                this.model.on('change:onlyWorkingHours', self.updateWorkingHours.bind(this));
                this.model.on('change:onlyWorkingHours change:compact change:zoom change:showFree change:showTemporary change:showReserved change:showAbsent', self.updateSettings.bind(this));

                this.on('dispose', function () {
                    self.timeSubview.dispose();
                    self.participantsSubview.dispose();
                });
                this.timeSubview.bodyNode.on('scroll', function () {
                    if (self.participantsSubview.bodyNode[0].scrollTop === 0 && this.scrollTop === 0) {
                        return;
                    }
                    self.participantsSubview.bodyNode[0].scrollTop = this.scrollTop;
                });

                this.header = $('<div class="freetime-view freetime-view-header">').addClass('zoomlevel-' + this.model.get('zoom'));
                this.body = $('<div class="freetime-view freetime-view-body">').addClass('zoomlevel-' + this.model.get('zoom'));
                this.updateWorkingHours();
                this.updateCompact();
            },
            updateSettings: function () {
                settings.set('schedulingZoomlevel', this.model.get('zoom'));
                settings.set('schedulingOnlyWorkingHours', this.model.get('onlyWorkingHours'));
                settings.set('schedulingShowFree', this.model.get('showFree'));
                settings.set('schedulingShowAbsent', this.model.get('showAbsent'));
                settings.set('schedulingShowReserved', this.model.get('showReserved'));
                settings.set('schedulingShowTemporary', this.model.get('showTemporary'));
                settings.set('schedulingCompactMode', this.model.get('compact'));
                settings.save();
            },

            updateZoom: function () {
                this.header.removeClass('zoomlevel-100 zoomlevel-200 zoomlevel-400 zoomlevel-1000').addClass('zoomlevel-' + this.model.get('zoom'));
                this.body.removeClass('zoomlevel-100 zoomlevel-200 zoomlevel-400 zoomlevel-1000').addClass('zoomlevel-' + this.model.get('zoom'));
            },
            updateWorkingHours: function () {
                this.header.toggleClass('only-workinghours', this.model.get('onlyWorkingHours'));
                this.body.toggleClass('only-workinghours', this.model.get('onlyWorkingHours'));
            },
            updateCompact: function () {
                this.header.toggleClass('compact', this.model.get('compact'));
                this.body.toggleClass('compact', this.model.get('compact'));
            },

            renderHeader: function () {
                this.header.empty();
                this.header.append($('<div class="header-row2">').append(this.participantsSubview.headerNodeRow, this.timeSubview.headerNodeRow2));
                this.participantsSubview.renderHeader();
                this.timeSubview.renderHeader();
                return this.header;
            },

            renderBody: function () {
                this.body.empty();
                this.body.append(this.participantsSubview.bodyNode, this.timeSubview.bodyNode);
                this.participantsSubview.renderBody();
                this.timeSubview.renderBody();
                return this.body;
            },

            render: function () {
                this.renderHeader();
                this.renderBody();
            },

            // for convenienece
            createAppointment: function () {
                return this.timeSubview.createAppointment();
            }
        }),

        showDialog = function (options) {
            var def = $.Deferred();
            options = options || {};
            options.model = new FreetimeModel();

            require(['io.ox/backbone/views/modal'], function (dialog) {
                var popup = new dialog({
                        width: '100%',
                        async: true,
                        title: options.title || gt('Scheduling')
                    }),
                    view;
                options.popup = popup;
                view = new freetimeView(options);

                popup.addCancelButton();
                popup.addButton({ label: options.label || gt('Create appointment'), action: 'save' });
                popup.open();
                popup.$el.addClass('freetime-popup');
                // append after header so it does not scroll with the rest of the view
                popup.$el.find('.modal-header').append(view.timeSubview.headerNodeRow1).after(view.header);
                popup.$body.append(view.body);
                view.render();
                popup.on('close', function () {
                    view.dispose();
                });
                def.resolve({ dialog: popup, view: view });
            });
            return def;
        };

    return {
        FreetimeView: freetimeView,
        showDialog: showDialog,
        // just for convenience purposes
        FreetimeModel:  FreetimeModel
    };
});
