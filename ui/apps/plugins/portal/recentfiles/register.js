/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('plugins/portal/recentfiles/register', [
    'io.ox/core/extensions',
    'io.ox/files/api',
    'io.ox/core/api/user',
    'io.ox/core/strings',
    'gettext!plugins/portal',
    'settings!io.ox/core',
    'settings!io.ox/files',
    'less!plugins/portal/recentfiles/style'
], function (ext, filesAPI, userAPI, strings, gt, settings, filesSettings) {

    'use strict';

    _(['recentfiles', 'myfiles']).each(function (type) {

        var searchOptions = { includeSubfolders: true, limit: _.device('smartphone') ? 5 : 10, order: 'desc', sort: 5 };

        if (type === 'myfiles') {
            searchOptions.folder = settings.get('folder/infostore');
        }

        var title = type === 'recentfiles' ? gt('Recently changed files') : gt('My latest files');

        ext.point('io.ox/portal/widget/' + type).extend({

            // helps at reverse lookup
            type: 'recentfiles',

            title: title,

            load: function (baton) {
                return filesAPI.search('', searchOptions).then(function (files) {
                    // don't show hidden files if disabled in settings
                    if (filesSettings.get('showHidden') === false) {
                        files = _(files).filter(function (file) {
                            var title = (file ? file['com.openexchange.file.sanitizedFilename'] : '');
                            return title.indexOf('.') !== 0;
                        });
                    }
                    // update baton
                    baton.data = files;
                    // get user ids
                    var userIds = _(files).chain().pluck('modified_by').uniq().value();
                    // map userids back to each file
                    return userAPI.getList(userIds)
                        .done(function (users) {
                            _(files).each(function (file) {
                                file.modified_by = _(users).find(function (user) { return user.id === file.modified_by; });
                            });
                        })
                        .then(function () {
                            return files;
                        });
                });
            },

            summary: function (baton) {

                if (this.find('.summary').length) return;

                var message = '',
                    count = baton.data.length;

                if (count === 0) {
                    message = gt('No files have been changed recently');
                } else if (count === 1) {
                    message = gt('1 file has been changed recently');
                } else {
                    message = gt('%1$d files has been changed recently', count);
                }

                this.addClass('with-summary show-summary').append(
                    $('<div class="summary">').text(message)
                )
                .on('tap', 'h2', function (e) {
                    $(e.delegateTarget).toggleClass('show-summary');
                });
            },

            preview: function (baton) {

                var content = $('<ul class="content recentfiles list-unstyled">').appendTo(this),
                    data = baton.data;

                if (!data || data.length === 0) {
                    content.append($('<li>').text(gt('No files have been changed recently')));
                    return;
                }

                content.append(
                    _(data).map(function (file) {
                        var filename = String(file['com.openexchange.file.sanitizedFilename'] || file.filename || file.title || ''),
                            size = strings.fileSize(file.file_size, 1),
                            ago = moment.duration(file.last_modified - _.utc()).humanize(true);
                        // create nice filename for long names
                        if (filename.length > 25) {
                            // remove leading & tailing date stufff
                            filename = filename
                                .replace(/^[0-9_\-.]{5,}(\D)/i, '\u2026$1')
                                .replace(/[0-9_\-.]{5,}(\.\w+)?$/, '\u2026$1');
                        }
                        return $('<li class="item file" tabindex="0">')
                            .data('item', file)
                            .append(
                                $('<div class="title">').text(_.noI18n(_.ellipsis(filename, { max: 25 }))), $.txt(' '),
                                $('<div class="clearfix">').append(
                                    // show WHO changed it OR file size
                                    $('<span class="pull-left ellipsis">').text(
                                        type === 'recentfiles' ? file.modified_by.display_name : size
                                    ),
                                    // show WHEN it was changed
                                    $('<span class="pull-right accent">').text(ago)
                                )
                            );
                    })
                );

                // store a copy of all items
                content.data('items', _(data).map(_.cid));

                content.on('click', 'li.item', function (e) {
                    e.stopPropagation();
                    var items = $(e.delegateTarget).data('items'),
                        item = $(e.currentTarget).data('item');
                    require(['io.ox/core/viewer/main'], function (Viewer) {
                        filesAPI.get(item).done(function (data) {
                            var models = filesAPI.resolve(items, false),
                                collection = new Backbone.Collection(models),
                                viewer = new Viewer();
                            baton = new ext.Baton({ data: data, collection: collection });
                            viewer.launch({ selection: baton.data, files: baton.collection.models });
                        });
                    });
                });
            },

            draw: function () {
            }
        });

        // publish
        ext.point('io.ox/portal/widget').extend({ id: type });

        ext.point('io.ox/portal/widget/' + type + '/settings').extend({
            title: title,
            type: type,
            unique: true,
            editable: false
        });
    });
});
