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
     'less!mediaelement/mediaelementplayer.css',
     'apps/io.ox/core/tk/jquery-ui.min.js'
    ], function (commons, gt, api, folderAPI) {

    'use strict';

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
            videoSupport: false
        },

        init: function (config) {
            _.extend(this.config, config);
            this.app = config.baton.app;
            this.win = this.app.getWindow();

            this.restore();
            this.list = this.filterMediaList(config.baton.allIds, config.videoSupport);

            if (this.list.length > 0) {
                this.show();
                this.eventHandler();
            }
        },

        load: function (file) {
            this.currentTrack = this.getURL(file);
            if (this.mediaelement) {
                this.mediaelement.pause();
                this.mediaelement.setSrc([{ src: this.currentTrack, type: file.file_mimetype }]);
                this.mediaelement.load();
                this.mediaelement.play();
            }
        },

        // DRY!
        play: function (file) {
            // get CID and new active list item
            var cid = _.cid(file), active = this.playlist.find('[data-cid="' + cid + '"]');
            // remove active class
            this.playlist.find('.active').removeClass('active');
            active.addClass('active');
            // load & play
            this.load(file);
            if (!this.config.videoSupport) this.drawTrackInfo(file);
        },

        eventHandler: function () {

            var self = this;

            this.playlist.on('click', 'li', function (e) {
                e.preventDefault();
                self.play($(this).data('file'));
            });

            this.container.find('.closemediaplayer').on('click', $.proxy(this.close, this));
            this.container.find('.minimizemediaplayer').on('click', $.proxy(this.minimize, this));

            $(document).keyup(function (e) {
                if (e.keyCode === 27) self.close();
            });
        },

        filterMediaList: function (list, videoSupport) {
            var pattern = '\\.(mp4|m4v|mov|avi|wmv|mpe?g|ogv|webm|3gp)';

            if (_.browser.Chrome) { pattern = '\\.(mp4|m4v|avi|wmv|mpe?g|ogv|webm)'; }

            return $.grep(list, function (o) {
                if (videoSupport) {
                    return (new RegExp(pattern, 'i')).test(o.filename);
                } else {
                    return (/\.(mp3|m4a|m4b|wma|wav|ogg)$/i).test(o.filename);
                }
            });
        },

        getURL: function (file) {
            return api.getUrl(file, 'open') + '&content_type=' + file.file_mimetype;
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
            var el = '<audio>';
            if (this.config.videoSupport) el = '<video>';
            this.player.empty().append(
                $(el, { src: url, type: mimetype, preload: 'metadata', controls: 'control', autoplay: 'true' })
            );
        },

        drawItem: function (file, i) {

            var url = this.getURL(file),
                item = $('<li>')
                    .attr('data-cid', _.cid(file))
                    .data('file', file)
                    .text(gt.noI18n(file.filename));

            if (this.player.find('.mejs-audio').length > 0) {
                if (i === 0) {
                    this.playlist.empty();
                }
                if (this.currentTrack === url) {
                    item.addClass('active');
                }
            } else {
                if (i === 0) {
                    this.drawPlayer(url, file.file_mimetype);
                    this.drawTrackInfo(file);
                    item.addClass('active');
                }
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
            var features = ['playpause', 'progress', 'current', 'volume'];
            if (this.player.find('.mejs-audio').length > 0) {
                this.drawItems();
            } else {
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
                    this.container.removeClass('audioplayer').addClass('videoplayer');
                    this.container.find('.minimizemediaplayer').remove();
                    features = ['playpause', 'progress', 'current', 'volume', 'fullscreen'];
                } else {
                    this.container.removeClass('videoplayer').addClass('audioplayer');
                    this.trackdisplay.find('.album').empty().append($('<i class="icon-music"></i>'));
                }
                this.drawItems();
                this.playlist.sortable({ axis: 'y', distance: 30 });
                this.player.find('video, audio').parent().addClass('noI18n');
                this.player.find('video, audio').mediaelementplayer({
                    // since we cannot resize later on ...
                    audioWidth: $(window).width() <= 400 ? 294 : 480,
                    videoWidth: $(window).width() <= 400 ? 294 : 480,
                    plugins: ['flash', 'silverlight'],
                    enableAutosize: false,
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
                            self.select('prev');
                        }
                    },
                    {
                        keys: [40], // DOWN
                        action: function (player, media) {
                            self.select('next');
                        }
                    }],
                    success: function (me, domObject) {
                        self.mediaelement = me;
                        self.mediaelement.addEventListener('ended', function () {
                            self.select('next');
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
            if (!this.config.videoSupport) {
                $('#io-ox-topbar > .minimizedmediaplayer').remove();
                this.list = [];
                this.container.show();
            }

        },

        close: function () {
            if ($('#io-ox-topbar > .minimizedmediaplayer').length === 0) {
                if (this.mediaelement) { // might be null
                    this.mediaelement.pause();
                }
                this.player.empty().remove();
                this.trackdisplay.remove(); // no empty; kills inner stuff
                this.playlist.empty().remove();
                this.container.empty().show().remove();
                this.list = [];
            }
        }
    };

    return mediaplayer;
});
