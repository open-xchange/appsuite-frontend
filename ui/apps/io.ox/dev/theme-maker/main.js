/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/dev/theme-maker/main',
    ['themes',
     'io.ox/core/tk/simple-colorpicker'
    ], function (themes) {

    'use strict';

    // application object
    var app = ox.ui.createApp({
            name: 'io.ox/dev/theme-maker',
            title: 'Theme maker'
        }),
        // app window
        win,
        // nodes
        left,
        right,
        out;

    function update(e) {
        var obj = {};
        obj[String(e.data.id)] = $(this).val();
        themes.alter(obj);
        out.val(themes.getDefinitions());
    }

    function createSection(title) {
        return $('<div>').css({
            fontSize: '16px',
            padding: '4px 13px 4px 13px',
            color: '#000'
        }).text(String(title));
    }

    function createPicker(title, id) {
        return $('<div>').css({
                padding: '10px',
                borderRadius: '5px',
                margin: '3px 3px 6px 3px',
                backgroundColor: 'rgba(255, 255, 255, 0.90)'
            })
            .append(
                $('<label>').css({
                    lineHeight: '1.5em',
                    fontWeight: 'bold',
                    color: 'black'
                }).text(String(title))
            )
            .append($('<br>'))
            .append(
                $('<input>', { type: 'text' })
                .css({
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    width: '7em'
                })
                .val('')
                .simpleColorPicker()
                .on('change', { id: id }, update)
            );
    }
    // launcher
    app.setLauncher(function () {

        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/dev/theme-maker',
            title: 'Theme maker',
            toolbar: true
        });

        app.setWindow(win);

        // left panel
        left = $('<div>')
            .addClass('leftside')
            .css({
                backgroundColor: 'transparent'
            })
            .appendTo(win.nodes.main);

        // right panel
        right = $('<div>')
            .addClass('rightside')
            .css({
                backgroundColor: 'transparent'
            })
            .append(
                out = $('<textarea>').css({
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    border: '0px none',
                    width: '50%',
                    height: '50%',
                    padding: '13px',
                    margin: '1em',
                    'float': 'right',
                    resize: 'none'
                })
            )
            .appendTo(win.nodes.main);

        win.nodes.main.css({
            backgroundColor: 'transparent'
        });

        left.css({
                overflow: 'auto'
            })

            .append(createSection('Topbar'))
            .append(createPicker('Topbar background', 'topbar-background'))
            .append(createPicker('Topbar app background active', 'topbar-launcher-background-active'))
            .append(createPicker('Topbar app background hover', 'topbar-launcher-background-hover'))
            .append(createPicker('Topbar app color', 'topbar-launcher-color'))
            .append(createPicker('Topbar app color active', 'topbar-launcher-color-active'))
            .append(createPicker('Topbar app color hover', 'topbar-launcher-color-hover'))

            .append(createSection('Wallpaper'))
            .append(createPicker('Wallpaper color #1', 'wallpaper-color1'))
            .append(createPicker('Wallpaper color #2', 'wallpaper-color2'))
            .append(createPicker('Wallpaper color #3', 'wallpaper-color3'))

            .append(createSection('Window'))
            .append(createPicker('Window title color', 'window-title-color'))
            .append(createPicker('Toolbar link color', 'toolbar-link-color'))

            .append(createSection('General'))
            .append(createPicker('Link color', 'link-color'))
            .append(createPicker('Inline link color', 'inline-link-color'))
            .append(createPicker('Person link color', 'person-link-color'))
            .append(createPicker('Selection background', 'selected-background'));

        win.show(function () {
            out.val(themes.getDefinitions());
        });
    });

    return {
        getApp: app.getInstance
    };
});
