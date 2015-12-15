/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/presenter/rtmodel', [
], function () {

    'use strict';

    /**
     * Represents the data of an update message send by the real-time framework.
     *
     * @param {Object} [attributes]
     *  Initial values of the attributes, which will be set on the RTModel when
     *  creating an instance.
     *
     *  @param {String} attributes.presenterId
     *   The user id of the presenter, or an empty string.
     *  @param {String} attributes.presenterName
     *   The display name of the presenter, or an empty string.
     *  @param {Number} attributes.activeSlide
     *   The index of the active slide.
     *  @param {Boolean} attributes.paused
     *   Whether the presenter paused the presentation.
     *  @param {Array} attributes.activeUsers
     *   An array of objects representing a real-time user.
     *
     *   @param {String} attributes.activeUsers[].userId
     *    The user id.
     *   @param {String} attributes.activeUsers[].userDisplayName
     *    The display name of the user.
     *   @param {Boolean} attributes.activeUsers[].active
     *    Whether the RT connection considers this user as active.
     *   @param {Number} attributes.activeUsers[].id
     *    The user id associated with the OX AppSuite account.
     *   @param {Number} attributes.activeUsers[].durationOfInactivity
     *    The amount of seconds that a user has been inactive.
     *   @param {Boolean} attributes.activeUsers[].joined
     *    Whether the user joined the presentation.
     */
    var RTModel = Backbone.Model.extend({

        defaults: function () {
            return {
                // rtConnection attributes
                presenterId: '',
                presenterName: '',
                activeUsers: [],
                activeSlide: 0,
                paused: false,
                // client generated attributes
                participants: []
            };
        },

        /**
         * Parses the data of an update message send by the real-time framework,
         * filters the users list for the ones who joined the presentation and for the presenter.
         *
         * @param {Object} data
         *  the real-time message data.
         *
         * @return {Object}
         *  the real-time message data supplemented by the participants list.
         */
        parse: function (data) {
            var result = _.copy(data, true);

            result.participants = _.filter(data.activeUsers, function (user) {
                return ((user.joined && (user.active || (!user.active && user.durationOfInactivity < 30))) || (user.userId === data.presenterId));
            }, this);

            return result;
        },

        initialize: function () {
            this.on('change', function (model) {
                console.log('Presenter - RTModel - change', model);
            });
        },

        /**
         * Returns true if a presenter is set,
         * which means the presentation is started.
         *
         * @returns {Boolean}
         *  Whether a presenter is set.
         */
        hasPresenter: function () {
            return !_.isEmpty(this.get('presenterId'));
        },

        /**
         * Returns true if the passed user id belongs to the presenter.
         *
         * @param {String} userId
         *  The user id to check.
         *
         * @returns {Boolean}
         *  Whether the user is the presenter.
         */
        isPresenter: function (userId) {
            return (userId === this.get('presenterId'));
        },

        /**
         * Returns true if the passed user id belongs to the presenter and the presentation is running.
         *
         * @param {String} userId
         *  The user id to check.
         *
         * @returns {Boolean}
         *  Whether the user is currently presenting.
         */
        isPresenting: function (userId) {
            return (!this.isPaused() && this.isPresenter(userId));
        },

        /**
         * Returns true if the provided user can start the presentation.
         * Which means the presentation must not be running and the user must not be joined.
         *
         * @param {String} userId
         *  The user id to check.
         */
        canStart: function (userId) {
            var presenterId = this.get('presenterId');
            return (_.isString(presenterId) && _.isEmpty(presenterId) && !this.isJoined(userId));
        },

        /**
         * Returns true if the presentation is paused.
         *
         * @returns {Boolean}
         *  Whether the presentation is paused.
         */
        isPaused: function () {
            return this.get('paused');
        },

        /**
         * Returns true if the provided user can pause the presentation.
         * Which means the user must be the presenter and the presentation must be running.
         *
         * @param {String} userId
         *  The user id to check.
         */
        canPause: function (userId) {
            return (!this.isPaused() && this.isPresenter(userId));
        },

        /**
         * Returns true if the provided user can continue the presentation.
         * Which means the user must be the presenter and the presentation must be paused.
         *
         * @param {String} userId
         *  The user id to check.
         */
        canContinue: function (userId) {
            return (this.isPaused() && this.isPresenter(userId));
        },

        /**
         * Returns the real-time user object for the provided user id.
         *
         * @param {String} userId
         *  The user id to look for.
         */
        getUser: function (userId) {
            return _.find(this.get('activeUsers'), function (user) {
                return (userId === user.userId);
            }, this);
        },

        /**
         * Returns true if the provided user has joined the presentation as participant.
         *
         * @param {String} userId
         *  The user id to look for.
         *
         * @returns {Boolean}
         *  Whether the user has joined the presentation.
         */
        isJoined: function (userId) {
            var user = this.getUser(userId);
            return (user && user.joined);
        },

        /**
         * Returns true if the provided user can join the presentation.
         * Which means the presentation must be running and the user must not be joined.
         *
         * @param {String} userId
         *  The user id to check.
         */
        canJoin: function (userId) {
            return (this.hasPresenter() && !this.isJoined(userId));
        },

        /**
         * Returns true if the provided user can leave the presentation.
         * Which means the user must be joined and must not be the presenter.
         *
         * @param {String} userId
         *  The user id to check.
         */
        canLeave: function (userId) {
            return (this.isJoined(userId) && !this.isPresenter(userId));
        },

        /**
         * Returns true if the thumb-nail view can be displayed for the provided user.
         * Which means the user must not be joined, or must be the presenter with the presentation paused.
         *
         * @param {String} userId
         *  The user id to check.
         */
        canShowThumbnails: function (userId) {
            return (!this.isJoined(userId) || (this.isPresenter(userId) && this.isPaused()));
        },

        /**
         * Returns true if the pause overlay can be displayed for the provided user.
         * Which means the user must be joined and the presentation must be paused.
         *
         * @param {String} userId
         *  The user id to check.
         */
        canShowPauseOverlay: function (userId) {
            return (this.isPaused() && !this.isPresenter(userId) && this.isJoined(userId));
        }

    });

    return RTModel;
});
