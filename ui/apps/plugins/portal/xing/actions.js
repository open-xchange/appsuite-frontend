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
 * Content: Actions that a user can perform as response to a XING activity.
 * Common actions are comment, delete, like and share.
 *
 * TODO:
 * - Too many on-click-handlers for actions
 */

define('plugins/portal/xing/actions',
    ['io.ox/core/extensions',
     'io.ox/xing/api',
     'io.ox/core/notifications',
     'io.ox/core/extPatterns/links',
     'gettext!plugins/portal',
     'less!plugins/portal/xing/xing'
    ], function (ext, api, notifications, links, gt) {

    'use strict';

    ext.point('io.ox/portal/widget/xing/reaction').extend({
        id: 'comment',

        accepts: function (activityName) {
            return activityName.toUpperCase() === 'COMMENT';
        },

        handle: function (activity) {
            var id, commentToggle, formSubmission, textarea, container;
            //tres fragile
            id = activity.ids[0];

            commentToggle = function () {
                container.toggle();
            };

            formSubmission = function () {
                console.log('Commenting:', textarea.val());

                api.addComment({
                    activity_id: id,
                    text: textarea.val()
                })
                .fail(function (response) {
                    notifications.yell('error', gt('There was a problem with XING, the error message was: "%s"', response.error));
                })
                .done(function () {
                    container.toggle();
                    textarea.val('');
                    notifications.yell('success', gt('Comment has been successfully posted on XING'));
                    ox.trigger('refresh^');
                });
            };

            return $('<div>').addClass('xing possible-action comment').append(
                $('<span>').addClass('comment-toggle').append(
                    $('<i class="fa fa-comment">'),
                    $.txt(gt('Comment'))
                ).on('click', commentToggle),
                container = $('<div>').addClass('comment-form').append(
                    textarea = $('<textarea>').attr({rows: 3, cols: 40}),
                    $('<button>').addClass('btn btn-primary').text(gt('Submit comment'))
                ).on('click', '.btn', formSubmission).hide()
            );
        }
    });

    ext.point('io.ox/portal/widget/xing/reaction').extend({
        id: 'delete',

        accepts: function (activityName) {
            return activityName.toUpperCase() === 'DELETE';
        },

        handle: function (activity) {
            var handler,
                //tres fragile
                id = activity.ids[0];

            handler = function () {
                var container = $('.activity[data-activity-id="' + id + '"]'),
                    type = activity.type,
                    successMessage,
                    def = $.Deferred();

                if (type === 'activity') {
                    def = api.deleteActivity({ activity_id: id });
                    successMessage = gt('The activity has been deleted successfully');
                } else if (type === 'comment') {
                    def = api.deleteComment({ comment_id: id });
                    successMessage = gt('The comment has been deleted successfully');
                } else {
                    console.log('We currently do not know how to handle deleting data of type="' + type + '". Please let us know about it. Here is more data:', JSON.stringify(activity));
                }

                def.fail(function (response) {
                    notifications.yell('error', gt('There was a problem with XING. The error message was: "%s"', response.error));
                })
                .done(function () {
                    container.remove();
                    //#. %s may be either 'comment' or 'activity'
                    notifications.yell('success', successMessage);
                    ox.trigger('refresh^');
                });
            };

            return $('<div class="xing possible-action delete">').append(
                    $('<i class="fa fa-trash-o">'),
                    $.txt(gt('Delete'))
                ).on('click', handler);
        }
    });

    ext.point('io.ox/portal/widget/xing/reaction').extend({
        id: 'like',

        accepts: function (activityName) {
            return activityName.toUpperCase() === 'LIKE';
        },

        handle: function (activity) {
            var handler,
                actId = activity.ids[0],
                //tres fragile
                comId = activity.objects[0].id,
                isAlreadyLiked = activity && activity.likes && activity.likes.current_user_liked;

            handler = function () {
                var def, message;

                if (isAlreadyLiked) {
                    def = api.unlikeActivity({
                        activity_id: actId,
                        comment_id: comId
                    });
                    //#. As on Facebook, XING allows a stop pointing out they liked a comment. An 'undo' for the like action, if you will.
                    message = gt('Un-liked comment');

                } else {
                    def = api.likeActivity({
                        activity_id: actId,
                        comment_id: comId
                    });
                    //#. As on Facebook, XING allows a user to point out that they like a comment
                    message = gt('Liked comment');
                }

                def.fail(function (response) {
                    notifications.yell('error', gt('There was a problem with XING, the error message was: "%s"', response.error));
                })
                .done(function () {
                    notifications.yell('success', message);
                    ox.trigger('refresh^');
                });
            };

            if (isAlreadyLiked) {
                return $('<div class="xing possible-action unlike">').append(
                    $('<i class="fa fa-thumbs-down">'),
                    $.txt(gt('Un-like'))
                ).on('click', handler);
            } else {
                return $('<div class="xing possible-action like">').append(
                    $('<i class="fa fa-thumbs-up">'),
                    $.txt(gt('Like'))
                ).on('click', handler);
            }
        }
    });


    ext.point('io.ox/portal/widget/xing/reaction').extend({
        id: 'share',

        accepts: function (activityName) {
            return activityName.toUpperCase() === 'SHARE';
            /* assuming the experimental "share link" function will be different */
        },

        handle: function (activity) {
            var handler,
                //tres fragile
                id = activity.ids[0];

            handler = function () {
                api.shareActivity({
                    activity_id: id
                })
                .fail(function (response) {
                    notifications.yell('error', gt('There was a problem with XING, the error message was: "%s"', response.error));
                })
                .done(function () {
                    notifications.yell('success', gt('Shared activity'));
                    ox.trigger('refresh^');
                });
            };

            return $('<div class="xing possible-action share">').append(
                    $('<i class="fa fa-share">'),
                    $.txt(gt('Share'))
                ).on('click', handler);
        }
    });

});
