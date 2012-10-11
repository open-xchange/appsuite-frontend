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
     'less!io.ox/files/mediaplayer.less',
     'less!mediaelement/mediaelementplayer.css'
    ], function (commons, gt, api, folderAPI) {

    "use strict";

    var mediaplayer = {

        app: null,
        win: null,
        mediaelement: null,

        container: $('<div class="mediaplayer_container">'),
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
            this.close();
            this.list = this.filterMediaList(config.list);
            if (this.list.length > 0)
            {
                this.show();
                this.eventHandler();
            }
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
            $('.minimizemediaplayer').on('click', $.proxy(this.minimize, this));

            $(document).keyup(function (e) {
                if (e.keyCode === 27) self.close();
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
                return (/\.(mp3|m4a|m4b|wma|wav|ogg)$/i).test(o.filename);
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

        selectTrack: function (dir) {
            var current = this.playlist.find('li.active');
            var selected = (dir === 'prev' ? current.prev() : current.next());
            if (selected.length > 0)
            {
                var link = selected.find('a');
                this.loadTrack(link.attr('href'), link.attr('data-mimetype'));
                current.removeClass('active');
                selected.addClass('active');
                this.drawTrackInfo(link.text());
            }
        },

        show: function () {
            var self = this;
            this.win.busy().nodes.outer.append(
                this.container.append(
                    $('<div class="mediaplayer_wrapper">').append(
                        $('<div class="mediaplayer_inner">').append(
                            $('<div class="mediaplayer_buttons pull-right">').append(
                                $('<button class="btn minimizemediaplayer">').text(gt('Minimize')),
                                $('<button class="btn btn-primary closemediaplayer">').text(gt('Close'))
                            ),
                            this.trackdisplay,
                            this.player,
                            this.playlist
                        )
                    )
                )
            );
            this.win.idle();
            this.trackdisplay.append($('<i class="icon-music"></i>'), $('<h3>'));
            this.getItems();
            $('video, audio').mediaelementplayer({
                width: 480,
                audioWidth: 480,
                plugins: ['flash', 'silverlight'],
                timerRate: 250,
                features: ['playpause', 'progress', 'current', 'volume'],
                keyActions: [{
                    keys: [32, 179], // SPACE
                    action: function (player, media) {
                        if (media.paused || media.ended) {
                            media.play();
                        } else {
                            media.pause();
                        }
                    }
                },
                {
                    keys: [39, 228], // RIGHT
                    action: function (player, media) {
                        var newVolume = Math.min(media.volume + 0.1, 1);
                        media.setVolume(newVolume);
                    }
                },
                {
                    keys: [37, 227], // LEFT
                    action: function (player, media) {
                        var newVolume = Math.max(media.volume - 0.1, 0);
                        media.setVolume(newVolume);
                    }
                },
                {
                    keys: [38], // UP
                    action: function (player, media) {
                        self.selectTrack('prev');
                    }
                },
                {
                    keys: [40], // DOWN
                    action: function (player, media) {
                        self.selectTrack('next');
                    }
                }],
                success: function (me, domObject) {
                    self.mediaelement = me;
                    self.mediaelement.addEventListener('ended', function () {
                        self.selectTrack('next');
                    }, false);
                }
            });
        },

        minimize: function () {
            $('#io-ox-topbar').append(
                $('<div class="launcher right minimizedmediaplayer">').append(
                    $('<i>').addClass('icon-play icon-white')
                ).on('click', function () {
                    ox.launch('io.ox/files/main');
                    $('.mediaplayer_container').show();
                    $(this).remove();
                })
            );
            this.container.hide();
        },

        close: function () {
            $('#io-ox-topbar > .minimizedmediaplayer').remove();
            this.player.empty().remove();
            this.trackdisplay.empty().remove();
            this.playlist.empty().remove();
            this.container.empty().show().remove();
            this.list = [];
        }
    };

    return mediaplayer;
});