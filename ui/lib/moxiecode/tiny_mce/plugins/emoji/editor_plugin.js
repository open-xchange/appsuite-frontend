/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

(function () {

    'use strict';

    //
    // Plugin functions
    //


    function onInsertEmoji(e) {
        e.preventDefault();

        var recently = {},
            icon = $(e.target).data('icon'),
            html = '<img src="apps/themes/login/1x1.gif" rel="0" ' +
                'class="mceItemNoResize emoji ' + icon.css + '" data-emoji-unicode="' + icon.unicode + '" ' +
                'data-mce-resize="false">';

        this.emoji.recent(icon.unicode);
        this.editor.execCommand('mceInsertContent', false, html);
    }

    // this is called for each editor instance
    function init(ed, url) {

        var view = null;

        ed.addCommand('mceInsertEmoji', function (ui) {

            if (view === null) {
                // load required code now
                require(['io.ox/core/emoji/view'], function (EmojiView) {
                    // create instance only once per editor
                    view = new EmojiView({ editor: ed, onInsertEmoji: onInsertEmoji });
                    // hook into tinyMCE's DOM
                    var container = $(ed.getContainer());
                    container.find('.mceIframeContainer').parent().append(
                        view.$el
                    );
                    container.find('td.mceToolbar').attr('colspan', 2);
                    view.toggle();
                });
            } else {
                view.toggle();
            }
        });

        // TODO: translate title
        ed.addButton('emoji', {
            title: 'Insert Emoji',
            onclick: function (e) {
                ed.execCommand('mceInsertEmoji', true, { event: e, editor: ed });
            }
        });
    }

    function getInfo() {
        return {
            longname: 'Emoji plugin',
            author: 'Julian Bäume',
            authorurl: 'http://open-xchange.com',
            infourl: 'http://oxpedia.org/wiki/AppSuite:Emoji',
            version: '0.1'
        };
    }

    //
    // Register plugin
    //

    window.tinymce.create('tinymce.plugins.EmojiPlugin', {
        init: init,
        getInfo: getInfo
    });

    window.tinymce.PluginManager.add('emoji', window.tinymce.plugins.EmojiPlugin);

}());
