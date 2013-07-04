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
define([
    'moxiecode/tiny_mce/plugins/emoji/main',
    'settings!io.ox/mail/emoji'
], function (emoji, settings) {
    "use strict";

    var pile_unicode = '\ud83d\udca9';

    describe('Emoji support', function () {
        describe('provides collections with categories', function () {
            beforeEach(function () {
                //prevent settings from being stored on server
                this.settingsSpy = sinon.stub(settings, 'save');
                settings.set('availableCollections', 'unified,softbank,japan_carrier');
                settings.set('userCollection', 'unified');

                this.emoji = emoji.getInstance();
            });

            afterEach(function () {
                this.settingsSpy.restore();
            });

            it('should contain some category names', function () {
                var categories = _(this.emoji.getCategories()).pluck('name');

                expect(categories).toContain('Nature');
                expect(categories).toContain('People');
                expect(categories).toContain('Symbols');
                expect(categories).toContain('Objects');
                expect(categories).toContain('Places');
            });

            it('should contain metadata for a category', function () {
                var data = this.emoji.getCategories()[0];

                expect(data.iconClass).toBeDefined();
                expect(data.name).toBeDefined();
                expect(data.title).toBeDefined();
            });

            it('should provide all icons for a specific category', function () {
                var peopleIcons = this.emoji.iconsForCategory('People'),
                    pile = _(peopleIcons).where({unicode: pile_unicode})[0];

                expect(this.emoji.icons.length > peopleIcons.length).toBeTruthy();
                expect(peopleIcons.length).toBe(167);
                expect(pile).toBeDefined();
                expect(pile.desc).toBe('pile of poo');
            });

            it('should have a default category', function () {
                var defaultCategory = this.emoji.getDefaultCategory();

                expect(defaultCategory).toBe('People');
            });

            it('should provide a method to test existance of a category', function () {
                expect(this.emoji.hasCategory('People')).toBeTruthy();
                expect(this.emoji.hasCategory('nonsense')).toBeFalsy();
            });

            describe('and meta category for recently used icons', function () {
                it('should contain a recenty category', function () {
                    expect(this.emoji.getRecently()).toBeDefined();
                });

                it('should be possible to reset recenty used icons', function () {
                    //add item to recently used list
                    this.emoji.recent(pile_unicode);
                    expect(_(this.emoji.iconsForCategory('recently')).pluck('desc')).toContain('pile of poo');

                    this.emoji.resetRecents();
                    expect(this.emoji.iconsForCategory('recently').length).toBe(0);
                });

                it('should store a maximum of 40 recently used icons', function () {
                    var emoji = this.emoji;
                    _(this.emoji.icons)
                        .chain()
                        .first(35)
                        .each(function (icon) {
                            emoji.recent(icon.unicode);
                        });

                    expect(this.emoji.iconsForCategory('recently').length).toBe(35);

                    _(this.emoji.icons)
                        .chain()
                        .first(50)
                        .each(function (icon) {
                            emoji.recent(icon.unicode);
                        });

                    expect(this.emoji.iconsForCategory('recently').length).toBe(40);
                });

                it('should sort the recently used icons (most used first)', function () {
                    this.emoji.resetRecents();
                    this.emoji.recent('\u2600');
                    this.emoji.recent('\u2600');
                    this.emoji.recent(pile_unicode);
                    this.emoji.recent('\u2600');

                    expect(_(this.emoji.iconsForCategory('recently')).pluck('unicode')).toEqual(['\u2600', pile_unicode]);

                    this.emoji.recent(pile_unicode);
                    expect(_(this.emoji.iconsForCategory('recently')).pluck('unicode')).toEqual(['\u2600', pile_unicode]);

                    for (var i=0;i<10;i++) this.emoji.recent(pile_unicode);
                    expect(_(this.emoji.iconsForCategory('recently')).pluck('unicode')).toEqual([pile_unicode, '\u2600']);
                });
            });
        });
    });
});
