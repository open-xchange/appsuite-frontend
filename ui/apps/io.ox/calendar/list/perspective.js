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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/list/perspective', [
    'io.ox/calendar/api',
    'io.ox/calendar/view-detail',
    'io.ox/core/commons',
    'io.ox/core/extensions',
    'io.ox/calendar/util',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/folder/api',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/list/style'
], function (api, viewDetail, commons, ext, util, actions, folderAPI, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('list');

    _.extend(perspective, {

        updateColor: function (model) {
            if (!model) return;
            var color = util.getFolderColor(model.attributes),
                container = $('[data-folder="' + model.get('id') + '"]', this.main);
            $('[data-folder="' + model.get('id') + '"]', this.main).css({
                'background-color': color
            });

            container.parent().removeClass('black white');
            container.parent().addClass(util.getForegroundColor(color) === 'white' ? 'white' : 'black');
        },

        selectAppointment: function (model) {
            this.app.listView.selection.set([model.cid]);
        },

        showAppointment: function (obj) {
            if (_.device('smartphone') && this.app.props.get('checkboxes') === true) return;
            if (obj instanceof Backbone.Model) obj = obj.attributes;
            // be busy
            this.app.right.busy(true);
            var self = this,
                lfoShow = _.lfo(function (appointmentModel) {
                    // we need to check folder api first when list perspective is used for search results. Those can contain appointments where the user has no right to see the folder
                    // this affects the shared folder check of the accept decline actions
                    // if the appointment data itself can tell the UI if it's a shared folder or not we can drop this check. tbd
                    var def = self.app.props.get('find-result') ? folderAPI.get(appointmentModel.get('folder')) : $.when();
                    def.always(function (result) {
                        self.drawAppointment(appointmentModel, { noFolderCheck: result && result.error });
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
                p.idle().empty().append(viewDetail.draw(model, options));
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

        render: function (app) {

            var win = app.getWindow(),
                self = this;

            this.app = app;
            if (_.device('smartphone')) {
                app.left.addClass('calendar-list-view vsplit');
                app.right.addClass('default-content-padding calendar-detail-pane f6-target')
                    .attr({
                        'tabindex': -1,
                        'role': 'main',
                        'aria-label': gt('Appointment')
                    });
            } else {
                this.main.addClass('calendar-list-view vsplit').append(
                    app.left.addClass('border-right'),
                    app.right.addClass('default-content-padding calendar-detail-pane f6-target')
                    .attr({
                        'tabindex': -1,
                        'role': 'main',
                        'aria-label': gt('Appointment')
                    })
                );
                app.right.scrollable();
            }

            app.listView.on({
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

            $.when(app.folder.getData(), app.folders.getData()).done(function (data, folders) {
                app.listView.model.set('folders', _(folders).pluck('id'));
                self.folderModels = _(folders).map(function (folder) {
                    var model = folderAPI.pool.getModel(folder.id);
                    model.on('change:com.openexchange.calendar.extendedProperties', self.updateColor, self);
                    return model;
                });
            });

            app.on('folders:change', function () {
                app.listView.model.set('folders', app.folders.list());
            });

            folderAPI.on('before:update', function (id, model) {
                if (model.get('module') !== 'calendar') return;
                if (!model.changed['com.openexchange.calendar.extendedProperties']) return;
                self.updateColor(model);
            });

            api.on('beforedelete', function (ids) {
                var selection = app.listView.selection.get(),
                    cids = _.map(ids, util.cid);
                if (_.intersection(cids, selection).length) app.listView.selection.dodge();
            });

            // refresh listview on all update/delete events
            api.on('refresh.all', function () {
                // make sure the collection loader uses the correct collection
                var loader = app.listView.loader,
                    collection = app.listView.collection;
                loader.collection = collection;
                app.listView.reload();
            });

            api.on('process:create', function (data) {
                app.listView.collection.once('reload', function () {
                    app.listView.selection.set([util.cid(data)]);
                });
            });

            // to show an appointment without it being in the grid, needed for direct links
            app.on('show:appointment', this.showAppointment);

            // drag & drop support
            win.nodes.outer.on('selection:drop', function (e, baton) {
                var list = _.map(baton.data, util.cid);
                api.getList(list).then(function (models) {
                    baton.data = _(models).map(api.reduce);
                    actions.invoke('io.ox/calendar/detail/actions/move', null, baton);
                });
            });

            app.listView.load();

            // select ids from url
            var cids = [].concat((_.url.hash('id') || '').split(','));
            app.listView.once('first-reset', function () {
                app.listView.selection.set(cids);
            });
        }

    });

    return perspective;
});
