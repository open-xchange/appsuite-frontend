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

define('io.ox/office/framework/app/basecontroller',
    ['io.ox/core/event',
     'io.ox/office/tk/utils'
    ], function (Events, Utils) {

    'use strict';

    // class BaseController ===================================================

    /**
     * A controller contains a collection of items, consisting of unique key
     * and value, and providing arbitrary getter and setter methods for their
     * values.
     *
     * @constructor
     *
     * @param {BaseApplication} app
     *  The application that has created this controller instance.
     */
    function BaseController(app) {

        var // self reference
            self = this,

            // cached item values during a complex update
            resultCache = {},

            // all the little controller items
            items = {

                'app/quit': {
                    // quit in a timeout (otherwise this controller becomes invalid while still running)
                    set: function () { _.defer(function () { app.quit(); }); }
                }
            };

        // class Item ---------------------------------------------------------

        function Item(key, definition) {

            var // self reference
                item = this,
                // global enabled state of the item
                enabled = true,
                // parent item whose value/state is needed to resolve the own value/state
                parentKey = Utils.getStringOption(definition, 'parent'),
                // handler for enabled state
                enableHandler = Utils.getFunctionOption(definition, 'enable', _.identity),
                // handler for value getter
                getHandler = Utils.getFunctionOption(definition, 'get', _.identity),
                // handler for value setter
                setHandler = Utils.getFunctionOption(definition, 'set', $.noop),
                // whether to return browser focus to application pane (default: true)
                done = Utils.getBooleanOption(definition, 'done', true),
                // whether the item executes asynchronously
                async = Utils.getBooleanOption(definition, 'async', false);

            function getAndCacheResult(type, handler, parentValue) {

                var // get or create a result object in the cache
                    result = resultCache[key] || (resultCache[key] = {});

                // if the required value does not exist yet, resolve it via the passed handler
                if (!(type in result)) {
                    result[type] = handler.call(item, parentValue);
                }
                return result[type];
            }

            /**
             * Returns whether this item is effectively enabled, by looking at
             * the own state, and by asking the enable handler of the item.
             */
            this.isEnabled = function () {
                var parentEnabled = enabled && ((parentKey in items) ? items[parentKey].isEnabled() : true);
                return enabled && getAndCacheResult('enable', enableHandler, parentEnabled);
            };

            /**
             * Returns the current value of this item.
             */
            this.get = function () {
                var parentValue = (parentKey in items) ? items[parentKey].get() : undefined;
                return getAndCacheResult('value', getHandler, parentValue);
            };

            /**
             * Executes the setter function of this item (passing in the new
             * value), and moves the browser focus back to the application
             * pane.
             *
             * @param value
             *  The new value of the item.
             *
             * @returns {Item}
             *  A reference to this item.
             */
            this.change = function (value) {

                var // the result Deferred object
                    def = null;

                // execute the set handler
                if (this.isEnabled()) {
                    if (async) {
                        enabled = false;
                        self.update(key);
                    }
                    def = setHandler.call(this, value);
                }

                $.when(def).always(function () {
                    enabled = true;
                    self.update();
                    // return focus to application pane
                    if (done) { grabApplicationFocus(); }
                });

                return this;
            };

        } // class Item

        // base constructor ---------------------------------------------------

        // add event hub
        Events.extend(this);

        // private methods ----------------------------------------------------

        /**
         * Clears all cached item results.
         */
        function clearResultCache() {
            resultCache = {};
        }

        /**
         * Moves the browser focus to the application pane.
         */
        function grabApplicationFocus() {
            app.getView().grabFocus();
        }

        /**
         * Calls the set handler of the item with the registered key, and moves
         * the browser focus back to the application pane.
         */
        function callSetHandler(key, value) {
            if (key in items) {
                clearResultCache();
                items[key].change(value);
            } else {
                grabApplicationFocus();
            }
        }

        /**
         * The event handler function that will listen to 'change' and 'cancel'
         * events in all registered view components.
         */
        function componentEventHandler(event, key, value) {
            switch (event.type) {
            case 'change':
                callSetHandler(key, value);
                break;
            case 'cancel':
                grabApplicationFocus();
                break;
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
         *  A map with callback functions defining the behavior of the item.
         *  All callback functions will be executed in the context of the Item
         *  class instance. The following attributes are supported:
         *  @param {String} [definition.parent]
         *      The name of an item that will be used to calculate intermediate
         *      results for the getter function and enabler function (see
         *      below). The key feature of parent items is that if a controller
         *      enables or updates multiple items at once, the getter or
         *      enabler of the same parent item registered at multiple items
         *      will be executed exactly once before the first item getter or
         *      enabler is called, and its result will be cached and passed to
         *      all item getters or enablers that are using this parent item.
         *  @param {Function} [definition.enable]
         *      Predicate function returning true if the item is enabled, and
         *      false otherwise. If a parent item has been specified (see
         *      above), the cached return value of its enabler function will be
         *      passed to this function. This means that the enabler function
         *      of parent items may return other values then booleans, if the
         *      enablers of items using the parent item will calculate a
         *      boolean value from that result. Defaults to a function that
         *      returns always true; or, if a parent item has been registered,
         *      that returns its cached value.
         *  @param {Function} [definition.get]
         *      Getter function returning the current value of the item. Can be
         *      omitted for one-way action items (actions without a return
         *      value). If a parent item has been specified (see above), the
         *      cached return value of its getter will be passed to this
         *      getter. May return null to indicate an ambiguous state. May
         *      return undefined to indicate that calculating the value is not
         *      applicable, not possible, not implemented, etc. In the case of
         *      an undefined return value, the current state of the controls in
         *      the view components will not be changed. Defaults to a function
         *      that returns undefined; or, if a parent item has been
         *      registered, that returns its cached value directly.
         *  @param {Function} [definition.set]
         *      Setter function changing the value of an item to the first
         *      parameter of the setter. Can be omitted for read-only items.
         *      Defaults to an empty function.
         *  @param {Function} [definition.async=false]
         *      If set to true, the setter function executes asynchronously and
         *      MUST return a Deferred object. As long as the setter function
         *      runs, the item will be disabled. When the Deferred object has
         *      been resolved or rejected, the item will be enabled and
         *      updated again.
         *  @param {Boolean} [definition.done=true]
         *      If set to false, the browser focus will not be moved to the
         *      application pane after an item setter has been executed.
         *
         * @returns {BaseController}
         *  A reference to this controller instance.
         */
        this.registerDefinition = function (key, definition) {
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
         *  defined by calling the method BaseController.registerDefinition().
         *  See this method for more details.
         *
         * @returns {BaseController}
         *  A reference to this controller instance.
         */
        this.registerDefinitions = function (definitions) {
            _(definitions).each(function (definition, key) {
                this.registerDefinition(key, definition);
            }, this);
            return this;
        };

        /**
         * Registers an event listener at the passed view component containing
         * form controls used to display item values and trigger item actions.
         *
         * @param {Component} component
         *  The view component to be registered. Must trigger 'change' events
         *  passing the item key and value as parameters, if a control has been
         *  activated in the user interface; or 'cancel' events to return to
         *  the application without doing anything.
         *
         * @returns {BaseController}
         *  A reference to this controller instance.
         */
        this.registerViewComponent = function (component) {
            component.on('change cancel', componentEventHandler);
            return this;
        };

        /**
         * Receives the current values of the specified items, and triggers an
         * 'update' event.
         *
         * @param {String} [key]
         *  The key of the item to be updated. If omitted, all items will be
         *  updated.
         *
         * @returns {BaseController}
         *  A reference to this controller.
         */
        this.update = (function () {

            var // pending controller items to be updated
                pendingItems = {};

            // direct callback: called every time when BaseController.update() has been called
            function registerKey(key) {
                if (_.isUndefined(key)) {
                    pendingItems = undefined;
                } else if (pendingItems && _.isString(key) && (key in items)) {
                    pendingItems[key] = items[key];
                }
                return self;
            }

            // deferred callback: called once, after current script ends
            function triggerUpdate() {

                // collect states of all matching items in resultCache
                clearResultCache();
                _(pendingItems || items).each(function (item) {
                    item.isEnabled();
                    item.get();
                });
                pendingItems = {};

                // notify all listeners
                self.trigger('update', resultCache);
            }

            // create and return the debounced BaseController.update() method
            return app.createDebouncedMethod(registerKey, triggerUpdate);

        }()); // BaseController.update()

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
            clearResultCache();
            return (key in items) ? items[key].get() : undefined;
        };

        /**
         * Triggers a controller item manually. Executes the setter function of
         * the item associated to the specified key, passing in the new value.
         *
         * @param {String} key
         *  The key of the item to be changed.
         *
         * @param value
         *  The new value of the item.
         *
         * @returns {BaseController}
         *  A reference to this controller.
         */
        this.change = function (key, value) {
            callSetHandler(key, value);
            return this;
        };

        this.destroy = function () {
            this.events.destroy();
            items = null;
        };

        // initialization -----------------------------------------------------

        // register item definitions
        this.registerDefinitions(items);

    } // class BaseController

    // exports ================================================================

    return _.makeExtendable(BaseController);

});
