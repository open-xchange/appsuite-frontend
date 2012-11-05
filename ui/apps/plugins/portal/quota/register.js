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
                                         'gettext!plugins/portal',
                                         'io.ox/core/api/quota',
                                         'io.ox/core/strings',
                                         'less!plugins/portal/quota/style.css'], function (ext, gt, api, strings) {
    "use strict";

    var loadTile = function () {
        return api.get();
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
                        $('<span>').text(gt("Mail count quota")),
                        $("<span>").addClass("plugins-portal-quota-memory-mailcount"),
                        $("<div>").addClass("plugins-portal-quota-mailcountbar")
                    ).addClass("plugins-portal-quota-mailcount")
                )
        );

        //filestorage
        if (quota.file.quota < 0) {
            $node.find(".plugins-portal-quota-memory-file")
            .text(gt("unlimited"));
            $node.find(".plugins-portal-quota-filebar").remove();
        } else {
            $node.find(".plugins-portal-quota-memory-file")
            .text(//#. %1$s is the storagespace in use
                  //#. %2$s is the max storagespace
                  //#, c-format
                  gt("%1$s of %2$s", strings.fileSize(quota.file.use), strings.fileSize(quota.file.quota)));

            var width = (quota.file.use / quota.file.quota) * 100;
            $node.find(".plugins-portal-quota-filebar")
                .addClass("progress")
                .css('margin-bottom', '0px')
                .append(buildbar(width));
        }

        //mailstorage
        if (quota.mail.quota < 0) {
            $node.find(".plugins-portal-quota-memory-mail")
            .text(gt("unlimited"));
            $node.find(".plugins-portal-quota-mailbar").remove();
        } else {
            $node.find(".plugins-portal-quota-memory-mail")
            .text(//#. %1$s is the storagespace in use
                  //#. %2$s is the max storagespace
                  //#, c-format
                  gt("%1$s of %2$s", strings.fileSize(quota.mail.use),  strings.fileSize(quota.mail.quota)));

            var width = (quota.mail.use / quota.mail.quota) * 100;
            $node.find(".plugins-portal-quota-mailbar")
                .addClass("progress")
                .css('margin-bottom', '0px')
                .append(buildbar(width));
        }

        //mailcount
        if (quota.mail.countquota < 0) {
            $node.find(".plugins-portal-quota-mailcount").remove();

        } else {
            $node.find(".plugins-portal-quota-memory-mailcount")
            
            .text(//#. %1$s is the number of mails
                  //#. %2$s is the maximum number of mails
                  //#, c-format
                  gt("%1$s of %2$s", gt.noI18n(quota.mail.countuse), gt.noI18n(quota.mail.countquota)));

            var width = (quota.mail.countuse / quota.mail.countquota) * 100;
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
        id: 'quota',//needed so onclick sidepane isn't shown
        index: 900,
        title: gt('Quota'),
        load: load,
        draw: draw,
        hideSidePopup: true,
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