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
        KeyCodes = Utils.KeyCodes,

        // left/right padding in the text field
        FIELD_PADDING = 4;

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
     *  details). Additionally, the following options are supported:
     *  @param {Number} [options.width=200]
     *      The fixed inner width of the editing area (without any padding), in
     *      pixels.
     */
    function TextField(options) {

        var // self reference
            self = this,

            // create the text field
            textField = Utils.createTextField(options),

            // the caption (icon and text label) for the text field
            caption = Utils.createLabel(options).addClass('input-caption'),

            // the caption (icon and text label) for the text field
            background = $('<div>'),

            // the overlay container for the caption and the background
            overlay = $('<div>').addClass('input-overlay').append(caption, background),

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
         * Called when the application window will be shown for the first time.
         * Initializes the caption overlay. Needs the calculated element sizes
         * which become available when the window becomes visible and all
         * elements have been inserted into the DOM.
         */
        function initHandler() {

            var // the inner width of the editing area
                width = Utils.getIntegerOption(options, 'width', 200, 1),
                // the width including the padding of the text field
                paddedWidth = width + 2 * FIELD_PADDING,
                // the current width of the caption element
                captionWidth = caption.outerWidth();

            // expand the text field by the size of the overlay caption
            textField
                .width(captionWidth + paddedWidth + 1) // text field has box-sizing: border-box
                .css({ paddingLeft: (captionWidth - 1 + FIELD_PADDING) + 'px', paddingRight: FIELD_PADDING + 'px' });

            // set the size of the white background area
            background.width(paddedWidth).height(textField.height());
        }

        /**
         * The update handler for this text field.
         */
        function updateHandler(value) {
            textField.val(_.isString(value) ? value : '');
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

        // insert the text field into this group, and register event handlers
        this.addFocusableControl(textField)
            .addChildNodes(overlay)
            .on('init', initHandler)
            .registerUpdateHandler(updateHandler);
        textField
            .on('focus', saveValue)
            .on('blur', restoreValue)
            .on('keydown keypress keyup', fieldKeyHandler);

    } // class TextField

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: TextField });

});
