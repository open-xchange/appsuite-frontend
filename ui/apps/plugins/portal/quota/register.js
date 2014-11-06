/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('plugins/portal/quota/register',
    ['io.ox/core/extensions',
     'gettext!plugins/portal',
     'io.ox/core/api/quota',
     'io.ox/core/strings',
     'io.ox/core/capabilities',
     'less!plugins/portal/quota/style'
    ], function (ext, gt, api, strings, capabilities) {

    'use strict';

    var loadTile = function () {
        return api.get();
    },
    availableQuota = function (quota) {
        var fields = [];

        if (capabilities.has('infostore')) {
            fields.push({
                quota: quota.file.quota,
                usage: quota.file.use,
                name: 'memory-file',
                i18nName: gt('File quota')
            });
        }
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
            //must check against undefined otherwise 0 values would lead to not displaying the quota. See Bug 25110
            return (q.quota !== undefined && q.usage !== undefined);
        });
    },

    drawTile = function (quota) {
        var contentFields = $('<ul>').addClass('content no-pointer list-unstyled');

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
    buildbar = (function () {

        function getWidth(usage, size) {
            if (!size) return 100;
            if (!usage) return 0;
            if (usage >= size) return 100;
            return Math.round(usage / size * 100);
        }

        return function (usage, size) {

            var width = getWidth(usage, size);

            return $('<div class="progress-bar">')
                .css('width', width + '%')
                .addClass(width < 90 ? 'default' : 'bar-danger');
        };
    }()),

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
            $('<li class="paragraph">').append(
                label,
                $('<span>').text(quota.i18nName),
                bar
            )
        );

        if (quota.quota <= 0) {
            label.text(gt('unlimited'));
            bar.remove();
        } else {
            if (quota.name === 'mailcount') {
                //mailcount must not be shown in bytes
                label.text(
                    quota.usage < quota.quota ?
                        //#. %1$s is the number of mails in use
                        //#. %2$s is the max number of mails
                        //#, c-format
                        gt('%1$s of %2$s', quota.usage, quota.quota) :
                        //#. Quota maxed out; 100%
                        gt('100%')
                );
            } else {
                label.text(
                    quota.usage < quota.quota ?
                        //#. %1$s is the storagespace in use
                        //#. %2$s is the max storagespace
                        //#, c-format
                        gt('%1$s of %2$s', strings.fileSize(quota.usage, 2), strings.fileSize(quota.quota, 2)) :
                        //#. Quota maxed out; 100%
                        gt('100%')
                );
            }

            bar.addClass('progress progress-striped').append(
                buildbar(quota.usage, quota.quota)
            );
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
