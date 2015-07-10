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
 * @author Kai Ahrens <kai.ahrens@open-xchange.com>
 * @author Carsten Driesner <carsten.driesner@open-xchange.com>
 * @author Daniel Rentz <daniel.rentz@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */

define('io.ox/presenter/rtconnection', [
    'io.ox/core/event',
    'io.ox/realtime/groups'
], function (Events, RTGroups) {

    'use strict';

    var // names of internal events for the real-time connection state
        INTERNAL_EVENTS = 'online offline reset error:notMember',

        // names of runtime push messages
        PUSH_EVENTS = 'update';

    // private static functions ===============================================

    /**
     * Encodes the file name of the passed file descriptor to a resource
     * identifier that can be used to initialize a real-time connection.
     *
     * @param {Object} file
     *  A file descriptor object which contains file specific properties, like
     *  'id' and 'folder_id'.
     *
     * @returns {String}
     *  A string which references a file and complies to the resource id
     *  encoding scheme; or null, if the file descriptor doesn't describe a
     *  valid file.
     */
    function encodeFileAsResourceId(file) {
        return encodeURIComponent(file.folder_id).replace(/\./g, '%2E') + '.' + encodeURIComponent(file.id).replace(/\./g, '%2E');
    }

    // class RTConnection =====================================================

    /**
     * Represents the connection to the real-time framework, used to send
     * message to and receive message from the server.
     *
     * Triggers the following events:
     * - 'update': Update notifications containing actions created by remote
     *  clients, and state information for the application (read-only, name and
     *  identifier of the current editor, etc.).
     *
     * @extends Events
     *
     * @param {Object} [initOptions]
     *  Optional parameters:
     *  @param {Number} [initOptions.realTimeDelay=100]
     *      The duration in milliseconds the realtime framework will collect
     *      messages before sending them to the server.
     */
    function RTConnection(file, initOptions) {

        var // self reference
            self = this,

            // rt channel id
            channelId = 'presenter',

            // create the core real-time group instance for the document
            rtGroup = RTGroups.getGroup('synthetic.' + channelId + '://operations/' + encodeFileAsResourceId(file)),

            // private event hub for internal event handling
            eventHub = new Events(),

            // duration for the realtime framework collecting messages before sending
            realTimeDelay = initOptions && initOptions.realTimeDelay || 100,

            traceActions = {},

            // joining the group
            joining = false,

            // rejoining is possible
            rejoinPossible = false;

        // base constructor ---------------------------------------------------

        Events.extend(this);

        // private methods ----------------------------------------------------

        /**
         * Log the data
         */
        function debugLogUpdateNotification(data) {
            console.info('Presenter - RTConnection - data', JSON.stringify(data || {}));
        }

        /**
         * Register events for specific RT actions.
         * The event handler 'eventName' is triggered, when
         * an RT event with the action name 'eventName' is received.
         * The triggered eventName will be equal to the 'actionName'.
         * The eventHandler will be called with the received payload data
         */
        function registerRTEvents(eventNames) {
            _.each(eventNames.split(/\s+/), function (eventName) {
                rtGroup.on('receive', function (event, stanza) {
                    _.each(stanza.getAll(channelId, eventName), function (payload) {
                        RTConnection.log('RTConnection.eventHub.trigger (' + channelId + '), ' + eventName);
                        eventHub.trigger(eventName, payload.data);
                    });
                });
            });
        }

        /**
         * Determines whether a certain action should be traced on its way
         * through the realtime backend.
         *
         * @returns {Boolean}
         *  Whether to trace the stanzas for the specified action.
         */
        function shouldTrace(action) {
            return traceActions[action.toLowerCase()];
        }

        /**
         * Send a message to the connected RT object,
         * waiting for the acknowledge to this call.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved if the
         *  acknowledge for this request will have arrived, or
         *  rejected after a time out otherwise.
         */
        function send(action, element, data) {

            var payloads = [{ element: 'action', data: action }],
                defer = null;

            if (_.isString(element) && !_.isUndefined(data)) {
                payloads.push({
                    namespace: channelId,
                    element: element,
                    data: data,
                    verbatim: true
                });
            }

            defer = rtGroup.send({
                element: 'message',
                payloads: payloads,
                trace: shouldTrace(action),
                bufferinterval: realTimeDelay
            });

            // Time out detection now uses the deferred to trigger an optional timeout handler
            defer.fail(function () {
                RTConnection.error('Send message with RT failed, payloads: ' + payloads.toString());
                // RT calls us even after connection, rtgroup are destroyed and references are cleared.
                if (!self.destroyed) { self.trigger('timeout'); }
            });

            return defer.promise();
        }

        /**
         * Send a message request to the connected RT object,
         * returning a promise object that will be resolved,
         * if the result data to this request has arrived.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved if the
         *  result for this request has arrived, or rejected otherwise.
         */
        function sendQuery(action, element, data) {
            var payloads = [{ element: 'action', data: action }],
                defer;

            if (_.isString(element) && !_.isUndefined(data)) {
                payloads.push({
                    namespace: channelId,
                    element: element,
                    data: data,
                    verbatim: true
                });
            }
            // Add necessary payload to provide the real-time id for
            // correct rights management on the backend
            payloads.push({
                namespace: 'office',
                element: 'rtdata',
                data: { rtid: rtGroup.getUuid(), session: ox.session },
                verbatim: true
            });

            defer = rtGroup.query({
                element: 'message',
                payloads: payloads,
                trace: shouldTrace(action),
                bufferinterval: realTimeDelay
            });

            // Time out detection now uses the deferred to trigger an optional timeout handler
            defer.fail(function () {
                RTConnection.error('Send query message with RT failed, payloads: ' + payloads.toString());
                // RT calls us even after connection, rtgroup are destroyed and references are cleared.
                if (!self.destroyed) { self.trigger('timeout'); }
            });

            return defer.promise();
        }

        /**
         * Handles the response from the RT low-level code and extract the
         * data part from, providing it as result via the deferred/promise.
         *
         * @param {jQuery.Deferred|jQuery.Promise} orgDeferred
         *  The original promise or deferred provided by the RT low-level
         *  code.
         *
         * @param {Number} [timeout]
         *  If specified, the delay time in milliseconds, after the Promise
         *  returned by this method will be rejected, if the passed original
         *  Deferred object is still pending.
         *
         * @returns {jQuery.Deferred}
         *  The Deferred object that will be resolved if the result for the
         *  original request has arrived, or rejected otherwise.
         */
        function handleResponse(orgDeferred, timeout) {

            var // the Deferred object to be returned
                def = $.Deferred();

            orgDeferred.then(function (response) {
                handleResolvedResponse(def, response);
            }, function (response) {
                handleRejectedResponse(def, response);
            });

            // prevent endless waiting
            if (_.isNumber(timeout) && (timeout > 0)) {
                _.delay(function () {
                    if (def.state() === 'pending') {
                        RTConnection.log('Timeout reached for RT request, timeout=' + timeout + 'ms.');
                        def.reject({ cause: 'timeout' });
                    }
                }, timeout);
            }

            return def;
        }

        /**
         * Handles the resolved response of the RT low-level code and
         * tries to extract the data port from it.
         *
         * @param {jQuery.Deferred} def
         *  The deferred to be resolved with the extracted data.
         *
         * @param {Object} response
         *  The original response provided by the RT low-level code.
         */
        function handleResolvedResponse(def, response) {
            var payloads = response && response.payloads || [];

            if (self.destroyed) {
                // reject deferred after destroy
                def.reject({ cause: 'closing' });
            }
            if (payloads.length > 0) {
                // Extract the data and provide it
                def.resolve(payloads[0].data);
            } else {
                // Response from server is not in the expected format, therefore
                // we reject the deferred here.
                def.reject(response);
            }
        }

        /**
         * Handles the rejected response of the RT low-level code and
         * tries to extract the data port from it.
         *
         * @param {jQuery.Deferred} def
         *  The deferred to be rejected with the extracted data.
         *
         * @param {Object} response
         *  The original response provided by the RT low-level code.
         */
        function handleRejectedResponse(def, response) {
            var payloads = response && response.payloads || [];

            if (payloads.length > 0) {
                // Extract data even for the rejected case
                def.reject(payloads[0].data);
            } else {
                // If we don't find a payload just provide the original response
                def.reject(response);
            }
        }

        /**
         * Join a group using the provided options and set the asynchronous
         * state. An optional retryHandler is called, if there is a chance
         * to retry the joining.
         *
         * @param {Object} connectOptions
         *  Contains properties to be sent while joining to the
         *  document real-time connection.
         *
         * @param {jQuery.Deferred} def
         *  The deferred to be resolved/rejected, if joining completed/failed.
         *
         * @param {Function} retryHandler
         *  A function that is called, if a retry is possible.
         */
        function joinGroup(connectOptions, def, retryHandler) {

            joining = true;
            rtGroup.join(connectOptions).then(function (response) {
                var payloads = response && response.payloads || [];

                if (self.destroyed) {
                    // reject deferred after destroy
                    def.reject({ cause: 'closing' });
                    joining = false;
                } else if (payloads.length > 0) {
                    handleResolvedResponse(def, response);
                    joining = false;
                } else {
                    // We encountered an illegal state for our join request.
                    if (_.isFunction(retryHandler)) {
                        // We have to wait for possible notifications from the
                        // low-level RT part to determine, if a retry is possible.
                        _.delay(function () {
                            // now check the states and decide, if we can try to
                            // start a reconnect using a possible retry handler
                            if (rejoinPossible) {
                                rejoinPossible = false;
                                retryHandler.call(this, def);
                                joining = false;
                            } else {
                                handleResolvedResponse(def, response);
                                joining = false;
                            }
                        }, 1000);
                    } else {
                        // without retry handler just process the original
                        // response
                        handleResolvedResponse(def, response);
                        joining = false;
                    }
                }
            }, function (response) {
                handleRejectedResponse(def, response);
                joining = false;
            });
        }

        // methods ------------------------------------------------------------

        /**
         * Connects the real-time group and sends the initial request for the
         * document import operations.
         *
         * @param {Object} connectData
         *  Contains properties to be sent while joining to the
         *  document real-time connection.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved with the
         *  getActions results.
         */
        this.connect = function (connectData) {
            var connectDeferred = $.Deferred(),
                // optional connect data
                connectOptions = { expectWelcomeMessage: true };

            if (connectData) {
                _.extend(connectOptions, { additionalPayloads: [{ element: 'connectData', namespace: channelId, data: connectData, verbatim: true }] });
            }

            if (!rtGroup.isRTWorking()) {
                // the server doesn't support real-time communication, must be
                // incorrect configured.
                return $.Deferred().reject({ cause: 'bad server component' });
            }

            RTConnection.log('RTConnection.connect called');

            // Handler to be called, if we detected a rejoin scenario - possible
            // if a re-enroll is needed by the low-level RT framework.
            function rejoinHandler(def) {
                // call join again, but this time without retry handler
                joinGroup(connectOptions, def, null);
            }

            // joins the group and provides the retry handler
            joinGroup(connectOptions, connectDeferred, rejoinHandler);

            // Remember *connect* deferred to be able to reject them if user
            // closes document while we are still connecting to the realtime group!
            //return this.createAbortablePromise(connectDeferred);

            // TODO: handle connection abort
            return connectDeferred;
        };

        /**
         * Send the given operations to the connected RT object
         * for further distribution to other connected clients
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved when the
         *  ACK of the internal send arrives.
         */
        this.sendActions = function (actions) {
            return send('applyactions', 'actions', actions);
        };

        /**
         * Sends slide data update to the server. This slide update data will
         * broadcasted to all collaborating clients.
         *
         * @param {Object} slideInfo
         *  An object containing relevant slide data.
         *
         * @returns {jQuery.Promise}
         */
        this.updateSlide = function (slideInfo) {
            RTConnection.log('RTConnection.updateSlide called', slideInfo);
            return send('updateslide', 'slideInfo', slideInfo);
        };

        /**
         * Start the presentation as presenter.
         *
         * @param {Object} slideInfo
         *  An object containing relevant data for the initial slide.
         *
         * @returns {jQuery.Promise}
         */
        this.startPresentation = function (slideInfo) {
            RTConnection.log('RTConnection.startPresentation called');
            return send('startpresentation', 'slideInfo', slideInfo);
        };

        /**
         * Pause the presentation as presenter.
         *
         * @returns {jQuery.Promise}
         */
        this.pausePresentation = function () {
            RTConnection.log('RTConnection.pausePresentation called');
            return send('pausepresentation');
        };

        /**
         * Continue the previously paused presentation as presenter.
         *
         * @returns {jQuery.Promise}
         */
        this.continuePresentation = function () {
            RTConnection.log('RTConnection.continuePresentation called');
            return send('continuepresentation');
        };

        /**
         * End the presentation as presenter.
         *
         * @returns {jQuery.Promise}
         */
        this.endPresentation = function () {
            RTConnection.log('RTConnection.endPresentation called');
            return send('endpresentation');
        };

        /**
         * Join the presentation as participant / listener.
         *
         * @returns {jQuery.Promise}
         */
        this.joinPresentation = function () {
            RTConnection.log('RTConnection.joinPresentation called');
            return send('joinpresentation');
        };

        /**
         * Leave the presentation as participant / listener.
         *
         * @returns {jQuery.Promise}
         */
        this.leavePresentation = function () {
            RTConnection.log('RTConnection.leavePresentation called');
            return send('leavepresentation');
        };

        /**
         * Sends a real-time request to the server and waits for a response.
         *
         * @param {String} action
         *  The identifier of the action sent to the server.
         *
         * @param {Number} [timeout]
         *  If specified, the delay time in milliseconds, after the Promise
         *  returned by this method will be rejected, if the query is still
         *  pending.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved with the
         *  answer of the server request, or rejected on error or timeout.
         */
        this.sendQuery = function (action, timeout) {
            RTConnection.log('RTConnection.sendQuery(' + action + ')');
            return handleResponse(sendQuery(action), timeout);
        };

        /**
         * Leave the connected real-time group.
         *
         * @returns {jQuery.Promise}
         *  The Promise of a Deferred object that will be resolved with the
         *  closing document status of the request.
         */
        this.close = function () {
            var leaveOptions = { expectSignOffMessage: true };

            RTConnection.log('RTConnection.close called');
            return handleResponse(rtGroup.leave(leaveOptions), 20000);
        };

        /**
         * Retrieves the universal unique id from the real-time framework.
         * This id is used to identify this client in the real-time
         * communiation with the server-side.
         * ATTENTION: If it's known that a http-request will need real-time
         * data, it's essential to add this id to the request. Otherwise
         * the server-side is not able to identify the specific client.
         *
         * @returns {String}
         *  The universal unique id of this client in the real-time
         *  environment.
         */
        this.getUuid = function () {
            return rtGroup.getUuid();
        };

        /**
         * Retrieves the universal unique real-time id from the real-time framework,
         * with the following format: ox:// <ox user id> + @ + <context id> + / + <Uuid>
         *
         * @returns {String}
         *  The universal unique real-time id of this client.
         */
        this.getRTUuid = function () {
            return 'ox://' + ox.user_id + '@' + ox.context_id + '/' + this.getUuid();
        };

        // initialization -----------------------------------------------------

        RTConnection.log('RTConnection initialization');

        // read traceable actions from page URL
        if (_.url.hash('office:trace')) {
            _.each(_.url.hash('office:trace').split(/\s*,\s*/), function (action) {
                traceActions[action.toLowerCase()] = true;
            });
        }

        // register the internal event hub for request events and custom runtime events
        registerRTEvents(PUSH_EVENTS);

        // forward runtime realtime events to own listeners
        rtGroup.on(INTERNAL_EVENTS, function (event, data) {
            // special handling for reset event
            if (event.type === 'reset') {
                if (joining) {
                    // If we are joining, reset is an indicator that a re-enroll
                    // has been done. In that case we have to try to join again.
                    // This must be limited to error code 1007 which means that
                    // we have to re-enroll. A reset after we received a reset with
                    // data.code 1007 is also normal, ignore that, too.
                    if ((!rejoinPossible && (data && data.code === 1007)) || rejoinPossible) {
                        if (!rejoinPossible) {
                            rejoinPossible = true;
                        }
                    } else {
                        // trigger reset otherwise
                        self.trigger(event.type);
                    }
                } else {
                    // trigger reset outside of join
                    self.trigger(event.type);
                }
            } else {
                self.trigger(event.type);
            }
        });

        // forward OX Documents runtime events to own listeners
        eventHub.on(PUSH_EVENTS, function (event, data) {
            if (event.type === 'update') {
                debugLogUpdateNotification(data);
            }
            self.trigger(event.type, data);
        });

        // disconnect from the RT object, no further calls should be made at this object from now on
        this.dispose = function () {

            // destroy realtime group
            try {
                rtGroup.destroy();
                rtGroup = null;
                RTConnection.log('RTConnection.destroy(): RT group destroyed');
            } catch (ex) {
                console.error('OX Presenter exception', ex);
            }

            // destroy private event hub
            eventHub.destroy();
            eventHub = null;

            // remove references
            traceActions = null;
        };

    } // class RTConnection

    // global initialization ==================================================

    // enable logging for real-time core
    require(['io.ox/realtime/rt']).done(function (CoreRT) {
        CoreRT.debug = RTConnection.debug;
    });

    RTConnection.log = function (msg) { console.info('Presenter - RTConnection - log', msg); };

    // exports ================================================================

    return RTConnection;

});
