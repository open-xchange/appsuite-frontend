/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/calendar/participants',
    ['io.ox/calendar/util',
     'gettext!io.ox/calendar',
     'io.ox/core/api/user',
     'io.ox/core/api/group',
     'io.ox/core/api/resource',
     'io.ox/core/extensions',
     'io.ox/contacts/util',
     'io.ox/core/util'], function (util, gt, userAPI, groupAPI, resourceAPI, ext, contactsUtil, coreUtil) {

    'use strict';

    //used to display participants in task and calendar detail views

    // duck test
    function looksLikeResource(obj) {
        return 'mailaddress' in obj && 'description' in obj;
    }

    function drawParticipant(obj, hash) {
        // initialize vars
        var key = obj.mail || obj.id,
            conf = hash[key] || { status: 0, comment: '' },
            confirm = util.getConfirmationSymbol(conf.status),
            statusClass = util.getConfirmationClass(conf.status),
            isPerson = hash[key] || obj.folder_id,
            personClass = isPerson ? 'person' : '',
            text, display_name, name, node, name_lc,
            comment = conf.comment || conf.message || '',
            mail_lc = String(obj.mail || obj.mailaddress || '').toLowerCase();
        // external participant?
        if (obj.type === 5) {
            //remove id or we get autogenerated data instead of address book data in the halo view
            //ugly fix, possibly there is a better backend solution, but too many possible sideffects. Maybe this can be changed later
            delete obj.id;
            // beautify
            name_lc = String(obj.display_name).toLowerCase();
            if (name_lc === mail_lc) {
                name = display_name = mail_lc;
            } else {
                name = obj.display_name ? obj.display_name + ' <' + mail_lc + '>' : mail_lc;
                display_name = obj.display_name || mail_lc;
            }
            text= $.txt(name);
        } else {
            name = display_name = obj.full_name || obj.display_name || mail_lc;
            text = obj.full_name || $.txt(name);
        }

        var isResource = looksLikeResource(obj);
        node = $('<li class="participant">').addClass(isResource ? 'halo-resource-link' : 'halo-link');

        if (isResource) {
            node.append(
                $('<a href="#">').addClass(personClass + ' ' + statusClass).append(text)
            );
        } else {
            node.append(
                coreUtil.renderPersonalName({ email: mail_lc, html: text }, obj).addClass(personClass + ' ' + statusClass),
                // has confirmation icon?
                confirm !== '' ? $('<span>').addClass('status ' + statusClass).append(confirm) : '',
                // has confirmation comment?
                comment !== '' ? $('<div>').addClass('comment').text(gt.noI18n(conf.comment)) : ''
            );
        }

        node.data(_.extend(obj, { display_name: display_name, email1: mail_lc }));

        return node;
    }

    function ParticipantsView(baton, options) {

        options = _.extend({
            summary: true,//show summary
            inlineLinks: false,//no inline links (provide extensionpoint id here to make them show)
            //inlineLinks: true
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
                participants = $i > MIN ? $('<div>').addClass('participants-view') : $(),
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

                if (baton.data.confirmations === undefined || baton.data.confirmations.length === 0) {//workaround for tasks
                    confirmations = util.getConfirmations({users: baton.data.users, confirmations: external});
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
                                $('<legend>').addClass('io-ox-label').text(gt('Participants')),
                                intList = $('<ul>').addClass('participant-list list-inline')
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
                            intList.append(drawParticipant(obj, confirmations));
                        });

                    //external Participants get their own section
                    var extList;
                    if (external.length > 0) {
                        participants.append(
                            $('<fieldset>').append(
                                $('<legend>').addClass('io-ox-label').text(gt('External participants')),
                                extList = $('<ul>').addClass('participant-list list-inline')
                            )
                        );
                    }
                    // loop over external participants
                    _(external).each(function (obj) {
                        extList.append(drawParticipant(obj, confirmations));
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
                            if (memberList.length) {
                                // new section
                                participants.append(
                                    $('<fieldset>').append(
                                        $('<legend>').addClass('group io-ox-label').text(gt.noI18n(obj.display_name + ':')),
                                        glist = $('<ul>').addClass('participant-list list-inline')
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
                                $('<legend>').addClass('io-ox-label').text(gt('Resources')),
                                plist = $('<ul>').addClass('participant-list list-inline')
                            )
                        );
                        // loop over resources
                        _(resourceList)
                            .chain()
                            .sortBy(function (obj) {
                                return obj.display_name;
                            })
                            .each(function (obj) {
                                plist.append(drawParticipant(obj, confirmations));
                            });
                    }
                })
                .always(function () {
                    // add summary
                    var sumData = util.getConfirmationSummary(confirmations);
                    if (options.summary && sumData.count > 3) {
                        var sum = $('<ul>').attr('aria-label', gt('Summary')).addClass('summary list-inline');
                        _.each(sumData, function (res) {
                            if (res.count > 0) {
                                sum.append(
                                    $('<li>').append(
                                        $('<a>')
                                            .attr({
                                                href: '#',
                                                'aria-label': res.title + ' ' + res.count,
                                                role: 'button',
                                                'aria-pressed': false
                                            })
                                            .addClass('countgroup')
                                            .text(res.count)
                                            .prepend(
                                                $('<span>')
                                                    .addClass('status ' + res.css)
                                                    .append(res.icon)
                                            )
                                            .on('click', function (e) {
                                                e.preventDefault();
                                                if ($(this).hasClass('badge')) {
                                                    $(this).removeClass('badge').attr('aria-pressed', false);
                                                    $('.participant', participants)
                                                        .show();
                                                } else {
                                                    $('.participant', participants)
                                                        .show()
                                                        .find('a.person:not(.' + res.css + ')')
                                                        .parent()
                                                        .toggle();
                                                    $('.countgroup', participants).removeClass('badge');
                                                    $(this).addClass('badge').attr('aria-pressed', true);
                                                }
                                            })
                                    )
                                );
                            }
                        });
                        participants.find('legend').first().append(sum);
                    }
                    if (changedBaton) {//remove temporary changes
                        delete baton.data;
                    }
                    // draw action links if extension point is provided
                    if (options.inlineLinks) {
                        ext.point(options.inlineLinks).invoke('draw', participants, baton);
                    }
                    // finish
                    participants.idle();
                });
            }

            return participants;
        };
    }

    return ParticipantsView;
});
