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

define('io.ox/office/tk/controller', function () {

    'use strict';

    // static functions =======================================================

    /**
     * Dummy predicate function returning always true.
     */
    function TRUE() { return true; }

    // class Controller =======================================================

    /**
     * A controller contains a collection of items, consisting of unique key
     * and value, and providing arbitrary getter and setter methods for their
     * values.
     *
     * @constructor
     *
     * @param {Object} definitions
     *  A map of key/definition pairs. Each attribute in this map defines an
     *  item, keyed by its name. See method Controller.addDefinitions() for
     *  details.
     *
     * @param {Function} [defaultDoneHandler]
     *  A function that will run when an item setter function has been executed
     *  after a 'change' event and the item does not define its own done
     *  handler, or if a view component triggers a 'cancel' event. Will be
     *  executed in the context of this controller.
     */
    function Controller(definitions, defaultDoneHandler) {

        var // self reference
            controller = this,

            // definitions for all items, mapped by item key
            items = {},

            // registered view components
            components = [];

        // class Item ---------------------------------------------------------

        function Item(key, definition) {

            var enabled = true,
                // handler for enabled state
                enableHandler = _.isFunction(definition.enable) ? definition.enable : TRUE,
                // handler for value getter
                getHandler = _.isFunction(definition.get) ? definition.get : $.noop,
                // handler for value setter
                setHandler = _.isFunction(definition.set) ? definition.set : $.noop,
                // done handler
                doneHandler = _.isFunction(definition.done) ? definition.done : defaultDoneHandler;

            /**
             * Returns whether this item is effectively enabled, by looking at
             * the own state, and by asking the enable handler of the item.
             */
            function isEnabled() {
                return enabled && enableHandler.call(controller);
            }

            /**
             * Enables or disables this item, and updates all registered view
             * components.
             *
             * @param {Boolean} [state=true]
             *  If omitted or set to true, the item will be enabled. Otherwise,
             *  the item will be disabled.
             *
             * @returns {Item}
             *  A reference to this item.
             */
            this.enable = function (state) {
                enabled = _.isUndefined(state) || (state === true);
                return this.update();
            };

            /**
             * Updates the controls associated to this item in all view
             * components.
             *
             * @param [defaultValue]
             *  The default value if the value getter returns undefined.
             *
             * @returns {Item}
             *  A reference to this item.
             */
            this.update = function (defaultValue) {
                var value = getHandler.call(controller);
                value = _.isUndefined(value) ? defaultValue : value;
                _(components).invoke('enable', key, isEnabled());
                if (!_.isUndefined(value)) {
                    _(components).invoke('update', key, value);
                }
                return this;
            };

            /**
             * Executes the setter function of this item (passing in the new
             * value), and the done handler, and updates all registered view
             * components.
             *
             * @param value
             *  The new value of the item.
             *
             * @returns {Item}
             *  A reference to this item.
             */
            this.change = function (value) {
                if (isEnabled()) {
                    setHandler.call(controller, value);
                    this.update(value);
                }
                doneHandler.call(controller);
                return this;
            };

        } // class Item

        // private methods ----------------------------------------------------

        /**
         * Returns all items matching the passed key selector in a map.
         *
         * @param {String|RegExp|String[]|RegExp[]|Null} [keys]
         *  The keys of the items to be included into the result, as
         *  space-separated string, or as regular expression, or as array of
         *  strings or regular expressions (also mixed). Strings have to match
         *  the keys exactly. If omitted, all registered items will be
         *  returned. If set to null, an empty map will be returned.
         *
         * @returns {Object}
         *  A map of all items with matching keys, mapped by their keys.
         */
        function selectItems(keys) {

            var // result collection
                matchingItems = {};

            // return all items, if parameter is missing
            if (_.isUndefined(keys)) {
                return items;
            }

            // convert passed parameter to array
            keys =
                _.isString(keys) ? keys.split(/\s+/) :  // string: space-separated list to array
                _.isRegExp(keys) ? [keys] :             // regular expression: one-element array
                _.isArray(keys) ? keys :                // array: nothing to do
                [];                                     // default: select nothing

            // pick items by string key or by regular expression
            _(keys).each(function (key) {
                if (_.isString(key) && (key in items)) {
                    matchingItems[key] = items[key];
                } else if (_.isRegExp(key)) {
                    _(items).each(function (item, itemKey) {
                        if (key.test(itemKey)) { matchingItems[itemKey] = item; }
                    });
                }
            });

            return matchingItems;
        }

        /**
         * The event handler function that will listen to 'change' and 'cancel'
         * events in all registered view components.
         */
        function componentEventHandler(event, key, value) {
            if (event.type === 'change') {
                if (key in items) {
                    items[key].change(value);
                } else {
                    defaultDoneHandler.call(controller);
                }
            } else if (event.type === 'cancel') {
                defaultDoneHandler.call(controller);
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Adds more item definitions to this controller.
         *
         * @param {Object} definitions
         *  A map of key/definition pairs. Each attribute in this map defines
         *  an item, keyed by its name. Definitions are maps themselves,
         *  supporting the following attributes:
         *  @param {Function} [definitions.enable]
         *      Predicate function returning true if the item is enabled, and
         *      false otherwise. Defaults to a function returning always true.
         *  @param {Function} [definitions.get]
         *      Getter function returning the current value of the item. Can be
         *      omitted for one-way action items (actions without a return
         *      value). May return null to indicate an ambiguous state. May
         *      return undefined to indicate that calculating the value is not
         *      applicable, not possible, not implemented, etc. In the case of
         *      an undefined return value, the current state of the controls in
         *      the view components will not be changed. Defaults to a getter
         *      returning undefined. Will be executed in the context of this
         *      controller.
         *  @param {Function} [definitions.set]
         *      Setter function changing the value of an item to the first
         *      parameter of the setter. Can be omitted for read-only items.
         *      Defaults to a no-op function. Will be executed in the context
         *      of this controller.
         *  @param {Function} [definitions.done]
         *      A function that will be executed after the setter function has
         *      returned. If specified, overrides the default done handler
         *      passed to the constructor of this controller.
         *
         * @returns {Controller}
         *  A reference to this controller instance.
         */
        this.addDefinitions = function (definitions) {
            _(definitions).each(function (definition, key) {
                if (_.isString(key) && key && _.isObject(definition)) {
                    items[key] = new Item(key, definition);
                }
            });
            return this;
        };

        /**
         * Registers a view component (e.g. a tool bar) that contains form
         * controls used to display item values and trigger item actions.
         *
         * @param {Object} component
         *  The view component to be registered. Must trigger 'change' events
         *  passing the item key and value as parameters, if a control has been
         *  activated in the user interface, or 'cancel' events to return to
         *  the application without doing anything. Must support the method
         *  enable() taking an item key and state parameter. Must support the
         *  method update() taking the key and value of an item.
         *
         * @returns {Controller}
         *  A reference to this controller instance.
         */
        this.registerViewComponent = function (component) {
            if (!_(components).contains(component)) {
                components.push(component);
                component.on('change cancel', componentEventHandler);
            }
            return this;
        };

        /**
         * Unregisters a view component that has been registered with the
         * method registerViewComponent().
         *
         * @param {Object} component
         *  A view component that has been registered with the method
         *  registerViewComponent() before.
         *
         * @returns {Controller}
         *  A reference to this controller instance.
         */
        this.unregisterViewComponent = function (component) {
            if (_(components).contains(component)) {
                component.off('change cancel', componentEventHandler);
                components = _(components).without(component);
            }
            return this;
        };

        /**
         * Enables or disables the specified items, and updates all registered
         * view components.
         *
         * @param {String|RegExp|String[]|RegExp[]|Null} [keys]
         *  The keys of the items to be enabled or disabled, as space-separated
         *  string, or as regular expression, or as array of strings or regular
         *  expressions (also mixed). Strings have to match the keys exactly.
         *  If omitted, all items will be enabled. If set to null, all items
         *  will be disabled.
         *
         * @param {Boolean} [state=true]
         *  If omitted or set to true, the items will be enabled. Otherwise,
         *  the items will be disabled.
         *
         * @returns {Controller}
         *  A reference to this controller.
         */
        this.enable = function (keys, state) {
            _(selectItems(keys)).invoke('enable', state);
            return this;
        };

        /**
         * Disables the specified items, and updates all registered view
         * components. Shortcut for Controller.enable(keys, false).
         *
         * @param {String|RegExp|String[]|RegExp[]|Null} [keys]
         *  The keys of the items to be disabled, as space-separated string, or
         *  as regular expression, or as array of strings or regular
         *  expressions (also mixed). Strings have to match the keys exactly.
         *  If omitted, all items will be enabled. If set to null, all items
         *  will be disabled.
         *
         * @returns {Controller}
         *  A reference to this controller.
         */
        this.disable = function (keys) {
            return this.enable(false);
        };

        /**
         * Enables or disables all items, and updates all registered view
         * components. Items matching the specified selector will be enabled,
         * all other items will be disabled.
         *
         * @param {String|RegExp|String[]|RegExp[]|Null} [keys]
         *  The keys of the items to be enabled, as space-separated string, or
         *  as regular expression, or as array of strings or regular
         *  expressions (also mixed). Strings have to match the keys exactly.
         *  If omitted, all items will be enabled. If set to null, all items
         *  will be disabled.
         *
         * @returns {Controller}
         *  A reference to this controller.
         */
        this.enableAndDisable = function (keys) {

            var // get all items specified by the passed selector
                enabledItems = selectItems(keys);

            // enable/disable the items
            _(items).each(function (item, key) {
                item.enable(key in enabledItems);
            });

            return this;
        };

        /**
         * Updates the values of the specified items, and updates all
         * registered view components.
         *
         * @param {String|RegExp|String[]|RegExp[]|Null} [keys]
         *  The keys of the items to be updated, as space-separated string, or
         *  as regular expression, or as array of strings or regular
         *  expressions (also mixed). Strings have to match the keys exactly.
         *  If omitted, all items will be updated. If set to null, no item will
         *  be updated.
         *
         * @returns {Controller}
         *  A reference to this controller.
         */
        this.update = function (keys) {
            _(selectItems(keys)).invoke('update');
            return this;
        };

        /**
         * Triggers a change event manually. Executes the setter function of
         * the item associated to the specified key, passing in the new value.
         *
         * @param {String} key
         *  The key of the item to be changed.
         *
         * @param value
         *  The new value of the item.
         *
         * @returns {Controller}
         *  A reference to this controller.
         */
        this.change = function (key, value) {
            componentEventHandler({ type: 'change' }, key, value);
            return this;
        };

        /**
         * Destructor: Removes this controller from all event sources.
         */
        this.destroy = function () {
            // unregister from view components
            _(components).invoke('off', 'change cancel', componentEventHandler);
            items = components = null;
        };

        // initialization -----------------------------------------------------

        defaultDoneHandler = _.isFunction(defaultDoneHandler) ? defaultDoneHandler : $.noop;
        this.addDefinitions(definitions);

    } // class Controller

    // exports ================================================================

    return _.makeExtendable(Controller);

});
