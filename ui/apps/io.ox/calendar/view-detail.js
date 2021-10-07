/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/calendar/view-detail', [
    'io.ox/core/extensions',
    'io.ox/calendar/common-extensions',
    'io.ox/calendar/util',
    'io.ox/calendar/api',
    'io.ox/core/tk/attachments',
    'io.ox/participants/chronos-detail',
    'io.ox/backbone/views/toolbar',
    'gettext!io.ox/calendar',
    'io.ox/calendar/model',
    'io.ox/calendar/actions',
    'less!io.ox/calendar/style'
], function (ext, extensions, util, calAPI, attachments, ParticipantsView, ToolbarView, gt, ChronosModel) {

    'use strict';

    // draw via extension points

    ext.point('io.ox/calendar/detail').extend({
        index: 100,
        id: 'inline-actions',
        draw: function (baton, options) {
            // if this is opened via invitation mail we dont show actions, event might not be created etc
            if (options.hideToolbar) return;
            this.append(
                new ToolbarView({ point: 'io.ox/calendar/links/inline', inline: true })
                .setSelection(baton.array(), { data: baton.array(), model: baton.model })
                .$el
            );
        }
    });

    ext.point('io.ox/calendar/detail').extend({
        index: 120,
        id: 'cancel notification',
        draw: function (baton) {
            if (util.getStatusClass(baton.model) !== 'cancelled') return;
            this.append($('<p class="alert alert-info cancel-warning" role="alert">').text(gt('This appointment was cancelled.')));
        }
    });

    // draw private flag
    ext.point('io.ox/calendar/detail').extend({
        index: 150,
        id: 'private-flag',
        draw: extensions.privateFlag
    });

    // draw title
    ext.point('io.ox/calendar/detail').extend({
        index: 200,
        id: 'title',
        draw: extensions.h1
    });

    // draw appointment date & time
    ext.point('io.ox/calendar/detail').extend({
        index: 300,
        id: 'date-time',
        draw: function (baton, options) {
            var node = $('<div class="date-time-recurrence">');
            ext.point('io.ox/calendar/detail/date').invoke('draw', node, baton, _.extend({ zone: moment().tz() }, options));
            ext.point('io.ox/calendar/detail/icons').invoke('draw', node.find('.date-time'), baton);
            this.append(node);
        }
    });

    // draw icons
    ext.point('io.ox/calendar/detail/icons').extend({
        index: 100,
        id: 'additional-flags',
        draw: extensions.additionalFlags
    });

    // draw date and recurrence information
    ext.point('io.ox/calendar/detail/date').extend(
        {
            index: 100,
            id: 'date',
            draw: extensions.date
        },
        {
            index: 200,
            id: 'recurrence',
            draw: function (baton) {
                var draw = _.bind(function (recurrenceMaster) {
                    if (recurrenceMaster) baton.recurrenceMaster = recurrenceMaster;
                    extensions.recurrence.call(this, baton);
                }, this);

                // get recurrenceMaster for exceptions too if the exception was not moved (just a simple check if the start date is still the same), to show some additional info like rrules etc.
                if (util.hasFlag(baton.model, 'overridden') && moment(_((baton.model.get('recurrenceId') || '').split(':')).last()).valueOf() === util.getMoment(baton.model.get('startDate')).valueOf()) {
                    calAPI.get({ id: baton.model.get('seriesId'), folder: baton.model.get('folder') }).then(draw, function () { draw(); });
                    return;
                }

                draw();
            }
        }
    );

    ext.point('io.ox/calendar/detail').extend({
        index: 400,
        id: 'location',
        draw: extensions.locationDetail
    });

    ext.point('io.ox/calendar/detail').extend({
        index: 450,
        id: 'recurrence-warning',
        draw: function (baton) {
            // not an exception? return
            if (!(baton.data.recurrenceId && baton.data.id !== baton.data.seriesId)) return;

            // additional information provided and info should be shown? Note: We dont want to show this all the time. it's just too annoying
            if (baton.updateData && baton.updateData.showRecurrenceInfo) {
                this.append($('<p class="alert alert-info recurrence-warning" role="alert">').text(gt('This appointment is an exception. Changing the exception does not affect the series.')));
            }
        }
    });

    ext.point('io.ox/calendar/detail').extend({
        index: 500,
        id: 'note',
        draw: extensions.note
    });

    ext.point('io.ox/calendar/detail').extend({
        index: 600,
        id: 'participants',
        draw: function (baton) {
            var pView = new ParticipantsView(baton, { summary: true });
            this.append(pView.draw());
        }
    });

    // draw details
    ext.point('io.ox/calendar/detail').extend({
        index: 800,
        id: 'details',
        draw: extensions.detail
    });

    // organizer
    ext.point('io.ox/calendar/detail/details').extend({
        index: 100,
        id: 'organizer',
        draw: extensions.organizer
    });

    // sentby
    ext.point('io.ox/calendar/detail/details').extend({
        index: 150,
        id: 'sentby',
        draw: extensions.sentBy
    });

    // show as
    ext.point('io.ox/calendar/detail/details').extend({
        index: 200,
        id: 'shownAs',
        draw: extensions.shownAs
    });

    // folder
    ext.point('io.ox/calendar/detail/details').extend({
        index: 300,
        id: 'folder',
        draw: extensions.folder
    });

    //used to show deep link when outside calendar app (search, portal)
    ext.point('io.ox/calendar/detail/details').extend({
        index: 350,
        id: 'deeplink',
        draw: function (baton, options) {
            //stolen from io.ox/mail/detail/links: processDeepLinks
            if (!options || !options.deeplink) return;
            var url = util.getDeepLink(baton.data);
            this.append(
                $('<tr>').append(
                    $('<th class="detail-label">').text(gt('Direct link')),
                    $('<td class="detail">').attr('style', 'font-size: 12px;').append(
                        $('<a target="_blank" role="button" class="deep-link btn btn-primary btn-xs">')
                            .attr('href', url).text(gt('Appointment'))
                            .on('click', { baton: baton }, openDeeplink)
                    )
                )
            );
        }
    });

    function openDeeplink(e) {
        e.preventDefault();

        var baton = e.data.baton;
        util.openDeeplink(baton.model);
    }

    // created on/by
    ext.point('io.ox/calendar/detail/details').extend({
        index: 400,
        id: 'created',
        draw: extensions.created
    });

    // modified on/by
    ext.point('io.ox/calendar/detail/details').extend({
        index: 500,
        id: 'modified',
        draw: extensions.modified
    });

    ext.point('io.ox/calendar/detail').extend({
        id: 'attachments',
        index: 550,
        draw: function (baton) {
            var $node = $('<fieldset class="attachments">').append(
                $('<legend class="io-ox-label">').append(
                    $('<h2>').text(gt('Attachments'))
                )
            );

            if (baton.data.attachments && baton.data.attachments.length) {
                this.append($node);
                ext.point('io.ox/calendar/detail/attachments').invoke('draw', $node, baton);
            }
        }
    });

    ext.point('io.ox/calendar/detail/attachments').extend(new attachments.AttachmentList({
        id: 'attachment-list',
        index: 200,
        module: 1,
        selector: '.window-container.io-ox-calendar-window'
    }));

    function redraw(e, baton) {
        $(this).replaceWith(e.data.view.draw(baton));
    }

    return {

        draw: function (baton, options) {
            // make sure that you can enter a model directly
            if (baton instanceof Backbone.Model) baton = new ext.Baton({ model: baton });

            // make sure we have a baton
            baton = ext.Baton.ensure(baton);

            // if we only have one create the other
            if (baton.data && _.isEmpty(baton.model)) baton.model = new ChronosModel.Model(baton.data);
            if (baton.model && _.isEmpty(baton.data)) baton.data = baton.model.toJSON();

            options = _.extend({ minimaldata: !baton.data.folder }, options);
            if (_.device('smartphone') && !options.deeplink) {
                baton.disable('io.ox/calendar/detail', 'inline-actions');
            }
            try {
                var node = $.createViewContainer(baton, calAPI, calAPI.get, { cidGetter: calAPI.cid }).on('redraw', { view: this }, redraw);
                node.addClass('calendar-detail view user-select-text ' + util.getStatusClass(baton.data)).attr('data-cid', String(util.cid(baton.data)));
                ext.point('io.ox/calendar/detail').invoke('draw', node, baton, options);
                return node;

            } catch (e) {
                console.error('io.ox/calendar/view-detail:draw()', e);
            }
        }
    };
});
