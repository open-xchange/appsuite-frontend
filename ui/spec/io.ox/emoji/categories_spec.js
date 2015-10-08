/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'io.ox/emoji/main',
    'settings!io.ox/mail/emoji'
], function (emoji, settings) {
    'use strict';

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

                expect(categories).to.contain('Nature');
                expect(categories).to.contain('People');
                expect(categories).to.contain('Symbols');
                expect(categories).to.contain('Objects');
                expect(categories).to.contain('Places');
            });

            it('should contain metadata for a category', function () {
                var data = this.emoji.getCategories()[0];

                expect(data.iconClass).to.exist;
                expect(data.name).to.exist;
                expect(data.title).to.exist;
            });

            it('should provide all icons for a specific category', function () {
                var peopleIcons = this.emoji.iconsForCategory('People'),
                    pile = _(peopleIcons).where({ unicode: pile_unicode })[0];

                expect(this.emoji.icons.length).to.be.above(peopleIcons.length);
                expect(peopleIcons.length).to.equal(167);
                expect(pile).to.exist;
                expect(pile.desc).to.equal('pile of poo');
            });

            it('should have a default category', function () {
                var defaultCategory = this.emoji.getDefaultCategory();

                expect(defaultCategory).to.equal('People');
            });

            it('should provide a method to test existance of a category', function () {
                expect(this.emoji.hasCategory('People'), 'has category People').to.be.true;
                expect(this.emoji.hasCategory('nonsense'), 'has category nonsense').to.be.false;
            });

            describe('and meta category for recently used icons', function () {
                it('should contain a recenty category', function () {
                    expect(this.emoji.getRecently()).to.exist;
                });

                it('should be possible to reset recenty used icons', function () {
                    //add item to recently used list
                    this.emoji.recent(pile_unicode);
                    expect(_(this.emoji.iconsForCategory('recently')).pluck('desc')).to.contain('pile of poo');

                    this.emoji.resetRecents();
                    expect(this.emoji.iconsForCategory('recently')).to.be.empty;
                });

                it('should store a maximum of 40 recently used icons', function () {
                    var emoji = this.emoji;
                    _(this.emoji.icons)
                        .chain()
                        .first(35)
                        .each(function (icon) {
                            emoji.recent(icon.unicode);
                        });

                    expect(this.emoji.iconsForCategory('recently')).to.have.length(35);

                    _(this.emoji.icons)
                        .chain()
                        .first(50)
                        .each(function (icon) {
                            emoji.recent(icon.unicode);
                        });

                    expect(this.emoji.iconsForCategory('recently')).to.have.length(40);
                });

                it('should sort the recently used icons (most used first)', function () {
                    this.emoji.resetRecents();
                    this.emoji.recent('\u2600');
                    this.emoji.recent('\u2600');
                    this.emoji.recent(pile_unicode);
                    this.emoji.recent('\u2600');

                    expect(_(this.emoji.iconsForCategory('recently')).pluck('unicode')).to.deep.equal(['\u2600', pile_unicode]);

                    this.emoji.recent(pile_unicode);
                    expect(_(this.emoji.iconsForCategory('recently')).pluck('unicode')).to.deep.equal(['\u2600', pile_unicode]);

                    for (var i = 0; i < 10; i++) {
                        this.emoji.recent(pile_unicode);
                    }
                    expect(_(this.emoji.iconsForCategory('recently')).pluck('unicode')).to.deep.equal([pile_unicode, '\u2600']);
                });
            });
        });
    });
});
