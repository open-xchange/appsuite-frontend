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
     'io.ox/office/tk/control/button',
     'io.ox/office/tk/dropdown/list',
     'io.ox/office/tk/dropdown/grid'
    ], function (Utils, Group, Button, List, Grid) {

    'use strict';

    // class RadioList ========================================================

    /**
     * Creates a drop-down list control used to hold a set of radio buttons.
     *
     * @constructor
     *
     * @extends Group|Button
     * @extends List|Grid
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button and
     *  menu. Supports all options of the Group base class, and of the List
     *  mix-in class. Additionally, the following options are supported:
     *  @param {Boolean|Function} [options.highlight=false]
     *      If set to true, the drop-down button will be highlighted, if an
     *      existing list item in the drop-down menu is active. The drop-down
     *      button will not be highlighted, if the value of this group is
     *      undetermined (value null), or if there is no option button present
     *      with the current value of this group. If set to false, the
     *      drop-down button will never be highlighted, even if a list item in
     *      the drop-down menu is active. If set to a function, it will be
     *      called every time after a list item will be activated. The
     *      drop-down button will be highlighted if this handler function
     *      returns true. Receives the value of the selected/activated list
     *      item as first parameter (also if this value does not correspond to
     *      any existing list item). Will be called in the context of this
     *      radio group instance.
     *  @param {Any} [options.toggleValue]
     *      If set to a value different to null, the option button that is
     *      currently active can be clicked to be switched off. In that case,
     *      this radio group will activate the button associated to the value
     *      specified in this option, and the action handler will return this
     *      value instead of the value of the button that has been switched
     *      off.
     *  @param {Any} [options.splitValue]
     *      If set to a value different to null, a separate option button will
     *      be inserted next to the drop-down menu button, representing the
     *      value of this option.
     *  @param {String} [options.updateCaptionMode='all']
     *      Specifies how to update the caption of the drop-down button when a
     *      list item in the drop-down menu has been activated. Supports the
     *      keywords 'all' and 'none', or a space separated list containing the
     *      string tokens 'icon', 'label', and 'labelCss'.
     *      - 'icon': copies the icon of the list item to the drop-down button.
     *      - 'label': copies the label of the list item to the drop-down
     *          button.
     *      - 'labelCss': copies the label CSS formatting of the list item to
     *          the label of the drop-down button.
     *      The keyword 'all' is equivalent to 'icon label labelCss'. The
     *      keyword 'none' is equivalent to the empty string.
     *  @param {Function} [options.updateCaptionHandler]
     *      A function that will be called after a list item has been
     *      activated, and the caption of the drop-down button has been updated
     *      according to the 'options.updateCaptionMode' option. Receives the
     *      following parameters:
     *      (1) {jQuery} captionButton
     *          The caption button (the split button in split mode, otherwise
     *          the drop-down button) to be updated,
     *      (2) {Any} value
     *          The value of the selected/activated list item, or passed to the
     *          Group.update() method,
     *      (3) {jQuery} [optionButton]
     *          The button element of the activated list item (may be empty, if
     *          no list item is active).
     *      Will be called in the context of this radio group instance.
     *  @param {Function} [options.equality=_.equals]
     *      A comparison function that returns whether an arbitrary value
     *      should be considered being equal to the value of a list item in the
     *      drop-down menu. If omitted, uses _.equal() which compares arrays
     *      and objects deeply.
     */
    function RadioList(options) {

        var // self reference
            self = this,

            // whether to highlight the drop-down menu button
            highlight = Utils.getBooleanOption(options, 'highlight', false),

            // custom update handler to highlight the drop down menu button
            updateHighlightHandler = Utils.getFunctionOption(options, 'highlight'),

            // fall-back value for toggle click
            toggleValue = Utils.getOption(options, 'toggleValue'),

            // value of the split button
            splitValue = Utils.getOption(options, 'splitValue'),

            // which parts of a list item caption will be copied to the menu button
            updateCaptionMode = Utils.getStringOption(options, 'updateCaptionMode', 'all'),

            // custom update handler for the caption of the menu button
            updateCaptionHandler = Utils.getFunctionOption(options, 'updateCaptionHandler'),

            // comparator for list item values
            equality = Utils.getFunctionOption(options, 'equality'),

            // whether split button is enabled
            hasSplitButton = !_.isUndefined(splitValue) && !_.isNull(splitValue),

            // the base class for this group
            BaseClass = hasSplitButton ? Button : Group,

            // the mix-in class for the drop-down menu
            DropDownClass = Utils.getBooleanOption(options, 'itemGrid', false) ? Grid : List;

        // base constructors --------------------------------------------------

        BaseClass.call(this, Utils.extendOptions(options, { value: splitValue }));
        DropDownClass.call(this, Utils.extendOptions({ itemValueResolver: itemClickHandler }, options, { plainCaret: hasSplitButton }));

        // private methods ----------------------------------------------------

        /**
         * Scrolls the drop-down menu to make the specified list item visible.
         */
        function scrollToListItem(button) {
            if (button.length && self.isMenuVisible()) {
                Utils.scrollToChildNode(self.getMenuNode(), button);
            }
        }

        /**
         * Handles 'menuopen' events.
         */
        function menuOpenHandler() {
            scrollToListItem(Utils.getSelectedButtons(self.getItems()));
        }

        /**
         * Activates an option button in this radio group.
         *
         * @param value
         *  The value associated to the button to be activated. If set to null,
         *  does not activate any button (ambiguous state).
         */
        function itemUpdateHandler(value) {

            var // the target caption button
                captionButton = self.getCaptionButton(),
                // activate an option button
                optionButton = Utils.selectOptionButton(self.getItems(), value, equality),
                // the options used to create the list item button
                buttonOptions = optionButton.data('options') || {},
                // the options used to set the caption of the drop-down menu button
                captionOptions = _.clone(options),
                // whether the drop-down button will be highlighted
                isHighlighted = false;

            // highlight the drop-down button (call custom handler, if available)
            if (!_.isUndefined(value) && !_.isNull(value)) {
                if (_.isFunction(updateHighlightHandler)) {
                    isHighlighted = updateHighlightHandler.call(self, value);
                } else {
                    isHighlighted = highlight && (optionButton.length > 0);
                }
            }
            Utils.toggleButtons(self.getMenuButton().add(captionButton), isHighlighted);

            // update the caption of the drop-down menu button
            if (updateCaptionMode.length > 0) {
                _(updateCaptionMode).each(function (name) {
                    if (name in buttonOptions) {
                        captionOptions[name] = buttonOptions[name];
                    }
                });
                Utils.setControlCaption(captionButton, captionOptions);
            }

            // call custom update handler
            if (_.isFunction(updateCaptionHandler)) {
                updateCaptionHandler.call(self, captionButton, value, optionButton);
            }
        }

        /**
         * Returns the value of the clicked option button, taking the option
         * 'toggleClick' into account.
         */
        function itemClickHandler(button) {
            var toggleClick = Utils.isButtonSelected(button) && !_.isNull(toggleValue) && !_.isUndefined(toggleValue);
            return toggleClick ? toggleValue : Utils.getControlValue(button);
        }

        // methods ------------------------------------------------------------

        /**
         * Returns the button element that contains the caption.
         *
         * @returns {jQuery}
         *  The caption button. If this radio group contains a split button
         *  (see the 'options.splitValue' constructor option), the split button
         *  will be returned, otherwise the drop-down button.
         */
        this.getCaptionButton = function () {
            return hasSplitButton ? this.getButtonNode() : this.getMenuButton();
        };

        /**
         * Removes all option buttons from this control.
         *
         * @returns {RadioList}
         *  A reference to this instance.
         */
        this.clearOptionButtons = function () {
            this.clearItemGroup();
            return this;
        };

        /**
         * Adds a new option button to this radio list.
         *
         * @param value
         *  The unique value associated to the option button. Must not be null
         *  or undefined.
         *
         * @param {Object} [options]
         *  A map of options to control the properties of the new option
         *  button. Supports all options supported by the Items.createItem()
         *  method, except 'options.value' which will be set to the 'value'
         *  parameter passed to this method.
         *
         * @returns {RadioList}
         *  A reference to this instance.
         */
        this.createOptionButton = function (value, options) {

            var // options for the new button, including the passed value
                buttonOptions = Utils.extendOptions(options, { value: value });

            // the new button (button options needed for updating the drop-down menu button)
            this.createItem(buttonOptions).data('options', buttonOptions);
            return this;
        };

        // initialization -----------------------------------------------------

        // initialize caption update mode
        switch (updateCaptionMode) {
        case 'all':
            updateCaptionMode = ['icon', 'label', 'labelCss'];
            break;
        case 'none':
            updateCaptionMode = [];
            break;
        default:
            updateCaptionMode = updateCaptionMode.split(/\s+/);
        }

        // register event handlers
        this.on('menuopen', menuOpenHandler)
            .registerUpdateHandler(itemUpdateHandler);

    } // class RadioList

    // exports ================================================================

    // derive this class from class Group
    return Group.extend({ constructor: RadioList });

});
