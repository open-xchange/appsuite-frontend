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
            $('<div>').addClass('content no-pointer').append(
                addQuotaArea('memory-file', gt('File quota')),
                addQuotaArea('memory-mail', gt('Mail quota')),
                addQuotaArea('mailcount', gt('Mail count quota'))
            )
        );

        displayQuota({
            quota: quota.file.quota,
            usage: quota.file.use,
            name: 'memory-file',
            widget: this
        });
        displayQuota({
            quota: quota.mail.quota,
            usage: quota.mail.use,
            name: 'memory-mail',
            widget: this
        });
        displayQuota({
            quota: quota.mail.countquota,
            usage: quota.mail.countuse,
            name: 'mailcount',
            widget: this
        });

    },

    /**
     * Create a progress bar showing the relation of two values represonted by
     * @param usage and @param size. It’s assumed, that usage is always the smaller
     * value and size the larger one.
     *
     * @return a progressbar element
     */
    buildbar = function (usage, size) {
        var width       = (Math.min(usage, size) / Math.max(usage, size)) * 100,
            progressbar = $('<div>').addClass('bar').css('width', width + '%');

        if (width < 70) {
            progressbar.addClass('default'); // blue instead of green
        } else if (width < 90) {
            progressbar.addClass('default'); // still blue instead of green
        } else {
            progressbar.addClass('bar-danger');
        }

        return progressbar;
    },
    /**
     * Add a quota section with a given (internal) @param name and a
     * user visible @param i18nName
     *
     * @return - a div element containing some fields for data
     */
    addQuotaArea = function (name, i18nName) {
        return $('<div>').addClass('paragraph')
            .append($('<span>').text(i18nName),
                    $('<span>').addClass('pull-right gray quota-' + name),
                    $('<div>').addClass('plugins-portal-quota-' + name + 'bar')
                   );
    },
    /**
     * Display quota data in the fields added by addQuotaArea
     *
     * @param params - object of the form:
     * {
     *  name: name of the quota element (same as for addQuotaArea)
     *  quota: value of the quota
     *  usage: actual usage of the quota
     *  widget: the parent widget of the portal plugins
     * }
     */
    displayQuota = function (params) {
        if (params.quota < 0) {
            params.widget.find('.quota-' + params.name).text(gt('unlimited'));
            params.widget.find('.plugins-portal-quota' + params.name + 'bar').remove();
        } else {
            params.widget.find('quota-' + params.name)
                .text(
                    //#. %1$s is the storagespace in use
                    //#. %2$s is the max storagespace
                    //#, c-format
                    gt('%1$s of %2$s', strings.fileSize(params.usage), strings.fileSize(params.quota))
                );

            params.widget.find('.plugins-portal-quota' + params.name + 'bar')
                .addClass('progress progress-striped')
                .append(buildbar(params.usage, params.quota));
        }
    },

    load = function () {
        return $.Deferred().resolve();
    },

    draw = function () {
        return $.Deferred().resolve();
    };

    ext.point('io.ox/portal/widget/quota').extend({
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

    ext.point('io.ox/portal/widget/quota/settings').extend({
        title: gt('Quota'),
        type: 'quota',
        editable: false,
        unique: true
    });
});
