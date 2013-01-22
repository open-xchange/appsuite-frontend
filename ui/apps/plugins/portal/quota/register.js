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
    availableQuota = function (quota) {
        var fields = [];

        fields.push({
            quota: quota.file.quota,
            usage: quota.file.use,
            name: 'memory-file',
            i18nName: gt('File quota')
        });

        fields.push({
            quota: quota.mail.quota,
            usage: quota.mail.use,
            name: 'memory-mail',
            i18nName: gt('Mail quota')
        });

        fields.push({
            quota: quota.mail.countquota,
            usage: quota.mail.countuse,
            name: 'mailcount',
            i18nName: gt('Mail count quota')
        });

        return _(fields).select(function (q) {
            return (q.quota && q.usage);
        });
    },

    drawTile = function (quota) {
        var contentFields = $('<div>').addClass('content no-pointer');

        this.append(contentFields);

        _.each(availableQuota(quota), function (q) {
            addQuotaArea(contentFields, q);
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
     * Add a quota section with a given (internal) @param quota.name and a
     * user visible @param quota.i18nName to the element @param el
     *
     * @param el - the element, that is the parent
     * @param quota - object of the form:
     * {
     *  name: name of the quota element (same as for addQuotaArea)
     *  i18nName: translated name to show to the user
     *  quota: value of the quota
     *  usage: actual usage of the quota
     *  widget: the widget to add the quota fields to
     * }
     * @return - a div element containing some fields for data
     */
    addQuotaArea = function (el, quota) {
        var label = $('<span>').addClass('pull-right gray quota-' + quota.name),
            bar = $('<div>').addClass('plugins-portal-quota-' + quota.name + 'bar');

        el.append(
            $('<div>').addClass('paragraph')
            .append($('<span>').text(quota.i18nName),
                label,
                bar
            )
        );

        if (quota.quota < 0) {
            label.text(gt('unlimited'));
            bar.remove();
        } else {
            label.text(
                //#. %1$s is the storagespace in use
                //#. %2$s is the max storagespace
                //#, c-format
                gt('%1$s of %2$s', strings.fileSize(quota.usage), strings.fileSize(quota.quota))
            );

            bar.addClass('progress progress-striped')
            .append(buildbar(quota.usage, quota.quota));
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
