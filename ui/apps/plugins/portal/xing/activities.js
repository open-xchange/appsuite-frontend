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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 *
 * Content: Activities that XING recognizes and shows in the activity
 * feed of a user.
 */

define('plugins/portal/xing/activities',
    ['io.ox/core/extensions',
     'io.ox/xing/api',
     'io.ox/core/notifications',
     'io.ox/core/extPatterns/links',
     'gettext!plugins/portal',
     'less!plugins/portal/xing/xing'
    ], function (ext, api, notifications, links, gt) {

    'use strict';

    var linkXingContact, makeName;

    linkXingContact = function (contact) {
        var contactNode = $('<a>')
            .attr({href: 'https://www.xing.com/profile/' + contact.page_name, target: '_blank'})
            .addClass('external xing');
        if (contact.photo_urls) {
            var ps = contact.photo_urls,
                photoUrl = ps.maxi_thumb || ps.medium_thumb || ps.mini_thumb || ps.thumb || ps.large;

            $('<img>').attr({href: photoUrl, 'class': 'photo'}).appendTo(contactNode);
        }
        contactNode.append($.txt(makeName(contact)));
        return contactNode;
    };

    makeName = function (actor) {
        return actor.type === 'user' ? actor.display_name : actor.name;
    };





    ext.point('io.ox/portal/widget/xing/activityhandler').extend({
        id: 'link',
        accepts: function (activity) {
            return activity.verb === 'bookmark';
        },
        handle: function (activityObj, creator) {
            return $('<div class="xing activityObj">').append(
                $('<div class="actionDesc">').text(gt('%1$s recommends this link:', makeName(creator))),
                $('<div class="actionContent">').append(
                    $('<a>').attr({href: activityObj.url}),
                    $('<div class="title">').text(activityObj.title),
                    $('<div class="description">').text(activityObj.description)
                )
            );

        }
    });


    ext.point('io.ox/portal/widget/xing/activityhandler').extend({
        id: 'singleBookmarkPost',
        accepts: function (activity) {
            return activity.verb === 'post' &&
                activity.objects.length === 1 &&
                activity.objects[0].type === 'bookmark';
        },
        handle: function (activity) {
            var linkActivity = activity.objects[0];
            return $('<div class="xing activityObj">').append(
                $('<div class="actionDesc">').text(gt('%1$s posted a link:', makeName(linkActivity.creator))),
                $('<div class="actionContent">').text(linkActivity.url)
            );
        }
    });


    ext.point('io.ox/portal/widget/xing/activityhandler').extend({
        id: 'singleStatusPost',
        accepts: function (activity) {
            return activity.verb === 'post' &&
                activity.objects.length === 1 &&
                activity.objects[0].type === 'status';
        },
        handle: function (activity) {
            var statusActivity = activity.objects[0];

            return $('<div class="xing activityObj">').append(
                $('<div class="actionDesc">').text(gt('%1$s changed their status:', makeName(statusActivity.creator))),
                $('<div class="actionContent">').text(statusActivity.content)
            );
        }
    });


    ext.point('io.ox/portal/widget/xing/activityhandler').extend({
        id: 'friend',
        accepts: function (activity) {
            return activity.verb === 'make-friend';
        },
        handle: function (activity) {
            var newContacts = [],
                actors = activity.actors,
                creator = activity.objects[0];

            if (actors.length === 1) {
                return $('<div class="xing activityObj">').append(
                    $('<div class="actionDesc">').text(gt('%1$s has a new contact:', makeName(creator))),
                    $('<div class="actionContent">').append(
                        linkXingContact(actors[0])
                    )
                );
            }

            _(actors).each(function (actor) {
                newContacts.push(linkXingContact(actor));
                newContacts.push($.txt(', '));
            });
            newContacts.pop();
            return $('<div class="xing activityObj">').append(
                $('<div class="actionDesc">').text(gt('%1$s has new contacts:', makeName(creator))),
                $('<div class="actionContent">').append(newContacts)
            );
        }
    });


    ext.point('io.ox/portal/widget/xing/activityhandler').extend({
        id: 'singleActivityPost',
        accepts: function (activity) {
            return activity.verb === 'post' &&
                activity.objects.length === 1 &&
                activity.objects[0].type === 'activity';
        },
        handle: function (activity) {
            var statusActivity = activity.objects[0];

            return $('<div class="xing activityObj">').append(
                $('<div class="actionDesc">').text(gt('%1$s posted a new activity:', makeName(statusActivity.creator))),
                $('<div class="actionContent">').text(statusActivity.content)
            );
        }
    });
});