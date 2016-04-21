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
    'less!io.ox/calendar/freetime/style',
    'less!io.ox/calendar/style'
], function (DisposableView, FreetimeModel, ParticipantsView, TimeView, gt) {

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
                    this.model.set('currentDay', moment(options.parentModel.get('start_date')).startOf('day'));
                } else {
                    if (options.startDate) {
                        this.model.set('currentDay', moment(options.startDate).startOf('day'));
                    }
                    if (options.participants) {
                        this.model.get('participants').add(options.participants);
                    }
                }

                this.participantsSubview = new ParticipantsView({ model: this.model });
                this.timeSubview = new TimeView({ model: this.model });
                this.on('dispose', function () {
                    self.timeSubview.dispose();
                    self.participantsSubview.dispose();
                });
            },

            render: function () {
                this.$el.empty();
                this.$el.append($('<div class="freetime-view-header">').append(this.participantsSubview.headerNode, this.timeSubview.headerNode),
                                $('<div class="freetime-view-body scrollable-pane">').append(this.participantsSubview.bodyNode, this.timeSubview.bodyNode));
                this.participantsSubview.renderHeader();
                this.timeSubview.renderHeader();
                this.participantsSubview.renderBody();
                this.timeSubview.renderBody();
            },

            renderHeader: function () {
                this.header = this.header || $('<div class="freetime-view freetime-view-header">');
                this.header.empty();
                this.header.append(this.participantsSubview.headerNode, this.timeSubview.headerNode);
                this.participantsSubview.renderHeader();
                this.timeSubview.renderHeader();
                return this.header;
            },

            renderBody: function () {
                this.body = this.body || $('<div class="freetime-view freetime-view-body">');
                this.body.empty();
                this.body.append(this.participantsSubview.bodyNode, this.timeSubview.bodyNode);
                this.participantsSubview.renderBody();
                this.timeSubview.renderBody();
                return this.body;
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
                        width: '90%',
                        title: options.title || gt('Appointment scheduling')
                    }),
                    view = new freetimeView(options);

                popup.addCancelButton();
                popup.addButton({ label: gt('Save'), action: 'save' });
                popup.open();
                // append after header so it does not scroll with the rest of the view
                popup.$el.find('.modal-header').after(view.renderHeader());
                popup.$body.css('padding-top', 0).append(view.renderBody());
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
