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
     'apps/mediaelement/mediaelement-and-player.js',
     'io.ox/files/actions',
     'less!io.ox/files/mediaplayer.less',
     'css!mediaelement/mediaelementplayer.css',
     'apps/io.ox/core/tk/jquery-ui.min.js'
    ], function (commons, gt, api, folderAPI) {

    'use strict';

    var mediaplayer = {

        app: null,
        win: null,
        mediaelement: null,
        currentFile: null,
        features: ['playpause', 'progress', 'current', 'volume'],

        container: $('<div class="abs mediaplayer_container">'),
        trackdisplay: $('<div class="mediaplayer_track css-table"><div class="css-table-row">' +
                '<div class="css-table-cell album"></div><div class="css-table-cell"><div class="track"></div></div>' +
                '</div></div>'),
        player: $('<div class="mediaplayer_player">'),
        playlist: $('<ul class="mediaplayer_playlist">'),


        config: {
            list: [],
            videoSupport: false
        },

        init: function (config) {
            _.extend(this.config, config);
            this.app = config.baton.app;
            this.win = this.app.getWindow();

            this.restore();
            this.list = this.filterMediaList(config.baton.allIds, config.videoSupport);

            if (this.config.videoSupport) {
                this.features = ['playpause', 'progress', 'current', 'volume', 'fullscreen'];
            }


            if (this.list.length > 0) {
                this.show();
                this.eventHandler();
            }
        },

        resetPlayer: function (url, mimetype) {
            if (this.mediaelement) {
                if (!_.browser.IE) { this.mediaelement.pause(); }
                if (_.browser.Chrome) { this.mediaelement.setSrc(''); }
                $(this.mediaelement).remove();
            }
            this.drawPlayer(url, mimetype);
        },

        // DRY!
        play: function (file) {
            // remove active class
            this.playlist.find('.active').removeClass('active');
            // get CID and new active list item
            this.playlist.find('[data-cid="' + _.cid(file) + '"]').addClass('active');
            // load & play
            var newTrack = this.getURL(file);

            if (newTrack !== this.currentFile || _.isUndefined(this.currentFile)) {
                this.currentFile = newTrack;
                this.resetPlayer(newTrack, file.file_mimetype);
            }

            if (!this.config.videoSupport) this.drawTrackInfo(file);
        },

        eventHandler: function () {

            var self = this;

            this.playlist.off('click', 'li').on('click', 'li', function (e) {
                e.preventDefault();
                self.play($(this).data('file'));
            });

            this.container.find('.minimizemediaplayer')
                .off('click')
                .on('click', $.proxy(this.minimize, this));

            $(document).keyup(function (e) {
                // close on ESC unless in fullscreen mode
                // note: macos' native fullscreen mode does not close on ESC (same for Chrome & Firefox)
                if (e.keyCode === 27 && BigScreen.element === null) self.close();
            });
        },

        filterMediaList: function (list, videoSupport) {
            return $.grep(list, function (o) {
                return api.checkMediaFile((videoSupport ? 'video' : 'audio'), o.filename);
            });
        },

        getURL: function (file) {
            return api.getUrl(file, 'play') + '&content_type=' + file.file_mimetype;
        },

        drawItems: function () {
            _(this.list).each(this.drawItem, this);
        },

        drawTrackInfo: (function () {

            var self = this;

            function audioIconError(e) {
                this.trackdisplay.find('.album').empty().append($('<i class="icon-music"></i>'));
            }

            function getCover(file) {
                return 'api/image/file/mp3Cover?folder=' + file.folder_id + '&id=' + file.id +
                    '&scaleType=contain&width=90&height=90';
            }

            return function (file) {
                if (!this.config.videoSupport) {
                    this.trackdisplay.find('.track').text(gt.noI18n(file.filename));
                    this.trackdisplay.find('.album').empty().append(
                        $('<img>', { alt: '', src: getCover(file) }).on('error', $.proxy(audioIconError, this))
                    );
                }
            };
        }()),

        drawPlayer: function (url, mimetype) {
            var el = '<audio>',
            // Flash support is pretty bad for video so we only use it for audio
            plugins = ['flash', 'silverlight'],
            self = this;
            if (this.config.videoSupport) {
                el = '<video>';
                plugins = false;
            }
            this.player.empty().append(
                $(el).attr({ src: url, type: mimetype, preload: 'none', controls: 'controls', autoplay: 'true' })
            );
            this.player.find('video, audio').parent().addClass('noI18n');
            var player = this.player.find('video, audio').mediaelementplayer({
                // since we cannot resize later on ...
                audioWidth: $(window).width() <= 700 ? 294 : 480,
                videoWidth: $(window).width() <= 700 ? 294 : 480,
                plugins: plugins,
                enableAutosize: false,
                timerRate: 250,
                features: this.features,
                pauseOtherPlayers: true,
                keyActions: [
                    {
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
                            self.select('prev');
                        }
                    },
                    {
                        keys: [40], // DOWN
                        action: function (player, media) {
                            self.select('next');
                        }
                    }
                ],
                success: function (me, domObject) {

                    self.mediaelement = me;
                    me.addEventListener('ended', function () {
                        self.select('next');

                    }, false);

                    if (!_.browser.Firefox) {
                        me.addEventListener('canplay', function () {
                            // Player is ready
                            me.play();
                        }, false);
                        me.play();
                    }
                }
            });
            this.mediaelement = player[0].player;
        },

        drawItem: function (file, i) {

            var url = this.getURL(file),
                item = $('<li>')
                    .attr('data-cid', _.cid(file))
                    .data('file', file)
                    .text(gt.noI18n(file.filename));

            if (this.currentFile === url) {
                item.addClass('active');
            }
            this.playlist.append(item);
        },

        select: function (dir) {
            var current = this.playlist.find('li.active'),
                selected = dir === 'prev' ? current.prev() : current.next();
            if (selected.length > 0) {
                this.play(selected.data('file'));
            }
        },

        show: function () {
            var self = this;
            this.win.busy().nodes.outer.append(
                this.container.append(
                    $('<div class="atb mediaplayer_inner">').append(
                        $('<div class="mediaplayer_buttons pull-right">').append(
                            $('<button class="btn btn-inverse minimizemediaplayer">').text(gt('Minimize')),
                            $('<button class="btn btn-primary closemediaplayer">')
                                .text(gt('Close'))
                                .one('click', $.proxy(this.close, this))
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
                this.container
                    .removeClass('audioplayer')
                    .addClass('videoplayer')
                    .find('.minimizemediaplayer').remove();
            } else {
                this.container
                    .removeClass('videoplayer')
                    .addClass('audioplayer');
                this.trackdisplay.find('.album').empty().append($('<i class="icon-music"></i>'));
            }

            this.playlist.empty();
            this.drawItems();
            if (_.device('!touch')) { this.playlist.sortable({ axis: 'y', distance: 30 }); }
            this.play(this.list[0]);
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
            if ($('#io-ox-topbar > .minimizedmediaplayer').length > 0) {
                $('#io-ox-topbar > .minimizedmediaplayer').remove();
                this.list = [];
                this.container.show();
            }

        },

        close: function () {
            if ($('#io-ox-topbar > .minimizedmediaplayer').length === 0) {
                if (this.mediaelement) {
                    this.mediaelement.pause();
                    if (_.browser.Chrome) { this.mediaelement.setSrc(''); }
                    $(this.mediaelement).remove();
                }
                this.container.remove();
                this.list = [];
                this.currentFile = null;
            }
        }
    };

    return mediaplayer;
});
