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

define("io.ox/internal/ajaxDebug/callViews", function () {

    function CallView ($node) {
        $node = $($node);
        
        var $address = $('<input type="text"/>'),
            $body = $('<textarea cols="80" rows="20"/>'),
            $resp = $('<textarea cols="80", rows="30" readonly="readonly"/>'),
            $submit = $('<button>').text("Send");
        
        $node.append($("<div/>").append($address));
        $node.append($("<div/>").append($body));
        $node.append($("<div/>").append($submit));
        $node.append($("<div/>").append($resp));
        
        
        this.draw = function (entry) {
            this.id = entry.id;
            // Address Text
            var addressText = entry.query.module+"."+entry.query.params.action;
            var queryString = "";
            _(entry.query.params).each(function (value, key) {
               if (key !== 'action') {
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
            }
            
            // Result
            if (entry.response) {
                $resp.val(JSON.stringify(entry.response, null, 4));
                $resp.show();
            } else {
                $resp.hide();
            }
            this.dirty = false;
        };
        
        this.submit = function () {
            
        }
        
        
    }

}