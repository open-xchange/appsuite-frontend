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

define('io.ox/calendar/freetime/participantsView', [
    'io.ox/participants/add',
    'io.ox/participants/chronos-views',
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/calendar'
], function (AddParticipantsView, participantsViews, ext, DisposableView, gt) {

    'use strict';

    var pointHeader = ext.point('io.ox/calendar/freetime/participants-view-header'),
        pointBody = ext.point('io.ox/calendar/freetime/participants-view-body');

    // add participants view
    pointHeader.extend({
        id: 'add-participant',
        index: 100,
        draw: function (baton) {
            var typeahead = new AddParticipantsView({
                apiOptions: {
                    contacts: true,
                    users: true,
                    groups: true,
                    resources: true,
                    distributionlists: true
                },
                convertToAttendee: true,
                placeholder: gt('Add participant') + ' \u2026',
                collection: baton.model.get('attendees')
            });
            this.append(
                typeahead.$el
            );
            typeahead.render().$el.addClass('add-participants-wrapper col-md-12');
        }
    });

    // participants container
    pointBody.extend({
        id: 'participants_list',
        index: 100,
        draw: function (baton) {
            this.append(new participantsViews.UserContainer({
                collection: baton.model.get('attendees'),
                baton: baton,
                entryClass: 'col-xs-12 col-sm-12',
                labelClass: 'sr-only',
                halo: false,
                hideMail: true,
                asHtml: true,
                noEmptyLabel: true
            }).render().$el);
        }
    });

    //
    // participantsview. Subview of freetimeview to show participants
    //

    return DisposableView.extend({
        className: 'freetime-participants-view',
        initialize: function () {
            this.pointHeader = pointHeader;
            this.pointBody = pointBody;
            this.headerNodeRow = $('<div class="freetime-participants-view-header row2">');
            this.bodyNode = $('<div class="freetime-participants-view-body scrollpane">');
        },

        renderHeader: function () {
            var baton = new ext.Baton({ view: this, model: this.model });
            this.headerNodeRow.empty();
            this.pointHeader.invoke('draw', this.headerNodeRow, baton);
        },

        renderBody: function () {
            var baton = new ext.Baton({ view: this, model: this.model });
            this.bodyNode.empty();
            this.pointBody.invoke('draw', this.bodyNode, baton);
        }
    });
});
