/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/calendar/list/view', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/calendar/api',
    'io.ox/core/folder/api',
    'io.ox/calendar/perspective',
    'io.ox/calendar/view-detail',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/list/style'
], function (ext, actionsUtil, api, folderAPI, perspective, viewDetail, util, gt) {

    'use strict';

    return perspective.View.extend({

        events: {},

        className: function () {
            if (_.device('smartphone')) return;
            return 'calendar-list-view vsplit';
        },

        initialize: function (opt) {
            var self = this, app = opt.app;
            this.app = app;

            // select ids from url before registering selection listeners
            var cids = [].concat((_.url.hash('id') || '').split(','));
            app.listView.once('first-reset', function () {
                app.listView.selection.set(cids);
            });

            this.listenTo(app.listView, {
                'selection:empty': function () {
                    self.drawMessageRight(gt('No appointment selected'));
                },
                'selection:one': function (list) {
                    self.showAppointment(util.cid(list[0]));
                },
                'selection:multiple': function (list) {
                    var count = $('<span class="number">').text(list.length).prop('outerHTML');
                    self.drawMessageRight(gt('%1$s appointments selected', count));
                },
                'selection:change': function (cids) {
                    _.url.hash('id', cids.join(','));
                }
            });

            this.listenTo(api, {
                'beforedelete': function (ids) {
                    var selection = app.listView.selection.get(),
                        cids = _.map(ids, util.cid);
                    if (_.intersection(cids, selection).length) app.listView.selection.dodge();
                },
                // refresh listview on all update/delete events
                'refresh.all': function () {
                    // make sure the collection loader uses the correct collection
                    var loader = app.listView.loader,
                        collection = app.listView.collection;
                    loader.collection = collection;
                    app.listView.reload();
                },
                'process:create': function (data) {
                    app.listView.collection.once('reload', function () {
                        app.listView.selection.set([util.cid(data)]);
                    });
                },
                // to show an appointment without it being in the grid, needed for direct links
                'show:appointment': this.showAppointment
            });

            // drag & drop support
            app.getWindow().nodes.outer.on('selection:drop', function (e, baton) {
                var list = _.map(baton.data, util.cid);
                api.getList(list).then(function (models) {
                    baton.data = _(models).invoke('toJSON');
                    actionsUtil.invoke('io.ox/calendar/detail/actions/move', baton);
                });
            });

            this.listenTo(app, 'folders:change', this.onUpdateFolders);
            $.when(app.folder.getData(), app.folders.getData()).done(function (folder, folders) {
                self.onUpdateFolders(_(folders).pluck('id'));
            });

            app.listView.load();

            perspective.View.prototype.initialize.call(this, opt);
        },

        onUpdateFolders: function (folders) {
            var app = this.app;
            app.listView.model.set('folders', folders);
        },

        render: function () {
            if (_.device('smartphone')) {
                this.app.left.addClass('calendar-list-view vsplit');
                this.app.right.addClass('default-content-padding calendar-detail-pane f6-target')
                    .attr({
                        'tabindex': -1,
                        'aria-label': gt('Appointment')
                    });
            } else {
                this.$el.append(
                    this.app.left.addClass('border-right'),
                    this.app.right.addClass('default-content-padding calendar-detail-pane f6-target')
                    .attr({
                        'tabindex': -1,
                        'aria-label': gt('Appointment')
                    })
                );
                this.app.right.scrollable();
            }

            return this;
        },

        showAppointment: function (e, obj) {
            if (!obj) obj = e;

            if (_.device('smartphone') && this.app.props.get('checkboxes') === true) return;
            if (obj instanceof Backbone.Model) obj = obj.attributes;
            // be busy
            this.app.right.busy({ empty: true });
            var self = this,
                lfoShow = _.lfo(function (appointmentModel) {
                    // we need to check folder api first when list perspective is used for search results. Those can contain appointments where the user has no right to see the folder
                    // this affects the shared folder check of the accept decline actions
                    // if the appointment data itself can tell the UI if it's a shared folder or not we can drop this check. tbd
                    var def = self.app.props.get('find-result') ? folderAPI.get(appointmentModel.get('folder')) : $.when();
                    def.always(function (result) {
                        // we use lfo here and wait for a folder api call. This might cause some ugly race conditions. The appointmentModel might be updated by a list or refresh call in the meantime, just make sure it's a fully featured model
                        if (appointmentModel.get('attendees')) {
                            self.drawAppointment(appointmentModel, { noFolderCheck: result && result.error });
                            self.app.listView.trigger('toolbar:update');
                            return;
                        }
                        api.get(obj).then(function (fullModel) {
                            self.drawAppointment(fullModel, { noFolderCheck: result && result.error });
                        });
                    });
                });

            api.get(obj)
                .then(
                    lfoShow,
                    _.lfo(this.drawMessageRight.bind(this, gt('Could\'t load appointment data.')))
                );
        },

        drawAppointment: function (model, options) {
            var baton = ext.Baton({ model: model, data: model.attributes });
            if (_.device('smartphone')) {
                this.app.pages.changePage('detailView');
                var app = this.app,
                    p = app.pages.getPage('detailView');
                // clear selection after page is left, otherwise the selection
                // will not fire an event if the user click on the same appointment again
                p.one('pagehide', function () {
                    app.listView.selection.clear();
                });
                // draw details to page
                p.idle().empty().append(viewDetail.draw(new ext.Baton({ model: model }), options));
                // update toolbar with new baton
                this.app.pages.getToolbar('detailView').setBaton(baton);

            } else {
                baton.disable('io.ox/calendar/detail', 'inline-actions');
                this.app.right.idle().empty().append(viewDetail.draw(baton, options));
            }
        },

        drawMessageRight: function (msg) {
            this.app.right.idle().empty().append(
                $('<div class="io-ox-center multi-selection-message">').append(
                    $('<div class="message">').append(msg)
                )
            );
        },

        beforeUpdateFolder: function (id, model) {
            if (model.get('module') !== 'calendar') return;
            if (!model.changed['com.openexchange.calendar.extendedProperties']) return;
            this.updateColor(model);
        },

        updateColor: function (model) {
            if (!model) return;
            var color = util.getFolderColor(model.attributes),
                container = this.$('[data-folder="' + model.get('id') + '"]');
            this.$('[data-folder="' + model.get('id') + '"]').css({
                'background-color': color
            });

            container.parent().removeClass('black white');
            container.parent().addClass(util.getForegroundColor(color) === 'white' ? 'white' : 'black');
        },

        getName: function () {
            return 'list';
        }

    });

});
