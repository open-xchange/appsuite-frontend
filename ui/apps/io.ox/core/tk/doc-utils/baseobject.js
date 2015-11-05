/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 */

define('io.ox/core/tk/doc-utils/baseobject', [
], function () {

    'use strict';

    // class BaseObject =======================================================

    /**
     * An abstract base class for all classes that want to register destructor
     * code that will be executed when the public method BaseObject.destoy()
     * has been invoked.
     *
     * @constructor
     */
    function BaseObject() {

        var // internal unique object identifier
            uid = _.uniqueId('obj'),

            // all event source objects and listeners
            listeners = null,

            // all destructor callbacks
            destructors = null;

        // protected methods --------------------------------------------------

        /**
         * Registers a destructor callback function that will be invoked when
         * the method BaseObject.destroy() has been called.
         *
         * @internal
         *  Intended to be used by the internal implementations of sub classes.
         *  DO NOT CALL from external code!
         *
         * @param {Function} destructor
         *  A destructor callback function. The BaseObject.destroy() method
         *  will invoke all registered destructor callbacks in reverse order of
         *  registration. The callback will be invoked in the context of this
         *  instance.
         *
         * @returns {BaseObject}
         *  A reference to this instance.
         */
        this.registerDestructor = function (destructor) {
            (destructors || (destructors = [])).unshift(destructor);
            return this;
        };

        // public methods -----------------------------------------------------

        /**
         * Returns the globally unique identifier for this instance.
         *
         * @returns {String}
         *  The globally unique identifier for this instance.
         */
        this.getUid = function () {
            return uid;
        };

        /**
         * Registers an event listener at the specified event source object. On
         * destruction of this instance, all event listeners registered with
         * this method will be removed from the source object.
         *
         * @param {jQuery|Events} source
         *  The event source object. Can be any object that provides a method
         *  'on()' to register an event listener (for example, jQuery objects,
         *  or any object extended with the core Events mix-in class).
         *
         * @param {String|Object} type
         *  The type of the event to listen to. Can be a space-separated list
         *  of event type names. Alternatively, can be an object mapping event
         *  types to listener callback functions.
         *
         * @param {Function} [listener]
         *  The event listener that will be invoked for the events triggered by
         *  the event source object. This parameter will be ignored, if the
         *  parameter 'type' is an object mapping event types to listener
         *  callback functions.
         *
         * @returns {BaseObject}
         *  A reference to this instance.
         */
        this.listenTo = function (source, type, listener) {

            // the function that binds the listener to an event source or promise
            function binderFunc(evtType, evtListener) {
                listeners.push({ source: source, type: evtType, listener: evtListener });
                source.on(evtType, evtListener);
            }

            // create the array of known listeners on demand
            listeners = listeners || [];

            // bug 36850: handle event maps and string/function parameters
            var eventMap;
            if (_.isObject(type)) {
                eventMap = type;
            } else {
                eventMap = {};
                eventMap[type] = listener;
            }
            _.each(eventMap, function (evtListener, evtTypes) {
                _.each(evtTypes.split(/\s+/), function (evtType) {
                    if (evtType.length > 0) {
                        binderFunc.call(this, evtType, evtListener);
                    }
                }, this);
            }, this);

            return this;
        };

        /**
         * Removes event listeners that have been registered for the passed
         * event source object using the method BaseObject.listenTo().
         *
         * @param {jQuery|Events} source
         *  The event source object, as has been passed to the method
         *  BaseObject.listenTo().
         *
         * @param {String|Object} [type]
         *  If specified, the type of the event to stop listening to. Can be a
         *  space-separated list of event type names. Alternatively, can be an
         *  object mapping event types to listener callback functions. If
         *  omitted, the event listeners for all registered event types will be
         *  removed (optionally filtered by a specific event listener function,
         *  see parameter 'listener').
         *
         * @param {Function} [listener]
         *  If specified, the event listener that will be removed for the event
         *  source object. If omitted, all event listeners of the event source
         *  will be removed (optionally filtered by specific event types, see
         *  parameter 'type'). This parameter will be ignored, if the parameter
         *  'type' is an object mapping event types to listener callback
         *  functions.
         *
         * @returns {BaseObject}
         *  A reference to this instance.
         */
        this.stopListeningTo = function (source, type, listener) {

            // unbinds the passed event type and/or listener (either parameter can be null)
            function unbindListener(evtTypes, evtListener) {

                // convert type string to array of single event types
                evtTypes = _.isString(evtTypes) ? _.without(evtTypes.split(/\s+/), '') : null;

                // detach all matching event listeners for the passed object
                _.each(listeners, function (data) {
                    // === equals check insufficient for jquery elements -> jq.is()
                    if ((data.source instanceof $ ? data.source.is(source) : data.source === source) && (!evtTypes || _.contains(evtTypes, data.type)) && (!evtListener || (evtListener === data.listener))) {
                        source.off(data.type, data.listener);
                    }
                });
            }

            if (_.isFunction(type) && _.isUndefined(listener)) {
                // 'type' may be omitted completely (instead of being set to null)
                unbindListener(null, type);
            } else if (_.isObject(type)) {
                // bug 36850: unbind all passed event types of an event map
                _.each(type, function (evtListener, evtTypes) {
                    unbindListener(evtTypes, evtListener);
                });
            } else {
                unbindListener(type, listener);
            }

            return this;
        };

        /**
         * Registers a callback function at the specified promise that waits
         * for it to be resolved. When this instance will be destroyed before
         * the promise resolves, the callback function will not be invoked.
         *
         * @param {jQuery.Promise} promise
         *  The promise.
         *
         * @param {Function} callback
         *  The callback function to be invoked when the promise resolves.
         *
         * @returns {BaseObject}
         *  A reference to this instance.
         */
        this.waitForSuccess = function (promise, callback) {
            // register a callback function that checks the destroyed flag of this instance
            promise.done(function () {
                if (!this.destroyed) { return callback.apply(this, arguments); }
            }.bind(this));
            return this;
        };

        /**
         * Registers a callback function at the specified promise that waits
         * for it to be rejected. When this instance will be destroyed before
         * the promise rejects, the callback function will not be invoked.
         *
         * @param {jQuery.Promise} promise
         *  The promise.
         *
         * @param {Function} callback
         *  The callback function to be invoked when the promise rejects.
         *
         * @returns {BaseObject}
         *  A reference to this instance.
         */
        this.waitForFailure = function (promise, callback) {
            // register a callback function that checks the destroyed flag of this instance
            promise.fail(function () {
                if (!this.destroyed) { return callback.apply(this, arguments); }
            }.bind(this));
            return this;
        };

        /**
         * Registers a callback function at the specified promise that waits
         * for it to be resolved or rejected. When this instance will be
         * destroyed before the promise resolves or rejects, the callback
         * function will not be invoked.
         *
         * @param {jQuery.Promise} promise
         *  The promise.
         *
         * @param {Function} callback
         *  The callback function to be invoked when the promise resolves or
         *  rejects.
         *
         * @returns {BaseObject}
         *  A reference to this instance.
         */
        this.waitForAny = function (promise, callback) {
            // register a callback function that checks the destroyed flag of this instance
            promise.always(function () {
                if (!this.destroyed) { return callback.apply(this, arguments); }
            }.bind(this));
            return this;
        };

        /**
         * Destroys this object. Invokes all destructor callback functions that
         * have been registered for this instance in reverse order. Afterwards,
         * all public properties and methods of this instance will be deleted,
         * and a single property 'destroyed' will be inserted and set to the
         * value true.
         */
        this.destroy = function () {

            // unregister all event listeners
            _.each(listeners, function (data) {
                // source object may have been destroyed already
                if (data.source.off) { data.source.off(data.type, data.listener); }
            });
            listeners = null;

            // invoke all destructor callbacks
            _.each(destructors, function (destructor) { destructor.call(this); }, this);
            destructors = null;

            // delete all public members, to detect any misuse after destruction
            _.each(this, function (member, name) { delete this[name]; }, this);
            this.destroyed = true;
            this.uid = uid;
        };

    } // class BaseObject

    // exports ================================================================

    return _.makeExtendable(BaseObject);

});
