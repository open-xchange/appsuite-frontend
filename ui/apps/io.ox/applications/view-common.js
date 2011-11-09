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

define("io.ox/applications/view-common", ["io.ox/core/api/apps"], function (api) {
    
    'use strict';
    
    var compiled = _.template(
        '<div class="app"><img src="<%= icon %>" class="icon" alt="">' +
        '<div class="title"><span><%= title %></span></div>' +
        '<div class="company"><%= company %></div>' +
        '<div class="description"><%= description %></div>' +
        '<div class="links"></div>' +
        '</div>'
    );
    
    function fnStart(e) {
        e.preventDefault();
        require([e.data.id + "/main"], function (m) {
            m.getApp().launch();
        });
    }
    
    function fnFavor(e) {
        e.preventDefault();
        api.markAsFavorite(e.data.id);
    }
    
    function fnUnmark(e) {
        e.preventDefault();
        api.unmarkAsFavorite(e.data.id);
    }
    
    function drawApp(data) {
        var node = $(compiled(data));
        // add starter on icon
        node.find(".icon, .title").on("click", { id: data.id }, fnStart);
        // add start link
        node.find(".links").append(
            $("<a>", { href: "#" }).text("Start")
            .on("click", { id: data.id }, fnStart)
            .add($.txt("\u00A0 "))
        );
        // favorite?
        if (api.isFavorite(data)) {
            node.find(".title").append(
                $("<span/>")
                .attr("title", "Favorite")
                .addClass("favorite").text("\u2605")
            );
            node.find(".links").append(
                $("<a>", { href: "#" }).text("Unmark as favorite")
                .on("click", { id: data.id }, fnUnmark)
                .add($.txt("\u00A0 "))
            );
        } else {
            // add favorite link
            node.find(".links").append(
                $("<a>", { href: "#" }).text("Mark as favorite")
                .on("click", { id: data.id }, fnFavor)
                .add($.txt("\u00A0 "))
            );
        }
        return node;
    }
    
    return {
        drawApp: drawApp
    };
});