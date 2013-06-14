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
    // View. One per editor instance.
    //

    var EmojiView = Backbone.View.extend({

        tagName: 'div',
        className: 'mceEmojiPane',

        events: {
            'click .emoji-icons .emoji': 'onInsertEmoji',
            'click .emoji-footer .emoji': 'onSelectCategory',
            'click .emoji-option': 'onSelectEmojiCollection'
        },

        // when user clicks on emoji. inserts emoji into editor
        onInsertEmoji: function (e) {
            e.preventDefault();
            var icon = $(e.target).data('icon'),
                html = '<img src="apps/themes/login/1x1.gif" ' +
                    'class="emoji ' + icon.css + '" data-emoji-unicode="' + icon.unicode + '">';
            this.editor.execCommand('mceInsertContent', false, html);
        },

        // when user clicks on emoji category
        onSelectCategory: function (e) {
            var node = $(e.target);
            this.setCategory(node.attr('data-category'));
        },

        // when user select emoji set in drop-down
        onSelectEmojiCollection: function (e) {
            e.preventDefault();
            var node = $(e.target);
            this.setCollection(node.attr('data-collection'));
        },

        initialize: function (options) {
            this.editor = options.editor;
            this.isRendered = false;
            this.currentCategory = '';
            this.currentCollection = '';
        },

        render: function () {

            this.$el.append(
                $('<div class="emoji-header abs">').append(
                    // Options drop down
                    $('<div class="emoji-options dropdown pull-right">').append(
                        // link
                        $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" tabindex="5" role="menuitem" aria-haspopup="true">')
                        .attr('arial-label', 'Options')
                        .append(
                            $('<i class="icon-cog" aria-hidden="true" role="presentation">')
                        ),
                        // list
                        $('<ul class="dropdown-menu" role="menu">')
                    ),
                    $('<span class="emoji-category">')
                ),
                $('<div class="emoji-icons abs">'),
                $('<div class="emoji-footer abs">')
            );

            this.drawOptions();
            this.drawCategoryIcons();
            this.setCategory('People');
            this.setCollection('unified');
            this.isRendered = true;

            return this;
        },

        // lists differet emoji sets in options drop-down (top/right)
        drawOptions: function () {
            var pane = this.$el.find('.emoji-options ul');

            require(['moxiecode/tiny_mce/plugins/emoji/main']).then(function (emoji) {
                var options = emoji.collections;

                pane.append(
                    _(options).map(function (option) {
                        var checkBox = $('<i class="icon-none">');
                        if (option === emoji.defaultCollection()) {
                            checkBox.attr('class', 'icon-ok');
                        }
                        return $('<li>').append(
                            $('<a href="#" class="emoji-option">')
                            .attr('data-collection', option)
                            .append(
                                checkBox,
                                $.txt(emoji.collectionTitle(option))
                            )
                        );
                    })
                );
            });
        },

        // TODO: uses internal list. must be configurable later on
        drawCategoryIcons: (function () {

            // evil copy-paste trap: codes must be lower-case!
            var codes = '1f603 2764 2600 1f431 1f374 1f3e0 2702 26bd 002320e3'.split(' '),
                category = 'People Nature Objects Places Symbols People Nature People Places'.split(' ');

            function draw(code, i) {
                return $('<a href="#" class="emoji" tabindex="5">')
                    .attr('data-category', category[i])
                    .attr('title', category[i])
                    .addClass('emoji' + code);
            }

            return function () {
                this.$el.find('.emoji-footer').append(
                    _(codes).map(draw)
                );
            };
        }()),

        // get emojis of current category
        // TODO: consider currentColleciton
        // returns Deferred Object
        getEmojis: function () {
            var category = this.currentCategory;
            return require(['moxiecode/tiny_mce/plugins/emoji/main']).then(function (emoji) {
                return emoji.iconsForCategory(category);
            });
        },

        // draw all emojis of current category
        drawEmojis: function () {

            var node = this.$el.find('.emoji-icons').hide().empty();

            this.getEmojis().done(function (list) {

                _(list).each(function (icon) {
                    node.append(
                        $('<a href="#" class="emoji" tabindex="5">')
                        .attr('title', icon.desc)
                        .addClass(icon.css)
                        .data('icon', icon)
                    );
                });

                node.show().scrollTop(0);
            });
        },

        // set current category. sets title and triggers repaint of all icons
        setCategory: function (category) {
            if (category !== this.currentCategory) {
                this.currentCategory = category;
                this.$el.find('.emoji-category').text(category);
                this.drawEmojis();
            }
        },

        setCollection: function (collection) {
            if (collection !== this.currentCollection) {
                this.currentCollection = collection;
                // set visual check-mark
                var options = this.$el.find('.emoji-options');
                options.find('[data-collection] i').attr('class', 'icon-none');
                options.find('[data-collection="' + collection + '"]')
                    .find('i').attr('class', 'icon-ok');
                require(['moxiecode/tiny_mce/plugins/emoji/main']).then(function (emoji) {
                    emoji.setDefaultCollection(collection);
                });
            }
        },

        // hide/show view
        toggle: function () {
            if (!this.isRendered) {
                this.render();
            } else {
                this.$el.toggle();
            }
        }
    });

    //
    // Plugin functions
    //

    // this is called for each editor instance
    function init(ed, url) {

        var view = null;

        ed.addCommand('mceInsertEmoji', function (ui, baton) {

            if (view === null) {
                // create instance only once per editor
                view = new EmojiView({ editor: ed });
                // hook into tinyMCE's table
                $(baton.editor.contentAreaContainer)
                    .parent().append(view.$el).end()
                    .parentsUntil('table').last().find('td.mceToolbar').attr('colspan', 2);
            }

            view.toggle();
        });

        // TODO: translate title
        ed.addButton('emoji', {
            title: 'Insert Emoji',
            onclick: function (e) {
                ed.execCommand('mceInsertEmoji', true, { event: e, editor: ed });
            }
        });

        ed.contentCSS.push(url + '/emoji.less');
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
