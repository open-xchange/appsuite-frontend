/**
 * 
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
 * 
 */

(function () {

    "use strict";

    // CSS plugin for require.js
    var plugin = {

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
                $("<style/>", { type: "text/css" })
                    .attr("data-require-src", def)
                    .text(css.replace(/url\(/g, "url(" + path)) // fix URLs
                    .insertBefore($("script").eq(0)); // append before first script tag
                // continue
                cont();
            });
        }
    };

    define(plugin);

})();
