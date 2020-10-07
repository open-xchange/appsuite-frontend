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

        events: {
            'click button[data-download]': 'onFileDownload'
        },

        initialize: function () {

            this.collection = data.files;

            this.listenTo(this.collection, {
                'add': this.onAdd
            });

            this.collection.fetch();
        },

        render: function () {
            this.$el.append(
                $('<div class="header">').append(
                    $('<h2>').append(gt('All files'))
                ),
                new ToolbarView({ point: 'io.ox/chat/files/toolbar', title: gt('All files') }).render(new ext.Baton()).$el,
                $('<div class="scrollpane">').append(
                    $('<ul>').append(
                        this.getItems().map(this.renderItem, this)
                    )
                )
            );
            return this;
        },

        getItems: function () {
            return this.collection;
        },

        renderItem: function (model) {
            var button = $('<button type="button">').attr('data-file-id', model.get('fileId'));
            if (model.isImage()) {
                button.attr('data-cmd', 'show-file');
                api.requestDataUrl({ url: model.getThumbnailUrl() }).then(function (base64encodedImage) {
                    button.css('backgroundImage', 'url(\'' + base64encodedImage + '\')');
                });
            } else {
                button.append(
                    $('<i class="fa icon" aria-hidden="true">').addClass(util.getClassFromMimetype(model.get('mimetype'))),
                    $('<div class="filename">').text(model.get('name'))
                ).attr('data-download', model.getFileUrl());
            }

            return $('<li>').append(button);
        },

        getNode: function (model) {
            return this.$('[data-id="' + $.escape(model.get('id')) + '"]');
        },

        onAdd: _.debounce(function (model, collection, options) {
            if (this.disposed) return;

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
        },

        onFileDownload: function (e) {
            e.preventDefault();
            var url = $(e.currentTarget).attr('data-download');
            api.downloadFile(url);
        }
    });

    return FileList;
});
