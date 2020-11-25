/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/views/fileList', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/disposable',
    'io.ox/chat/data',
    'io.ox/backbone/views/toolbar',
    'io.ox/chat/util',
    'io.ox/chat/api',
    'gettext!io.ox/chat'
], function (ext, DisposableView, data, ToolbarView, util, api, gt) {

    'use strict';

    ext.point('io.ox/chat/files/toolbar').extend({
        id: 'back',
        index: 100,
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="button" draggable="false" tabindex="-1" data-cmd="close-chat">').append(
                    $('<i class="fa fa-chevron-left" aria-hidden="true">').css({ 'margin-right': '4px' }), gt('Chats')
                )
            );
        }
    });

    ext.point('io.ox/chat/files/toolbar').extend({
        id: 'title',
        index: 200,
        custom: true,
        draw: function () {
            this.addClass('toolbar-title').attr('data-prio', 'hi').text(gt('All files'));
        }
    });

    ext.point('io.ox/chat/files/toolbar').extend({
        id: 'switch-to-floating',
        index: 300,
        custom: true,
        draw: function () {
            this.attr('data-prio', 'hi').append(
                $('<a href="#" role="button" draggable="false" tabindex="-1" data-cmd="switch-to-floating">').attr('aria-label', gt('Detach window')).append(
                    $('<i class="fa fa-window-maximize" aria-hidden="true">').attr('title', gt('Detach window'))
                )
            );
        }
    });

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
        },

        render: function () {
            var items = this.getItems();
            this.$el.append(
                $('<div class="header">').append(
                    $('<h2>').append(gt('All files'))
                ),
                new ToolbarView({ point: 'io.ox/chat/files/toolbar', title: gt('All files') }).render(new ext.Baton()).$el,
                $('<div class="scrollpane">').append(
                    $('<ul>').append(
                        items.length > 0 ? items.map(this.renderItem, this) : this.renderEmpty().delay(500).fadeIn(100)
                    )
                )
            );
            return this;
        },
        renderEmpty: function () {
            return $('<li class="info-container">').hide()
                .append($('<div class="info">').text(gt('There are no files yet')));
        },
        getItems: function () {
            return this.collection;
        },

        renderItem: function (model) {
            var preview = $('<div class="preview">');
            var details = $('<div class="details">');
            var button = $('<button type="button">')
                .attr('data-file-id', model.get('fileId'))
                .append(preview, details);
            // preview
            if (model.isImage()) {
                button.attr('data-cmd', 'show-file');
                preview.addClass('cursor-zoom-in');
                api.requestBlobUrl({ url: model.getThumbnailUrl() }).then(function (url) {
                    preview.css('backgroundImage', 'url("' + url + '")');
                });
            } else {
                button.attr({ 'data-cmd': 'download', 'data-url': model.getFileUrl() });
                preview.addClass('flex-center-vertically').append(
                    $('<i class="fa icon" aria-hidden="true">')
                        .addClass(util.getClassFromMimetype(model.get('mimetype')))
                        .attr('title', util.getFileTypeName(model.get('mimetype'), model.get('name')))
                );
            }
            // details
            details.append(
                $('<div class="filename">').text(model.get('name')),
                $('<div class="filestats">').append(
                    $('<span class="filedate">').text(data.users.getShortName(model.get('email'))),
                    $('<span class="filesize">').text('')
                )
            );
            // list item
            return $('<li class="file">').append(button);
        },

        getNode: function (model) {
            return this.$('[data-id="' + $.escape(model.get('id')) + '"]');
        },

        onAdd: _.debounce(function (model, collection, options) {
            if (this.disposed) return;
            $(this.el).find('.info-container').remove();
            this.updateIndices();
            this.$('.scrollpane ul').prepend(
                options.changes.added.map(this.renderItem, this)
            );
        }, 1),

        updateIndices: function () {
            this.$('.scrollpane ul li').each(function () {
                var index = parseInt($(this).children().attr('data-index'), 10);
                $(this).children().attr('data-index', index + 1);
            });
        }
    });

    return FileList;
});
