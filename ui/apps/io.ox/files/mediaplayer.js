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
     'io.ox/files/actions',
     'less!io.ox/files/mediaplayer.css',
     'mediaelement/mediaelement-and-player',
     'less!mediaelement/mediaelementplayer.css'
    ], function (commons, gt, api, folderAPI) {

    "use strict";

    var mediaPlayer = {

        app: null,
        win: null,

        defaults: {
        },

        pos: {},

        container: $('<div class="mediaplayer_container">'),

        wrapper: $('<div class="mediaplayer_wrapper">'),

        inner: $('<div class="mediaplayer_inner">'),

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

            $('.closemediaplayer').on('click', $.proxy(this.close, this));

            $(document).keyup(function (e) {
                if (e.keyCode === 27) self.close();
                if (e.keyCode === 39) self.nextItem();
                if (e.keyCode === 37) self.prevItem();
            });

        },

        filterMediaList: function (list) {
            return $.grep(list, function (o) {
                return (/^((?![.]_?).)*\.(mp4|mp3|ogv|ogg|webm|wmv|wav|wma)$/i).test(o.filename);
            });
        },

        addURL: function (file) {
            return api.getUrl(file, 'open');
        },

        getItems: function () {

            var self = this;

            _(this.list).each(function (file) {
                self.drawItem(file);
            });
        },

        drawItem: function (file) {
            this.playlist.append(
                $('<li>').append(
                    $('<a>', { href: this.addURL(file) })
                        .text(file.filename)
                )
            );
        },

        prevItem: function () {

        },

        nextItem: function () {

        },

        closeControl: function () {
            return $('<button class="btn btn-primary closemediaplayer">').text(gt('Close'));
        },

        show: function () {
            this.win.busy().nodes.outer.append(
                this.container.append(
                    this.wrapper.append(

                        this.inner.append(
                            this.player,
                            this.playlist
                        )
                    ).append(
                        this.closeControl()
                    )
                )
                .on('click', '.breadcrumb li a', $.proxy(this.close, this))
            );
            this.win.idle();
            this.getItems();
        },

        close: function () {
            this.playlist.empty().remove();
            this.container.empty().remove();
            this.list = [];
        }
    };

    return mediaPlayer;
});