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

define('plugins/portal/xing/activities', [
    'io.ox/core/extensions',
    'io.ox/xing/api',
    'io.ox/core/notifications',
    'io.ox/core/extPatterns/links',
    'gettext!plugins/portal',
    'less!plugins/portal/xing/xing'
], function (ext, api, notifications, links, gt) {

    'use strict';

    var linkXingContact, makeName, very_short, shorter, very_short_middle_ellipsis;

    linkXingContact = function (contact) {
        var contactNode = $('<a>')
            .attr({ href: 'https://www.xing.com/profile/' + contact.page_name, target: '_blank' })
            .addClass('external xing');
        if (contact.photo_urls) {
            var ps = contact.photo_urls,
                photoUrl = ps.maxi_thumb || ps.medium_thumb || ps.mini_thumb || ps.thumb || ps.large;

            $('<img>').attr({ href: photoUrl, 'class': 'photo' }).appendTo(contactNode);
        }
        contactNode.append($.txt(makeName(contact)));
        return contactNode;
    };

    makeName = function (actor) {
        return actor.type === 'user' ? actor.display_name : actor.name;
    };

    very_short_middle_ellipsis = function (text, options) {
        if (!options || !options.limitLength) {
            return text;
        }
        return _.ellipsis(text, { max: 30, charpos: 'middle' });

    };

    very_short = function (text, options) {
        if (!options || !options.limitLength) {
            return text;
        }
        return _.ellipsis(text, { max: 30 });
    };

    shorter = function (text, options) {
        if (!options || !options.limitLength) {
            return text;
        }
        return _.ellipsis(text, { max: 50 });
    };

    ext.point('io.ox/portal/widget/xing/activityhandler').extend({
        id: 'link',
        accepts: function (activity) {
            return activity.verb === 'bookmark';
        },
        handle: function (activityObj, options) {
            return $('<div class="xing activityObj">').append(
                $('<div class="actionDesc">').text(gt('%1$s recommends this link:', makeName(activityObj.creator))),
                $('<div class="actionContent">').append(
                    $('<a>').attr({ href: activityObj.url }).text(very_short_middle_ellipsis(activityObj.url, options)).addClass('external xing'),
                    $('<div class="title">').text(very_short(activityObj.title, options)),
                    $('<div class="description">').text(shorter(activityObj.description, options))
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
        handle: function (activity, options) {
            var linkActivity = activity.objects[0];
            return $('<div class="xing activityObj">').append(
                $('<div class="actionDesc">').text(gt('%1$s posted a link:', makeName(linkActivity.creator))),
                $('<div class="actionContent">').append(
                    $('<a>').attr({ 'href': linkActivity.url, 'target': '_blank' })
                    .addClass('external xing')
                    .text(shorter(linkActivity.description, options) || very_short_middle_ellipsis(linkActivity.url, options))
                )
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
        handle: function (activity, options) {
            var statusActivity = activity.objects[0];

            return $('<div class="xing activityObj">').append(
                //#. We do not know the gender of the user and therefore, it is impossible to write e.g. '%1$s changed her status'.
                //#. But you could use '%1$s changes his/her status' depending on the language.
                //#. %1$s the name of the user which changed his/her status
                $('<div class="actionDesc">').text(gt('%1$s changed the status:', makeName(statusActivity.creator))),
                $('<div class="actionContent">').text(shorter(statusActivity.content, options))
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
                actor = activity.actors[0],
                objs = activity.objects;

            if (objs.length === 1) {
                return $('<div class="xing activityObj">').append(
                    $('<div class="actionDesc">').text(gt('%1$s has a new contact:', makeName(actor))),
                    $('<div class="actionContent">').append(
                        linkXingContact(objs[0])
                    )
                );
            }

            _(objs).each(function (contact) {
                newContacts.push(linkXingContact(contact));
                newContacts.push($.txt(', '));
            });
            newContacts.pop();
            return $('<div class="xing activityObj">').append(
                $('<div class="actionDesc">').text(gt('%1$s has new contacts:', makeName(actor))),
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
        handle: function (activity, options) {
            var statusActivity = activity.objects[0];

            return $('<div class="xing activityObj">').append(
                $('<div class="actionDesc">').text(gt('%1$s posted a new activity:', makeName(statusActivity.creator))),
                $('<div class="actionContent">').text(shorter(statusActivity.content, options))
            );
        }
    });

    ext.point('io.ox/portal/widget/xing/activityhandler').extend({
        id: 'singleCompanyProfileUpdate',
        accepts: function (activity) {
            return (activity.verb === 'share' || activity.verb === 'post') &&
                activity.objects.length === 1 &&
                activity.objects[0].type === 'company_profile_update';
        },
        handle: function (activity, options) {
            var profileUpdate = activity.objects[0];

            return $('<div class="xing activityObj">').append(
                //#. We do not know the gender of the user and therefore, it is impossible to write e.g. '%1$s changed her profile:'.
                //#. But you could use '%1$s changes his/her profile:' depending on the language.
                //#. %1$s the name of the user which changed his/her profile
                $('<div class="actionDesc">').text(gt('%1$s updated the profile:', profileUpdate.description)),
                $('<div class="actionContent">').text(shorter(profileUpdate.name, options))
            );
        }
    });

    ext.point('io.ox/portal/widget/xing/activityhandler').extend({
        id: 'singleUpdate',
        accepts: function (activity) {
            return activity.verb === 'update' &&
                activity.objects.length === 1;
        },
        handle: function (activity) {
            var profile = activity.objects[0];

            return $('<div class="xing activityObj">').append(
                $('<div class="actionDesc">').text(gt('%1$s updated their profile:', makeName(profile))),
                    $('<div class="actionContent">').append(
                        linkXingContact(profile)
                    )
            );
        }
    });
});
