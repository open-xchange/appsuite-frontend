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

    // helper

    function closeView(ed, e) {
        if (e.which === 9) return;
        if (this.isOpen) this.toggle();
    }

    //
    // View. One per editor instance.
    //

    var EmojiView = Backbone.View.extend({

        tagName: 'td',
        className: 'mceEmojiPane',

        events: {
            'click .emoji-icons .emoji': 'onInsertEmoji',
            'click .emoji-footer .emoji': 'onSelectCategory',
            'click .emoji-option, .emoji-tab': 'onSelectEmojiCollection',
            'click .reset-recents': 'onResetRecents'
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

        // when user clicks on "Reset" in "Recently used" list
        onResetRecents: function (e) {
            e.preventDefault();
            this.emoji.resetRecents();
            this.drawEmojis();
        },

        initialize: function (options) {

            this.editor = options.editor;
            this.isRendered = false;
            this.isOpen = false;
            this.currentCategory = '';
            this.currentCollection = '';

            // for optional run-time access
            this.$el.data('view', this);
        },

        render: function () {

            // outer container first to fix firefox's problems with position: relative in table cells
            var node = $('<div class="table-cell-fix">');

            var collectionControl = this.emoji.settings.get('collectionControl', 'tabs');

            this.showTabs = collectionControl === 'tabs' && _(this.emoji.collections).contains('softbank');
            this.showDropdown = collectionControl === 'dropdown' && this.emoji.collections.length > 1;

            // add tab-control?
            if (this.showTabs) {
                node.addClass('emoji-use-tabs').append(
                    $('<div class="emoji-tabs abs">').append(
                        // we directly use the Japanese terms; no translation
                        $('<a href="#" class="emoji-tab left abs" tabindex="5">')
                            .attr('data-collection', 'japan_carrier')
                            .text(this.emoji.getTitle('commonEmoji')), // 他社共通絵文字
                        $('<a href="#" class="emoji-tab right abs" tabindex="5">')
                            .attr('data-collection', 'softbank')
                            .text(this.emoji.getTitle('allEmoji')) // 全絵文字
                    )
                );
            }

            node.append(
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

            this.$el.append(node);

            this.setCollection();
            this.drawOptions();
            this.isRendered = true;
            this.isOpen = true;

            // auto close emoji view on keypress or click inside editor
            if (this.emoji.settings.get('autoClose') === true) {
                this.editor.onKeyDown.add(_.bind(closeView, this));
                this.editor.onClick.add(_.bind(closeView, this));
            }

            return this;
        },

        // lists differet emoji sets in options drop-down (top/right)
        drawOptions: function () {

            var pane = this.$el.find('.emoji-options ul'),
                options = this.emoji.collections,
                current = this.currentCollection,
                self = this;

            pane.append(
                _(options).map(function (collection) {
                    return $('<li>').append(
                        $('<a href="#" class="emoji-option">')
                        .attr('data-collection', collection)
                        .append(
                            $('<i>').addClass(collection === current ? 'icon-ok' : 'icon-none'),
                            $.txt(self.emoji.getTitle(collection))
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
                categories = this.emoji.getCategories();

            categories.unshift(this.emoji.getRecently());

            footer.empty().append(
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

            // add "reset" link for recently
            if (list.length > 0 && this.currentCategory === 'recently') {
                node.append(
                    $('<a href="#" class="reset-recents">').text('Reset this list')
                );
            }

            node.show().scrollTop(0);
        },

        // set current category. sets title and triggers repaint of all icons
        setCategory: function (category) {

            if (category === undefined) {
                category = this.currentCategory === 'recently' || this.emoji.hasCategory(this.currentCategory) ?
                    this.currentCategory :
                    this.emoji.getDefaultCategory();
            }

            // always draw emojis because the collection might have changed
            this.currentCategory = category;
            this.$el.find('.emoji-category').text(this.emoji.getTitle(category));
            this.drawEmojis();
        },

        setCollection: function (collection) {

            if (collection === undefined) {
                collection = this.emoji.getCollection();
            }

            if (collection !== this.currentCollection) {

                this.currentCollection = collection;
                this.emoji.setCollection(collection);

                // set active collection in tab-conrol
                if (this.showTabs) {
                    var tabs = this.$el.find('.emoji-tabs');
                    tabs.find('[data-collection]').removeClass('active');
                    tabs.find('[data-collection="' + collection + '"]').addClass('active');
                } else {
                    // set visual check-mark in drop-down menu
                    var options = this.$el.find('.emoji-options');
                    options.find('[data-collection] i').attr('class', 'icon-none');
                    options.find('[data-collection="' + collection + '"]')
                        .find('i').attr('class', 'icon-ok');
                }

                this.drawCategoryIcons();
                this.setCategory();
            }
        },

        // hide/show view
        toggle: function () {
            if (!this.isRendered) {
                this.render();
            } else {
                this.$el.toggle();
                this.isOpen = !this.isOpen;
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
                    view.emoji = emoji.getInstance();
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
