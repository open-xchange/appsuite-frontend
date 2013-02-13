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
     'io.ox/office/tk/dropdown/list',
     'io.ox/office/tk/dropdown/grid'
    ], function (Utils, Group, List, Grid) {

    'use strict';

    // class RadioList ========================================================

    /**
     * Creates a drop-down list control used to hold a set of radio buttons.
     *
     * @constructor
     *
     * @extends Group
     * @extends List|Grid
     *
     * @param {Object} [options]
     *  A map of options to control the properties of the drop-down button and
     *  menu. Supports all options of the Group base class, and of the List
     *  mix-in class. Additionally, the following options are supported:
     *  @param {Boolean|Function} [options.highlight=false]
     *      If set to true, the drop-down button will be highlighted if a list
     *      item in the drop-down menu is active. If set to false, the
     *      drop-down button will never be highlighted, even if a list item in
     *      the drop-down menu is active. If set to a function, it will be
     *      called every time after when list item will be activated. The
     *      drop-down button will be highlighted if this handler function
     *      returns true. Receives the value of the selected/activated list
     *      item as first parameter (also if this value does not correspond to
     *      any existing list item). Will be called in the context of this
     *      radio group instance.
     *  @param [options.toggleValue]
     *      If set to a value different to null or undefined, the option button
     *      that is currently active can be clicked to be switched off. In that
     *      case, this radio group will activate the button associated to the
     *      value specified in this option, and the action handler will return
     *      this value instead of the value of the button that has been
     *      switched off.
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
     *      button element of the activated list item (as jQuery object) in the
     *      first parameter (empty jQuery object, if no list item is active),
     *      and the value of the selected/activated list item in the second
     *      parameter (also if this value does not correspond to any existing
     *      list item). Will be called in the context of this radio group
     *      instance.
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

            // which parts of a list item caption will be copied to the menu button
            updateCaptionMode = Utils.getStringOption(options, 'updateCaptionMode', 'all'),

            // custom update handler for the caption of the menu button
            updateCaptionHandler = Utils.getFunctionOption(options, 'updateCaptionHandler'),

            // the mix-in class for the drop-down menu
            DropDownClass = Utils.getBooleanOption(options, 'itemGrid', false) ? Grid : List;

        // base constructor ---------------------------------------------------

        Group.call(this, options);
        DropDownClass.call(this, Utils.extendOptions({ itemValueResolver: itemClickHandler }, options));

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

            var // activate a radio button
                button = Utils.selectOptionButton(self.getItems(), value),
                // the options used to create the list item button
                buttonOptions = button.data('options') || {},
                // the options used to set the caption of the drop-down menu button
                captionOptions = _.clone(options),
                isHighlighted = false;

            // highlight the drop-down button
            if (_.isFunction(updateHighlightHandler)) {  // call custom update handler, if available
                isHighlighted = updateHighlightHandler.call(self, value);
            } else {
                isHighlighted = highlight && (button.length > 0);
            }

            Utils.toggleButtons(self.getMenuButton(), isHighlighted);

            // update the caption of the drop-down menu button
            if (updateCaptionMode.length > 0) {
                _(updateCaptionMode).each(function (name) {
                    if (name in buttonOptions) {
                        captionOptions[name] = buttonOptions[name];
                    }
                });
                Utils.setControlCaption(self.getMenuButton(), captionOptions);
            }

            // call custom update handler
            if (_.isFunction(updateCaptionHandler)) {
                updateCaptionHandler.call(self, button, value);
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
         * Removes all option buttons from this control.
         */
        this.clearOptionButtons = function () {
            this.clearItems();
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
         *  button. Supports all options supported by the method
         *  List.createItem(), except 'options.value' which will be set to the
         *  'value' parameter passed to this method.
         *
         * @returns {RadioList}
         *  A reference to this instance.
         */
        this.addOptionButton = function (value, options) {

            var // options for the new button, including the passed value
                buttonOptions = Utils.extendOptions(options, { value: value });

            // the new button (button options needed for updating the drop-down menu button)
            this.createItem(buttonOptions).data('options', buttonOptions);
            return this;
        };

        // initialization -----------------------------------------------------

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
