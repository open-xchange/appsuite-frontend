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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/calendar/edit/module-conflicts',
      ['io.ox/calendar/edit/model-appointment',
       'io.ox/calendar/edit/module-participants',
       'io.ox/calendar/api',
       'io.ox/core/http',
       'io.ox/calendar/view-grid-template',
       'dot!io.ox/calendar/edit/common.html',
       'gettext!io.ox/calendar/edit/main'], function (AppointmentModel, participantsModule, CalendarAPI, http, vgridtpl, tmpl, gt) {

    'use strict';

    var ConflictModel = AppointmentModel.extend({
        initialize: function () {
            var self = this,
                conflicting_participants = new participantsModule.Collection(self.get('participants'));
            self.set('conflicting_participants', conflicting_participants);
        },
        fetch: function (options) {
            var self = this,
                df = new $.Deferred();

            CalendarAPI.get(options)
                .done(function (data) {
                    if (data.data) {
                        data.data.conflicting_participants = self.get('conflicting_participants');
                        self.set(data.data);
                        df.resolve(self, data);
                    } else if (data.error) {
                        if (data.error.categories === 'PERMISSION_DENIED') {
                            self.set('title', gt('Unknown'));
                            self.set('location', gt('No read permission!'));
                            df.resolve(self, data);
                            //self.set('additional_info', [gt('Permission denied, this appointment is private.')]);
                        }
                    }
                })
                .fail(function (err) {
                    df.reject(self, err);
                });

            return df;
        }
    });

    var ConflictCollection = Backbone.Collection.extend({
        model: ConflictModel,
        fetch: function () {
            http.pause();
            this.each(function (model) {
                model.fetch(model.toJSON());
            });
            return http.resume();
        }
    });

    var ConflictsView = Backbone.View.extend({
        tagName: 'div',
        events: {
            'click a.btn-danger[data-action=ignore]': 'onIgnore',
            'click a.btn[data-action=cancel]': 'onCancel'
        },
        initialize: function () {

        },
        render: function () {
            var conflictList = vgridtpl.drawSimpleGrid(this.collection.toJSON());

            require(
                    ["io.ox/core/tk/dialogs", "io.ox/calendar/view-grid-template"],
                    function (dialogs, viewGrid) {

                        new dialogs.SidePopup()
                            .delegate($(conflictList), ".vgrid-cell", function (popup) {
                                var data = $(this).data("appointment");
                                require(["io.ox/calendar/view-detail"], function (view) {
                                    popup.append(view.draw(data));
                                    data = null;
                                });
                            });

                    }
                );
            this.$el.empty().append(
                conflictList,
                tmpl.render('io.ox/calendar/edit/conflicts', {})
            );

            // remove buttons, when resources are in the conflicts
            var isResource = this.collection.any(function (conflict) {
                return conflict.get('conflicting_participants').any(function (participant) {
                    return (participant.get('type') === participant.TYPE_RESOURCE);
                });
            });

            if (isResource) {
                this.$('[data-action="cancel"]').hide();
                this.$('[data-action="ignore"]').hide();
            }

            this.isResource = isResource;


            return this;
        },
        onIgnore: function () {
            this.trigger('ignore');
        },
        onCancel: function () {
            this.trigger('cancel');
        }
    });

    return {
        Model: ConflictModel,
        Collection: ConflictCollection,
        CollectionView: ConflictsView
    };

});
