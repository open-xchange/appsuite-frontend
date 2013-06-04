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
                var pane = $('td#mceEmojiPane'),
                    iconSelector = {},
                    categorySelector = $('<div class="emoji_category_selector">'),
                    editorPane = $(baton.editor.contentAreaContainer);

                if (pane.length > 0) {
                    pane.remove();
                    return;
                } else {
                    pane = $('<td id="mceEmojiPane">');
                    editorPane.parentsUntil('table').last().find('td.mceToolbar').attr('colspan', 2);
                    editorPane.parent().append(pane);
                    pane = pane.append($('<div>')).children().first();
                }
                require(['moxiecode/tiny_mce/plugins/emoji/main'], function (emoji) {
                    _(emoji.categories)
                    .chain()
                    .keys()
                    .each(function (category) {
                        categorySelector.append(
                            $('<a href="#" class="emoji_category" data-emoji-category="' + category + '">')
                            .text(category)
                            .click(function (evt) {
                                $('a.emoji_category').removeClass('open');
                                $(evt.target).addClass('open');
                                $('div.emoji_selector').remove();
                                pane.append(iconSelector[category]);
                                baton.editor.focus();
                            })
                        );
                        iconSelector[category] = $('<div class="emoji_selector">').addClass(category);

                        _(emoji.iconsForCategory(category)).each(function (icon) {
                            iconSelector[category].append(
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
                                })
                            );
                        });
                    });
                    pane.append(
                        categorySelector
                    );

                    $('a.emoji_category:last')
                    .addClass('open')
                    .append(
                        _(iconSelector)
                        .chain()
                        .values()
                        .last()
                        .value()
                    );
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
