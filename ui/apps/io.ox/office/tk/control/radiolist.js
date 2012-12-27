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

define('io.ox/office/tk/control/radiolist',
    ['io.ox/office/tk/utils',
     'io.ox/office/tk/control/group',
     'io.ox/office/tk/dropdown/list'
    ], function (Utils, Group, List) {

    'use strict';

    // class RadioList =======================================================

    /**
     * Creates a drop-down list control used to hold a set of radio buttons.
     *
     * @constructor
     *
     * @extends Group
     * @extends List
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button and
     *  menu. Supports all options of the Group base class, and of the List
     *  mix-in class. Additionally, the following options are supported:
     *  @param {Boolean} [options.highlight=false]
     *      If set to true, the drop-down button will be highlighted if a list
     *      item in the drop-down menu is active. Has no effect, if the radio
     *      group is not in drop-down mode.
     *  @param [options.toggleValue]
     *      If set to a value different to null or undefined, the option button
     *      that is currently active can be clicked to be switched off. In that
     *      case, this radio group will activate the button associated to the
     *      value specified in this option, and the action handler will return
     *      this value instead of the value of the button that has been
     *      switched off.
     *  @param {String} [options.updateCaptionMode='all']
     *      Specifies how to update the caption of the drop-down button when a
     *      list item in the drop-down menu has been activated. If set to
     *      'label', only the label text of the list item will be copied. If
     *      set to 'icon', only the icon will be copied. If set to 'none',
     *      nothing will be copied. By default, icon and label of the list item
     *      will be copied. Has no effect, if the radio group is not in
     *      drop-down mode.
     *  @param {Function} [options.updateCaptionHandler]
     *      A function that will be called after a list item has been
     *      activated, and the caption of the drop-down button has been updated
     *      according to the 'options.updateCaptionMode' option. Receives the
     *      button element of the activated list item (as jQuery object) in the
     *      first parameter (empty jQuery object, if no list item is active),
     *      and the value of the selected/activated list item in the second
     *      parameter (also if this value does not correspond to any existing
     *      list item). Will be called in the context of this radio group
     *      instance. Has no effect, if the radio group is not in drop-down
     *      mode.
     */
    function RadioList(options) {

        var // self reference
            self = this,

            // whether to highlight the drop-down menu button
            highlight = Utils.getBooleanOption(options, 'highlight', false),

            // fall-back value for toggle click
            toggleValue = Utils.getOption(options, 'toggleValue'),

            // which parts of a list item caption will be copied to the menu button
            updateCaptionMode = Utils.getStringOption(options, 'updateCaptionMode', 'all'),

            // custom update handler for the caption of the menu button
            updateCaptionHandler = Utils.getFunctionOption(options, 'updateCaptionHandler');

        // private methods ----------------------------------------------------

        /**
         * Returns all option buttons as jQuery collection.
         */
        function getOptionButtons() {
            return self.getListItems();
        }

        /**
         * Activates an option button in this radio group.
         *
         * @param value
         *  The value associated to the button to be activated. If set to null,
         *  does not activate any button (ambiguous state).
         */
        function updateHandler(value) {

            var // activate a radio button
                button = Utils.selectOptionButton(getOptionButtons(), value),
                // the options used to set the caption of the drop-down menu button
                captionOptions = options;

            // highlight the drop-down button
            Utils.toggleButtons(self.getMenuButton(), highlight && (button.length > 0));

            // update the caption of the drop-down menu button
            if (updateCaptionMode !== 'none') {
                if (button.length) {
                    if (updateCaptionMode !== 'label') {
                        captionOptions = Utils.extendOptions(captionOptions, { icon: Utils.getControlIcon(button) });
                    }
                    if (updateCaptionMode !== 'icon') {
                        captionOptions = Utils.extendOptions(captionOptions, { label: Utils.getControlLabel(button) });
                    }
                }
                Utils.setControlCaption(self.getMenuButton(), captionOptions);
            }

            // call custom update handler
            if (_.isFunction(updateCaptionHandler)) {
                updateCaptionHandler.call(self, button, value);
            }
        }

        /**
         * Click handler for an option button in this radio group. Will
         * activate the clicked button (or deactivate if clicked on an active
         * button in toggle mode), and return the value of the new active
         * option button.
         *
         * @param {jQuery} button
         *  The clicked button, as jQuery object.
         *
         * @returns
         *  The button value that has been passed to the addOptionButton()
         *  method.
         */
        function clickHandler(button) {
            var toggleClick = Utils.isButtonSelected(button) && !_.isNull(toggleValue) && !_.isUndefined(toggleValue),
                value = toggleClick ? toggleValue : Utils.getControlValue(button);
            updateHandler(value);
            return value;
        }

        // base constructor ---------------------------------------------------

        Group.call(this, options);
        List.call(this, options);

        // methods ------------------------------------------------------------

        /**
         * Removes all option buttons from this control.
         */
        this.clearOptionButtons = function () {
            this.clearListItems();
        };

        /**
         * Adds a new option button to this radio group.
         *
         * @param value
         *  The unique value associated to the button. Must not be null or
         *  undefined.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new button.
         *  Supports all generic formatting options for buttons (See method
         *  Utils.createButton() for details), except 'options.value' which
         *  will be set to the 'value' parameter passed to this function.
         *  Additionally, the following options are supported:
         *  @param {String} [options.tooltip]
         *      Tool tip text shown when the mouse hovers the button.
         *
         * @returns {RadioList}
         *  A reference to this instance.
         */
        this.addOptionButton = function (value, options) {

            var // options for the new button, including the passed value
                buttonOptions = Utils.extendOptions(options, { value: value }),
                // the new button
                button = this.createListItem(buttonOptions);

            // add tool tip
            Utils.setControlTooltip(button, Utils.getStringOption(options, 'tooltip'), 'bottom');
            return this;
        };

        // initialization -----------------------------------------------------

        // register event handlers
        this.registerUpdateHandler(updateHandler)
            .registerActionHandler(this.getMenuNode(), 'click', Utils.BUTTON_SELECTOR, clickHandler);

    } // class RadioList

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: RadioList });

});
