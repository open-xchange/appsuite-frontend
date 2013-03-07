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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/mail/mailfilter/settings/register',
        ['io.ox/core/extensions', 'io.ox/core/notifications',
         'io.ox/core/api/user', 'gettext!io.ox/mail'], function (ext, notifications, userAPI, gt) {

    'use strict';

    var filterModel,
        touchAttributes = function (model) {
        var fields = ['subject', 'text', 'days', 'id', 'addresses'],
            x = 0;
        for (; x < fields.length; x++) {
            model.touch(fields[x]);
        }
    },
        createDaysObject = function (from, to) {
        var objectOfValues = {};
        for (var i = from; i <= to; i += 1) {
            objectOfValues[i] = i;
        }
        return objectOfValues;
    };

    ext.point("io.ox/settings/pane").extend({
        id: 'vacation',
        title: gt("Vacation Notice"),
        ref: 'io.ox/vacation',
        loadSettingPane: false,
        index: 400,
        lazySaveSettings: true
    });

    ext.point("io.ox/vacation/settings/detail").extend({
        index: 100,
        draw: function () {
            var $node = this;
            require(["io.ox/mail/mailfilter/settings/filter"], function (filters) {

                userAPI.get().done(function (user) {

                    var multiValues = {
                        aliases: _.object(user.aliases, user.aliases),
                        days: createDaysObject(1, 31)
                    };

                    filters.editVacationtNotice($node, multiValues, user.email1).done(function (filter) {
                        filterModel = filter;
                        touchAttributes(filterModel);
                        filter.on('update', function () {
                            require("io.ox/core/notifications").yell("success", gt("Your vacation notice has been saved"));
                        });
                    }).fail(function () {
                        $node.append(
                            $.fail(gt("Couldn't load your vacation notice."), function () {
                                filters.editVacationtNotice($node).done(function () {
                                    $node.find('[data-action="discard"]').hide();
                                });
                            })
                        );
                    });
                });
            });
        },

        save: function () {
            filterModel.save().done(function () {
                touchAttributes(filterModel);
            }).fail(function () {
                notifications.yell('error', gt('Could not save vacation notice'));
            });

        }
    });
});
