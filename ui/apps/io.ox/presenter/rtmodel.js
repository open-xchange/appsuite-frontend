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

        parse: function (data) {
            var result = _.copy(data, true);

            result.participants = _.filter(data.activeUsers, function (user) {
                return ((user.active && user.joined) || (user.userId === data.presenterId));
            }, this );

            return result;
        },

        initialize: function () {
            console.info('Presenter - RTModel.initialize()');

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
         * Returns true if the passed user is the presenter
         *
         * @param {Object} user
         *  A participants or activeUsers object.
         *
         * @returns {Boolean}
         *  Whether the user is the presenter.
         */
        isPresenter: function (user) {
            return (user && user.userId && user.userId === this.get('presenterId'));
        }

    });

    return RTModel;
});
