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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

(function () {

    "use strict";

    var plugin = function (selector) {
        
        return {

            load: function (def, require, cont, config) {
                
                var file = config.baseUrl + def,
                    // get path to fix URLs
                    path = file.replace(/\/[^\/]+$/, "/");

                // fetch via XHR
                $.ajax({
                    url: file,
                    dataType: "text"
                })
                .done(function (css) {
                    // now the file is cached
                    var text = css.replace(/url\(/g, "url(" + path);
                    $('<style type="text/css">' + text + '</style>')
                        .attr("data-require-src", def)
                        .insertBefore($(selector).eq(0));
                    // continue
                    cont();
                });
            }
        }
    };
    
    // css plugin
    define("css", plugin("title"));  // append before title tag
    
    // theme plugin
    define("theme", plugin("script"));  // append before first script tag
    
}());
