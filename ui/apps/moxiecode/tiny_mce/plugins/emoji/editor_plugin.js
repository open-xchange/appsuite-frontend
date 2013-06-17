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
            'click .emoji-option, .emoji-tab': 'onSelectEmojiCollection'
        },

        // when user clicks on emoji. inserts emoji into editor
        onInsertEmoji: function (e) {

            e.preventDefault();

            var recently = {},
                icon = $(e.target).data('icon'),
                html = '<img src="apps/themes/login/1x1.gif" rel="0" ' +
                    'class="emoji ' + icon.css + '" data-emoji-unicode="' + icon.unicode + '">';

            this.emoji.recent(icon.unicode);
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

            var collectionControl = this.emoji.settings.get('collectionControl', 'tabs');

            this.showTabs = collectionControl === 'tabs';
            this.showDropdown = collectionControl === 'dropdown';

            // add tab-control?
            if (this.showTabs) {
                this.$el.addClass('emoji-use-tabs').append(
                    $('<div class="emoji-tabs abs">').append(
                        // TODO: we directly use the Japanese terms; no translation
                        $('<a href="#" class="emoji-tab left abs" tabindex="5">')
                            .attr('data-collection', 'softbank')
                            .text('SoftBank'),
                        $('<a href="#" class="emoji-tab right abs" tabindex="5">')
                            .attr('data-collection', 'japan_carrier')
                            .text('Japanese')
                    )
                );
            }

            this.$el.append(
                $('<div class="emoji-header abs">').append(
                    // Options drop down
                    this.showDropdown ?
                        $('<div class="emoji-options dropdown pull-right">').append(
                            // link
                            $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" tabindex="5" role="menuitem" aria-haspopup="true">')
                            .attr('arial-label', 'Options')
                            .append(
                                $('<i class="icon-cog" aria-hidden="true" role="presentation">')
                            ),
                            // list
                            $('<ul class="dropdown-menu" role="menu">')
                        ) :
                        [],
                    // category name
                    $('<span class="emoji-category">')
                ),
                $('<div class="emoji-icons abs">'),
                $('<div class="emoji-footer abs">')
            );

            this.drawOptions();
            this.drawCategoryIcons();
            this.isRendered = true;

            return this;
        },

        // lists differet emoji sets in options drop-down (top/right)
        drawOptions: function () {

            var pane = this.$el.find('.emoji-options ul'),
                options = this.emoji.collections,
                defaultCollection = this.emoji.defaultCollection(),
                self = this;

            pane.append(
                _(options).map(function (collection) {
                    return $('<li>').append(
                        $('<a href="#" class="emoji-option">')
                        .attr('data-collection', collection)
                        .append(
                            $('<i>').addClass(options === defaultCollection ? 'icon-ok' : 'icon-none'),
                            $.txt(self.emoji.collectionTitle(collection))
                        )
                    );
                })
            );
        },

        drawCategoryIcons: function () {

            function draw(category) {
                return $('<a href="#" class="emoji" tabindex="5">')
                    .attr('data-category', category.name)
                    .attr('title', category.title)
                    .addClass(category.iconClass);
            }

            var footer = this.$el.find('.emoji-footer').empty(),
                categories = this.emoji.categories();

            categories.unshift({
                name: 'recently',
                title: 'Recently used',
                iconClass: 'emoji1f552'
            });

            footer.append(
                _(categories).map(draw)
            );
        },

        // get emojis of current category
        // returns Deferred Object
        getEmojis: function () {
            var category = this.currentCategory,
                list = this.emoji.iconsForCategory(category);
            return list;
        },

        // draw all emojis of current category
        drawEmojis: function () {

            var node = this.$el.find('.emoji-icons').hide().empty();

            var list = this.getEmojis();

            _(list).each(function (icon) {
                node.append(
                    $('<a href="#" class="emoji" tabindex="5">')
                    .attr('title', icon.desc)
                    .addClass(icon.css)
                    .data('icon', icon)
                );
            });

            node.show().scrollTop(0);
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
                this.emoji.setDefaultCollection(collection);

                // set active collection in tab-conrol
                if (this.showTabs) {
                    var tabs = this.$el.find('.emoji-tabs');
                    tabs.find('[data-collection]').removeClass('active');
                    tabs.find('[data-collection="' + collection + '"]').addClass('active');
                    return;
                }

                // set visual check-mark in drop-down menu
                var options = this.$el.find('.emoji-options');
                options.find('[data-collection] i').attr('class', 'icon-none');
                options.find('[data-collection="' + collection + '"]')
                    .find('i').attr('class', 'icon-ok');
                this.drawCategoryIcons();
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

        ed.addCommand('mceInsertEmoji', function (ui) {

            if (view === null) {
                // create instance only once per editor
                view = new EmojiView({ editor: ed });
                // load required code now
                require(['moxiecode/tiny_mce/plugins/emoji/main'], function (emoji) {
                    view.emoji = emoji;
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
