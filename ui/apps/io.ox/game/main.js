/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/game/main', [], function () {

    'use strict';

    var app = ox.ui.createApp({ name: 'io.ox/game' }),
        PATH = ox.base + "/apps/io.ox/game",
        WIDTH = 1920,
        DURATION = 5,
        FONT_SIZE = 72,
        LINE_HEIGHT = FONT_SIZE * 1.2;

    app.setLauncher(function () {

        // hide core
        $('#io-ox-core').hide();

        // canvas
        var canvas = $('<div>', { id: 'game-canvas' })
                .addClass('abs')
                .css({
                    backgroundColor: 'white'
                }),

            // moving background
            background = $('<div>')
                .css({
                    position: 'absolute',
                    top: '50%',
                    marginTop: '-200px',
                    height: '400px',
                    width: WIDTH * 2 + 'px',
                    left: '0px',
                    backgroundImage: 'url(' + PATH + '/wood.jpg)',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: (WIDTH * 2) + 'px 2400px'
                })
                .hide()
                .appendTo(canvas),

           // parallax layer #2
           layer = $('<div>')
               .css({
                    position: 'absolute',
                    top: 0, bottom: 0, left: 0,
                    width: WIDTH * 4 + 'px',
                    whiteSpace: 'pre',
                    lineHeight: LINE_HEIGHT + 'px',
                    fontSize: FONT_SIZE + 'px',
                    color: 'white'
                })
                .appendTo(canvas),

           // text #1
           text1 = $('<div>').css({
                   position: 'absolute',
                   top: '50%',
                   left: ($('body').width() * 1.1) + 'px',
                   marginTop: -(LINE_HEIGHT >> 1) + 'px'
               })
               .text('OX7 - The Quest')
               .appendTo(layer),

            // text #2
            text2 = $('<div>').css({
                    position: 'absolute',
                    top: '50%',
                    left: ($('body').width() * 2) + 'px',
                    marginTop: -(LINE_HEIGHT >> 1) + 'px'
                })
                .text('You start as a little unexperienced email user ...')
                .appendTo(layer),

            // text #3
            text3 = $('<div>').css({
                    position: 'absolute',
                    top: '50%',
                    left: ($('body').width() * 4) + 'px',
                    marginTop: -(LINE_HEIGHT >> 1) + 'px'
                })
                .text('... fighting all the way up to become ...')
                .appendTo(layer),

            // text4
            text4 = $('<div>').css({
                    position: 'absolute',
                    top: '50%',
                    left: ($('body').width() * 5) + 'px',
                    marginTop: -(LINE_HEIGHT >> 1) + 'px'
                })
                .text('A master of groupware')
                .appendTo(layer);

        canvas.appendTo('body');

        // intro animation
        $.when(background.fadeIn(500))
            .done(function () {
                background.css({
                    '-webkit-transition-duration': DURATION + 's',
                    '-webkit-transition-timing-function': 'linear',
                    '-webkit-transform': 'translate3d(-' + WIDTH + 'px, 0, 0)'
                });
                layer.css({
                    '-webkit-transition-duration': DURATION + 's',
                    '-webkit-transition-timing-function': 'linear',
                    '-webkit-transform': 'translate3d(-' + (WIDTH * 3) + 'px, 0, 0)'
                });
            });
    });

    return {
        getApp: app.getInstance
    };
});