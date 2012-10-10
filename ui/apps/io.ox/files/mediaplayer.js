/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/files/mediaplayer',
    ['io.ox/core/commons',
     'gettext!io.ox/files/files',
     'io.ox/files/api',
     'io.ox/core/api/folder',
     'mediaelement/mediaelement-and-player',
     'io.ox/files/actions',
     'less!io.ox/files/mediaplayer.css',
     'less!mediaelement/mediaelementplayer.css'
    ], function (commons, gt, api, folderAPI) {

    "use strict";

    var mediaPlayer = {

        app: null,
        win: null,
        mediaelement: null,

        container: $('<div class="mediaplayer_container">'),
        wrapper: $('<div class="mediaplayer_wrapper">'),
        inner: $('<div class="mediaplayer_inner">'),
        trackdisplay: $('<div class="mediaplayer_track">'),
        player: $('<div class="mediaplayer_player">'),
        playlist: $('<ul class="mediaplayer_playlist">'),


        config: {
            list: [],
            app: null
        },

        init: function (config) {

            $.extend(this.config, config);
            this.app = config.app;
            this.win = this.app.getWindow();
            this.list = this.filterMediaList(config.list);

            this.show();
            this.eventHandler();
        },

        eventHandler: function () {

            var self = this;

            $('.mediaplayer_playlist li a').on('click', function (e)
            {
                e.preventDefault();
                self.loadTrack($(this).attr('href'), $(this).attr('data-mimetype'));
                $(this).parent().addClass('active').siblings().removeClass('active');
                self.drawTrackInfo($(this).text());
            });

            $('.closemediaplayer').on('click', $.proxy(this.close, this));

            $(document).keyup(function (e) {
                if (e.keyCode === 27) self.close();
                if (e.keyCode === 39 || e.keyCode === 40) self.nextItem(); // right / down
                if (e.keyCode === 37 || e.keyCode === 38) self.prevItem(); // left / up
            });

        },

        loadTrack: function (url, mimetype) {
            this.mediaelement.pause();
            this.mediaelement.setSrc([{src: url, type: mimetype}]);
            this.mediaelement.load();
            this.mediaelement.play();
        },

        filterMediaList: function (list) {
            return $.grep(list, function (o) {
                return (/\.(mp3|mp4|m4a|m4b|mov|wmv|wav|mpg|m4v|ogg)$/i).test(o.filename);
            });
        },

        addURL: function (file) {
            return api.getUrl(file, 'open') + '&content_type=' + file.file_mimetype;
        },

        getItems: function () {

            var self = this;
            _(this.list).each(function (file, i) {
                self.drawItem(file, i);
            });
        },

        drawTrackInfo: function (data) {
            console.log(data);
            this.trackdisplay.find('h3').text(data);
        },

        drawItem: function (file, i) {
            var url = this.addURL(file);
            var item = $('<li>').append($('<a>', { href: url, 'data-mimetype': file.file_mimetype }).text(file.filename));
            if (i === 0) {
                this.player.empty().append(
                    $('<audio>', { src: url, type: file.file_mimetype, preload: 'metadata', controls: 'control', autoplay: 'true' })
                );
                this.drawTrackInfo(file.filename);
                item.addClass('active');
            }
            this.playlist.append(item);
        },

        prevItem: function () {
            var current = $('.mediaplayer_playlist li.active');
            var prev = current.prev();
            if (prev.length > 0)
            {
                var preva = prev.find('a');
                this.loadTrack(preva.attr('href'), preva.attr('data-mimetype'));
                current.removeClass('active');
                prev.addClass('active');
                this.drawTrackInfo(preva.text());
            }
        },

        nextItem: function () {
            var current = $('.mediaplayer_playlist li.active');
            var next = current.next();
            if (next.length > 0)
            {
                var nexta = next.find('a');
                this.loadTrack(nexta.attr('href'), nexta.attr('data-mimetype'));
                current.removeClass('active');
                next.addClass('active');
                this.drawTrackInfo(nexta.text());
            }
        },

        closeControl: function () {
            return $('<button class="btn btn-primary closemediaplayer">').text(gt('Close'));
        },

        show: function () {
            var self = this;
            this.win.busy().nodes.outer.append(
                this.container.append(
                    this.wrapper.append(
                        this.inner.append(
                            this.trackdisplay,
                            this.player,
                            this.playlist
                        )
                    ).append(
                        this.closeControl()
                    )
                )
            );
            this.win.idle();
            this.trackdisplay.append($('<i class="icon-music"></i>'), $('<h3>'));
            this.getItems();
            $('video, audio').mediaelementplayer({
                width: 480,
                audioWidth: 480,
                plugins: ['flash'],
                success: function (me, domObject) {
                    self.mediaelement = me;
                    self.mediaelement.addEventListener('ended', function () {
                        self.nextItem();
                    }, false);
                }
            });
        },

        close: function () {
            this.player.empty().remove();
            this.trackdisplay.empty().remove();
            this.playlist.empty().remove();
            this.container.empty().remove();
            this.list = [];
        }
    };

    return mediaPlayer;
});