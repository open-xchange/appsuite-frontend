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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define("plugins/portal/dummy/register", ["io.ox/core/extensions"], function (ext) {

    "use strict";
    
    var load = function () {
        return $.Deferred();
    };
    var draw = function (feed) {
        var $node = $('<div class="io-ox-portal-dummy">').appendTo(this).append(
            $('<h1 class="clear-title">').text("Dummy #" + i),
            $('<p>').text("Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt " +
            "ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi" +
            " ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum" +
            " dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia" +
            " deserunt mollit anim id est laborum.")
        );
        return $.Deferred().resolve($node);
    };
    for (var i = 0; i < 25; i++) {
        //var color = 'rgb(' + (200 + i * (i % 3)) + ',' + (200 + i * ((i + 1) % 3)) + ',' + (200 + i * ((i + 2) % 3)) + ')';
        //var palette = ["FF6728", "913C00", "432704", "A88247", "E5BD6C"]; //kuler palette: "mars" by robertnbrown
        var palette = ["ADACA2", "828594", "614B59", "BFC47D", "E3E2B3"]; //kuler palette: "backstage" by robertnbrown
        var color = '#' + palette[i % palette.length];
        if (i % (palette.length * 2)) {
            //color = darken(color);
        }
        ext.point("io.ox/portal/widget").extend({
            id: 'dummy' + i,
            background: color,
            index: 200,
            title: 'Dummy #' + i,
            load: load,
            draw: draw
        });
    }
});