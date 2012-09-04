/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define("plugins/portal/quota/register", ["io.ox/core/extensions",
                                         'gettext!plugins/portal/quota',
                                         'io.ox/core/api/quota',
                                         'io.ox/core/strings',
                                         'less!plugins/portal/quota/style.css'], function (ext, gt, api, strings) {
    "use strict";
    
    var loadTile = function () {
        var def = new $.Deferred();
        api.getFile().done(function (filequota) {
            api.getMail().done(function (mailquota) {
                var quotas = {
                        filequota: filequota,
                        mailquota: mailquota
                    };
                def.resolve(quotas);
            });
        });
        
        return def;
    },
    
    drawTile = function (quota, $node) {
        $node.append(
            $('<div class="io-ox-clear io-ox-portal-preview quota-preview">').append(
                    $('<div>').append(
                        $("<span>").text(gt("File quota")),
                        $("<span>").addClass("plugins-portal-quota-memory-file"),
                        $("<div>").addClass("plugins-portal-quota-filebar")
                    ),
                    $('<div>').append(
                        $('<span>').text(gt("Mail quota")),
                        $("<span>").addClass("plugins-portal-quota-memory-mail"),
                        $("<div>").addClass("plugins-portal-quota-mailbar")
                    ),
                    $('<div>').append(
                        $('<span>').text(gt("Mailcount quota")),
                        $("<span>").addClass("plugins-portal-quota-memory-mailcount"),
                        $("<div>").addClass("plugins-portal-quota-mailcountbar")
                    )
                )
        );
        
        //filestorage
        if (quota.filequota.quota < 0) {
            $node.find(".plugins-portal-quota-memory-file")
            .text(strings.fileSize(quota.filequota.use));
            $node.find(".plugins-portal-quota-filebar").remove();
        } else {
            $node.find(".plugins-portal-quota-memory-file")
            .text(strings.fileSize(quota.filequota.use) + " " + gt("of") + " " + strings.fileSize(quota.filequota.quota));
            
            var width = (quota.filequota.use / quota.filequota.quota) * 100;
            $node.find(".plugins-portal-quota-filebar")
                .addClass("progress")
                .css('margin-bottom', '0px')
                .append(buildbar(width));
        }
        
        //mailstorage
        if (quota.mailquota.quota < 0) {
            $node.find(".plugins-portal-quota-memory-mail")
            .text(strings.fileSize(0));
            $node.find(".plugins-portal-quota-mailbar").remove();
        } else {
            $node.find(".plugins-portal-quota-memory-mail")
            .text(strings.fileSize(quota.mailquota.use / 1024) + " " + gt("of") + " " + strings.fileSize(quota.mailquota.quota));
            
            var width = (quota.mailquota.use / quota.mailquota.quota) * 100;
            $node.find(".plugins-portal-quota-mailbar")
                .addClass("progress")
                .css('margin-bottom', '0px')
                .append(buildbar(width));
        }
        
        //mailcount
        if (quota.mailquota.countquota < 0) {
            $node.find(".plugins-portal-quota-memory-mailcount")
                .text("0");
            $node.find(".plugins-portal-quota-mailcountbar").remove();
            
        } else {
            $node.find(".plugins-portal-quota-memory-mailcount")
            .text(quota.mailquota.countuse + " " + gt("of") + " " + quota.mailquota.countquota);
            
            var width = (quota.mailquota.countuse / quota.mailquota.countquota) * 100;
            $node.find(".plugins-portal-quota-mailcountbar")
                .addClass("progress")
                .css('margin-bottom', '0px')
                .append(buildbar(width));
        }
        
    },
    
    buildbar = function (width) {
        var progressbar = $('<div>').addClass('bar').css('width', width + "%");
        if (width < 70) {
            progressbar.addClass('bar-success');
        } else if (width < 90) {
            progressbar.addClass('bar-warning');
        } else {
            progressbar.addClass('bar-danger');
        }
                    
        return progressbar;
    },
    
    load = function () {
        return $.Deferred().resolve();
    },
    
    draw = function () {
        return $.Deferred().resolve();
    };

    ext.point("io.ox/portal/widget").extend({
        id: 'filler',//needed so onclick sidepane isn't shown
        index: 900,
        title: gt('Quota'),
        load: load,
        draw: draw,
        preview: function () {
            var deferred = $.Deferred();
            loadTile().done(function (quota) {
                var $node = $('<div>');
                drawTile(quota, $node);
                deferred.resolve($node);
            });
            return deferred;
        }
    });
});