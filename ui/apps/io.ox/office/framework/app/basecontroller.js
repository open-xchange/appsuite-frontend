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
     'io.ox/office/tk/utils',
     'io.ox/office/tk/keycodes'
    ], function (Events, Utils, KeyCodes) {

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
     *
     * @param {Object} [options]
     *  A map with options controlling the behavior of this controller. The
     *  following options are supported:
     *  @param {Number} [options.updateDelay=100]
     *      The delay for the debounced Controller.update() method.
     *  @param {Number} [options.updateMaxDelay=1000]
     *      The maximum delay for the debounced Controller.update() method.
     */
    function BaseController(app, options) {

        var // self reference
            self = this,

            // all the little controller items
            items = {

                'app/quit': {
                    set: function () {
                        var def = $.Deferred();
                        // quit in a timeout (otherwise this controller becomes invalid while still running)
                        _.defer(function () {
                            // failed quit means that application continues to run
                            app.quit().fail(function () { def.resolve(); });
                        });
                        return def;
                    },
                    focus: 'wait' // application may resume
                },

                'document/print': {
                    // enabled in read-only mode
                    set: function () { app.print(); },
                    shortcut: { keyCode: 'P', ctrlOrMetaKey: true }
                }
            },

            // cached item values during a complex update
            resultCache = {},

            // number of item setters currently running (recursion counter)
            runningSetters = 0,

            // shortcut definitions for 'keydown', mapped by key code (for performance)
            keyShortcuts = {},

            // shortcut definitions for 'keypress', mapped by char code (for performance)
            charShortcuts = {};

        // class Item ---------------------------------------------------------

        function Item(key, definition) {

            var // self reference
                item = this,
                // global enabled state of the item
                enabled = true,
                // parent item whose value/state is needed to resolve the own value/state
                parentKey = Utils.getStringOption(definition, 'parent'),
                // handler for enabled state (default to constant true if missing)
                enableHandler = Utils.getFunctionOption(definition, 'enable', true),
                // handler for value getter (default to identity to forward parent value)
                getHandler = Utils.getFunctionOption(definition, 'get', _.identity),
                // handler for value setter
                setHandler = Utils.getFunctionOption(definition, 'set'),
                // behavior for returning browser focus to application
                focus = Utils.getStringOption(definition, 'focus', 'direct'),
                // additional user data
                userData = Utils.getOption(definition, 'userData');

            // private methods

            function getAndCacheResult(type, handler, parentValue) {

                var // get or create a result object in the cache
                    result = resultCache[key] || (resultCache[key] = {});

                // if the required value does not exist yet, resolve it via the passed handler
                if (!(type in result)) {
                    result[type] = _.isFunction(handler) ? handler.call(item, parentValue) : handler;
                }
                return result[type];
            }

            // methods

            /**
             * Returns whether this item is effectively enabled, by looking at
             * the own state, and by asking the enable handler of the item.
             */
            this.isEnabled = function () {
                var parentEnabled = enabled && ((parentKey in items) ? items[parentKey].isEnabled() : true);
                return getAndCacheResult('enable', (enabled && parentEnabled) ? enableHandler : false);
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
             * @param {Any} value
             *  The new value of the item.
             *
             * @param {Object} [options]
             *  A map with options controlling the behavior of this method. The
             *  following options are supported:
             *  @param {Boolean} [options.preserveFocus=false]
             *      If set to true, the browser focus will not be modified,
             *      regardless of the focus mode configured for this item.
             *
             * @returns {Item}
             *  A reference to this item.
             */
            this.change = function (value, options) {

                var // the result Deferred object
                    def = null;

                // do nothing if item is disabled
                if (this.isEnabled()) {

                    // execute the set handler
                    if (_.isFunction(setHandler)) {
                        runningSetters += 1;
                        def = setHandler.call(this, value);
                        runningSetters -= 1;
                    }

                    // convert result of the setter to a Deferred object
                    def = $.when(def);

                    // disable this item if setter is still running
                    if (def.state() === 'pending') {
                        enabled = false;
                        self.update();
                    }
                } else {
                    // item is disabled
                    def = $.Deferred().reject();
                }

                // focus back to application
                switch (focus) {
                case 'direct':
                    grabApplicationFocus(options);
                    break;
                case 'wait':
                    def.always(function () {
                        // execute in a timeout, needed for dialogs which are closed *after* resolve/reject
                        app.executeDelayed(function () { grabApplicationFocus(options); });
                    });
                    break;
                case 'never':
                    break;
                default:
                    Utils.warn('BaseController.Item.change(): unknown focus mode: ' + focus);
                }

                // post processing after the setter is finished
                def.always(function () {
                    enabled = true;
                    self.update();
                });

                return this;
            };

            /**
             * Returns the unique key of this item.
             *
             * @returns {String}
             *  The unique key this item has been registered with.
             */
            this.getKey = function () {
                return key;
            };

            /**
             * Returns the user data that has been registered with the
             * definition of this item.
             *
             * @returns {Any}
             *  The registered user data if existing, otherwise undefined.
             */
            this.getUserData = function () {
                return userData;
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
        function grabApplicationFocus(options) {
            if (!Utils.getBooleanOption(options, 'preserveFocus', false)) {
                app.getView().grabFocus();
            }
        }

        /**
         * Calls the set handler of the item with the registered key, and moves
         * the browser focus back to the application pane.
         */
        function callSetHandler(key, value, options) {
            if (key in items) {
                // do not clear cache if called recursively from another setter
                if (runningSetters === 0) { clearResultCache(); }
                items[key].change(value, options);
            } else {
                grabApplicationFocus(options);
            }
        }

        /**
         * The event handler function that will listen to 'change' events in
         * all registered view components.
         */
        function componentChangeHandler(event, key, value, options) {
            callSetHandler(key, value, options);
        }

        /**
         * The event handler function that will listen to 'cancel' events in
         * all registered view components.
         */
        function componentCancelHandler(event, options) {
            grabApplicationFocus(options);
        }

        /**
         * Handles 'keydown' and 'keypress' events and calls the setter of this
         * item, if it contains a matching keyboard shortcut definition.
         *
         * @param {jQuery.Event} event
         *  The jQuery event object. If a matching shortcut definition has been
         *  found, propagation of the event will be stopped, and the browser
         *  default action will be suppressed.
         */
        function keyHandler(event) {

            // executes the item setter defined in the passed shortcut
            function callSetHandlerForShortcut(shortcut) {

                var // call value resolver function, or take constant value
                    value = _.isFunction(shortcut.definition.value) ?
                        shortcut.definition.value(self.get(shortcut.key)) : shortcut.definition.value;

                callSetHandler(shortcut.key, value);
                if (!Utils.getBooleanOption(shortcut.definition, 'propagate', false)) {
                    event.stopPropagation();
                    event.preventDefault();
                }
            }

            switch (event.type) {
            case 'keydown':
                // process all shortcut definitions for the key code in the passed event
                if (event.keyCode in keyShortcuts) {
                    _(keyShortcuts[event.keyCode]).each(function (shortcut) {
                        // check if the additional control keys match the shortcut definition
                        if (KeyCodes.matchEventControlKeys(event, shortcut.definition)) {
                            callSetHandlerForShortcut(shortcut);
                        }
                    });
                }
                break;
            case 'keypress':
                // process all shortcut definitions for the char code in the passed event
                if (event.charCode in charShortcuts) {
                    _(charShortcuts[event.charCode]).each(callSetHandlerForShortcut);
                }
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
         *      The key of an item that will be used to calculate intermediate
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
         *      above) and it returned false, the item is disabled already, and
         *      this function will not be called anymore. Defaults to a
         *      function that always returns true.
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
         *      Defaults to an empty function. If the setter has been triggered
         *      by a registered keyboard shortcut (see below), the 'keydown'
         *      event object will be passed to the second parameter of the
         *      setter function.
         *  @param {Object|Array} [definition.shortcut]
         *      One or multiple keyboard shortcut definitions. If the window
         *      root node of the application receives a 'keydown' or 'keypress'
         *      event that matches a shortcut definition, the setter function
         *      of this item will be executed, and will receive the event
         *      object in its second parameter. Can be as single shortcut
         *      definition, or an array of shortcut definitions. Each
         *      definition object supports the following attributes:
         *      - {Number|String} [shortcut.charCode]
         *          If specified, the shortcut definition will be matched
         *          against 'keypress' events, and the value represents the
         *          numeric code point of a Unicode character, or the Unicode
         *          character as a string.
         *      - {Number|String} [shortcut.keyCode]
         *          If specified, the shortcut definition will be matched
         *          against 'keydown' events, and the value represents the
         *          numeric key code, or the upper-case name of a key code, as
         *          defined in the static class KeyCodes. Be careful with digit
         *          keys, for example, the number 9 matches the TAB key
         *          (KeyCodes.TAB), but the string '9' matches the digit '9'
         *          key (KeyCodes['9'] with the key code 57).
         *      - {Boolean|Null} [shortcut.shiftKey=false]
         *          If set to true, the SHIFT key must be pressed when the
         *          'keydown' events is received. If set to false (or omitted),
         *          the SHIFT key must not be pressed. If set to null, the
         *          current state of the SHIFT key will be ignored. Has no
         *          effect when evaluating 'keypress' events.
         *      - {Boolean|Null} [shortcut.altKey=false]
         *          If set to true, the ALT key must be pressed when the
         *          'keydown' events is received. If set to false (or omitted),
         *          the ALT key must not be pressed. If set to null, the
         *          current state of the ALT key will be ignored. Has no effect
         *          when evaluating 'keypress' events.
         *      - {Boolean|Null} [shortcut.ctrlKey=false]
         *          If set to true, the CTRL key must be pressed when the
         *          'keydown' events is received. If set to false (or omitted),
         *          the CTRL key must not be pressed. If set to null, the
         *          current state of the CTRL key will be ignored. Has no
         *          effect when evaluating 'keypress' events.
         *      - {Boolean|Null} [shortcut.metaKey=false]
         *          If set to true, the META key must be pressed when the
         *          'keydown' events is received. If set to false (or omitted),
         *          the META key must not be pressed. If set to null, the
         *          current state of the META key will be ignored. Has no
         *          effect when evaluating 'keypress' events.
         *      - {Boolean} [shortcut.altOrMetaKey=false]
         *          Convenience option that if set to true, matches if either
         *          the ALT key, or the META key are pressed. Has the same
         *          effect as defining two separate shortcuts, one with the
         *          'altKey' option set to true, and one with the 'metaKey'
         *          option set to true, while keeping the other option false.
         *          Must not be used in a shortcut definition where these
         *          options are set explicitly.
         *      - {Boolean} [shortcut.ctrlOrMetaKey=false]
         *          Convenience option that if set to true, matches if either
         *          the CTRL key, or the META key are pressed. Has the same
         *          effect as defining two separate shortcuts, one with the
         *          'ctrlKey' option set to true, and one with the 'metaKey'
         *          option set to true, while keeping the other option false.
         *          Must not be used in a shortcut definition where these
         *          options are set explicitly.
         *      - {Any|Function} [shortcut.value]
         *          The value that will be passed to the setter function of
         *          this item. If multiple shortcuts are defined for an item,
         *          each shortcut definition may define its own value. If this
         *          option contains a function, it will receive the current
         *          value of the controller item as first parameter, and its
         *          return value will be passed to the setter function.
         *      - {Boolean} [shortcut.propagate=false]
         *          If set to true, the event will propagate up to the DOM root
         *          element, and the browser will execute its default action
         *          (but the setter function called by this shortcut receives
         *          the event and may decide to cancel propagation manually).
         *          If omitted or set to false, the event will be cancelled
         *          immediately after calling the setter function.
         *  @param {String} [definition.focus='direct']
         *      Determines how to return the browser focus to the application
         *      pane after executing the setter function of this item. The
         *      following values are supported:
         *      - 'direct': (default) The focus will return directly after the
         *          setter function has been executed, regardless of the return
         *          value of the setter.
         *      - 'never': The focus will not be returned to the application
         *          pane. The setter function is responsible for application
         *          focus handling.
         *      - 'wait': The controller will wait until the Deferred object
         *          returned by the setter function gets resolved or rejected,
         *          and then sets the browser focus to the application pane.
         *  @param {Any} [definition.userData]
         *      Additional user data that will be provided by the method
         *      'Item.getUserData()'. Can be used in all item getter and setter
         *      methods.
         *
         * @returns {BaseController}
         *  A reference to this controller instance.
         */
        this.registerDefinition = function (key, definition) {
            if (_.isString(key) && key && _.isObject(definition)) {
                items[key] = new Item(key, definition);
                if (_.isObject(definition.shortcut)) {
                    _.chain(definition.shortcut).getArray().each(function (shortcut) {
                        var keyCode = Utils.getOption(shortcut, 'keyCode'),
                            charCode = Utils.getOption(shortcut, 'charCode');
                        if (_.isString(keyCode)) {
                            keyCode = KeyCodes[keyCode] || 0;
                        }
                        if (_.isNumber(keyCode) && (keyCode > 0)) {
                            (keyShortcuts[keyCode] || (keyShortcuts[keyCode] = [])).push({ key: key, definition: shortcut });
                        }
                        if (_.isString(charCode)) {
                            charCode = charCode.charCodeAt(0);
                        }
                        if (_.isNumber(charCode) && (charCode > 0)) {
                            (charShortcuts[charCode] || (charShortcuts[charCode] = [])).push({ key: key, definition: shortcut });
                        }
                    });
                }
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
            component.on({ change: componentChangeHandler, cancel: componentCancelHandler });
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
            return app.createDebouncedMethod(registerKey, triggerUpdate, {
                delay: Utils.getIntegerOption(options, 'updateDelay', 100, 0),
                maxDelay: Utils.getIntegerOption(options, 'updateMaxDelay', 1000, 0)
            });

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
            // do not clear the cache if currently running in a set handler
            if (runningSetters === 0) { clearResultCache(); }
            return (key in items) ? items[key].get() : undefined;
        };

        /**
         * Triggers a controller item manually. Executes the setter function of
         * the item associated to the specified key, passing in the new value.
         *
         * @param {String} key
         *  The key of the item to be changed.
         *
         * @param {Any} value
         *  The new value of the item.
         *
         * @param {Object} [options]
         *  A map with options controlling the behavior of this method. The
         *  following options are supported:
         *  @param {Boolean} [options.preserveFocus=false]
         *      If set to true, the browser focus will not be modified after
         *      executing the item, regardless of the focus mode configured for
         *      that item.
         *
         * @returns {BaseController}
         *  A reference to this controller.
         */
        this.change = function (key, value, options) {
            callSetHandler(key, value, options);
            return this;
        };

        this.destroy = function () {
            this.events.destroy();
            items = null;
        };

        // initialization -----------------------------------------------------

        // register item definitions
        this.registerDefinitions(items);

        // register keyboard event listener for shortcuts
        app.getView().getAppPaneNode().on('keydown keypress', keyHandler);

        // update once after import (successful and failed)
        app.on('docs:import:after', function () { self.update(); });

    } // class BaseController

    // exports ================================================================

    return _.makeExtendable(BaseController);

});
