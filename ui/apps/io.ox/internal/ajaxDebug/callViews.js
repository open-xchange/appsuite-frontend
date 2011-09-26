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

define("io.ox/internal/ajaxDebug/callViews", function () {

    function CallView ($node, callHandling) {
        var self = this;
        $node = $($node);
        
        var $address = $('<input/>').css({
            width: "500px",
            "margin-left": "2px" // ???
        }).attr({
            type: "text",
            placeholder: "module.action?param1=param2"
        });
        var $body = $('<textarea cols="80" rows="20"/>'),
            $resp = $('<textarea cols="80", rows="30" readonly="readonly"/>').hide(),
            $submit = $('<button>').text("Send");
        
        $node.append($("<div/>").append($address));
        $node.append($("<div/>").append($body));
        $node.append($("<div/>").append($submit));
        $node.append($("<div/>").append($resp));
                
        this.draw = function (entry, options) {
            if (!options) {
                options = {};
            }
            this.id = entry.id;
            // Address Text
            $address.focus();
            var addressText = entry.query.module+"."+entry.query.params.action;
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
                $body.val(JSON.stringify(entry.query.data, null, 4));
            } else {
                $body.val("");
            }
            
            // Result
            if (entry.response) {
                $resp.idle();
                $resp.val(JSON.stringify(entry.response, null, 4));
                $resp.show();
            } else if (options.inProgress) {
                $resp.show().busy();
            } else {
                $resp.hide();
            }
            
            
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
                alert("Can't parse query: "+$address.val()+". Please use the following format: module.action?param1=value1&param2=value2");
            }
            
            if ($body.val()) {
                try {
                    query.data = new Function("return "+$body.val())(); // The JSON parser is too anal
                } catch (err) {
                    query.data = $body.val();
                }
            }
            return query;
        };
        
       function submit () {
            var query = self.getQuery();
            var entry = callHandling.perform(query);
            self.draw(entry, {inProgress: true});
        }
        
        
        function changed () {
            if ($address.val().match(addrRegex)) {
                $address.css("border", "green solid 3px");
            } else {
                $address.css("border", "red solid 3px");
            }
            if ($body.val()) {
                try {
                    new Function("return "+$body.val())(); // The JSON parser is too anal
                    $body.css("border", "green solid 3px");
                } catch (err) {
                    $body.css("border", "red solid 3px");
                }
            }
            self.dirty = true;
        }
        
        $submit.click(submit);
        
        $address.keypress(changed);
        $body.change(changed);
        
        callHandling.bind("entrychanged", function (entry) {
            if (entry.id === self.id && !self.dirty) {
                self.draw(entry);
            }
        });
        
        
    }
    
    return {
        CallView: CallView
    };

});