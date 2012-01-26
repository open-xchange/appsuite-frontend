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
        DURATION = 20,
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
                    backgroundSize: (WIDTH * 2) + 'px 2400px',
                    zIndex: 1
                })
                .hide()
                .appendTo(canvas),

            // text layer
            layer = $('<div>').addClass('abs')
                .css({
                    whiteSpace: 'pre',
                    lineHeight: LINE_HEIGHT + 'px',
                    fontSize: FONT_SIZE + 'px',
                    color: 'white',
                    textAlign: 'center',
                    '-webkit-transform': 'translate3d(0, 0, 0)',
                    zIndex: 2
                })
                .appendTo(canvas),

            showText = function (text, start, duration) {
                    var numLines = text.split(/\n/).length,
                        node = $('<div>').addClass('abs')
                            .css({
                                top: '50%',
                                marginTop: -(numLines * LINE_HEIGHT >> 1) + 'px'
                            })
                            .text(text + '')
                            .hide()
                            .appendTo(layer);
                    setTimeout(function () {
                        node.fadeIn(500);
                    }, start * 1000);
                    setTimeout(function () {
                        node.fadeOut(function () {
                            node = null;
                        });
                    }, (start + duration) * 1000);
                };

        canvas.appendTo('body');

        // intro animation
        $.when(background.fadeIn(500), require(['io.ox/mail/main']))
            .done(function () {
                background.css({
                    '-webkit-transition-duration': DURATION + 's',
                    '-webkit-transition-timing-function': 'linear',
                    '-webkit-transform': 'translate3d(-' + WIDTH / 2 + 'px, 0, 0)'
                });
                showText('OX7 - The Game', 5, 3);
                showText('You start as a little\nunexperienced email user ...', 10, 3);
                showText('... fighting all the way up\nto become ...', 15, 3);
                showText('A master of groupware', 20, 5);
                _.wait((DURATION + 7) * 1000).done(function () {
                    background.css('-webkit-transition-duration', '0.5s').css('opacity', 0);
                    _.wait(1000).done(function () {
                        // launch email
                            require('io.ox/mail/main').getApp().launch()
                            .pipe(_.wait(2000))
                            .done(function () {
                                // show core
                                $('#io-ox-core').css({
                                        '-webkit-perspective': '200px',
                                        '-webkit-transform': 'scale3d(100, 100, 1)'
                                    })
                                    .show();
                                canvas.hide();
                                // zoom out
                                $('#io-ox-core').css({
                                        '-webkit-transition-duration': '3s',
                                        '-webkit-transform': 'scale3d(1, 1, 1)'
                                    });
                            });
                    });
                });
            });
    });

    return {
        getApp: app.getInstance
    };
});