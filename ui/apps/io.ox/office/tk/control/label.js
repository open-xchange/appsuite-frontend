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
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/office/tk/control/label',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group'
    ], function (Utils, Group) {

    'use strict';

    // class Label ============================================================

    /**
     * Creates a label control listening to update requests.
     *
     * @constructor
     *
     * @extends Group
     *
     * @param {String} key
     *  The unique key of this label.
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the label. Supports all
     *  generic formatting options (see method Utils.createLabel() for
     *  details).
     */
    function Label(key, options) {

        var // create the label
            label = Utils.createLabel(options);

        // private methods ----------------------------------------------------

        function updateHandler(value) {
            var labelOptions = Utils.extendOptions(options, { label: _.isNull(value) ? undefined : value });
            Utils.setControlCaption(label, labelOptions);
        }

        // base constructor ---------------------------------------------------

        Group.call(this, key);

        // initialization -----------------------------------------------------

        // insert the label into this group, and register event handlers
        this.addControl(label)
            .registerUpdateHandler(updateHandler);

    } // class Label

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: Label });

});
