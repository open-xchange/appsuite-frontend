 /**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 */

define("io.ox/dev/ajaxDebug/callHandling",
    ["io.ox/core/http", "io.ox/core/event"], function (http, Events) {

    "use strict";

    var callHandler = {
        history: [],
        perform: function (options, cb) {
            var entry = {
                id: this.history.length,
                query: options,
                response: null
            };
            this.history.push(entry);
            this.trigger("historychanged", this);
            options.appendColumns = false;
            options.processResponse = false;

            function process(data) {
                entry.response = data;
                if (cb) {
                    cb(data);
                }
                callHandler.trigger("entrychanged", entry);
            }

            if (options.data) {
                http.PUT(options).done(process);
                http.PUT(options).fail(process);
            } else {
                http.GET(options).done(process);
                http.GET(options).fail(process);
            }
            return entry;
        }
    };

    Events.extend(callHandler);

    return callHandler;
});