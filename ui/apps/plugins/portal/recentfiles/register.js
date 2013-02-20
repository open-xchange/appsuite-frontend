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
     'gettext!plugins/portal',
     'less!plugins/portal/recentfiles/style.css'], function (ext, filesApi, userApi, date, gt) {

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

    ext.point('io.ox/portal/widget/recentfiles').extend({

        title: 'Recently changed files',

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
            return filesApi.search('', { sort: 5, order: 'desc', limit: 10, columns: '1,3,4,5,20,700,701,702,703,704' })
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
            var content = $('<div class="content recentfiles pointer">').appendTo(this),
                data = baton.data;
            if (!data || data.length === 0) {
                content.text(gt("No files were uploaded recently"));
                return;
            }
            _(data).each(function (file) {
                var myDate = new date.Local(file.last_modified).format(date.DATE_TIME),
                    text = file.last_modified === file.creation_date ?
                        gt("%1$s was created by %2$s") :
                        gt("%1$s was modified by %2$s");
                text = gt.format(text, '<b>' + (file.filename || file.title) + '</b>', file.modified_by.display_name);
                $('<div class="entry">').html(text).appendTo(content);
            });
        },

        draw: function (baton) {
            var content = $('<div class="content recentfiles">').appendTo(this),
                data = baton.data;

            content.append($('<h1>').text(gt('Recently changed files')));

            if (!data || data.length === 0) {
                content.text(gt("No files were created or changed recently."));
                return;
            }

            _(data).each(function (file) {
                var myDate = new date.Local(file.last_modified).format(date.DATE_TIME),
                    text;
                if (file.last_modified === file.creation_date) {
                    text = gt("Created by:");
                } else {
                    text = gt("Modified by:");
                }
                $('<div class="entry">').append(
                    $('<a>', {href: "#!&app=io.ox/files&folder=" + file.folder_id + "&id=" + file.folder_id + "." + file.id + "&perspective=list"}).text(file.filename || file.title),
                    '<br/>',
                    $('<span class="uploader">').text(text),
                    $('<b class="uploader">').text(file.modified_by.display_name), //TODO halo here?
                    '<br/>',
                    $('<span class="date">').text(myDate),
                    $('<span class="type">').text(file.mime_type),
                    $('<span class="size">').text(humanReadable(file.file_size)),
                    '<br />'
                ).appendTo(content);

            });

        }
    });

    ext.point('io.ox/portal/widget/recentfiles/settings').extend({
        title: gt('Recent files'),
        type: 'recentfiles',
        editable: false
    });
});
