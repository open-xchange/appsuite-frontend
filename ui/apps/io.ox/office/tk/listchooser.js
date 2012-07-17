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

define('io.ox/office/tk/listchooser',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/dropdown'
    ], function (Utils, DropDown) {

    'use strict';

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

    // class ListChooser ======================================================

    /**
     * Creates a container element with a drop-down button shown on top, and a
     * drop-down menu containing a list of items. The list may change
     * dynamically at runtime, using the setItems() method.
     *
     * @constructor
     *
     * @extends DropDown
     *
     * @param {String} key
     *  The unique key of the list chooser.
     *
     * @param {Object} options
     *  A map of options to control the properties of this control. Supports
     *  all options of the base class (see DropDown() constructor for details).
     */
    function ListChooser(key, options) {

        var // self reference to be used in event handlers
            self = this;

        // private methods ----------------------------------------------------

        // base constructor ---------------------------------------------------

        DropDown.call(this, key, options);

        // methods ------------------------------------------------------------

        // initialization -----------------------------------------------------

        // initialize the drop-down element
        this.getMenuNode().addClass('list-chooser');

    } // class ListChooser

    // exports ================================================================

    // derive this class from class DropDown
    return DropDown.extend({ constructor: ListChooser });

});
