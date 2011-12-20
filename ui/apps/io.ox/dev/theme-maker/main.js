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

define("io.ox/dev/theme-maker/main", ["themes", "io.ox/core/tk/simple-colorpicker"], function (themes) {

    'use strict';

    // application object
    var app = ox.ui.createApp({
            title: 'Theme maker'
        }),
        // app window
        win;

    function update(e) {
        var obj = {};
        obj[e.data.id + ''] = $(this).val();
        console.log("alter", e.data.id, $(this).val());
        themes.alter(obj);
    }

    function createPicker(title, id) {
        return $('<div>').css({
                padding: '10px',
                borderRadius: '5px',
                width: '300px',
                margin: '0 0 1em 0',
                backgroundColor: 'rgba(255, 255, 255, 0.90)'
            })
            .append(
                $('<label>').css({
                    lineHeight: '1.5em',
                    fontWeight: 'bold',
                    color: 'black'
                }).text(title + '')
            )
            .append($('<br>'))
            .append(
                $('<input>', { type: 'text' })
                .css('width', '8em').val('#000000')
                .simpleColorPicker()
                .on('change', { id: id }, update)
            );
    }
    // launcher
    app.setLauncher(function () {

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/dev/theme-maker',
            title: "Theme maker",
            toolbar: true
        });
        app.setWindow(win);

        win.nodes.main
            .css({
                backgroundColor: 'transparent',
                overflow: 'auto'
            })
            .append(createPicker('Topbar background', 'menu-background'))
            .append(createPicker('Topbar app color', 'topbar-launcher-color'))
            .append(createPicker('Topbar app color active', 'topbar-launcher-color-active'))
            .append(createPicker('Topbar app background active', 'topbar-launcher-background-active'))
            .append(createPicker('Topbar app color hover', 'topbar-launcher-color-hover'))
            .append(createPicker('Topbar app background hover', 'topbar-launcher-background-hover'))

            .append(createPicker('Wallpaper color #1', 'wallpaper-color1'))
            .append(createPicker('Wallpaper color #2', 'wallpaper-color2'))
            .append(createPicker('Wallpaper color #3', 'wallpaper-color3'))

            .append(createPicker('Window title color', 'window-title-color'))

            .append(createPicker('Link color', 'link-color'))
            .append(createPicker('Inline link color', 'inline-link-color'))
            .append(createPicker('Person link color', 'person-link-color'))
            .append(createPicker('Toolbar link color', 'toolbar-link-color'))

            .append(createPicker('Selection background', 'selected-background'));

        win.show();
    });

    return {
        getApp: app.getInstance
    };
});