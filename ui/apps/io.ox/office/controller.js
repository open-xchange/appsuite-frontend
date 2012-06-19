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

define('io.ox/office/controller', ['io.ox/core/event'], function (Events) {

    'use strict';

    // class Controller =======================================================

    /**
     * A controller is a collection of items, consisting of key and value, and
     * providing arbitrary getter and setter methods for their values.
     *
     * @param definitions
     *  A map of key/definition pairs. Each attribute in this map defines an
     *  item, keyed by its name. Definitions are maps themselves, supporting
     *  the following attributes:
     *  - get: (optional) Getter function returning the current value of the
     *      item. Can be omitted for one-way action items (actions without a
     *      return value). Defaults to a getter returning undefined. Will be
     *      executed in the context of this controller.
     *  - set: (optional) Setter function changing the value of an item to the
     *      first parameter of the setter. Can be omitted for read-only items.
     *      Defaults to a no-op function. Will be executed in the context of
     *      this controller.
     *  - poll: (optional) If set to true, the controller will constantly poll
     *      the item value and notify its clients.
     */
    function Controller(definitions) {

        var // item definitions for all items
            allItems = {},
            // extra map for all polled items
            pollItems = {};

        // process passed definitions
        _(definitions).each(function (def, key) {
            if (key && _.isObject(def)) {
                var item = allItems[key] = {
                    // bind getters and setters to this controller
                    get: _.isFunction(def.get) ? _.bind(def.get, this) : $.noop,
                    set: _.isFunction(def.set) ? _.bind(def.set, this) : $.noop,
                    focus: _.isFunction(def.focus) ? _.bind(def.focus, this) : $.noop
                };
                if (def.poll === true) {
                    pollItems[key] = item;
                } else if (key in pollItems) {
                    delete pollItems[key];
                }
            }
        });

        /**
         * Registers a view component (e.g. a tool bar) that contains form
         * controls used to display item values and trigger item actions.
         *
         * @param component
         *  The view component to be registered. Must trigger 'change' events
         *  passing the item key and value as parameters, if a control has been
         *  activated in the user interface.
         *
         * @returns {Controller}
         *  A reference to this controller instance.
         */
        this.registerViewComponent = function (component) {
            component.on('change', function (event, key, value) {
                var item = allItems[key];
                if (item) {
                    item.set(value);
                    item.focus();
                }
            });
            return this;
        };

        /**
         * Unregisters a view component that has been registered with the
         * method registerViewComponent().
         *
         * @returns {Controller}
         *  A reference to this controller instance.
         */
        this.unregisterViewComponent = function (component) {
            component.off('change');
            return this;
        };

    }

    // exports ================================================================

    _.makeExtendable(Controller);

    return Controller;
});
