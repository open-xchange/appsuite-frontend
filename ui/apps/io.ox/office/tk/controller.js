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
     *  item, keyed by its name. Definitions are maps themselves, supporting
     *  the following attributes:
     *  @param {Function} [definitions.enable]
     *      Predicate function returning true if the item is enabled, and false
     *      otherwise. Defaults to a function returning always true.
     *  @param {Function} [definitions.get]
     *      Getter function returning the current value of the item. Can be
     *      omitted for one-way action items (actions without a return value).
     *      May return null to indicate an ambiguous state, or undefined to
     *      indicate a 'no value' state independent from the type of the item.
     *      Defaults to a getter returning undefined. Will be executed in the
     *      context of this controller.
     *  @param {Function} [definitions.set]
     *      Setter function changing the value of an item to the first
     *      parameter of the setter. Can be omitted for read-only items.
     *      Defaults to a no-op function. Will be executed in the context of
     *      this controller.
     */
    function Controller(definitions) {

        var // definitions for all items, mapped by item key
            allItems = {},
            // registered view components
            components = [];

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
                return allItems;
            }

            // convert passed parameter to array
            keys =
                _.isString(keys) ? keys.split(/\s+/) :  // string: space-separated list to array
                _.isRegExp(keys) ? [keys] :             // regular expression: one-element array
                _.isArray(keys) ? keys :                // array: nothing to do
                [];                                     // default: select nothing

            // pick items by string key or by regular expression
            _(keys).each(function (key) {
                if (_.isString(key) && (key in allItems)) {
                    matchingItems[key] = allItems[key];
                } else if (_.isRegExp(key)) {
                    _(allItems).each(function (item, itemKey) {
                        if (key.test(itemKey)) { matchingItems[itemKey] = item; }
                    });
                }
            });

            return matchingItems;
        }

        /**
         * Updates all controls associated to the specified items according to
         * the current item value.
         *
         * @param {Object[]} components
         *  View components to be updated, as array.
         *
         * @param {Object} items
         *  Items to be updated in the view components, according to their
         *  current value and enabled state.
         */
        function updateComponents(components, items) {
            _(items).each(function (item, key) {
                // ask if item is dynamically disabled
                var enabled = item.enabled && item.enable();
                _(components).invoke('enable', key, enabled);
                // pass undefined value for disabled items
                var value = enabled ? item.get() : undefined;
                _(components).invoke('update', key, value);
            });
        }

        /**
         * The listener function that will listen to 'change' events in all
         * registered view components.
         */
        function componentListener(event, key, value) {
            var item = allItems[key];
            if (item && item.enabled) {
                item.set(value);
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Registers a view component (e.g. a tool bar) that contains form
         * controls used to display item values and trigger item actions.
         *
         * @param {Object} component
         *  The view component to be registered. Must trigger 'change' events
         *  passing the item key and value as parameters, if a control has been
         *  activated in the user interface. Must support the method enable()
         *  taking an item key and state parameter. Must support the method
         *  update() taking the key and value of an item.
         *
         * @returns {Controller}
         *  A reference to this controller instance.
         */
        this.registerViewComponent = function (component) {
            if (!_(components).contains(component)) {
                components.push(component);
                updateComponents([component], allItems);
                component.on('change', componentListener);
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
                component.off('change', componentListener);
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

            var // get all items specified by the passed selector
                items = selectItems(keys);

            // enable/disable the items
            var enabled = (state === true) || (state === undefined);
            _(items).each(function (item, key) {
                item.enabled = enabled;
            });

            // update all view components
            updateComponents(components, items);

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
                items = selectItems(keys);

            // enable/disable the items
            _(allItems).each(function (item, key) {
                item.enabled = key in items;
            });

            // update all view components
            updateComponents(components, allItems);

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
            updateComponents(components, selectItems(keys));
            return this;
        };

        /**
         * Destructor: Removes this controller from all event sources.
         */
        this.destroy = function () {
            // unregister from view components
            _(components).each(function (component) {
                component.off('change', componentListener);
            });
            allItems = components = null;
        };

        // initialization -----------------------------------------------------

        // process passed definitions
        _(definitions).each(function (def, key) {
            if (key && _.isObject(def)) {
                // build the item object
                allItems[key] = {
                    // bind getters and setters to this controller instance
                    enable: _.isFunction(def.enable) ? _.bind(def.enable, this) : TRUE,
                    get: _.isFunction(def.get) ? _.bind(def.get, this) : $.noop,
                    set: _.isFunction(def.set) ? _.bind(def.set, this) : $.noop,
                    // items are initially disabled
                    enabled: false
                };
            }
        });

    } // class Controller

    // exports ================================================================

    _.makeExtendable(Controller);

    return Controller;
});
