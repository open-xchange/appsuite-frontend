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
 */

/**
 * This API defines the 2014 way of accessing XING. There used to be
 * another way, using the OAuth proxy. This is a dedicated interface
 * to provide more functions.
 */
define('io.ox/xing/api', ['io.ox/core/http'], function (http) {
    var xingGet, xingPost, xingDelete,
        /* external methods go here */
        getByEMail, getUserfeed, getComments, addComment, deleteComment,
        likeActivity, unlikeActivity, getLikes, showActivity,
        shareActivity, deleteActivity, changeStatus, createProfile,
        initiateContactRequest, revokeContactRequest, invite,
        shareLink;

    /*
     * Helpers
     */
    xingGet = function (action, params) {
        return http.GET({
            module: 'xing',
            params: _.extend(params, {action: action})
        });
    };

    xingPost = function (action, params, data) {
        return http.POST({
            module: 'xing',
            params: _.extend(params, {action: action}),
            data: data
        });
    };

    xingDelete = function (action, params) {
        return http.DELETE({
            module: 'xing',
            params: _.extend(params, {action: action})
        });
    };

    /*
     * API methods
     */

    getByEMail = function (params) {

        console.error('THIS IS NOT YET IMPLEMENTED', params);
        //return xingPost('get_by_email', params);
        return {
            results: {
                items: [
                    {
                        email: 'existing_user@xing.com',
                        hash: null,
                        user: {
                            id: '10368_ddec16'
                        }
                    },
                    {
                        email: 'unknown_user@xing.com',
                        hash: null,
                        user: null
                    }
                ],
                total: 2
            }
        };
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

    /* strictly experimental */
    shareLink = function (params, body) {
        return xingPost('share_link', params, body);
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
        invite: invite
    };
});