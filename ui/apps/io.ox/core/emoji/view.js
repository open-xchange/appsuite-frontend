/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/emoji/view', [
    'raw!io.ox/emoji/unified.json',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'less!io.ox/emoji/emoji'
], function (unified, settings, gt) {

    'use strict';

    unified = JSON.parse(unified);

    //
    // View. One per editor instance.
    //

    var EmojiView = Backbone.View.extend({

        tagName: 'div',
        className: 'emoji-picker',

        events: {
            'click .emoji-icons button': 'onInsertEmoji',
            'click .emoji-footer button': 'onSelectCategory',
            'click .emoji-option, .emoji-tab': 'onSelectEmojiCollection',
            'click .reset-recents': 'onResetRecents'
        },

        // when user clicks on emoji. inserts emoji into editor
        onInsertEmoji: function (e) {
            var unicode = $(e.target).text();
            util.addRecent(unicode);
            if (this.editor) this.editor.execCommand('mceInsertContent', false, unicode);
            this.trigger('insert', unicode);
        },

        // when user clicks on emoji category
        onSelectCategory: function (e) {
            e.preventDefault();
            var node = $(e.target);
            this.setCategory(node.attr('data-category'));
        },

        // when user clicks on "Reset" in "Recently used" list
        onResetRecents: function (e) {
            e.preventDefault();
            util.resetRecents();
            this.drawEmojis();
        },

        initialize: function (options) {
            this.editor = options.editor;
            this.subject = options.subject || false;
            this.isRendered = false;
            this.isOpen = false;
            this.currentCategory = '';
            if (this.editor) this.$el.addClass('mceEmojiPane');
            // for optional run-time access
            this.$el.data('view', this);
        },

        render: function () {

            this.$el.append(
                $('<div class="emoji-header">').append(
                    $('<span class="emoji-category">')
                ),
                $('<div class="emoji-icons">'),
                $('<div class="emoji-footer">')
            );

            this.drawCategories();
            this.setCategory();
            this.isRendered = true;
            this.isOpen = true;

            return this;
        },

        drawCategories: function () {

            function draw(category) {
                return $('<button type="button">')
                    .attr('data-category', category.name)
                    .attr('title', /*#, dynamic */ gt(category.name))
                    .text(category.unicode);
            }

            var footer = this.$('.emoji-footer').empty(),
                categories = util.getCategories();

            footer.empty().append(
                _(categories).map(draw)
            );
        },

        // get emojis of current category
        getEmojis: function () {
            return util.getEmojis(this.currentCategory);
        },

        // draw all emojis of current category
        drawEmojis: function () {

            var node = this.$('.emoji-icons').hide().empty(),
                list = this.getEmojis();

            node.append(
                list.map(function (unicode) {
                    return $('<button type="button">').text(unicode);
                })
            );

            // add "reset" link for recently
            if (list.length > 0 && this.currentCategory === 'Recently') {
                node.append(
                    $('<button class="reset-recents">').text(gt('Reset this list'))
                );
            }

            node.show().scrollTop(0);
        },

        // set current category. sets title and triggers repaint of all icons
        setCategory: function (category) {
            // always draw emojis because the collection might have changed
            this.currentCategory = category || util.getDefaultCategory();
            this.$('.emoji-category').text(util.getTitle(this.currentCategory));
            this.$('.emoji-footer > button').removeClass('active');
            this.$('.emoji-footer > [data-category="' + this.currentCategory + '"]').addClass('active');
            this.drawEmojis();
        },

        // hide/show view
        toggle: function () {
            if (!this.isRendered) return this.render();
            this.$el.toggle();
            this.isOpen = !this.isOpen;
            this.trigger('toggle', this.isOpen);
        }
    });

    // helper

    var util = {

        getCategories: function () {
            return unified.meta;
        },

        // add to "recently used" category
        addRecent: function (unicode) {

            var recently = settings.get('emoji/recently', {}),
                // encode unicode to avoid backend bug
                key = escape(unicode);

            if (key in recently) {
                recently[key].count++;
                recently[key].time = _.now();
            } else {
                recently[key] = { count: 1, time: _.now() };
            }

            settings.set('emoji/recently', recently).save();
        },

        resetRecents: function () {
            settings.set('emoji/recently', {}).save();
        },

        getEmojis: function (category) {

            if (category === 'Recently') {

                return _(settings.get('emoji/recently', {}))
                    .chain()
                    .map(function (value, key) {
                        return [unescape(key), value];
                    })
                    // sort by timestamp
                    .sortBy(function (array) {
                        return 0 - array[1].time;
                    })
                    // get first 40 icons (5 rows; 8 per row)
                    .first(40)
                    // now sort by frequency (descending order)
                    .sortBy(function (array) {
                        return array[1].count;
                    })
                    // extract the icon
                    .pluck(0)
                    .value()
                    .reverse();
            }

            return unified[category] || [];
        },

        getDefaultCategory: function () {
            return 'People';
        },

        getTitle: function (id) {
            switch (id) {
                //#. Emoji category
                case 'Recently': return gt('Recently used');
                //#. Emoji category
                case 'People': return gt('People');
                //#. Emoji category
                case 'Symbols': return gt('Symbols');
                //#. Emoji category
                case 'Nature': return gt('Nature');
                //#. Emoji category
                case 'Objects': return gt('Objects');
                //#. Emoji category
                case 'Places': return gt('Places');
                // no default
            }
        }
    };

    EmojiView.util = util;

    return EmojiView;
});
