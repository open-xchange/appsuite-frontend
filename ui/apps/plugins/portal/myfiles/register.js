/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2013
 * Mail: info@open-xchange.com
 *
 * @author  Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/portal/myfiles/register',
    ['io.ox/core/extensions',
     'io.ox/files/api',
     'io.ox/core/api/user',
     'io.ox/core/date',
     'io.ox/core/config',
     'io.ox/core/tk/dialogs',
     'io.ox/files/list/view-detail',
     'gettext!plugins/portal',
     'less!plugins/portal/myfiles/style.css'], function (ext, filesApi, userApi, date, config, dialogs, viewDetail, gt) {

    'use strict';
    var humanReadable = function (bytes) {
        var pos = 0,
            temp = bytes,
            suffixes = ['Byte', 'kb', 'mb', 'gb', 'tb', 'pb'];
        while ((temp / 1024 >= 1) && (pos < suffixes.length - 1)) {
            temp = temp / 1024;
            pos += 1;
        }
        return Math.round(temp) + " " + suffixes[pos];
    };

    var sidePop = function (e, dialog, file) {
        dialog.show(e, function (popup) {
            popup.append(viewDetail.draw(file));
        });
    };

    ext.point('io.ox/portal/widget/myfiles').extend({

        title: 'My latest files',

        isEnabled: function () {
            return true;
        },

        requiresSetUp: function () {
            return false;
        },

        performSetUp: function () {
            return;
        },

        load: function (baton) {
            return filesApi.search('', { sort: 5, order: 'desc', limit: 10, columns: '1,3,4,5,20,700,701,702,703,704', folder: config.get('folder.infostore') })
            .pipe(function (files) {
                // update baton
                baton.data = files;
                // get user ids
                var userIds = _(files).chain().pluck('modified_by').uniq().value();
                // map userids back to each file
                return userApi.getList(userIds)
                    .done(function (users) {
                        _(files).each(function (file) {
                            file.modified_by = _(users).find(function (user) { return user.id === file.modified_by; });
                        });
                    })
                    .pipe(function () {
                        return files;
                    });
            });
        },

        preview: function (baton) {
            var content = $('<div class="content myfiles pointer">').appendTo(this),
                data = baton.data,
                dialog = new dialogs.SidePopup();
            if (!data || data.length === 0) {
                content.text(gt("No files were uploaded recently"));
                return;
            }
            _(data).each(function (file) {
                var myDate = new date.Local(file.last_modified).format(date.DATE_TIME),
                    text = file.last_modified === file.creation_date ?
                        gt("%1$s was created on %2$s") :
                        gt("%1$s was modified on %2$s");
                text = gt.format(text, '<b>' + (file.filename || file.title) + '</b>', myDate);
                $('<div class="item">').html(text).appendTo(content).on('click', function (e) {
                    sidePop(e, dialog, file);
                });
            });
        }
    });

    ext.point('io.ox/portal/widget/myfiles/settings').extend({
        title: gt('My files'),
        type: 'myfiles',
        editable: false
    });
});
