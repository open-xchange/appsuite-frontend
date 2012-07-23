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

define('io.ox/office/tk/control/textfield',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group'
    ], function (Utils, Group) {

    'use strict';

    // class TextField ========================================================

    /**
     * Creates a container element used to hold a text input field.
     *
     * @constructor
     *
     * @extends Group
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the text field. Supports
     *  all generic formatting options (see method Utils.createInput() for
     *  details).
     */
    function TextField(options) {

        var // create the text field
            textField = Utils.createTextField(options);

        // private methods ----------------------------------------------------

        /**
         * The update handler for this text field.
         */
        function updateHandler(value) {
            textField.val(_.isString(value) ? value : '');
        }

        /**
         * The action handler for this text field.
         */
        function changeHandler(textField) {
            return textField.val();
        }

        // base constructor ---------------------------------------------------

        Group.call(this);

        // initialization -----------------------------------------------------

        // insert the text field into this group, and register event handlers
        this.addFocusableControl(textField)
            .registerUpdateHandler(updateHandler)
            .registerActionHandler(textField, 'change', changeHandler);

    } // class TextField

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: TextField });

});
