/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/participants/detail', [
    'io.ox/calendar/util',
    'io.ox/core/api/user',
    'io.ox/core/api/group',
    'io.ox/core/api/resource',
    'io.ox/core/extensions',
    'io.ox/contacts/util',
    'io.ox/mail/util',
    'io.ox/core/util',
    'gettext!io.ox/core',
    'less!io.ox/participants/style'
], function (util, userAPI, groupAPI, resourceAPI, ext, contactsUtil, mailUtil, coreUtil, gt) {

    'use strict';

    //used to display participants in task and calendar detail views

    ext.point('io.ox/participants/item').extend({
        index: 100,
        id: 'resource',
        draw: function (baton) {
            var data = baton.data;
            if (!data.isResource) return;
            if (!baton.options.halo) return this.append($.txt(data.name));

            this.append(
                $('<a href="#" role="button" class="halo-resource-link">')
                    .attr('title', data.name)
                    // use obj for the 'looksLikeResource' duck check
                    .data(_.extend(baton.obj, { email1: data.email }))
                    .append($.txt(data.name))
            );
        }
    });

    ext.point('io.ox/participants/item').extend({
        index: 200,
        id: 'person',
        draw: function (baton) {
            if (baton.data.isResource) return;

            var data = baton.data,
                display_name = mailUtil.getDisplayName([data.name, data.email], { showMailAddress: true }),
                html = baton.obj.full_name ? $(baton.obj.full_name) : $.txt(display_name),
                opt = _.extend({ html: html }, data);

            if (!baton.options.halo) opt.$el = $('<span>');

            this.append(
                coreUtil.renderPersonalName(opt, baton.obj)
            );
        }
    });

    ext.point('io.ox/participants/item').extend({
        index: 300,
        id: 'status',
        draw: function (baton) {
            var conf = baton.conf,
                confirm = util.getConfirmationSymbol(conf.status),
                comment = conf.comment || conf.message || '',
                statusClass = util.getConfirmationClass(conf.status);

            this.children().first()
                .addClass(statusClass)
                .addClass(baton.data.isResource ? '' : 'person');

            this.append(
                // pause for screenreader
                !baton.data.isResource ? $('<span class="sr-only">').text(', ' + util.getConfirmationLabel(conf.status) + '.') : '',
                // has confirmation icon?
                confirm ? $('<span class="status" aria-hidden="true">').addClass(statusClass).append(confirm) : '',
                // has confirmation comment?
                comment ? $('<div class="comment">').text(comment) : ''
            );
        }
    });

    function drawParticipant(obj, hash, options) {
        options = _.extend({
            halo: true
        }, options);

        // initialize vars
        var key = obj.mail || obj.id,
            conf = hash[key] || { status: 0, comment: '' },
            node = $('<li class="participant">');

        // harmonize
        var data = {
            name: obj.display_name,
            email: obj.mail || obj.mailaddress || obj.email1,
            user_id: obj.user_id || obj.internal_userid,
            isResource: 'mailaddress' in obj && 'description' in obj
        };

        var baton = new ext.Baton({ obj: obj, data: data, conf: conf, options: options });
        ext.point('io.ox/participants/item').invoke('draw', node, baton);

        return node;
    }

    function filterParticipants(e) {
        e.preventDefault();
        if ($(this).parent().hasClass('active')) {
            $(this).attr('aria-pressed', false);
            $('.active', e.data.participants).removeClass('active');
            $('.participant', e.data.participants).show();
        } else {
            $('.participant', e.data.participants)
                .show()
                .find('a.person:not(.' + e.data.res.css + ')')
                .parent()
                .toggle();
            $('.active', e.data.participants).removeClass('active');
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
            halo: true
        }, options);

        this.draw = function () {
            //make it usable with or without model
            var changedBaton = false;
            if (!baton.data) {
                baton.data = baton.model.attributes;
                changedBaton = true;
            }

            var list = baton.data.participants || {},
                $i = list.length,
                MIN = 0,
                participants = $i > MIN ? $('<div class="participants-view">') : $(),
                confirmations = {};

            // has participants? should always be true for appointments. Was $i > 1 (see bug #23295).
            if ($i > MIN) {
                participants.busy();

                // get internal users
                var users = _(list)
                    .chain()
                    .select(function (obj) {
                        return obj.type === 1;
                    })
                    .map(function (obj) {
                        return obj.id;
                    })
                    .value();
                // get user groups
                var groups = _(list)
                    .chain()
                    .select(function (obj) {
                        return obj.type === 2;
                    })
                    .map(function (obj) {
                        return { id: obj.id };
                    })
                    .value();
                // get resources
                var resources = _(list)
                    .chain()
                    .select(function (obj) {
                        return obj.type === 3;
                    })
                    .map(function (obj) {
                        return { id: obj.id };
                    })
                    .value();
                // get external participants
                var external = _(list)
                    .chain()
                    .select(function (obj) {
                        return obj.type === 5;
                    })
                    .sortBy(function (obj) {
                        return obj.mail;
                    })
                    .value();

                if (baton.data.confirmations === undefined || baton.data.confirmations.length === 0) {
                    //workaround for tasks
                    confirmations = util.getConfirmations({ users: baton.data.users, confirmations: external });
                } else {
                    confirmations = util.getConfirmations(baton.data);
                }

                $.when(userAPI.getList(users), groupAPI.getList(groups), resourceAPI.getList(resources))
                .done(function (userList, groupList, resourceList) {
                    // loop over internal users
                    var intList;
                    if (userList.length > 0) {
                        participants.append(
                            $('<fieldset>').append(
                                $('<legend class="io-ox-label">').append(
                                    $('<h2>').text(gt('Participants'))
                                ),
                                intList = $('<ul class="participant-list list-inline">')
                            )
                        );
                    }
                    _(userList)
                        .chain()
                        .map(function (obj) {
                            obj.full_name = contactsUtil.getFullName(obj, true);
                            obj.sort_name = obj.last_name || obj.first_name || obj.display_name || '';
                            return obj;
                        })
                        .sortBy(function (obj) {
                            return obj.sort_name;
                        })
                        .each(function (obj) {
                            intList.append(drawParticipant(obj, confirmations, options));
                        });

                    //external Participants get their own section
                    var extList;
                    if (external.length > 0) {
                        participants.append(
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
                        extList.append(drawParticipant(obj, confirmations, options));
                    });

                    // loop over groups
                    _(groupList)
                        .chain()
                        .sortBy(function (obj) {
                            return obj.display_name;
                        })
                        .each(function (obj) {
                            var glist, memberList;
                            // resolve group members (remove internal users first)
                            memberList = _(obj.members).difference(users);
                            // remove group members that are not part of "users" array
                            // (some might have been removed from the appointment)
                            // see bug 42204
                            if (_.isArray(baton.data.users)) {
                                memberList = _(memberList).intersection(_(baton.data.users).pluck('id'));
                            }
                            if (memberList.length) {
                                // new section
                                participants.append(
                                    $('<fieldset>').append(
                                        $('<legend class="group io-ox-label">').append(
                                            $('<h2>').text(obj.display_name + ':')
                                        ),
                                        glist = $('<ul class="participant-list list-inline">')
                                    )
                                );

                                userAPI.getList(memberList)
                                    .done(function (members) {
                                        // loop members
                                        _(members)
                                            .chain()
                                            .map(function (obj) {
                                                obj.full_name = contactsUtil.getFullName(obj, true);
                                                obj.sort_name = obj.last_name || obj.first_name || obj.display_name || '';
                                                return obj;
                                            })
                                            .sortBy(function (obj) {
                                                return obj.sort_name;
                                            })
                                            .each(function (obj) {
                                                glist.append(drawParticipant(obj, confirmations));
                                            });
                                    });
                            }
                        });
                    // resources
                    if (resourceList.length) {
                        var plist;
                        participants.append(
                            $('<fieldset>').append(
                                $('<legend class="io-ox-label">').append(
                                    $('<h2>').text(gt('Resources'))
                                ),
                                plist = $('<ul class="participant-list list-inline">')
                            )
                        );
                        // loop over resources
                        _(resourceList)
                            .chain()
                            .sortBy(function (obj) {
                                return obj.display_name;
                            })
                            .each(function (obj) {
                                plist.append(drawParticipant(obj, confirmations, options));
                            });
                    }
                })
                .always(function () {
                    // add summary
                    var sumData = util.getConfirmationSummary(confirmations);
                    if (options.summary && sumData.count > 3) {
                        participants.find('legend').first().append(
                            $('<ul class="summary list-inline pull-right">').attr('aria-label', gt('Summary')).append(
                                _.map(sumData, function (res) {
                                    if (!_.isNumber(res.count) || res.count <= 0) return;

                                    return $('<li>').append(
                                        $('<a href="#" role="button" aria-pressed="false">').text(res.count).attr('aria-label', res.title + ' ' + res.count).prepend(
                                            $('<span class="status">').addClass(res.css).append(res.icon)
                                        )
                                        .on('click', { participants: participants, res: res }, filterParticipants)
                                    );
                                })
                            )
                        );
                    }

                    //remove temporary changes
                    if (changedBaton) delete baton.data;

                    // draw action links if extension point is provided
                    if (options.inlineLinks) ext.point(options.inlineLinks).invoke('draw', participants, baton);

                    // finish
                    participants.idle();
                });
            }

            return participants;
        };
    }

    return ParticipantsView;
});
