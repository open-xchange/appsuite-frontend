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
define('io.ox/presenter/localmodel', [
    'io.ox/core/api/user'
], function (UserAPI) {

    'use strict';

    var USER_ID_REGEX = /^ox\:\/\/(\d+)@.+\/.+/;

    /**
     * Stores the data for a presentation in local mode.
     *
     * @param {Object} [attributes]
     *  Initial values of the attributes, which will be set when creating an instance.
     *
     *  @param {String} attributes.presenterId
     *   The user id of the presenter, or an empty string.
     *
     *  @param {String} attributes.presenterName
     *   The display name of the presenter, or an empty string.
     *
     *  @param {Boolean} attributes.paused
     *   Whether the presenter paused the presentation.
     */
    var LocalModel = Backbone.Model.extend({

        defaults: function () {
            return {
                presenterId: '',
                presenterName: '',
                paused: false
            };
        },

        initialize: function () {
            this.on('change', function (model) {
                console.log('Presenter - local model - change', model);
            });
        },

        /**
         * Starts the presentation.
         * - sets the presenter id and name.
         *
         * @param {String} userId
         *  The user id of the presenter.
         */
        startPresentation: function (userId) {
            var self = this;

            if (this.canStart(userId)) {
                var matches = userId.match(USER_ID_REGEX);

                if (_.isArray(matches) && matches[1]) {
                    UserAPI.getName(matches[1]).done(function (name) {
                        self.set('presenterName', name);
                    });

                    this.set({
                        presenterId: userId,
                        paused: false
                    });
                }
            }
        },

        /**
         * Ends the presentation.
         * - sets the presenter id and name to defaults.
         *
         * @param {String} userId
         *  The user id of the presenter.
         */
        endPresentation: function (userId) {
            if (this.isPresenter(userId)) {
                this.set({
                    presenterId: '',
                    presenterName: '',
                    paused: false
                });
            }
        },

        /**
         * Pauses the presentation
         * if the user is the presenter and the presentation is running.
         */
        pausePresentation: function (userId) {
            if (this.canPause(userId)) {
                this.set('paused', true);
            }
        },

        /**
         * Continues the presentation
         * if the user is the presenter and the presentation is paused.
         */
        continuePresentation: function (userId) {
            if (this.canContinue(userId)) {
                this.set('paused', false);
            }
        },

        /**
         * Returns true if the provided user can start the presentation.
         *
         * @param {String} userId
         *  The user id to check.
         */
        canStart: function (userId) {
            var presenterId = this.get('presenterId');
            return (_.isString(userId) && USER_ID_REGEX.test(userId) && _.isString(presenterId) && _.isEmpty(presenterId));
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
         * Returns true if the passed user id belongs to the former presenter.
         * Which means the given user started and ended the presentation again. And the presentation has not yet been started.
         * - Intended to be called after a Backbone model change event (otherwise the result may not be valid).
         *
         * @param {String} userId
         *  The user id to check.
         *
         * @returns {Boolean}
         *  Whether the user was the presenter.
         */
        wasPresenter: function (userId) {
            var formerPresenter = this.previous('presenterId');
            return (!this.hasPresenter() && !_.isEmpty(formerPresenter) && userId === formerPresenter);
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
         * Returns true if the pause overlay can be displayed for the provided user.
         * Which means the user must be joined and the presentation must be paused.
         *
         * @param {String} userId
         *  The user id to check.
         */
        canShowPauseOverlay: function (userId) {
            return (this.isPresenter(userId) && this.isPaused());
        }

    });

    return LocalModel;
});
