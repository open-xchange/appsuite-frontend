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

define('io.ox/chat/views/fileList', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'io.ox/chat/data',
    'io.ox/backbone/views/toolbar',
    'io.ox/chat/util',
    'io.ox/chat/api',
    'io.ox/chat/util/url',
    'io.ox/core/strings',
    'io.ox/chat/toolbar',
    'gettext!io.ox/chat'
], function (ext, DisposableView, data, ToolbarView, util, api, url, strings, toolbar, gt) {

    'use strict';

    var FileList = DisposableView.extend({

        className: 'files abs',

        initialize: function () {
            this.collection = data.files;
            this.listenTo(this.collection, { 'add': this.onAdd });
            this.collection.fetch().fail(function () {
                require(['io.ox/core/yell'], function (yell) {
                    yell('error', gt('Files could not be loaded.'));
                });
            });
            this.$scrollpane = $('<div class="scrollpane scrollable" tabindex="0">').lazyloadScrollpane();
        },

        render: function () {
            this.$el.append(
                $('<div class="header">').append(
                    $('<h2>').append(gt('All files'))
                ),
                new ToolbarView({ point: 'io.ox/chat/files/toolbar', title: gt('All files') }).render(new ext.Baton()).$el,
                this.$scrollpane.append(
                    this.renderItems()
                )
            );
            return this;
        },

        renderItems: function () {
            var $ul = $('<ul>');
            var items = this.getItems();
            // before adding nodes the scrollpane should be added to the DOM
            setTimeout(function (items) {
                $ul.append(
                    items.length > 0 ? items.map(this.renderItem, this) : this.renderEmpty().delay(500).fadeIn(100)
                );
            }.bind(this, items), 0);
            return $ul;
        },

        renderEmpty: function () {
            return $('<li class="info-container">').hide()
                .append($('<div class="info">').text(gt('There are no files yet')));
        },

        getItems: function () {
            return this.collection;
        },

        renderItem: function (model) {
            var $preview = $('<div class="preview">');
            var $details = $('<div class="details">');
            var $button = $('<button type="button">')
                .attr('data-file-id', model.get('fileId'))
                .append($preview, $details);
            // preview
            if (model.isImage()) {
                $button.attr('data-cmd', 'show-file');
                var preview = model.get('preview');
                var averageColor = preview && preview.averageColor;
                if (averageColor) $preview.css('backgroundColor', averageColor);
                $preview.addClass('cursor-zoom-in').fastlazyload(this.$scrollpane).one('appear', { url: model.getThumbnailUrl() }, function (e) {
                    url.request(e.data.url).then(function (url) {
                        $(this).css('backgroundImage', 'url("' + url + '")');
                    }.bind(this));
                });
            } else {
                var mimetype = model.get('mimetype');
                var filetype = util.getClassFromMimetype(mimetype);
                $button.attr({ 'data-cmd': 'download', 'data-url': model.getFileUrl() });
                $preview.addClass('flex-center-vertically').append(
                    util.svg({ icon: 'fa-' + filetype })
                        .addClass('file-type ' + filetype)
                        .attr('title', util.getFileTypeName(mimetype, model.get('name')))
                );
            }
            // details
            $details.append(
                $('<div class="filename">').text(model.get('name')),
                $('<div class="filestats ellipsis">').append(
                    $('<span class="filedate">').text(data.users.getShortName(model.get('sender'))),
                    $('<span class="filesize">').text(strings.fileSize(model.get('size'), 0))
                )
            );
            // list item
            return $('<li class="file">').append($button);
        },

        getNode: function (model) {
            return this.$('[data-id="' + $.escape(model.get('id')) + '"]');
        },

        onAdd: _.debounce(function (model, collection, options) {
            if (this.disposed) return;
            $(this.el).find('.info-container').remove();
            this.updateIndices();
            this.$scrollpane.find('ul').prepend(
                options.changes.added.map(this.renderItem, this)
            );
            // let lazyload react immediately
            this.$scrollpane.triggerHandler('add');
        }, 1),

        updateIndices: function () {
            this.$('.scrollpane ul li').each(function () {
                var index = parseInt($(this).children().attr('data-index'), 10);
                $(this).children().attr('data-index', index + 1);
            });
        }
    });

    ext.point('io.ox/chat/files/toolbar').extend(
        {
            id: 'back',
            index: 100,
            custom: true,
            draw: toolbar.back
        },
        {
            id: 'title',
            index: 200,
            custom: true,
            draw: function () {
                this.addClass('toolbar-title').attr('data-prio', 'hi').text(gt('All files'));
            }
        },
        {
            id: 'switch-to-floating',
            index: 300,
            custom: true,
            draw: toolbar.detach
        }
    );

    return FileList;
});
