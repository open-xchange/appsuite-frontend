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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/calendar/common-extensions', [
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'io.ox/core/api/user',
    'io.ox/core/util',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar'
], function (ext, folderAPI, userAPI, coreUtil, util, gt) {

    'use strict';

    function getTitle(baton) {
        return _.isUndefined(baton.data.title) ? gt('Private') : (baton.data.title || '\u00A0');
    }

    var extensions = {

        title: function (baton) {
            this.append($('<div class="title">').text(getTitle(baton)));
        },

        h1: function (baton) {
            this.append($('<h1 class="subject clear-title">').text(getTitle(baton)));
        },

        h2: function (baton) {
            this.append($('<h2 class="subject">').text(getTitle(baton)));
        },

        interval: function (baton) {
            var tmp = $('<div>');
            ext.point('io.ox/calendar/detail/date').invoke('draw', tmp, baton);
            this.append(
                $('<span class="interval">').append(tmp.find('.interval').html())
            );
        },

        day: function (baton) {
            var tmp = $('<div>');
            ext.point('io.ox/calendar/detail/date').invoke('draw', tmp, baton);
            this.append(
                $('<span class="day">').append(tmp.find('.day').html())
            );
        },

        location: function (baton) {
            this.append(
                $('<span class="location">').text(baton.data.location)
            );
        },

        locationDetail: function (baton) {
            if (!baton.data.location) return;

            this.append(
                $('<div class="location">').text(baton.data.location)
            );
        },

        time: function (baton) {
            this.append(
                $('<div class="time">').text(util.getTimeInterval(baton.data))
            );
        },

        dateSimple: function (baton) {
            this.append(
                $('<div class="date">').text(util.getDateInterval(baton.data))
            );
        },

        datetime: function (baton) {
            this.append(
                $('<div class="date-time">').append(
                    $('<span class="date">').text(util.getDateInterval(baton.data)),
                    $('<span class="time">').text(util.getTimeInterval(baton.data))
                )
            );
        },

        date: function (baton, options) {
            this.append(
                util.getDateTimeIntervalMarkup(baton.data, options)
            );
        },

        recurrence: function (baton) {
            var recurrenceString = util.getRecurrenceString(baton.data);
            if (recurrenceString === '') return;
            this.append(
                $('<div class="recurrence">').text(recurrenceString)
            );
        },

        privateFlag: function (baton) {
            if (!baton.data.private_flag) return;
            this.append(
                $('<i class="fa fa-lock private-flag" aria-hidden="true" data-animation="false">')
                    .attr('title', gt('Private'))
                    .tooltip(),
                $('<span class="sr-only">').text(gt('Private'))
            );
        },

        note: function (baton) {
            if (!baton.data.note) return;

            this.append(
                $('<div class="note">').html(util.getNote(baton.data))
            );
        },

        detail: function (baton, options) {

            // we don't show details for private appointments in shared/public folders (see bug 37971)
            var data = baton.data, folder = options.minimaldata ? {} : folderAPI.pool.getModel(data.folder_id);
            if (data.private_flag && data.created_by !== ox.user_id && !folderAPI.is('private', folder)) return;

            var node = $('<table class="details-table expandable-content">');
            ext.point('io.ox/calendar/detail/details').invoke('draw', node, baton, options);
            this.append(
                $('<fieldset class="details expandable">').append(
                    $('<legend class="io-ox-label">').append(
                        $('<a href="#" class="expandable-toggle" role="button" aria-expanded="false">').append(
                            $('<h2>').text(gt('Details'))
                        ),
                        $.txt(' '),
                        $('<i class="fa expandable-indicator" aria-hidden="true">')
                    ),
                    node
                ).addClass(options.minimaldata ? 'open' : '')
            );
        },

        organizer: function (baton) {

            // internal or external organizer?
            if (!baton.data.organizerId && !baton.data.organizer) return;

            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Organizer')),
                    $('<td class="detail organizer">').append(
                        coreUtil.renderPersonalName(
                            baton.data.organizerId ? {
                                $el: baton.organizerNode,
                                html: userAPI.getTextNode(baton.data.organizerId),
                                user_id: baton.data.organizerId
                            } : {
                                $el: baton.organizerNode,
                                name: baton.data.organizer,
                                email: baton.data.organizer
                            },
                            baton.data
                        )
                    )
                )
            );
        },

        noHalos: function () {
            this.find('*').removeClass('halo-link');
        },

        shownAs: function (baton) {
            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Shown as')),
                    $('<td>').append(
                        $('<i class="fa fa-square shown_as">').addClass(util.getShownAsClass(baton.data)),
                        $('<span class="detail shown-as">').text('\u00A0' + util.getShownAs(baton.data))
                    )
                )
            );
        },

        folder: function (baton) {
            if (!baton.data.folder_id) return;
            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Folder')),
                    $('<td>').attr('data-folder', baton.data.folder_id).append(folderAPI.getTextNode(baton.data.folder_id))
                )
            );
        },

        created: function (baton) {
            if (!baton.data.creation_date && !baton.data.created_by) return;
            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Created')),
                    $('<td class="created">').append(
                        baton.data.creation_date ? [
                            $('<span>').text(util.getDate(baton.data.creation_date)),
                            $('<span>').text(' \u2013 ')
                        ] : [],
                        baton.data.created_by ? coreUtil.renderPersonalName({
                            html: userAPI.getTextNode(baton.data.created_by),
                            user_id: baton.data.created_by
                        }, baton.data) : []
                    )
                )
            );
        },

        modified: function (baton) {
            if (!baton.data.last_modified && !baton.data.modified_by) return;
            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Modified')),
                    $('<td class="modified">').append(
                        baton.data.last_modified ? [
                            $('<span>').text(util.getDate(baton.data.last_modified)),
                            $('<span>').text(' \u2013 ')
                        ] : [],
                        baton.data.modified_by ? coreUtil.renderPersonalName({
                            html: userAPI.getTextNode(baton.data.modified_by),
                            user_id: baton.data.modified_by
                        }, baton.data) : []
                    )
                )
            );
        }

    };

    return extensions;
});
