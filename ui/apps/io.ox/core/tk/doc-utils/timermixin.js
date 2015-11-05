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

define('io.ox/core/tk/doc-utils/timermixin', [
], function () {

    'use strict';

    // mix-in class TimerMixin ================================================

    /**
     * A mix-in class for any class based on BaseObject that adds helper
     * methods for delayed, repeated, and debounced code execution. All timers
     * created by these methods consider the lifetime of the instance they have
     * been invoked from. If the instance has been destroyed, no pending timer
     * code for that instance will be executed anymore. See the descriptions of
     * the methods for more details.
     *
     * Intended as mix-in for the class BaseObject or any of its sub classes.
     * The constructor MUST be called with the calling context bound to the
     * object instance to be extended.
     *
     * @constructor
     */
    function TimerMixin() {

        var // self reference
            self = this,

            // all pending abortable promises registered for this instance
            pendingPromises = [];

        // private methods ----------------------------------------------------

        /**
         * Adds an abort() method to the passed promise which invokes the
         * specified callback functions. The abort() method will accept a
         * single optional parameter 'cause', that if omitted defaults to the
         * string 'abort'.
         *
         * @param {jQuery.Promise}
         *  A promise that will be extended with an abort() method.
         *
         * @param {Function} abort
         *  The implementation of the generated abort() method. Will be called
         *  with undefined context, and forwards the parameter 'cause' passed
         *  to the generated abort() method.
         *
         * @param {Function} [custom]
         *  An addition custom user-defined callback function that will be
         *  called before executing the specified 'abort' callback function.
         *  Will be called in the context of the promise, and forwards and
         *  forwards the parameter 'cause' passed to the generated abort()
         *  method.
         */
        function createAbortMethod(promise, abort, custom) {

            // create the new abort() method
            promise.abort = function (cause) {
                // prevent recursive calls from callback functions
                if (promise.state() === 'pending') {
                    if (_.isUndefined(cause)) { cause = 'abort'; }
                    if (_.isFunction(custom)) { custom.call(this, cause); }
                    abort(cause);
                }
                return this;
            };

            // replace the abort() method in resolved promise
            promise.always(function () {
                promise.abort = function () { return this; };
            });
        }

        /**
         * Overrides the then() method of the passed abortable promise with a
         * version that creates and returns a piped promise with an abort()
         * method which aborts the original abortable promise.
         *
         * @param {jQuery.Promise} abortablePromise
         *  The abortable promise whose then() method will be overridden.
         */
        function overrideThenMethod(abortablePromise) {

            var // the original then() method of the passed promise
                thenMethod = _.bind(abortablePromise.then, abortablePromise),
                // the original abort() method of the passed promise
                abortMethod = _.bind(abortablePromise.abort, abortablePromise);

            // create the new then() method which returns an abortable promise
            abortablePromise.then = function (done, fail, notify, abort) {

                var // the new piped promise returned by the original then() method
                    pipedPromise = thenMethod(done, fail, notify);

                // add a custom abort() method, that aborts the passed promise
                createAbortMethod(pipedPromise, abortMethod, abort);

                // override the then() method of the promise with an abortable version
                overrideThenMethod(pipedPromise);

                return pipedPromise;
            };

            // prevent using the deprecated pipe() method
            delete abortablePromise.pipe;
        }

        // public methods -----------------------------------------------------

        /**
         * Creates a promise for the passed deferred object representing code
         * running asynchronously. The promise will contain an additional
         * method abort() that (when called before the deferred object has been
         * resolved or rejected) invokes the specified callback function, and
         * rejects the passed deferred object. Additionally, the promise will
         * be stored internally as long as it is in pending state. When this
         * instance will be destroyed, all pending promises will be aborted
         * automatically.
         *
         * @param {jQuery.Deferred} deferred
         *  The deferred object to create an abortable promise for.
         *
         * @param {Function} [callback]
         *  An optional callback function that will be invoked when the promise
         *  has been aborted, and the deferred object is still pending. Will be
         *  called in the context of this instance.
         *
         * @param {Number} [timeout]
         *  If specified and a positive number, the delay time in milliseconds
         *  after the promise returned by this method will be rejected, if the
         *  passed original deferred object is still pending.
         *
         * @returns {jQuery.Promise}
         *  A promise for the passed deferred object, with an additional method
         *  abort().
         */
        this.createAbortablePromise = function (deferred, callback, timeout) {

            var // the promise of the passed deferred object
                promise = deferred.promise();

            // add a custom abort() method to the promise, rejecting the passed deferred object
            createAbortMethod(promise, _.bind(deferred.reject, deferred), callback);

            // override the then() method of the promise with an abortable version
            overrideThenMethod(promise);

            // do not process a deferred object that is not pending anymore, but create the abort() method
            if (promise.state() === 'pending') {

                // add the new promise to the internal array of pending promises
                pendingPromises.push(promise);

                // remove the promise from the array when it resolves
                promise.always(function () {
                    pendingPromises = _.without(pendingPromises, promise);
                });

                // abort automatically after the specified timeout
                if (_.isNumber(timeout) && (timeout > 0)) {
                    var timer = window.setTimeout(function () {
                        if (promise.state() === 'pending') { promise.abort('timeout'); }
                    }, timeout);
                    promise.always(function () {
                        if (timer) { window.clearTimeout(timer); timer = null; }
                    });
                }
            }

            callback = null;
            return promise;
        };

        /**
         * Invokes the passed callback function once in a browser timeout. If
         * this instance will be destroyed before the callback function has
         * been started, it will not be called anymore.
         *
         * @param {Function} callback
         *  The callback function that will be executed in a browser timeout
         *  after the delay time. Does not receive any parameters. Will be
         *  called in the context of this instance.
         *
         * @param {Object|Number} [options]
         *  Optional parameters:
         *  @param {Number} [options.delay=0]
         *      The time (in milliseconds) the execution of the passed callback
         *      function will be delayed.
         *  Can also be a number, allowing to pass the value of the option
         *  'delay' directly.
         *
         * @returns {jQuery.Promise}
         *  A promise that will be resolved after the callback function has
         *  been executed. If the callback function returns a simple value or
         *  object, the promise will be resolved with that value. If the
         *  callback function returns a promise by itself, its state and result
         *  value will be forwarded to the promise returned by this method. The
         *  promise contains an additional method abort() that can be called
         *  before the timeout has been fired to cancel the pending execution
         *  of the callback function. In that case, the promise will be
         *  rejected. If this instance will be destroyed before invoking the
         *  callback function, the timer will be aborted automatically, and the
         *  promise will be rejected.
         */
        this.executeDelayed = function (callback, options) {

            var // the delay time for the next execution of the callback
                delay = Math.max(0, _.isNumber(options) ? options : (options && options.delay || 0)),
                // the current browser timeout identifier
                timeout = null,
                // the resulting deferred object
                def = $.Deferred(),
                // the abortable promise for the deferred object
                promise = this.createAbortablePromise(def, function () {
                    if (timeout) { window.clearTimeout(timeout); timeout = null; }
                });

            // create a new browser timeout
            timeout = window.setTimeout(function () {
                timeout = null;
                // execute the callback function, forward its result to the promise
                $.when(callback.call(self)).done(_.bind(def.resolve, def)).fail(_.bind(def.reject, def));
            }, delay);

            return promise;
        };

        /**
         * Invokes the passed callback function repeatedly in a browser timeout
         * loop. If this instance will be destroyed before the callback
         * function has been started, or while the callback function will be
         * repeated, it will not be called anymore.
         *
         * @param {Function} callback
         *  The callback function that will be invoked repeatedly in a browser
         *  timeout loop after the initial delay time. Receives the zero-based
         *  index of the execution cycle as first parameter. Will be called in
         *  the context of this instance. The return value of the function will
         *  be used to decide whether to continue the repeated execution. If
         *  the function returns TimerMixin.BREAK, execution will be stopped. If the
         *  function returns a promise, looping will be deferred until the
         *  promise is resolved or rejected. After resolving the promise, the
         *  delay time will start, and the callback will be invoked again.
         *  Otherwise, after the promise has been rejected, execution will be
         *  stopped, and the promise returned by this method will be rejected
         *  too. All other return values will be ignored, and the callback loop
         *  will continue.
         *
         * @param {Object|Number} [options]
         *  Optional parameters:
         *  @param {Number|String} [options.delay=0]
         *      The time (in milliseconds) the initial invocation of the passed
         *      callback function will be delayed. If set to the special value
         *      'immediate', the callback function will be executed immediately
         *      (synchronously) with the invocation of this method.
         *  @param {Number} [options.repeatDelay]
         *      The time (in milliseconds) the repeated invocation of the
         *      passed callback function will be delayed. If omitted, the
         *      specified initial delay time passed with the option 'delay'
         *      will be used. If the option 'delay' is set to 'immediate', the
         *      value of this option will be 0.
         *  @param {Number} [options.cycles]
         *      If specified, the maximum number of cycles to be executed.
         *  @param {Boolean} [options.fastAsync=false]
         *      If set to true, and the callback function returns a pending
         *      promise, the delay time for the next invocation of the callback
         *      function will be reduced by the time the promise is pending. By
         *      default, the delay time always starts after the promise has
         *      been resolved.
         *  Can also be a number, allowing to pass the value of the option
         *  'delay' (and also 'repeatDelay' which defaults to the value of the
         *   option 'delay') directly.
         *
         * @returns {jQuery.Promise}
         *  A promise that will be resolved or rejected after the callback
         *  function has been invoked the last time. The promise will be
         *  resolved, if the callback function has returned the TimerMixin.BREAK
         *  object in the last iteration, or if the maximum number of
         *  iterations (see option 'cycles') has been reached. It will be
         *  rejected, if the callback function has returned a rejected promise.
         *  The returned promise contains an additional method abort() that can
         *  be called before or while the callback loop is executed to stop the
         *  loop immediately. In that case, the promise will be rejected. If
         *  this instance will be destroyed before or during the callback loop,
         *  the loop timer will be aborted automatically, and the promise will
         *  be rejected.
         */
        this.repeatDelayed = function (callback, options, timerInfo) {

            var // the delay time for the first invocation of the callback
                initDelay = Math.max(0, _.isNumber(options) ? options : (options && options.delay || 0)),
                // the delay time for the next invocations of the callback
                repeatDelay = Math.max(0, (options && options.repeatDelay || initDelay)),
                // the number of cycles to be executed
                cycles = options && options.cycles || null,
                // whether to reduce delay time after asynchronous callbacks
                fastAsync = Boolean(options && options.fastAsync),
                // the index of the next cycle
                index = 0,
                // the current timeout before invoking the callback
                timer = null,
                // the resulting deferred object
                def = $.Deferred(),
                // the abortable promise for the deferred object
                promise = this.createAbortablePromise(def, function () {
                    if (timer) { timer.abort(); timer = null; }
                });

            // invokes the callback function
            function invokeCallback() {

                var // the result of the callback
                    result = callback.call(self, index),
                    // whether the result was a pending promise
                    pending = false,
                    // start time of pending asynchronous callback
                    t0 = 0;

                // immediately break the loop if callback returns TimerMixin.BREAK
                if (result === TimerMixin.BREAK) {
                    def.resolve(TimerMixin.BREAK);
                    return;
                }

                // convert to a promise, check whether it is still pending
                result = $.when(result);
                pending = result.state() === 'pending';
                t0 = pending ? _.now() : 0;

                // wait for the result
                result.done(function () {
                    // do not create a new timeout if execution has been aborted while the asynchronous code was running
                    if (def.state() !== 'pending') { return; }
                    // decide whether to start the next iteration
                    index += 1;
                    if (!_.isNumber(cycles) || (index < cycles)) {
                        createTimer((fastAsync && pending) ? Math.max(0, repeatDelay - (_.now() - t0)) : repeatDelay);
                    } else {
                        def.resolve();
                    }
                });

                // reject the own deferred object on failure
                result.fail(_.bind(def.reject, def));
            }

            // creates and registers a browser timeout that executes the callback
            function createTimer(delay) {
                timer = self.executeDelayed(invokeCallback, delay, timerInfo);
            }

            // immediately invoke callback the first time if specified, otherwise start the initial timer
            if (options && options.delay === 'immediate') {
                invokeCallback();
            } else {
                createTimer(initDelay);
            }

            return promise;
        };

        /**
         * Invokes the passed callback function repeatedly until it returns a
         * specific value. To prevent performance problems (frozen user
         * interface of the browser), the callback function may be invoked from
         * several time slices of a browser timeout loop. In difference to the
         * method TimerMixin.repeatDelayed() that uses an own browser timeout
         * for each invocation of the callback function, this method tries to
         * pack multiple invocations into a single time slice until the total
         * execution time of the time slice is exceeded, and continues with a
         * new time slice in another browser timeout afterwards. If this
         * instance will be destroyed while the loop is running, it will be
         * aborted immediately.
         *
         * @param {Function} callback
         *  The callback function that will be invoked repeatedly. Receives the
         *  zero-based index of the execution cycle as first parameter. Will be
         *  called in the context of this instance. The return value of the
         *  function will be used to decide whether to continue the repeated
         *  execution (see parameter 'callback' of the method
         *  TimerMixin.repeatDelayed() for details).
         *
         * @param {Object} [options]
         *  Optional parameters:
         *  @param {Number|String} [options.delay=0]
         *      The initial delay time (in milliseconds) before invoking the
         *      callback function the first time. If set to the special value
         *      'immediate', the callback function will be executed immediately
         *      (synchronously) with the invocation of this method.
         *  @param {Number} [options.slice=200]
         *      The time (in milliseconds) for a single synchronous time slice.
         *      The callback function will be invoked repeatedly until the time
         *      has elapsed; or until the callback function returns
         *      TimerMixin.BREAK, a pending promise, or a rejected promise (see
         *      parameter 'callback' above for more details).
         *  @param {Number} [options.interval=10]
         *      The delay time (in milliseconds) between two time slices. if
         *      callback function returns a pending promise, the implementation
         *      will wait for that promise to resolve, and will add a shorter
         *      delay (shortened by the time the promise has needed to resolve)
         *      before continuing the loop.
         *  @param {String} [options.infoString]
         *      If specified, this string is used for logging information about
         *      run times of asynchronous operations. This option is only
         *      evaluated, if debug mode is enabled.
         *
         * @returns {jQuery.Promise}
         *  A promise that will be resolved after the callback function returns
         *  TimerMixin.BREAK; or that will be rejected, if the callback function
         *  returns a rejected promise. The promise will be notified each time
         *  a new time slice starts (with the zero-based index of the next
         *  iteration cycle). The promise contains an additional method abort()
         *  that can be called to abort the loop immediately. In that case, the
         *  promise will be rejected. If this instance will be destroyed before
         *  or during the callback loop, the loop timer will be aborted
         *  automatically, and the promise will be rejected.
         */
        this.repeatSliced = function (callback, options) {

            var // slice time for synchronous processing
                slice = Math.max(10, (options && options.slice || 200)),
                // a string information to identify the asynchronous function
                infoString = options && options.infoString || '',
                // index of the next cycle
                index = 0,
                // the interval timer for the time slices
                timer = null,
                // the resulting deferred object
                def = $.Deferred(),
                // the abortable promise for the resulting deferred object
                promise = this.createAbortablePromise(def, function () {
                    if (timer) { timer.abort(); timer = null; }
                });

            // create the interval timer with the passed delay options
            timer = this.repeatDelayed(function () {

                var // start time of this iteration
                    start = _.now(),
                    // current return value of the callback function
                    result = null;

                // notify the own deferred object about the progress (once per time slice)
                def.notify(index);

                // time slice implementation: invoke callback repeatedly (loop body returns on any exit conditions)
                while (true) {

                    // invoke the callback function
                    result = callback.call(self, index);
                    index += 1;

                    // callback has returned TimerMixin.BREAK: resolve the own deferred
                    // object immediately, and break the background loop
                    if (result === TimerMixin.BREAK) {
                        def.resolve(TimerMixin.BREAK);
                        return TimerMixin.BREAK;
                    }

                    // callback has returned a pending or rejected promise: return it to defer
                    // the loop (ignore resolved promises and continue with next invocation)
                    if (_.isObject(result) && _.isFunction(result.promise) && (result.state() !== 'resolved')) {
                        return result;
                    }

                    // check elapsed time at the end of the loop body (this ensures
                    // that the callback will be executed at least once)
                    if (_.now() - start >= slice) {
                        return;
                    }
                }
            }, {
                delay: options && options.delay,
                repeatDelay: Math.max(0, (options && options.interval || 10)),
                fastAsync: true
            }, infoString);

            // resolve/reject the own deferred object when the timer has finished
            timer.done(_.bind(def.resolve, def)).fail(_.bind(def.reject, def));

            return promise;
        };

        /**
         * Invokes the passed callback function for all elements contained in
         * the passed data array. To prevent performance problems (frozen user
         * user interface of the browser), the callback function will be
         * invoked from several time slices of a browser timeout loop. If this
         * instance will be destroyed while the loop is running, it will be
         * aborted immediately.
         *
         * @param {Array|jQuery|String} array
         *  A JavaScript array, or another array-like object that provides a
         *  'length' property, and element access via bracket notation.
         *
         * @param {Function} callback
         *  The callback function that will be invoked for each array element.
         *  Receives the following parameters:
         *  (1) {Any} element
         *      The current array element.
         *  (2) {Number} index
         *      The array index of the current element.
         *  (3) {Array|jQuery} array
         *      The entire array as passed in the 'array' parameter.
         *  Will be called in the context of this instance. The return value of
         *  the callback function will be used to decide whether to continue to
         *  process the next array elements (see parameter 'callback' of the
         *  method TimerMixin.repeatDelayed() for details).
         *
         * @param {Object} [options]
         *  Optional parameters. See method TimerMixin.repeatSliced() for
         *  details about all supported options. Additionally, the following
         *  options are supported:
         *  @param {Boolean} [options.reverse=false]
         *      If set to true, the array elements will be visited in reversed
         *      order. In reverse mode, the callback function may remove the
         *      array element currently visited, or elements that are following
         *      the visited element, from the array in-place.
         *  @param {String} [options.infoString]
         *      If specified, this string is used for logging information about
         *      run times of asynchronous operations. This option is only
         *      evaluated, if debug mode is enabled.
         *
         * @returns {jQuery.Promise}
         *  A promise that will be resolved after all array elements have been
         *  processed successfully, or the callback function returns
         *  TimerMixin.BREAK; or that will be rejected, if the callback function
         *  returns a rejected promise. The promise will be notified about the
         *  progress (as a floating-point value between 0.0 and 1.0). The
         *  promise contains an additional method abort() that can be called to
         *  cancel the loop immediately while processing the array. In that
         *  case, the promise will be rejected. If this instance will be
         *  destroyed before or during the callback loop, the loop timer will
         *  be aborted automatically, and the promise will be rejected.
         */
        this.iterateArraySliced = function (array, callback, options) {

            var // whether to iterate in reversed order
                reverse = Boolean(options && options.reverse || false),
                // current array index
                arrayIndex = reverse ? (array.length - 1) : 0,
                // promise representing the sliced loop
                timer = null,
                // the resulting deferred object
                def = $.Deferred(),
                // the abortable promise of the resulting deferred object
                promise = this.createAbortablePromise(def, function () {
                    if (timer) { timer.abort(); timer = null; }
                });

            // do nothing if passed array is empty
            if (array.length === 0) {
                def.notify(1).resolve();
                return promise;
            }

            // start the sliced loop
            timer = this.repeatSliced(function () {

                // end of array reached
                if ((arrayIndex < 0) || (arrayIndex >= array.length)) {
                    def.resolve();
                    return TimerMixin.BREAK;
                }

                // invoke the callback function for a single array element
                var result = callback.call(self, array[arrayIndex], arrayIndex, array);

                // next array index
                arrayIndex = reverse ? (arrayIndex - 1) : (arrayIndex + 1);

                // immediately resolve after last element unless the result is a pending or rejected promise
                if (((arrayIndex < 0) || (arrayIndex >= array.length)) && !(_.isObject(result) && _.isFunction(result.promise) && (result.state() !== 'resolved'))) {
                    def.resolve();
                    return TimerMixin.BREAK;
                }

                return result;
            }, options);

            // resolve/reject the own deferred object according to the timer result
            timer.done(_.bind(def.resolve, def)).fail(_.bind(def.reject, def));

            // notify the own deferred object about the progress (once per time slice)
            timer.progress(function (index) { def.notify(index / array.length); });
            promise.done(function () { def.notify(1); });

            return promise;
        };

        /**
         * Invokes the passed callback function for all properties contained in
         * the passed object. To prevent performance problems (frozen user user
         * interface of the browser), the callback function will be invoked
         * from several time slices of a browser timeout loop. If this instance
         * will be destroyed while the loop is running, it will be aborted
         * immediately.
         *
         * @param {Object} object
         *  A JavaScript object whose properties will be iterated.
         *
         * @param {Function} callback
         *  The callback function that will be invoked for each object property
         *  (in no specific order). Receives the following parameters:
         *  (1) {Any} value
         *      The value of the current property.
         *  (2) {String} key
         *      The name of the current property.
         *  (3) {Object} object
         *      The entire object as passed in the 'object' parameter.
         *  Will be called in the context of this instance. The return value of
         *  the callback function will be used to decide whether to continue to
         *  process the next object properties (see parameter 'callback' of the
         *  method TimerMixin.repeatDelayed() for details).
         *
         * @param {Object} [options]
         *  Optional parameters. See method TimerMixin.repeatSliced() for
         *  details about all supported options.
         *
         * @returns {jQuery.Promise}
         *  A promise that will be resolved after all object properties have
         *  been processed successfully, or the callback function returns
         *  TimerMixin.BREAK; or that will be rejected, if the callback function
         *  returns a rejected promise. The promise will be notified about the
         *  progress (as a floating-point value between 0.0 and 1.0). The
         *  promise contains an additional method abort() that can be called to
         *  cancel the loop immediately while processing the properties. In
         *  that case, the promise will be rejected. If this instance will be
         *  destroyed before or during the callback loop, the loop timer will
         *  be aborted automatically, and the promise will be rejected.
         */
        this.iterateObjectSliced = function (object, callback, options) {
            return this.iterateArraySliced(_.keys(object), function (key) {
                if (key in object) { return callback.call(this, object[key], key, object); }
            }, options);
        };

        /**
         * Creates a synchronized method wrapping a callback function that
         * executes asynchronous code. The synchronized method buffers multiple
         * fast invocations and executes the callback function successively,
         * always waiting for the asynchronous code. In difference to debounced
         * methods, invocations of a synchronized method will never be skipped,
         * and each call of the asynchronous callback function receives its
         * original arguments passed to the synchronized method.
         *
         * @param {Function} callback
         *  A function that will be called every time the synchronized method
         *  has been called. Will be called in the context the synchronized
         *  method has been called with, and receives all parameters that have
         *  been passed to the synchronized method. If this function returns a
         *  pending promise, subsequent invocations of the synchronized method
         *  will be postponed until the promise will be resolved or rejected.
         *  All other return values will be interpreted as synchronous
         *  invocations of the callback function.
         *
         * @param {String} [timerInfo]
         *  An optional string that is used to debug run times of asynchronous
         *  functions. This parameter is only used, if the debug mode is enabled.
         *
         * @returns {Function}
         *  The synchronized method that can be called multiple times, and that
         *  executes the asynchronous callback function sequentially. Returns
         *  a promise that will be resolved or rejected after the callback
         *  function has been invoked. If the callback function returns a
         *  promise, the synchronized method will wait for it, and will forward
         *  its state and response to its promise. Otherwise, the promise will
         *  be resolved with the return value of the callback function. If this
         *  instance will be destroyed, processing the chain of pending method
         *  invocations will be aborted.
         */
        this.createSynchronizedMethod = function (callback, timerInfo) {

            var // arguments and returned Promise of pending calls of the method
                pendingInvocations = [],
                // the background loop processing all pending invocations
                timer = null;

            // invokes the first pending callback function (used as callback for repeatDelayed())
            function invokeCallback() {

                // stop background loop if array is empty (all callbacks invoked)
                if (pendingInvocations.length === 0) { return TimerMixin.BREAK; }

                var // the first pending invocation (keep in array until it resolves)
                    invocationData = pendingInvocations[0],
                    // create the promise representing the result of the callback function
                    promise = $.when(callback.apply(invocationData.ctxt, invocationData.args)),
                    // the deferred object bound to the result of the callback
                    def = invocationData.def;

                // remove invocation data from array when the promise has been resolved/rejected
                promise.always(function () { pendingInvocations.shift(); });

                // forward result of the promise to the deferred object
                promise.done(_.bind(def.resolve, def)).fail(_.bind(def.reject, def));

                // return the promise (unless last callback was synchronous and is already resolved)
                return (pendingInvocations.length === 0) ? TimerMixin.BREAK : promise;
            }

            // rejects the deferred objects of all cached invocations
            function rejectInvocations(cause) {
                _.each(pendingInvocations, function (invocationData) {
                    invocationData.def.reject(cause);
                });
            }

            // create and return the synchronized method
            return function () {

                var // all data about the current invocation (arguments and returned deferred object)
                    invocationData = { ctxt: this, args: arguments, def: $.Deferred() };

                // push new invocation to the end of the array
                pendingInvocations.push(invocationData);

                // if missing, start a new timer that processes the array
                if (!timer) {
                    // reject all pending promises on abort/destruction
                    timer = self.repeatDelayed(invokeCallback, { delay: 'immediate' }, timerInfo).fail(rejectInvocations);
                    // forget the timer after the last callback invocation
                    timer.always(function () { timer = null; });
                }

                // return a promise that will be resolved/rejected after invocation
                return invocationData.def.promise();
            };
        };

        /**
         * Creates a debounced method that can be called multiple times during
         * the current script execution. The passed callback will be executed
         * once in a browser timeout.
         *
         * @param {Function} directCallback
         *  A function that will be called every time the debounced method has
         *  been called. Will be called in the context the debounced method has
         *  been called with, and receives all parameters that have been passed
         *  to the created debounced method.
         *
         * @param {Function} deferredCallback
         *  A function that will be called in a browser timeout after the
         *  debounced method has been called at least once during the execution
         *  of the current script. Will be called in the context the debounced
         *  method has been called with, and does not receive any parameters.
         *
         * @param {Object} [options]
         *  Optional parameters:
         *  @param {Number} [options.delay=0]
         *      The delay time (in milliseconds) for the deferred callback
         *      function. The delay time will restart after each call of the
         *      debounced method, causing the execution of the deferred
         *      callback to be postponed until the debounced method has not
         *      been called again during the delay (this is the behavior of the
         *      method _.debounce()).
         *  @param {Number} [options.maxDelay]
         *      If specified, a delay time used as a hard limit to execute the
         *      deferred callback after the first call of the debounced method,
         *      even if it has been called repeatedly afterwards and the normal
         *      delay time is still running.
         *  @param {String} [options.infoString]
         *      If specified, this string is used for logging information about
         *      run times of asynchronous operations. This option is only
         *      evaluated, if debug mode is enabled.
         *
         * @returns {Function}
         *  The debounced method that can be called multiple times, and that
         *  executes the deferred callback function once after execution of the
         *  current script ends. Passes all arguments to the direct callback
         *  function, and returns its result. If this instance will be
         *  destroyed, pending debounced methods will not be invoked anymore.
         */
        this.createDebouncedMethod = function (directCallback, deferredCallback, options) {

            var // delay time per invocation
                delay = Math.max(0, (options && options.delay || 0)),
                // maximum accumulated delay time
                maxDelay = Math.max(0, (options && options.maxDelay || 0)),
                // a string information to identify the asynchronous function
                infoString = options && options.infoString || '',
                // the current timer used to execute the callback
                minTimer = null,
                // timer used for the maxDelay option
                maxTimer = null,
                // first call in this stack frame
                firstCall = true;

            // aborts and clears all timers
            function clearTimers() {
                if (minTimer) { minTimer.abort(); }
                if (maxTimer) { maxTimer.abort(); }
                minTimer = maxTimer = null;
                firstCall = true;
            }

            // creates the timers that execute the deferred callback
            function createTimers(context) {

                // timer callback invoking the deferred callback, bound to the current context (but ignoring the
                // return value, especially promises returned by the callback will not be forwarded to the timer)
                function timerCallback() {
                    clearTimers();
                    deferredCallback.call(context);
                }

                // abort running timer on first call
                if (firstCall && minTimer) {
                    minTimer.abort();
                    minTimer = null;
                }

                // reset the first-call flag, but set it back in a direct
                // timeout, this helps to prevent recreation of the browser
                // timeout on every call of the debounced method
                if (firstCall) {
                    firstCall = false;
                    window.setTimeout(function () { firstCall = true; }, 0);
                }

                // create a new timeout executing the callback function
                if (!minTimer) {
                    minTimer = self.executeDelayed(timerCallback, delay, 'debounced (min) ' + infoString);
                }

                // on first call, create a timer for the maximum delay
                if (!maxTimer && (maxDelay > 0)) {
                    maxTimer = self.executeDelayed(timerCallback, maxDelay, 'debounced (max) ' + infoString);
                }
            }

            // create and return the debounced method
            return function () {

                // create a new timeout executing the callback function
                createTimers(this);

                // call the direct callback with the passed arguments
                return directCallback.apply(this, arguments);
            };
        };

        // initialization -----------------------------------------------------

        // destroy all class members on destruction
        this.registerDestructor(function () {

            // Abort all asynchronous code to prevent JS errors from callbacks when the
            // promises resolve/reject normally. Each aborted timer removes itself from
            // the array, but a single abort() call inside the while-loop MAY abort other
            // dependent timer as well, therefore a while loop will be used that checks
            // the array length intentionally in each iteration.
            while (pendingPromises.length > 0) {
                pendingPromises[0].abort();
            }

            self = pendingPromises = null;
        });

    } // class TimerMixin

    // constants --------------------------------------------------------------

    /**
     * A unique object used as return value in callback functions of iteration
     * loops to break the iteration process immediately.
     *
     * @constant
     */
    TimerMixin.BREAK = {};

    // exports ================================================================

    return TimerMixin;

});
