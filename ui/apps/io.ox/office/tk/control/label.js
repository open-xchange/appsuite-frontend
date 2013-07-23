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
     * Creates a label control listening to update requests. By registering an
     * update handler that modifies the caption it is even possible to update
     * the label dynamically with the method 'Group.setValue()' based on any
     * arbitrary value.
     *
     * @constructor
     *
     * @extends Group
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the label. Supports all
     *  options of the Group base class, and all generic formatting options for
     *  labels (see method Utils.createLabel() for details).
     */
    function Label(options) {

        var // create the label
            label = Utils.createLabel(options);

        // base constructor ---------------------------------------------------

        Group.call(this, options);

        // methods ------------------------------------------------------------

        /**
         * Changes the icon of this label control.
         *
         * @param {String} [icon]
         *  The CSS class name of the new icon. If omitted, the current icon
         *  will be removed from the label.
         *
         * @returns {Label}
         *  A reference to this instance.
         */
        this.setIcon = function (icon) {
            Utils.setControlCaption(label, Utils.extendOptions(options, { icon: icon }));
            return this;
        };

        /**
         * Changes the label text of this label control.
         *
         * @param {String} [labelText]
         *  The new label text. If omitted, the current label text will be
         *  removed from the label control.
         *
         * @returns {Label}
         *  A reference to this instance.
         */
        this.setLabelText = function (labelText) {
            Utils.setControlCaption(label, Utils.extendOptions(options, { label: labelText }));
            return this;
        };

        // initialization -----------------------------------------------------

        // insert the label into this group
        this.addChildNodes(label);

    } // class Label

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: Label });

});
