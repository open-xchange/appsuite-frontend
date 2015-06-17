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
     *  The Model represents the real time data for the OX Presenter.
     */
    var RTModel = Backbone.Model.extend({

        defaults: function () {
            return {
                slide: 0,
                presenter: null,
                listeners: []
            };
        },

        initialize: function () {
            console.info('Presenter - RTModel.initialize()');
        }

    });

    return RTModel;
});
