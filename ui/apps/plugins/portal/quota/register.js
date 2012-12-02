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

define("plugins/portal/quota/register",
    ['io.ox/core/extensions',
     'gettext!plugins/portal',
     'io.ox/core/api/quota',
     'io.ox/core/strings',
     'less!plugins/portal/quota/style.css'
    ], function (ext, gt, api, strings) {

    "use strict";

    var loadTile = function () {
        return api.get();
    },

    drawTile = function (quota) {
        this.append(
            $('<div class="content no-pointer">').append(
                $('<div class="paragraph">').append(
                    $("<span>").text(gt("File quota")),
                    $('<span class="pull-right gray quota-memory-file">'),
                    $("<div>").addClass("plugins-portal-quota-filebar")
                ),
                $('<div class="paragraph">').append(
                    $('<span>').text(gt("Mail quota")),
                    $('<span class="pull-right gray quota-memory-mail">'),
                    $("<div>").addClass("plugins-portal-quota-mailbar")
                ),
                $('<div class="paragraph">').append(
                    $('<span>').text(gt("Mail count quota")),
                    $('<span class="pull-right gray quota-mailcount">'),
                    $("<div>").addClass("plugins-portal-quota-mailcountbar")
                ).addClass("plugins-portal-quota-mailcount")
            )
        );

        //filestorage
        if (quota.file.quota < 0) {
            this.find(".quota-memory-file").text(gt("unlimited"));
            this.find(".plugins-portal-quota-filebar").remove();
        } else {
            this.find(".quota-memory-file")
            .text(//#. %1$s is the storagespace in use
                  //#. %2$s is the max storagespace
                  //#, c-format
                  gt("%1$s of %2$s", strings.fileSize(quota.file.use), strings.fileSize(quota.file.quota)));

            var width = (quota.file.use / quota.file.quota) * 100;
            this.find(".plugins-portal-quota-filebar")
                .addClass("progress progress-striped")
                .append(buildbar(width));
        }

        //mailstorage
        if (quota.mail.quota < 0) {
            this.find(".quota-memory-mail").text(gt("unlimited"));
            this.find(".plugins-portal-quota-mailbar").remove();
        } else {
            this.find(".quota-memory-mail")
            .text(//#. %1$s is the storagespace in use
                  //#. %2$s is the max storagespace
                  //#, c-format
                  gt("%1$s of %2$s", strings.fileSize(quota.mail.use),  strings.fileSize(quota.mail.quota)));

            var width = (quota.mail.use / quota.mail.quota) * 100;
            this.find(".plugins-portal-quota-mailbar")
                .addClass("progress progress-striped")
                .append(buildbar(width));
        }

        //mailcount
        if (quota.mail.countquota < 0) {
            this.find(".quota-mailcount").remove();
        } else {
            this.find(".quota-mailcount")
            .text(//#. %1$s is the number of mails
                  //#. %2$s is the maximum number of mails
                  //#, c-format
                  gt("%1$s of %2$s", gt.noI18n(quota.mail.countuse), gt.noI18n(quota.mail.countquota)));

            var width = (quota.mail.countuse / quota.mail.countquota) * 100;
            this.find(".plugins-portal-quota-mailcountbar")
                .addClass("progress progress-striped")
                .append(buildbar(width));
        }
    },

    buildbar = function (width) {
        var progressbar = $('<div>').addClass('bar').css('width', width + "%");
        if (width < 70) {
            progressbar.addClass('default'); // blue instead of green
        } else if (width < 90) {
            progressbar.addClass('default'); // still blue instead of green
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

    ext.point("io.ox/portal/widget/quota").extend({
        title: gt('Quota'),
        load: load,
        draw: draw,
        hideSidePopup: true,
        preview: function () {
            var self = this;
            return loadTile().done(function (quota) {
                drawTile.call(self, quota);
            });
        }
    });
});
