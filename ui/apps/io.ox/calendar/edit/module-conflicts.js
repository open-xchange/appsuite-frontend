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
      ['io.ox/calendar/model',
       'io.ox/participants/model',
       'io.ox/calendar/api',
       'io.ox/core/http',
       'io.ox/calendar/view-grid-template',
       'io.ox/core/extensions',
       'io.ox/backbone/views',
       'gettext!io.ox/calendar/edit/main'], function (AppointmentModel, participantsModule, CalendarAPI, http, vgridtpl, ext, views, gt) {

    'use strict';

    var ConflictModel = AppointmentModel.extend({
        initialize: function () {
            var self = this,
                conflicting_participants = new participantsModule.Participants(self.get('participants'));
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

    var ConflictsView = views.point('io.ox/calendar/edit/conflicts').createView({
        tagName: 'div',
        render: function () {
            var conflictList = vgridtpl.drawSimpleGrid(this.collection.toJSON());
            var self = this;
            // show info about conflicting appointment
            require(
                    ["io.ox/core/tk/dialogs", "io.ox/calendar/view-grid-template"],
                    function (dialogs, viewGrid) {

                        new dialogs.SidePopup()
                            .delegate($(conflictList), ".vgrid-cell", function (popup, e, target) {
                                var data = target.data("appointment");
                                require(["io.ox/calendar/view-detail"], function (view) {
                                    popup.append(view.draw(data));
                                    data = null;
                                });
                            });

                    }
                );

            var rows = [];

            function getRow(index) {
                if (rows.length > index + 1) {
                    return rows[index];
                }
                for (var i = 0; i < index + 1 - rows.length; i++) {
                    rows.push($('<div class="row-fluid">'));
                }
                return rows[index];
            }

            this.point.each(function (extension) {
                var node = getRow(extension.forceLine || rows.length);
                extension.invoke('draw', node, {model: self.model, parentView: self});
            });
			this.$el.append(conflictList);
            this.$el.append(rows);

            // remove buttons, when resources are in the conflicts
            var isResource = this.collection.any(function (conflict) {
                return conflict.get('conflicting_participants').any(function (participant) {
                    return (participant.get('type') === participant.TYPE_RESOURCE);
                });
            });
            if (isResource) {
                this.$('.btn').hide();
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
