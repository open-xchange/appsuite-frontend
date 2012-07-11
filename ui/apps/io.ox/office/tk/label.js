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

define('io.ox/office/tk/label',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/group'
    ], function (Utils, Group) {

    'use strict';

    // class Label ============================================================

    /**
     * Creates a label control listening to update requests.
     *
     * @constructor
     *
     * @extends Group
     */
    function Label(key, options) {

        var // create the label
            label = Utils.createLabel(key, options);

        // base constructor ---------------------------------------------------

        Group.call(this);

        // initialization -----------------------------------------------------

        // append the label to the group container
        this.getNode().append(label);

        // register update handler
        this.registerUpdateHandler(key, function (value) {
            Utils.insertControlLabel(label.empty(), Utils.extendOptions(options, { label: value }));
        });

    } // class Label

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: Label });

});
