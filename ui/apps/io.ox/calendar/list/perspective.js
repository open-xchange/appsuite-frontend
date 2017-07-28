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
    'io.ox/calendar/chronos-api',
    'io.ox/calendar/view-detail',
    'io.ox/core/commons',
    'io.ox/core/extensions',
    'io.ox/calendar/util',
    'io.ox/calendar/chronos-util',
    'io.ox/core/extPatterns/actions',
    'io.ox/core/folder/api',
    'settings!io.ox/calendar',
    'gettext!io.ox/calendar',
    'less!io.ox/calendar/list/style'
], function (api, viewDetail, commons, ext, util, chronosUtil, actions, folderAPI, settings, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('list');
    // start, end;

    _.extend(perspective, {

        updateColor: function (model) {
            if (!model) return;
            $('[data-folder="' + model.get('id') + '"]', this.pane).each(function () {
                this.className = this.className.replace(/color-label-\d{1,2}/, 'color-label-' + (model.get('meta') ? model.get('meta').color_label || '1' : '1'));
            });
        },

        selectAppointment: function (model) {
            this.app.listView.selection.set([model.cid]);
        },

        showAppointment: function (obj) {
            if (_.device('smartphone') && this.app.props.get('checkboxes') === true) return;
            if (obj instanceof Backbone.Model) obj = obj.attributes;
            // be busy
            this.app.right.busy(true);

            api.get(obj)
                .then(
                    _.lfo(this.drawAppointment.bind(this)),
                    _.lfo(this.drawMessageRight.bind(this, gt('Could\'t load appointment data.')))
                );
        },

        drawAppointment: function (model) {
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
                p.idle().empty().append(viewDetail.draw(model));
                // update toolbar with new baton
                this.app.pages.getToolbar('detailView').setBaton(baton);

            } else {
                baton.disable('io.ox/calendar/detail', 'inline-actions');
                this.app.right.idle().empty().append(viewDetail.draw(baton));
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
                    self.showAppointment(chronosUtil.cid(list[0]));
                },
                'selection:multiple': function (list) {
                    var count = $('<span class="number">').text(list.length).prop('outerHTML');
                    self.drawMessageRight(gt('%1$s appointments selected', count));
                },
                'selection:change': function (cids) {
                    _.url.hash('id', cids.join(','));
                }
            });

            self.app.folder.getData().done(function (data) {
                self.folderModel = folderAPI.pool.getModel(data.id);
                self.folderModel.on('change:meta', self.updateColor, self);
            });

            app.on('folder:change', function (id) {
                app.listView.model.set('folder', id);

                self.app.folder.getData().done(function (data) {
                    if (self.folderModel) {
                        self.folderModel.off('change:meta', self.updateColor);
                    }
                    self.folderModel = folderAPI.pool.getModel(data.id);
                    self.folderModel.on('change:meta', self.updateColor, self);
                });
            });

            api.on('create', function (data) {
                app.listView.load();
                app.listView.collection.once('load', function () {
                    app.listView.selection.set([chronosUtil.cid(data)]);
                });
            });

            api.on('beforedelete', function (ids) {
                var selection = app.listView.selection.get(),
                    cids = _.map(ids, chronosUtil.cid);
                if (_.intersection(cids, selection).length) app.listView.selection.dodge();
            });

            // refresh listview on all update/delete events
            api.on('update delete refresh.all', app.listView.reload.bind(app.listView));

            // to show an appointment without it being in the grid, needed for direct links
            app.on('show:appointment', this.showAppointment);

            // drag & drop support
            win.nodes.outer.on('selection:drop', function (e, baton) {
                var list = _.map(baton.data, chronosUtil.cid);
                api.getList(list).then(function (models) {
                    baton.data = _(models).map(api.reduce);
                    actions.invoke('io.ox/calendar/detail/actions/move', null, baton);
                });
            });

            // select ids from url
            var cids = [].concat((_.url.hash('id') || '').split(','));
            app.listView.once('first-reset', function () {
                app.listView.selection.set(cids);
            });
        }

    });

    return perspective;
});
