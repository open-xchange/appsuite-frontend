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
     'gettext!io.ox/files',
     'io.ox/files/api',
     'io.ox/core/api/folder',
     'mediaelement/mediaelement-and-player',
     'io.ox/files/actions',
     'less!io.ox/files/mediaplayer.less',
     'less!mediaelement/mediaelementplayer.css',
     'apps/io.ox/core/tk/jquery-ui.min.js'
    ], function (commons, gt, api, folderAPI) {

    "use strict";

    var mediaplayer = {

        app: null,
        win: null,
        mediaelement: null,
        currenttrack: null,

        container: $('<div class="abs mediaplayer_container">'),
        trackdisplay: $('<div class="mediaplayer_track css-table"><div class="css-table-row">' +
                '<div class="css-table-cell album"></div><div class="css-table-cell"><div class="track"></div></div>' +
                '</div></div>'),
        player: $('<div class="mediaplayer_player">'),
        playlist: $('<ul class="mediaplayer_playlist">'),


        config: {
            list: [],
            app: null,
            videoSupport: false
        },

        init: function (config) {
            _.extend(this.config, config);
            this.app = config.app;
            this.win = this.app.getWindow();
            this.restore();
            this.list = this.filterMediaList(config.list, config.videoSupport);
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
                if (!self.config.videoSupport) self.drawTrackInfo($(this).text());
            });

            $('.closemediaplayer').on('click', $.proxy(this.close, this));
            $('.minimizemediaplayer').on('click', $.proxy(this.minimize, this));

            $(document).keyup(function (e) {
                if (e.keyCode === 27) self.close();
            });

        },

        loadTrack: function (url, mimetype) {
            this.currentTrack = url;
            this.mediaelement.pause();
            this.mediaelement.setSrc([{src: url, type: mimetype}]);
            this.mediaelement.load();
            this.mediaelement.play();
        },

        filterMediaList: function (list, videoSupport) {
            return $.grep(list, function (o) {
                if (videoSupport) {
                    return (/\.(mp4|m4v|mov|avi|wmv|mpe?g|ogv|webm)$/i).test(o.filename);
                }
                else
                {
                    return (/\.(mp3|m4a|m4b|wma|wav|ogg)$/i).test(o.filename);
                }
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
            if (!this.config.videoSupport) this.trackdisplay.find('.track').text(data);
        },

        drawPlayer: function (url, mimetype) {
            var el = '<audio>';
            if (this.config.videoSupport) el = '<video>';
            this.player.empty().append(
                $(el, { src: url, type: mimetype, preload: 'metadata', controls: 'control', autoplay: 'true' })
            );
        },

        drawItem: function (file, i) {
            var url = this.addURL(file);
            var item = $('<li>').append($('<a>', { href: url, 'data-mimetype': file.file_mimetype }).text(gt.noI18n(file.filename)));
            if (this.player.find('.mejs-audio').length > 0)
            {
                if (i === 0) {
                    this.playlist.empty();
                }
                if (this.currentTrack === url)
                {
                    item.addClass('active');
                }
            }
            else
            {
                if (i === 0) {
                    this.drawPlayer(url, file.file_mimetype);
                    this.drawTrackInfo(file.filename);
                    item.addClass('active');
                }
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
            var features = ['playpause', 'progress', 'current', 'volume'];
            if (this.player.find('.mejs-audio').length > 0)
            {
                this.getItems();
            }
            else
            {
                this.win.busy().nodes.outer.append(
                    this.container.append(
                        $('<div class="atb mediaplayer_inner">').append(
                            $('<div class="mediaplayer_buttons pull-right">').append(
                                $('<button class="btn btn-inverse minimizemediaplayer">').text(gt('Minimize')),
                                $('<button class="btn btn-primary closemediaplayer">').text(gt('Close'))
                            ),
                            this.trackdisplay,
                            this.player,
                            this.playlist
                        )
                    )
                );
                this.win.idle();
                if (this.config.videoSupport) {
                    this.trackdisplay.remove();
                    this.container.find('.minimizemediaplayer').remove();
                    features = ['playpause', 'progress', 'current', 'volume', 'fullscreen'];
                }
                else
                {
                    this.trackdisplay.find('.album').empty().append($('<i class="icon-music"></i>'));
                }
                this.getItems();
                this.playlist.sortable({ axis: 'y' });
                this.player.find('video, audio').mediaelementplayer({
                    // since we cannot resize later on ...
                    audioWidth: $(window).width() <= 400 ? 294 : 480,
                    height: 500,
                    plugins: ['flash', 'silverlight'],
                    timerRate: 250,
                    features: features,
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
            }
        },

        minimize: function () {
            $('#io-ox-topbar > .minimizedmediaplayer').remove();
            $('#io-ox-topbar').append(
                $('<div class="launcher right minimizedmediaplayer">').append(
                    $('<i>').addClass('icon-play icon-white')
                ).one('click', function () {
                    ox.launch('io.ox/files/main');
                    $('.mediaplayer_container').show();
                    $(this).remove();
                })
            );
            this.container.hide();
        },

        restore: function () {
            if (this.config.videoSupport) {
                this.close();
            }
            else
            {
                $('#io-ox-topbar > .minimizedmediaplayer').remove();
                this.list = [];
                this.container.show();
            }

        },

        close: function () {
            $('#io-ox-topbar > .minimizedmediaplayer').remove();
            this.player.empty().remove();
            this.trackdisplay.remove(); // no empty; kills inner stuff
            this.playlist.empty().remove();
            this.container.empty().show().remove();
            this.list = [];
        }
    };

    return mediaplayer;
});