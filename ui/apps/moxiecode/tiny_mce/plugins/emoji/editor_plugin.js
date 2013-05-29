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
 */
(function () {

    "use strict";

    window.tinymce.create('tinymce.plugins.EmojiPlugin', {
        init : function (ed, url) {
            ed.addCommand('mceInsertEmoji', function (ui, baton) {
                require(['io.ox/core/tk/dialogs',
                        'moxiecode/tiny_mce/plugins/emoji/main'], function (dialogs, emoji) {
                    var popup = new dialogs.SidePopup();
                    var p = popup.show(baton.event, function (pane) {
                        var node = $('<div class="emoji_selector">');
                        _(emoji.icons).each(function (icon) {
                            node.append(
                                $('<a href="#" class="emoji">')
                                .attr('title', icon.desc)
                                .addClass(icon.css)
                                .click(function (evt) {
                                    var ed = baton.editor,
                                        node = $('<img src="apps/themes/login/1x1.gif" class="emoji">')
                                        .addClass(icon.css)
                                        .attr('data-emoji-unicode', icon.unicode);
                                    evt.preventDefault();

                                    ed.execCommand('mceInsertContent', false, node.prop('outerHTML'));
                                    p.close();
                                })
                            );
                        });
                        pane.append(node);
                    });
                    //steal focus back
                    p.on('close', function () {
                        baton.editor.focus();
                    });
                });
            });

            //TODO: translate title
            ed.addButton('emoji', {
                title: 'Insert Emoji',
                image: url + '/img/smile.gif',
                onclick: function (e) {
                    ed.execCommand('mceInsertEmoji', true, {event: e, editor: ed});
                }
            });
            ed.contentCSS.push(url + '/emoji.less');
        },
        getInfo: function () {
            return {
                longname: 'Emoji plugin',
                author: 'Julian Bäume',
                authorurl: 'http://open-xchange.com',
                infourl: 'http://oxpedia.org/wiki/AppSuite:Emoji',
                version: '0.1'
            };
        }
    });

    window.tinymce.PluginManager.add('emoji', window.tinymce.plugins.EmojiPlugin);
}());
