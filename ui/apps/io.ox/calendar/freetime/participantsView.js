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
                collection: baton.model.get('attendees'),
                resources: true
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
