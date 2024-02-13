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

define('io.ox/participants/chronos-detail', [
    'io.ox/calendar/util',
    'io.ox/core/extensions',
    'io.ox/contacts/util',
    'io.ox/calendar/util',
    'io.ox/mail/util',
    'io.ox/core/util',
    'gettext!io.ox/core',
    'settings!io.ox/calendar',
    'less!io.ox/participants/style'
], function (util, ext, contactsUtil, calendarUtil, mailUtil, coreUtil, gt, settings) {

    'use strict';

    //used to display participants in calendar detail views when chronos api is used

    ext.point('io.ox/participants/chronos/item').extend({
        index: 100,
        id: 'resource',
        draw: function (baton) {
            var data = baton.data,
                name = calendarUtil.getAttendeeName(data);
            if (data.cuType !== 'RESOURCE') return;
            if (!baton.options.halo) return this.append($.txt(name));
            if (data.resource) data = data.resource;
            baton.flexWrapper.append(
                $('<a href="#" role="button" class="halo-resource-link">')
                    .attr('title', data.display_name || name)
                    // 'looksLikeResource' duck check
                    .data(_.extend(data, { email1: data.mailaddress || data.email }))
                    .append($.txt(data.display_name || name))
            );
        }
    });

    ext.point('io.ox/participants/chronos/item').extend({
        index: 200,
        id: 'person',
        draw: function (baton) {
            if (baton.data.cuType === 'RESOURCE') return;

            var display_name, html, opt;
            display_name = mailUtil.getDisplayName([calendarUtil.getAttendeeName(baton.data), baton.data.email], { showMailAddress: true });
            html = baton.data.full_name ? $(baton.data.full_name) : $.txt(display_name);
            opt = _.extend({ html: html }, baton.data);

            if (!baton.options.halo) opt.$el = $('<span>');
            if (baton.data.entity) opt.user_id = baton.data.entity;

            baton.flexWrapper.append(
                coreUtil.renderPersonalName(opt, baton.data)
            );
        }
    });

    ext.point('io.ox/participants/chronos/item').extend({
        index: 300,
        id: 'status',
        draw: function (baton) {
            var data = baton.data,
                confirm = baton.data.cuType !== 'RESOURCE' ? util.getConfirmationSymbol(data.partStat) : '',
                comment = baton.data.cuType !== 'RESOURCE' ? data.comment : undefined,
                statusClass = util.getConfirmationClass(data.partStat);

            baton.flexWrapper.children().first()
                .addClass(statusClass)
                .addClass(baton.data.cuType === 'RESOURCE' ? '' : 'person');

            baton.flexWrapper.append(
                // pause for screenreader
                !baton.data.isResource ? $('<span class="sr-only">').text(', ' + util.getConfirmationLabel(data.partStat) + '.') : '',
                // has confirmation icon?
                confirm ? $('<span class="status" aria-hidden="true">').addClass(statusClass).append(confirm) : ''
            );
            if (baton.appointment.get('attendees').length > 1 && isOrganizer(baton)) {
                baton.flexWrapper.append($('<span class="organizer-container">').text('(' + gt('Organizer') + ')'));
            }
            this.append(
                // has confirmation comment?
                comment ? $('<div class="comment">').text(comment) : ''
            );
        }
    });

    function isOrganizer(baton) {
        var appointment = baton.appointment.toJSON();
        if (!appointment.organizer || !(appointment.organizer.entity || appointment.organizer.email)) return false;
        return baton.data.entity ? baton.data.entity === appointment.organizer.entity : baton.data.email === appointment.organizer.email;
    }

    function drawParticipant(obj, appointment, options) {
        options = _.extend({
            halo: true
        }, options);

        // initialize vars
        var flexWrapper = $('<div class="flex-wrapper" >'),
            node = $('<li class="participant">').append(flexWrapper);

        var baton = new ext.Baton({ data: obj, options: options, appointment: appointment, flexWrapper: flexWrapper });
        ext.point('io.ox/participants/chronos/item').invoke('draw', node, baton);

        return node;
    }

    function filterParticipants(e) {
        e.preventDefault();
        if ($(this).parent().hasClass('active')) {
            $(this).attr('aria-pressed', false);
            $('.active', e.data.participantsContainer).removeClass('active');
            $('.participant', e.data.participantsContainer).show();
        } else {
            $('.participant', e.data.participantsContainer)
                .show()
                .find('a.person:not(.' + e.data.res.css + ')')
                .parent()
                .parent()
                .toggle();
            $('.active', e.data.participantsContainer).removeClass('active');
            $(this).attr('aria-pressed', true).parent().addClass('active');
        }
    }

    function ParticipantsView(baton, options) {

        options = _.extend({
            //show summary
            summary: true,
            //no inline links (provide extensionpoint id here to make them show)
            inlineLinks: false,
            //halo views
            halo: true,
            // external participants and users in the same list or not
            separateLists: settings.get('separateExternalParticipantList', false)
        }, options);

        this.draw = function () {

            var list = baton.model.get('attendees') || [],
                participantsContainer = list.length ? $('<div class="participants-view">') : $();

            if (list.length) {
                participantsContainer.busy();
                // get users
                var users = _(list)
                    .filter(function (obj) {
                        return (!obj.cuType || obj.cuType === 'INDIVIDUAL') && (!options.separateLists || obj.entity);
                    });
                // get external
                var external = _(list)
                    .filter(function (obj) {
                        return options.separateLists && (!obj.cuType || obj.cuType === 'INDIVIDUAL') && !obj.entity;
                    });
                // get resources
                var resources = _(list)
                    .filter(function (obj) {
                        return obj.cuType === 'RESOURCE';
                    });

                // loop over persons
                var participantListNode;
                if (users.length) {
                    participantsContainer.append(
                        $('<fieldset>').append(
                            $('<legend class="io-ox-label">').append(
                                $('<h2>').text(gt('Participants'))
                            ),
                            participantListNode = $('<ul class="participant-list list-inline">')
                        )
                    );
                }

                // users
                _(users)
                    .chain()
                    .map(function (obj) {
                        if (obj.contact) {
                            obj.full_name = contactsUtil.getFullName(obj.contact, true);
                            obj.sort_name = obj.contact.last_name || obj.contact.first_name || obj.contact.display_name || '';
                        } else {
                            obj.sort_name = obj.cn;
                        }
                        return obj;
                    })
                    .sortBy(function (obj) {
                        return obj.sort_name;
                    })
                    .each(function (obj) {
                        if (isOrganizer({ data: obj, appointment: baton.model })) {
                            participantListNode.prepend(drawParticipant(obj, baton.model, options));
                            return;
                        }
                        participantListNode.append(drawParticipant(obj, baton.model, options));
                    });

                //external Participants get their own section
                var extList;
                if (external.length > 0) {
                    participantsContainer.append(
                        $('<fieldset>').append(
                            $('<legend class="io-ox-label">').append(
                                $('<h2>').text(gt('External participants'))
                            ),
                            extList = $('<ul class="participant-list list-inline">')
                        )
                    );
                }

                // loop over external participants
                _(external).each(function (obj) {
                    extList.append(drawParticipant(obj, baton.model, options));
                });
                // resources
                if (resources.length) {
                    var plist;
                    participantsContainer.append(
                        $('<fieldset>').append(
                            $('<legend class="io-ox-label">').append(
                                $('<h2>').text(gt('Resources'))
                            ),
                            plist = $('<ul class="participant-list list-inline">')
                        )
                    );
                    // loop over resources
                    _(resources)
                        .chain()
                        .sortBy(function (obj) {
                            return obj.display_name;
                        })
                        .each(function (obj) {
                            plist.append(drawParticipant(obj, baton.model, options));
                        });
                }

                // add summary
                var sumData = util.getConfirmationSummary(list, { chronos: true });
                if (options.summary && sumData.count > 3) {
                    participantsContainer.find('legend').first().append(
                        $('<ul class="summary list-inline pull-right">').attr('aria-label', gt('Summary')).append(
                            _.map(sumData, function (res) {
                                if (!_.isNumber(res.count) || res.count <= 0) return;

                                return $('<li>').append(
                                    $('<a href="#" role="button" aria-pressed="false">').text(res.count).attr('aria-label', res.title + ' ' + res.count).prepend(
                                        $('<span class="status">').addClass(res.css).append(res.icon)
                                    )
                                    .on('click', { participantContainer: participantsContainer, res: res }, filterParticipants)
                                );
                            })
                        )
                    );
                }

                // draw action links if extension point is provided
                if (options.inlineLinks) ext.point(options.inlineLinks).invoke('draw', participantsContainer, baton);

                // finish
                participantsContainer.idle();
            }

            return participantsContainer;
        };
    }

    return ParticipantsView;
});
