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

define('io.ox/calendar/common-extensions', [
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'io.ox/core/api/user',
    'io.ox/core/util',
    'io.ox/calendar/util',
    'gettext!io.ox/calendar'
], function (ext, folderAPI, userAPI, coreUtil, util, gt) {

    'use strict';

    function getTitle(baton, options) {
        options = options || {};
        var data = baton.data.event || baton.data,
            result = _.isUndefined(data.summary) ? gt('Private') : (data.summary || '\u00A0');

        if (options.parse) {
            result = coreUtil.urlify(result);
        }

        return result;
    }

    var extensions = {

        h1: function (baton) {
            this.append($('<h1 class="subject clear-title">').append(getTitle(baton, { parse: true })));
        },

        h2: function (baton) {
            this.append($('<h2 class="subject">').text(getTitle(baton)));
        },

        locationDetail: function (baton) {
            if (!baton.data.location) return;

            this.append(
                $('<div class="location">').append(coreUtil.urlify(baton.data.location).replace(/\n/g, '<br>'))
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
            var data = baton.data.event || baton.data;
            this.append(
                util.getDateTimeIntervalMarkup(data, { zone: moment().tz(), noTimezoneLabel: true })
            );
        },

        date: function (baton, options) {
            this.append(
                util.getDateTimeIntervalMarkup(baton.data, options)
            );
        },

        recurrence: function (baton) {
            // userecurrenceMaster if available (is requested for series exceptions)
            var recurrenceString = util.getRecurrenceString(baton.recurrenceMaster || baton.model || baton.data);
            if (recurrenceString === '') return;
            this.append(
                $('<div class="recurrence">').text(recurrenceString)
            );
        },

        privateFlag: function (baton) {
            if (!util.isPrivate(baton.data)) return;
            //#. appointment flag: 'secret' does not show up for other users in any cases; 'private' may be shown to other users under certain conditions
            var label = util.isPrivate(baton.data, true) ? gt('Secret') : gt('Private'),
                icon = $('<i class="fa private-flag" aria-hidden="true" data-animation="false">');
            this.append(
                util.isPrivate(baton.data, true) ? icon.addClass('fa-user-circle') : icon.addClass('fa-lock')
                    //#.
                    .attr('title', label)
                    .tooltip(),
                $('<span class="sr-only">').text(label)
            );
        },

        additionalFlags: function (baton) {
            if (_.isEmpty(util.returnIconsByType(baton.data).property)) return;
            var node = $('<div class="flags">');
            this.append(
                node.append(util.returnIconsByType(baton.data).property)
            );
        },

        note: function (baton) {
            if (!baton.data.description) return;

            this.append(
                $('<div class="note">').html(util.getNote(baton.data))
            );
        },

        detail: function (baton, options) {

            // we don't show details for private appointments in shared/public folders (see bug 37971)
            var data = baton.data, folder = options.minimaldata ? {} : folderAPI.pool.getModel(data.folder);
            if (util.isPrivate(data) && (data.createdBy || {}).entity !== ox.user_id && !folderAPI.is('private', folder)) return;

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
            if (!baton.data.organizer) return;

            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Organizer')),
                    $('<td class="detail organizer">').append(
                        coreUtil.renderPersonalName(
                            {
                                $el: baton.organizerNode,
                                name: baton.data.organizer.cn,
                                email: baton.data.organizer.email,
                                user_id: baton.data.organizer.entity
                            },
                            _.extend({}, baton.data, { nohalo: baton.isConflictView })
                        )
                    )
                )
            );
        },

        sentBy: function (baton) {
            if (!baton.data.organizer || !baton.data.organizer.sentBy) return;

            var sentBy = baton.data.organizer.sentBy;
            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Sent by')),
                    $('<td class="detail sendby">').append(
                        coreUtil.renderPersonalName({
                            $el: baton.sendbyNode,
                            name: sentBy.cn,
                            email: sentBy.email,
                            user_id: sentBy.entity
                        }, _.extend({}, baton.data, { nohalo: baton.isConflictView }))
                    )
                )
            );
        },

        noHalos: function () {
            this.find('*').removeClass('halo-link');
        },

        shownAs: function (baton) {
            // only show when marked as free
            if (!util.hasFlag(baton.model || baton.data, 'transparent')) return;
            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Shown as')),
                    $('<td>').append(util.getShownAs(baton.model || baton.data)
                    )
                )
            );
        },

        folder: function (baton) {
            if (!baton.data.folder) return;
            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Calendar')),
                    $('<td>').attr('data-folder', baton.data.folder).append(folderAPI.getTextNode(baton.data.folder))
                )
            );
        },

        created: function (baton) {
            if (!baton.data.created && !baton.data.createdBy) return;
            var entity = (baton.data.createdBy || {}).entity,
                // if we don't have an entity, this might be an external creator (federated sharing etc)
                userData = baton.data.createdBy && !entity ? {
                    $el: $('<span>'),
                    name: baton.data.createdBy.cn,
                    email: baton.data.createdBy.email
                } : {
                    html: userAPI.getTextNode(entity),
                    user_id: entity
                };

            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Created')),
                    $('<td class="created">').append(
                        baton.data.created ? [
                            $('<span>').text(util.getDate(baton.data.created)),
                            $('<span>').text(' \u2013 ')
                        ] : [],
                        baton.data.createdBy ? coreUtil.renderPersonalName(userData, _.extend({}, baton.data, { nohalo: baton.isConflictView })) : []
                    )
                )
            );
        },

        modified: function (baton) {
            if (!baton.data.lastModified && !baton.data.modifiedBy) return;
            // if we don't have an entity, this might be an external creator (federated sharing etc)
            var userData = baton.data.modifiedBy && !baton.data.modifiedBy.entity ? {
                $el: $('<span>'),
                name: baton.data.modifiedBy.cn,
                email: baton.data.modifiedBy.email
            } : {
                html: userAPI.getTextNode(baton.data.modifiedBy.entity),
                user_id: baton.data.modifiedBy.entity
            };

            this.append(
                $('<tr>').append(
                    $('<th>').text(gt('Modified')),
                    $('<td class="modified">').append(
                        baton.data.lastModified ? [$('<span>').text(util.getDate(baton.data.lastModified))] : [],
                        baton.data.lastModified && baton.data.modifiedBy ? $('<span>').text(' \u2013 ') : [],
                        baton.data.modifiedBy ? coreUtil.renderPersonalName(userData, _.extend({}, baton.data, { nohalo: baton.isConflictView })) : []
                    )
                )
            );
        }

    };

    return extensions;
});
