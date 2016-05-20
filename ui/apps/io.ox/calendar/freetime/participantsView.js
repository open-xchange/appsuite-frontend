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
    'io.ox/participants/views',
    'io.ox/core/extensions',
    'io.ox/backbone/disposable',
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
                collection: baton.model.get('participants')
            });
            this.append(
                typeahead.$el,
                $('<legend>').text(gt('Participants')).attr('aria-hidden', true)
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
                collection: baton.model.get('participants'),
                baton: baton,
                entryClass: 'col-xs-12 col-sm-12',
                labelClass: 'sr-only',
                halo: false

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
            this.headerNode = $('<div class="freetime-participants-view-header">');
            this.bodyNode = $('<div class="freetime-participants-view-body">');
        },

        renderHeader: function () {
            var baton = new ext.Baton({ view: this, model: this.model });
            this.headerNode.empty();
            this.pointHeader.invoke('draw', this.headerNode, baton);
        },

        renderBody: function () {
            var baton = new ext.Baton({ view: this, model: this.model });
            this.bodyNode.empty();
            this.pointBody.invoke('draw', this.bodyNode, baton);
        }
    });
});
