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
 */

define("io.ox/applications/view-mockIntegration",
    ["io.ox/core/api/apps", "io.ox/applications/view-common", "text!io.ox/applications/mocks/parallels.html"], function (api, view, parallelsHTML) {

    'use strict';
    
    var $snippets = $(parallelsHTML);
    
    function drawKeepitOptions($node) {
        var $app = $("<div>").addClass("app").appendTo($node);
        $app.append($("<img>").addClass("icon").attr("src", "https://openxchange.parallelsmarketplace.com/store/conf/173/images/55154e955dccbe11.png"));
        $app.append($("<div>").addClass("title").append($("<span>").text("Keepit Online Backup")));
        $app.append($("<div>").addClass("company").text("Keepit"));
        $app.append($("<div>").addClass("description").text("Simple, automatic and secure online backup solution for small business desktops."));
        $app.append("<br/>");
        
        $app.append($snippets.find(".keepitOptions").clone());
        $app.append($snippets.find(".appButtons"));
        $app.find(".buyButton").on("click", function () {
            alert("Ka-Chink.");
            return false;
        });
        
    }
    
    return {

        draw: function (context) {
            var node = $("<div>")
                .append(
                    $("<div>").addClass("clear-title")
                    .text("Parallels Marketplace")
                );
            
            var $apps = $("<div>").addClass("apps").appendTo(node);
            
            var $app = $("<div>").addClass("app").appendTo($apps);
            $app.append($("<img>").addClass("icon").attr("src", "https://openxchange.parallelsmarketplace.com/store/conf/173/images/55154e955dccbe11.png"));
            $app.append($("<div>").addClass("title").append($("<span>").text("Keepit Online Backup")));
            $app.append($("<div>").addClass("company").text("Keepit"));
            $app.append($("<div>").addClass("description").text("Simple, automatic and secure online backup solution for small business desktops."));
            $app.on("click", function () {
                node.empty();
                drawKeepitOptions(node);
            });

            $app = $("<div>").addClass("app").appendTo($apps);
            $app.append($("<img>").addClass("icon").attr("src", "https://openxchange.parallelsmarketplace.com/store/conf/173/images/792edc608049a948.png"));
            $app.append($("<div>").addClass("title").append($("<span>").text("Norton Internet Security Online")));
            $app.append($("<div>").addClass("company").text("Norton"));
            $app.append($("<div>").addClass("description").text("The fastest virus, spyware and internet protection you can buy for your desktop. Completely FUD compliant additian to keep you SAFE."));


            return node;
        }
    };
});