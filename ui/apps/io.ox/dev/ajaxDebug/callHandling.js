 /**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 */

define('io.ox/dev/ajaxDebug/callHandling',
    ['io.ox/core/http',
     'io.ox/core/event'
    ], function (http, Events) {

    'use strict';

    var callHandler = {
        history: [],
        perform: function (options) {
            var entry = {
                id: this.history.length,
                query: options,
                response: null,
                deferred: null
            };
            this.history.push(entry);
            this.trigger('historychanged', this);
            options.appendColumns = false;
            options.processResponse = false;

            function process(data) {
                entry.response = data;
                callHandler.trigger('entrychanged', entry);
            }

            // GO!
            entry.deferred = http[options.data ? 'PUT' : 'GET'](options);
            entry.deferred.done(process).fail(process);
            return entry;
        }
    };

    Events.extend(callHandler);

    return callHandler;
});
