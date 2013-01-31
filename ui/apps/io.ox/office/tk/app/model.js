/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Kai Ahrens <kai.ahrens@open-xchange.com>
 */

define('io.ox/office/tk/app/model',
     ['io.ox/core/event',
      'io.ox/office/tk/utils'
     ], function (Events, Utils) {

    'use strict';

    // class Model ============================================================

    /**
     * The base class for model classes used in OX Documents applications. Adds
     * the Events mix-in class to all created instances.
     *
     * @constructor
     *
     * @extends Events
     *
     * @param {OfficeApplication} app
     *  The application that has created this model instance.
     */
    function Model(app) {

        // base constructor ---------------------------------------------------

        // add the Events mix-in class
        Events.extend(this);

        // methods ------------------------------------------------------------

        this.destroy = function () {
            this.events.destroy();
        };

    } // class Model

    // exports ================================================================

    return _.makeExtendable(Model);

});
