/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

/* global MediaElementPlayer: true */

/*
    NOTE:

    We cannot yet determine what content is in a container like mp4, aac or mov.
    This information should come from the backend so we can decide if the currently used
    browsers native html5 video playback or one of the fallbacks can play the provided
    file correctly.
    mp4 files e.g. can be audio only, video only or mixed and will therefore be displayed
    in both players for now.

    Flash and silverlight fallbacks are only working for audiofiles because of this.
    If we provide an unsupported video file to a flash fallback it is likely to crash.
*/

define('io.ox/files/mediaplayer', [
    'io.ox/core/commons',
    'gettext!io.ox/files',
    'io.ox/files/api',
    'io.ox/files/mediasupport',
    'static/3rd.party/mediaelement/mediaelement-and-player.js',
    'io.ox/files/actions',
    'less!io.ox/files/mediaplayer',
    'css!3rd.party/mediaelement/mediaelementplayer.css',
    'static/3rd.party/jquery-ui.min.js'
], function (commons, gt, api, mediasupport) {

    'use strict';

    var mediaplayer = {

        app: null,
        win: null,
        mediaelement: null,
        currentFile: null,
        currentVolume: 0.8,
        isMuted: false,
        features: ['playpause', 'progress', 'current', 'volume'],

        container: $('<div class="abs mediaplayer_container" tabindex="-1">'),
        trackdisplay: $('<div class="mediaplayer_track"><div class="row">' +
                '<div class="col-xs-3 album"></div><div class="col-xs-9"><div class="track"></div></div>' +
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
            if (this.app) {
                this.win = this.app.getWindow();
            } else {
                //get active window by hand
                this.win = { nodes: { outer: $('.window-container:visible').first() } };
            }
            this.lastActiveElement = $(document.activeElement);

            this.restore();
            this.list = this.filterMediaList(config.baton.allIds, config.videoSupport);

            if (this.config.videoSupport) {
                this.features = ['playpause', 'progress', 'current', 'volume', 'fullscreen'];
            }
            $('#io-ox-mediaplayer').remove();

            if (this.list.length > 0) {
                this.show();
                this.eventHandler();
            }
        },

        resetPlayer: function (url, mimetype) {
            if (this.mediaelement) {
                if (!_.browser.IE) { this.mediaelement.pause(); }
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

            this.container.on('keydown', function (e) {
                // close on ESC unless in fullscreen mode
                // note: macos' native fullscreen mode does not close on ESC (same for Chrome & Firefox)
                if (e.keyCode === 27 && !MediaElementPlayer.fullscreen) self.close();
            });
        },

        filterMediaList: function (list, videoSupport) {
            return $.grep(list, function (o) {
                return mediasupport.checkFile(videoSupport ? 'video' : 'audio', o.filename);
            });
        },

        getURL: function (file) {
            return api.getUrl(file, 'play') + '&content_type=' + String(file.file_mimetype).split(';')[0];
        },

        drawItems: function () {
            _(this.list).each(this.drawItem, this);
        },

        drawTrackInfo: (function () {

            function audioIconError() {
                this.trackdisplay.find('.album').empty().append($('<i class="fa fa-music"></i>'));
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
                pluginPath: 'apps/3rd.party/mediaelement/',
                enableAutosize: false,
                autosizeProgress: false,
                timerRate: 250,
                startVolume: self.currentVolume,
                features: this.features,
                pauseOtherPlayers: true,
                keyActions: [
                    {
                        // SPACE
                        keys: [32, 179],
                        action: function (player, media) {
                            if (media.paused || media.ended) {
                                media.play();
                            } else {
                                media.pause();
                            }
                        }
                    },
                    {
                        // RIGHT
                        keys: [39, 228],
                        action: function (player, media) {
                            var newVolume = Math.min(media.volume + 0.1, 1);
                            media.setVolume(newVolume);
                        }
                    },
                    {
                        // LEFT
                        keys: [37, 227],
                        action: function (player, media) {
                            var newVolume = Math.max(media.volume - 0.1, 0);
                            media.setVolume(newVolume);
                        }
                    },
                    {
                        // UP
                        keys: [38],
                        action: function () {
                            self.select('prev');
                        }
                    },
                    {
                        // DOWN
                        keys: [40],
                        action: function () {
                            self.select('next');
                        }
                    }
                ],
                success: function (me) {
                    if (self.isMuted) {
                        me.setMuted(true);
                    }
                    me.setVolume(self.currentVolume);
                    $('.mediaplayer_container .mejs-time-rail').css({
                        width: ($(window).width() <= 700 ? '140px' : '330px')
                    });
                    self.mediaelement = me;
                    me.addEventListener('ended', function () {
                        self.currentVolume = me.volume;
                        self.isMuted = me.muted;
                        self.select('next');

                    }, false);
                    me.addEventListener('volumechange', function () {
                        self.currentVolume = me.volume;
                        self.isMuted = me.muted;
                    }, false);
                    if (!_.browser.Firefox) {
                        me.addEventListener('canplay', function () {
                            me.setVolume(self.currentVolume);
                            if (self.isMuted) {
                                me.setMuted(true);
                            }
                            me.play();
                        }, false);
                        me.play();
                    }
                }
            });
            this.mediaelement = player[0].player;
        },

        drawItem: function (file) {

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
            if (this.app) {
                this.win.busy();
            }
            this.win.nodes.outer.append(
                this.container.append(
                    $('<div id="io-ox-mediaplayer" class="atb mediaplayer_inner" tabindex="1">').append(
                        $('<div class="mediaplayer_buttons pull-right">').append(
                            $('<button type="button" class="btn btn-inverse minimizemediaplayer" tabindex="1">').text(gt('Minimize')),
                            $('<button type="button" class="btn btn-primary closemediaplayer" tabindex="1">')
                                .text(gt('Close'))
                                .one('click', $.proxy(this.close, this))
                        ),
                        this.trackdisplay,
                        this.player,
                        this.playlist
                    )
                )
            );
            if (this.app) {
                this.win.idle();
            }
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
                this.trackdisplay.find('.album').empty().append($('<i class="fa fa-music"></i>'));
            }

            this.playlist.empty();
            this.drawItems();
            if (_.device('!touch')) { this.playlist.sortable({ containment: this.playlist, axis: 'y', distance: 30 }); }
            this.play(this.list[0]);
            _.defer(function () { $('#io-ox-mediaplayer').focus(); });
        },

        minimize: function () {
            var minimizedPlayerLauncher;
            $('#io-ox-topbar > ul.launchers-secondary > .minimizedmediaplayer').remove();
            $('#io-ox-topbar > ul.launchers-secondary').prepend(
                minimizedPlayerLauncher = $('<li class="launcher minimizedmediaplayer">').append(
                    $('<a href="#" tabindex="1">').append($('<i>').addClass('fa fa-play'))
                ).one('click', function () {
                    ox.launch('io.ox/files/main');
                    $('.mediaplayer_container').show();
                    $(this).remove();
                })
                .on('keydown', function (e) {
                    // enter
                    if ((e.keyCode || e.which) === 13) {
                        ox.launch('io.ox/files/main');
                        $('.mediaplayer_container').show();
                        $(this).remove();
                    }
                })
            );
            this.container.hide();
            minimizedPlayerLauncher.focus();
        },

        restore: function () {
            if ($('#io-ox-topbar > ul.launchers-secondary > .minimizedmediaplayer').length > 0) {
                $('#io-ox-topbar > ul.launchers-secondary > .minimizedmediaplayer').remove();
                this.list = [];
                this.container.show();
                _.defer(function () { $('#io-ox-mediaplayer').focus(); });
            }
        },

        close: function () {
            if ($('#io-ox-topbar > .minimizedmediaplayer').length === 0) {
                if (window.mejs) {
                    _(window.mejs.players).each(function (player) {
                        player.pause();
                    });
                }
                $('#io-ox-mediaplayer').remove();
                this.container.remove();
                this.list = [];
                this.currentFile = null;
                this.lastActiveElement.focus();
            }
        }
    };

    // track fullscreen
    var enter = MediaElementPlayer.prototype.enterFullScreen;
    MediaElementPlayer.prototype.enterFullScreen = function () {
        MediaElementPlayer.fullscreen = true;
        enter.apply(this, arguments);
    };

    var exit = MediaElementPlayer.prototype.exitFullScreen;
    MediaElementPlayer.prototype.exitFullScreen = function () {
        MediaElementPlayer.fullscreen = false;
        exit.apply(this, arguments);
    };

    return mediaplayer;
});
