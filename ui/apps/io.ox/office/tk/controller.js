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

define('io.ox/office/tk/controller', ['io.ox/office/tk/utils'], function (Utils) {

    'use strict';

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
            components = [],

            // keys of all items waiting for an update
            pendingKeys = [],

            // timer collecting multiple update requests
            updateTimeout = null,

            // cached results for chain operations
            chainedResults = {};

        // class Item ---------------------------------------------------------

        function Item(key, definition) {

            var enabled = true,
                // chained item
                chainKey = Utils.getStringOption(definition, 'chain'),
                // handler for enabled state
                enableHandler = Utils.getFunctionOption(definition, 'enable', _.identity),
                // handler for value getter
                getHandler = Utils.getFunctionOption(definition, 'get', _.identity),
                // handler for value setter
                setHandler = Utils.getFunctionOption(definition, 'set', $.noop),
                // done handler
                doneHandler = Utils.getFunctionOption(definition, 'done', defaultDoneHandler);

            /**
             * Returns whether this item is effectively enabled, by looking at
             * the own state, and by asking the enable handler of the item.
             */
            this.isEnabled = function () {
                var chainedEnable = enabled && (_.isString(chainKey) ? getChainedResult(chainKey, 'isEnabled') : true);
                return enabled && enableHandler.call(controller, chainedEnable);
            };

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
                _(components).invoke('enable', key, this.isEnabled());
                return this;
            };

            /**
             * Returns the current value of this item.
             */
            this.get = function () {
                var chainedValue = _.isString(chainKey) ? getChainedResult(chainKey, 'get') : undefined;
                return getHandler.call(controller, chainedValue);
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
                var value = this.get();
                value = _.isUndefined(value) ? defaultValue : value;
                _(components).invoke('enable', key, this.isEnabled());
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
                if (this.isEnabled()) {
                    setHandler.call(controller, value);
                    this.update(value);
                }
                doneHandler.call(controller);
                return this;
            };

        } // class Item

        // private methods ----------------------------------------------------

        /**
         * Clears all cached results of chained items.
         */
        function clearChainedResultCache() {
            chainedResults = {};
        }

        /**
         * Returns the chained result for the specified item key and attribute.
         * Creates a new empty result object if no result object exists yet,
         * and resolves the specified attribute.
         *
         * @param {String} key
         *  The key of the item whose attribute result will be cached and
         *  returned.
         *
         * @param {String} attribute
         *  An item attribute whose value will be cached and returned. May be
         *  'isEnabled' to get the value of the enabler function registered for
         *  the specified item, or 'get' to get the value of its getter
         *  function.
         */
        function getChainedResult(key, attribute) {
            var result = chainedResults[key] || (chainedResults[key] = {});
            if (!(attribute in result)) {
                result[attribute] = (key in items) ? items[key][attribute]() : undefined;
            }
            return result[attribute];
        }

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
                Utils.info('Controller: received change event: key="' + key + '", value=' + JSON.stringify(value));
                if (key in items) {
                    clearChainedResultCache();
                    items[key].change(value);
                } else {
                    defaultDoneHandler.call(controller);
                }
            } else if (event.type === 'cancel') {
                Utils.info('Controller: received cancel event');
                defaultDoneHandler.call(controller);
            }
        }

        // methods ------------------------------------------------------------

        /**
         * Adds the definition for a new item to this controller.
         *
         * @param {String} key
         *  The key of the new item.
         *
         * @param {Object} definition
         *  A map defining the item. The following attributes are supported:
         *  @param {String} [definition.chain]
         *      The name of an item that will be used to calculate intermediate
         *      results for the getter function and enabler function (see
         *      below). The key feature of chained items is that if a
         *      controller enables or updates multiple items at once, the
         *      chained item getter or enabler registered at multiple items
         *      will be executed exactly once before the first item getter or
         *      enabler is called, and its result will be cached and passed to
         *      all item getters or enablers that are using the same chained
         *      item.
         *  @param {Function} [definition.enable]
         *      Predicate function returning true if the item is enabled, and
         *      false otherwise. Will be executed in the context of this
         *      controller. If a chained item has been defined (see above), the
         *      cached return value of its enabler function will be passed to
         *      this function. This means that the enabler function of chained
         *      items may return other values then booleans, if the enablers of
         *      items using the chained item will calculate a boolean value
         *      from that result. Defaults to a function that returns always
         *      true; or, if a chained item has been registered, that returns
         *      its cached value.
         *  @param {Function} [definition.get]
         *      Getter function returning the current value of the item. Can be
         *      omitted for one-way action items (actions without a return
         *      value). Will be executed in the context of this controller. If
         *      a chained item has been defined (see above), the cached return
         *      value of its getter will be passed to this getter. May return
         *      null to indicate an ambiguous state. May return undefined to
         *      indicate that calculating the value is not applicable, not
         *      possible, not implemented, etc. In the case of an undefined
         *      return value, the current state of the controls in the view
         *      components will not be changed. Defaults to a function that
         *      returns undefined; or, if a chained item has been registered,
         *      that returns its cached value.
         *  @param {Function} [definition.set]
         *      Setter function changing the value of an item to the first
         *      parameter of the setter. Can be omitted for read-only items.
         *      Defaults to a no-op function. Will be executed in the context
         *      of this controller.
         *  @param {Function} [definition.done]
         *      A function that will be executed after the setter function has
         *      returned. If specified, overrides the default done handler
         *      passed to the constructor of this controller.
         *
         * @returns {Controller}
         *  A reference to this controller instance.
         */
        this.addDefinition = function (key, definition) {
            if (_.isString(key) && key && _.isObject(definition)) {
                items[key] = new Item(key, definition);
            }
            return this;
        };

        /**
         * Adds definitions for multiple items to this controller.
         *
         * @param {Object} definitions
         *  A map of key/definition pairs for all new items. Each item will be
         *  defined by calling the method Controller.addDefinition().
         *
         * @returns {Controller}
         *  A reference to this controller instance.
         */
        this.addDefinitions = function (definitions) {
            _(definitions).each(function (definition, key) { this.addDefinition(key, definition); }, this);
            return this;
        };

        /**
         * Registers a view component (e.g. a tool bar) that contains form
         * controls used to display item values and trigger item actions.
         *
         * @param {Component} component
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
         * method Controller.registerViewComponent().
         *
         * @param {Component} component
         *  A view component that has been registered with the method
         *  Controller.registerViewComponent() before.
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
         * @param {String|RegExp|Null} [keys]
         *  The keys of the items to be enabled or disabled, as space-separated
         *  string, or as regular expression. Strings have to match the keys
         *  exactly. If omitted, all items will be enabled or disabled. If set
         *  to null, no item will be enabled or disabled.
         *
         * @param {Boolean} [state=true]
         *  If omitted or set to true, the items will be enabled. Otherwise,
         *  the items will be disabled.
         *
         * @returns {Controller}
         *  A reference to this controller.
         */
        this.enable = function (keys, state) {
            clearChainedResultCache();
            _(selectItems(keys)).invoke('enable', state);
            return this;
        };

        /**
         * Disables the specified items, and updates all registered view
         * components. Shortcut for Controller.enable(keys, false).
         *
         * @param {String|RegExp|Null} [keys]
         *  The keys of the items to be disabled, as space-separated string, or
         *  as regular expression. Strings have to match the keys exactly. If
         *  omitted, all items will be disabled. If set to null, no item will
         *  be disabled.
         *
         * @returns {Controller}
         *  A reference to this controller.
         */
        this.disable = function (keys) {
            return this.enable(keys, false);
        };

        /**
         * Updates the values of the specified items, and updates all
         * registered view components.
         *
         * @param {String|RegExp|Null} [keys]
         *  The keys of the items to be updated, as space-separated string, or
         *  as regular expression. Strings have to match the keys exactly. If
         *  omitted, all items will be updated. If set to null, no item will be
         *  updated.
         *
         * @returns {Controller}
         *  A reference to this controller.
         */
        this.update = function (keys) {

            // update the array of pending keys
            if (_.isUndefined(keys)) {
                pendingKeys = undefined;
            } else if (_.isArray(pendingKeys) && (_.isString(keys) || _.isRegExp(keys))) {
                pendingKeys.push(keys);
            }

            // start a timeout that calls the item update handlers
            if (!updateTimeout) {
                updateTimeout = window.setTimeout(function () {
                    updateTimeout = null;
                    clearChainedResultCache();
                    _(selectItems(pendingKeys)).invoke('update');
                    pendingKeys = [];
                }, 0);
            }

            return this;
        };

        /**
         * Returns the current value of the specified item.
         *
         * @param {String} key
         *  The key of the item.
         *
         * @returns
         *  The current value of the item, or undefined, if the item does not
         *  exist.
         */
        this.get = function (key) {
            clearChainedResultCache();
            return (key in items) ? items[key].get() : undefined;
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
         * Triggers a cancel event manually. Executes the default done handler
         * of this controller.
         *
         * @returns {Controller}
         *  A reference to this controller.
         */
        this.cancel = this.done = function () {
            componentEventHandler({ type: 'cancel' });
            return this;
        };

        /**
         * Removes this controller from all event sources.
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
