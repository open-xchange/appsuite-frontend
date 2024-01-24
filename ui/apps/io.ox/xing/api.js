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

/**
 * This API defines the 2014 way of accessing XING. There used to be
 * another way, using the OAuth proxy. This is a dedicated interface
 * to provide more functions.
 */
define('io.ox/xing/api', ['io.ox/core/http'], function (http) {

    var xingGet, xingPost, xingDelete, xingPut,
        /* external methods go here */
        findByMail, getUserfeed, getComments, addComment, deleteComment,
        likeActivity, unlikeActivity, getLikes, showActivity,
        shareActivity, deleteActivity, changeStatus, createProfile,
        initiateContactRequest, revokeContactRequest, invite,
        createSubscription;

    /*
     * Helpers
     */
    xingGet = function (action, params) {
        return http.GET({
            module: 'xing',
            params: _.extend(params, { action: action })
        });
    };

    xingPost = function (action, params, data) {
        return http.POST({
            module: 'xing',
            params: _.extend(params, { action: action }),
            data: data
        });
    };

    xingPut = function (action, params, data) {
        return http.PUT({
            module: 'xing',
            params: _.extend(params, { action: action }),
            data: data
        });
    };

    xingDelete = function (action, params) {
        return http.DELETE({
            module: 'xing',
            params: _.extend(params, { action: action })
        });
    };

    /*
     * API methods
     */

    var cache = {};

    findByMail = function (emails) {
        if (!emails || emails.length === 0) return $.when({});
        var key = emails.join(',');
        if (cache[key]) return $.when(cache[key]);
        return xingPut('find_by_mails', {}, { 'emails': emails }).done(function (result) {
            cache[key] = result;
        });
    };

    getUserfeed = function (params) {
        return xingPost('newsfeed', params);
    };

    getComments = function (params) {
        return xingGet('get_comments', params);
    };

    addComment = function (params) {
        return xingPost('comment', params);
    };

    deleteComment = function (params) {
        return xingPost('delete_comment', params);
    };

    likeActivity = function (params) {
        return xingPost('like', params);
    };

    unlikeActivity = function (params) {
        return xingPost('unlike', params);
    };

    getLikes = function (params) {
        return xingGet('get_likes', params);
    };

    showActivity = function (params) {
        return xingGet('show_activity', params);
    };

    shareActivity = function (params) {
        return xingPost('share_activity', params);
    };

    deleteActivity = function (params) {
        return xingDelete('delete_activity', params);
    };

    changeStatus = function (params) {
        return xingPost('change_status', params);
    };

    createProfile = function (params) {
        return xingPost('create', params);
    };

    initiateContactRequest = function (params) {
        return xingPost('contact_request', params);
    };

    revokeContactRequest = function (params) {
        return xingDelete('revoke_contact_request', params);
    };

    invite = function (params) {
        return xingPost('invite', params);
    };

    // TODO: unused
    /* strictly experimental */
    // var shareLink = function (params, body) {
    //     return xingPost('share_link', params, body);
    // };

    /*
     * Create a folder in contacts with name 'XING' and corresponding subscription
     */
    createSubscription = function () {
        require([
            'io.ox/core/api/sub',
            'io.ox/core/sub/model',
            'io.ox/core/folder/api',
            'io.ox/keychain/api',
            'io.ox/core/notifications',
            'settings!io.ox/core'
        ], function (subAPI, subModel, folderAPI, keychainAPI, notifications, settings) {
            subAPI.sources.getAll().done(function (subscriptions) {
                var subs = _(subscriptions).filter(function (s) { return s.id.match('.*xing.*') && s.module === 'contacts'; });

                if (subs.length > 0) {
                    var sub = subs[0],
                        folder = settings.get('folder/' + sub.module);

                    folderAPI.create(folder, {
                        title: sub.displayName || 'XING'
                    }).done(function (folder) {
                        var account = keychainAPI.getStandardAccount('xing'),
                            model = new subModel.Subscription({
                                folder: folder.id,
                                entity: { folder: folder.id },
                                entityModule: sub.module
                            });

                        model.setSource(sub, { 'account': parseInt(account.id, 10) });

                        model.save().then(function saveSucess(id) {
                            subAPI.subscriptions.refresh({ id: id, folder: folder.id }).fail(notifications.yell);
                        }, notifications.yell);
                    });
                }
            });
        });
    };

    return {
        getUserfeed: getUserfeed,
        getComments: getComments,
        addComment: addComment,
        deleteComment: deleteComment,
        likeActivity: likeActivity,
        unlikeActivity: unlikeActivity,
        getLikes: getLikes,
        showActivity: showActivity,
        shareActivity: shareActivity,
        deleteActivity: deleteActivity,
        changeStatus: changeStatus,
        createProfile: createProfile,
        initiateContactRequest: initiateContactRequest,
        revokeContactRequest: revokeContactRequest,
        invite: invite,
        findByMail: findByMail,
        createSubscription: createSubscription
    };
});
