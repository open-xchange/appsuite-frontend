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
            textField = Utils.createTextField(options),

            // old value of text field, needed for ESCAPE key handling
            oldValue = null;

        // private methods ----------------------------------------------------

        /**
         * Saves the current value of the text field in an internal variable,
         * to be able to restore it when editing is cancelled.
         */
        function saveValue() {
            oldValue = textField.val();
        }

        /**
         * Restores the old value saved in the last call of the method
         * saveValue().
         */
        function restoreValue() {
            if (_.isString(oldValue)) {
                textField.val(oldValue);
                oldValue = null;
            }
        }

        /**
         * Triggers a change event, if the value has been changed since the
         * last call of the method saveValue().
         */
        function commitValue() {
            if (oldValue !== textField.val()) {
                oldValue = null;
                self.trigger('change', textField.val());
            } else {
                self.trigger('cancel');
            }
        }

        /**
         * The update handler for this text field.
         */
        function updateHandler(value) {
            textField.val(_.isString(value) ? value : '');
        }

        /**
         * Handles mouse click events on the caption element preceding the text
         * field element.
         */
        function captionClickHandler() {
            if (self.isEnabled()) {
                textField.focus();
            }
        }

        /**
         * Handles keyboard events, especially the cursor keys.
         */
        function fieldKeyHandler(event) {

            var // distinguish between event types (ignore keypress events)
                keyup = event.type === 'keyup';

            switch (event.keyCode) {
            case KeyCodes.LEFT_ARROW:
            case KeyCodes.RIGHT_ARROW:
                // do not bubble to view component (suppress focus navigation)
                event.stopPropagation();
                // ... but let the browser perform cursor movement
                break;
            case KeyCodes.ENTER:
                if (keyup) { commitValue(); }
                return false;
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
            .registerUpdateHandler(updateHandler);
        caption
            .on('click', captionClickHandler);
        textField
            .on('focus', saveValue)
            .on('blur', restoreValue)
            .on('keydown keypress keyup', fieldKeyHandler);

    } // class TextField

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: TextField });

});
