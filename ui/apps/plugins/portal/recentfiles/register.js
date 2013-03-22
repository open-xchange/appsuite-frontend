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

define('plugins/portal/recentfiles/register',
    ['io.ox/core/extensions',
     'io.ox/files/api',
     'io.ox/core/api/user',
     'io.ox/core/date',
     'io.ox/core/config',
     'gettext!plugins/portal',
     'less!plugins/portal/recentfiles/style.css'], function (ext, filesApi, userApi, date, config, gt) {

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

    _(['recentfiles', 'myfiles']).each(function (type) {

        var searchOptions = { sort: 5, order: 'desc', limit: 10, columns: '1,3,4,5,20,700,701,702,703,704' };
        if (type === 'myfiles') {
            searchOptions.folder = config.get('folder.infostore');
        }

        var title = type === 'recentfiles' ? gt('Recently changed files') : gt('My latest files');

        ext.point('io.ox/portal/widget/' + type).extend({

            title: title,

            load: function (baton) {
                return filesApi.search('', searchOptions)
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

                var content = $('<div class="content recentfiles">').appendTo(this),
                    data = baton.data;

                if (!data || data.length === 0) {
                    content.text(gt('No files have been changed recently'));
                    return;
                }

                _(data).each(function (file) {
                    var filename = String(file.filename || file.title || '');
                    // create nice filename for long names
                    if (filename.length > 20) {
                        // remove leading & tailing date stufff
                        filename = filename
                            .replace(/^[0-9_\-\.]{5,}(\D)/i, '\u2026$1')
                            .replace(/[0-9_\-\.]{5,}(\.\w+)?$/, '\u2026$1');
                    }
                    content.append(
                        $('<div class="item">').data('item', file).append(
                            $('<b>').text(filename), $.txt(' '),
                            $('<span class="gray">').text(
                                type === 'recentfiles' ?
                                    file.modified_by.display_name : // show WHO changed it
                                    new date.Local(file.last_modified).format(date.DATE_TIME) // show WHEN it was changed
                            )
                        )
                    );
                });
            },

            draw: function (baton) {
                var popup = this.busy();
                require(['io.ox/files/list/view-detail'], function (view) {
                    var obj = filesApi.reduce(baton.item);
                    filesApi.get(obj).done(function (data) {
                        popup.idle().append(view.draw(data));
                    });
                });
            }
        });

        ext.point('io.ox/portal/widget/' + type + '/settings').extend({
            title: title,
            type: type,
            unique: true,
            editable: false
        });
    });
});
