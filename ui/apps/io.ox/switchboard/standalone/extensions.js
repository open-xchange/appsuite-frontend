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

define('io.ox/switchboard/standalone/extensions', [
    'io.ox/backbone/views/actions/util',
    'io.ox/contacts/api',
    'io.ox/contacts/model',
    'io.ox/core/capabilities',
    'io.ox/core/extensions',
    'io.ox/switchboard/standalone/api',
    'io.ox/switchboard/views/conference-select',
    'gettext!io.ox/switchboard'
], function (
    actionsUtil, contactsAPI, contactsModel, capabilities, ext, api,
    ConferenceSelectView, gt
) {

    'use strict';

    if (_.device('smartphone')) return;

    require(['less!io.ox/switchboard/style']);

    var util = {
        createButton: function (action, icon, label, baton) {
            // do not change the initial baton as it is reused
            baton = baton.clone();
            baton.data = [].concat(baton.data);
            var $button = $('<button type="button" class="btn btn-link">')
                .prop('disabled', true)
                .on('click', { baton: baton }, function (e) {
                    actionsUtil.invoke(action, e.data.baton);
                })
                .append(
                    $('<div class="icon-container">').append($.icon(icon)),
                    $.txt(label)
                );
            actionsUtil.checkAction(action, baton).then(function () {
                $button.prop('disabled', false);
            });
            return $button;
        }
    };

    /*TODO*/
    // no presence state for anonymous guests (check if they are allowed to edit their contact/user data to distinguish between invited by mail or anonymous link)
    //if (capabilities.has('guest') && settings.get('user/internalUserEdit', true) === false) return util;

    // add to contact detail view
    ext.point('io.ox/contacts/detail/summary').extend({
        index: 400,
        id: 'actions',
        draw: function (baton) {
            if (contactsAPI.looksLikeResource(baton.data)) return;

            var $actions = $('<div class="action-button-rounded">');
            ext.point('io.ox/contacts/detail/actions').invoke('draw', $actions, baton.clone());
            if ($actions.is(':empty')) return;

            this.append($actions);
        }
    });

    ext.point('io.ox/contacts/detail/actions').extend(
        {
            id: 'email',
            index: 100,
            draw: function (baton) {
                if (!capabilities.has('webmail')) return;
                this.append(
                    util.createButton('io.ox/contacts/actions/send', 'fa-envelope', gt('Email'), baton)
                );
            }
        },
        {
            id: 'call',
            index: 300,
            draw: function (baton) {
                var $ul = $('<ul class="dropdown-menu">');
                ext.point('io.ox/contacts/detail/actions/call').invoke('draw', $ul, baton.clone());
                // check only for visible items (not dividers, etc)
                var hasOptions = $ul.children('[role="presentation"]').length > 0;
                this.append(
                    $('<div class="dropdown">').append(
                        $('<button type="button" class="btn btn-link" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">')
                        .prop('disabled', !hasOptions)
                        .append(
                            $('<div class="icon-container">').append($.icon('fa-phone', false, 'call-icon')),
                            $.txt(gt.pgettext('verb', 'Call')),
                            hasOptions ? $('<i class="fa fa-caret-down" aria-hidden="true">') : $()
                        ),
                        $ul
                    )
                );
            }
        },
        {
            id: 'invite',
            index: 400,
            draw: function (baton) {
                if (!capabilities.has('calendar')) return;
                this.append(
                    util.createButton('io.ox/contacts/actions/invite', 'fa-calendar-plus-o', gt('Invite'), baton)
                );
            }
        }
    );

    var phoneFields = [
        'telephone_company', 'telephone_business1', 'telephone_business2',
        'cellular_telephone1', 'cellular_telephone2',
        'telephone_home1', 'telephone_home2', 'telephone_other'
    ];

    ext.point('io.ox/contacts/detail/actions/call').extend(
        {
            id: 'phone',
            index: 300,
            draw: function (baton) {
                var numbers = phoneFields.map(function (field) {
                    var number = baton.data[field];
                    if (!number) return $();
                    return $('<li role="presentation">').append(
                        $('<a>').attr('href', 'callto:' + number).append(
                            $('<small>').text(contactsModel.fields[field]),
                            $('<br>'),
                            $.txt(number)
                        )
                    );
                });
                if (!numbers.length) return;
                this.append(
                    $('<li class="divider" role="separator">'),
                    numbers
                );
            }
        }
    );

    // add to contact detail view
    ext.point('io.ox/calendar/detail').extend({
        after: 'location',
        id: 'join',
        draw: function (baton) {
            // TODO: Split this for compability with pure location and real conference
            // conference field should also be printed in the view
            var match = [], conference = api.getConference(baton.data.conferences), title;
            if (conference) {
                match.push(conference.joinURL);
                title = getTitle(conference);
            } else {
                match = String(baton.data.location).match(/(https:\/\/.*?\.zoom\.us\S+)/i);
                title = gt('Join Zoom meeting');
            }
            if (!match) return;
            this.append(
                $('<div class="action-button-rounded horizontal">').append(
                    // Call
                    $('<button type="button" class="btn btn-link" data-action="join">')
                        .append(
                            $('<div class="icon-container">').append($.icon('fa-phone')),
                            $('<div>').text(title)
                        )
                        .on('click', function () {
                            window.open(match[0]);
                        })
                )
            );
            // avoid actions
            baton.disable('io.ox/calendar/detail', 'actions');

            function getTitle(conference) {
                var point = ext.point('io.ox/calendar/conference-solutions'),
                    solution = point.get(conference.type);
                return solution && solution.joinLabel || gt('Join conference call');
            }
        }
    });

    // edit appointment
    ext.point('io.ox/calendar/edit/section').extend({
        id: 'conference',
        before: 'location',
        draw: function (baton) {
            var point = ext.point('io.ox/calendar/conference-solutions');
            if (point.list().length <= 1) return;
            new ConferenceSelectView({ el: this, appointment: baton.model, point: point }).render();
        }
    });

    api.on('addSolution', function () {
        // move location to later position
        ext.point('io.ox/calendar/edit/section').replace({ id: 'location', index: 750 });
    });

    ext.point('io.ox/calendar/conference-solutions')
        .extend({ id: 'none', index: 100, value: 'none', label: gt('None') });

    return util;
});
