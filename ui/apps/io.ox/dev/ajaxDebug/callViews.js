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

/*global escape:true, unescape:true */

define("io.ox/dev/ajaxDebug/callViews", function () {

    "use strict";

    function CallView($node, callHandling) {

        var self = this,

            $address = $('<input>', {
                    type: "text",
                    placeholder: "module.action?param1=value&param2=value"
                }).css({
                    width: '500px'
                }),

            $body = $('<textarea>', {
                    placeholder: "{ the: 'body', json: data }"
                })
                .css({ width: '500px', height: '200px' }),

            $resp = $('<textarea>', {
                    readonly: 'readonly'
                })
                .css({ width: '500px', height: '200px', marginTop: '10px' }).hide(),

            $submit = $('<button>').addClass('btn btn-primary').text("Send");

        $node.append(
            $("<div>").append($address),
            $("<div>").append($body),
            $("<div>").append($submit),
            $("<div>").append($resp)
        );

        this.draw = function (entry) {

            this.id = entry.id;
            // Address Text
            $address.focus();
            var addressText = entry.query.module + "." + entry.query.params.action;
            var queryString = "";
            _(entry.query.params).each(function (value, key) {
                if (key !== 'action' && key !== 'session') {
                    queryString = queryString + "&" + escape(key) + "=" + escape(value);
                }
            });
            if (queryString.length > 0) {
                addressText += "?" + queryString.substring(1);
            }
            $address.val(addressText);

            // Body
            if (entry.query.data) {
                if (_.isString(entry.query.data)) {
                    $body.val(entry.query.data);
                } else {
                    $body.val(JSON.stringify(entry.query.data, null, 4));
                }
            } else {
                $body.val("");
            }

            $resp.busy().show();
            console.log('entry', entry);
            entry.deferred.always(function () {
                $resp.val(JSON.stringify(entry.response, null, 4));
                $resp.idle();
            });

            this.dirty = false;
            $address.css("border", '');
            $body.css("border", '');

        };

        var addrRegex = /((\w|\/)+?)\.(\w+)(\?(.*))?/;

        this.getQuery = function () {
            var query = {};
            var match = $address.val().match(addrRegex);
            if (match) {
                query.module = match[1];
                query.params = {
                    action: match[3]
                };
                var queryString = match[5];
                if (queryString) {
                    _(queryString.split("&")).each(function (pair) {
                        var splitPair = pair.split("=");
                        var key = unescape(splitPair[0]);
                        var value = unescape(splitPair[1]);
                        query.params[key] = value;
                    });
                }
            } else {
                alert("Can't parse query: " + $address.val() + ". Please use the following format: module.action?param1=value1&param2=value2");
            }

            if ($body.val()) {
                try {
                    query.data = new Function("return " + $body.val())(); // The JSON parser is too anal
                } catch (err) {
                    query.data = $body.val();
                }
            }
            return query;
        };

        function submit(e) {
            e.preventDefault();
            var query = self.getQuery(),
                entry = callHandling.perform(query);
            console.log('DRAW!', entry);
            self.draw(entry);
        }

        function changed() {
            if ($address.val().match(addrRegex)) {
                $address.css("border", "green solid 1px");
            } else {
                $address.css("border", "red solid 1px");
            }
            if ($body.val()) {
                try {
                    new Function("return " + $body.val())(); // The JSON parser is too anal
                    $body.css("border", "green solid 1px");
                } catch (err) {
                    $body.css("border", "red solid 1px");
                }
            }
            self.dirty = true;
        }

        $submit.click(submit);
        $address.change(changed);
        $body.change(changed);

        callHandling.on("entrychanged", function (e, entry) {
            if (entry.id === self.id && !self.dirty) {
                self.draw(entry);
            }
        });
    }

    return {
        CallView: CallView
    };

});