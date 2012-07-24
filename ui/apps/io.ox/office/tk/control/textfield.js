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

    var // shortcut for the KeyCodes object
        KeyCodes = Utils.KeyCodes;

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
     *  all options of the Group base class, generic caption options (see
     *  Utils.setControlCaption() for details), and all generic formatting
     *  options of input fields (see method Utils.createTextField() for
     *  details).
     */
    function TextField(options) {

        var // self reference
            self = this,

            // container for caption elements
            caption = Utils.createLabel(options).addClass('input-caption'),

            // create the text field
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

        /**
         * Handles mouse click events on the caption element preceding the text
         * field element.
         */
        function captionClickHandler(event) {
            if (self.isEnabled()) {
                textField.focus();
            } else {
                self.trigger('cancel');
            }
        }

        /**
         * Handles keyboard events, especially the cursor keys.
         */
        function keyHandler(event) {
            switch (event.keyCode) {
            case KeyCodes.LEFT_ARROW:
            case KeyCodes.RIGHT_ARROW:
                // do not bubble to view component (suppress focus navigation)
                event.stopPropagation();
                // ... but let the browser perform its default action
                break;
            // browser ESCAPE handling inconsistent or buggy, e.g.: https://bugzilla.mozilla.org/show_bug.cgi?id=598819
            }
        }

        // base constructor ---------------------------------------------------

        Group.call(this, options);

        // initialization -----------------------------------------------------

        // add the caption
        if (caption.children().length) {
            this.addChildNodes(caption);
        }

        // insert the text field into this group, and register event handlers
        this.addFocusableControl(textField)
            .registerUpdateHandler(updateHandler)
            .registerActionHandler(textField, 'change', changeHandler);
        caption.on('click', captionClickHandler);
        textField.on('keydown keypress keyup', keyHandler);

    } // class TextField

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: TextField });

});
