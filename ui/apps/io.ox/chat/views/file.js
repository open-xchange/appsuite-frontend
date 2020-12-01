/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/chat/views/file', [
    'io.ox/backbone/views/disposable',
    'io.ox/chat/api',
    'io.ox/chat/util',
    'io.ox/core/strings',
    'gettext!io.ox/chat'
], function (DisposableView, api, util, strings, gt) {

    'use strict';

    var FileView = DisposableView.extend({

        className: 'file',

        events: {
            'click .cancel-upload': 'cancelUpload',
            'click .play-button': 'toggleAnimation',
            'click .animated-file': 'toggleAnimation'
        },

        initialize: function (options) {
            this.options = _.extend({ inEditor: false }, options);
            this.inEditor = this.options.inEditor;
            this.listenTo(this.model, {
                'change:files': this.onChangeBody,
                'progress': this.renderUploadProgress,
                // if upload is done switch preview to actual fileview
                'change:uploading': this.render
            });
        },

        render: function () {
            if (this.disposed) return this;
            this.$el.empty();
            var model = this.model;
            if (model.get('cancelled')) return this;
            if (model.isDeleted()) return this;
            var file = model.getFile();
            if (!file) return this;
            if (file.isImage) this.renderThumbnail(file); else this.renderFile(file);
            return this;
        },

        renderThumbnail: function (file) {

            this.$el.addClass('message-thumbnail-container').append(
                $('<div class="name">').text(file.name)
            );

            var $img = $('<img>');
            var $thumbnail = $('<div class="message-thumbnail">').append($img);

            if (file.isBlob) {
                $img.attr('src', URL.createObjectURL(file.blob)).on('dispose', function () {
                    URL.revokeObjectURL(this.src);
                });
                this.$el.append($thumbnail.append(this.getCancelUploadButton(), this.getProgressBar()));
                return;
            }

            var preview = file.preview;
            if (preview) {
                $img.attr('src', getSVG(preview.width, preview.height))
                    .css('backgroundColor', preview.averageColor || '#eeeeee');
            } else {
                $img.attr('src', getSVG(1, 1)).css('backgroundColor', '#eee');
            }

            this.$el.append(
                $thumbnail.append(
                    $img.lazyload().one('appear', { url: file.thumbnail }, function (e) {
                        api.requestBlobUrl({ url: e.data.url }).then(function (url) {
                            $(this).attr('src', url)
                            .css('backgroundColor', '')
                            .on('dispose', function () { URL.revokeObjectURL(this.src); });
                        }.bind(this));
                    })
                )
            );

            if (this.inEditor) {
                $img.trigger('appear');
                return;
            }

            this.$el.attr({
                'data-room-id': this.model.get('roomId'),
                'data-file-id': file.id,
                'data-message-id': this.model.get('messageId')
            });

            if (file.isAnimated) {
                var animatedFile = $('<img class="animated-file">'),
                    playButton = $('<button class="play-button">').append($('<i class="fa fa-play">')),
                    loadAnimation = function () {
                        api.requestBlobUrl({ url: file.url }).then(function (url) {
                            animatedFile.attr('src', url);
                        });
                    };

                $thumbnail.append(animatedFile, playButton);
                // autostart animation for small files
                // 5mb (1024 * 1024 * 5)
                if (file.size && file.size < 5242880) {
                    loadAnimation();
                    this.$el.addClass('animation-running');
                    $thumbnail.addClass('io-ox-busy');
                    return;
                }

                // start animation on demand for bigger files
                playButton.one('click', loadAnimation);
            } else {
                this.$el.addClass('cursor-zoom-in').attr({ 'data-cmd': 'show-message-file' });
            }
        },

        toggleAnimation: function () {
            this.$el.toggleClass('animation-running').find('.message-thumbnail').toggleClass('io-ox-busy');
        },

        renderFile: function (file) {

            var classFromMimeType = util.getClassFromMimetype(file.type);
            var fileSize = strings.fileSize(file.size, 0);
            var fileType = util.getFileTypeName(file.type, file.name);

            this.$el.addClass('message-file-container').append(
                $('<i class="fa icon" aria-hidden="true">').addClass(classFromMimeType),
                $('<div class="name ellipsis">').text(file.name),
                $('<div class="info ellipsis">').text(fileSize + ' ' + fileType)
            );

            if (file.isBlob) {
                this.$el.append(this.getCancelUploadButton(), this.getProgressBar());
            } else {
                this.$el.append(this.getDownloadButton(file.url));
            }
        },

        getDownloadButton: function (url) {
            return $('<button type="button" class="file-action download">')
                .attr({ 'data-cmd': 'download', 'data-url': url, 'title': gt('Download file') })
                .append('<i class="fa fa-download" aria-hidden="true">');
        },

        getCancelUploadButton: function () {
            return $('<button type="button" class="file-action cancel-upload">')
                .hide()
                .attr('title', gt('Cancel file upload'))
                .append('<i class="fa fa-times" aria-hidden="true">');
        },

        getProgressBar: function () {
            return $('<div class="progress"><div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" style="width: 0%"></div></div>');
        },

        renderUploadProgress: function (pct) {
            if (!this.model.get('uploading')) return;
            this.$('.progress, .cancel-upload').toggle(pct > 0 && pct < 100);
            this.$('.progress-bar').attr('aria-valuenow', pct).css('width', pct + '%');
        },

        cancelUpload: function () {
            if (!this.model.abort) return;
            this.model.abort();
            this.model.set({ cancelled: true, deleted: true });
        }
    });

    function getSVG(width, height) {
        return 'data:image/svg+xml;utf8,<svg version="1.1" width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg"></svg>';
    }

    return FileView;
});
