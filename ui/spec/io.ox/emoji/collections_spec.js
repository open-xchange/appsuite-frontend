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

    //FIXME: reload emoji module once reloading is possible
    //run some initialisation code (run during module loading) again,
    //to be able to change collections during run-time
    function parseCollections() {
        var e = settings.get('availableCollections', '');
        return _(e.split(','))
        .chain()
        .map(function (collection) {
            return collection.trim();
        })
        .compact()
        .value();
    }

    describe('Emoji support', function () {
        describe('with different collections', function () {
            beforeEach(function () {
                //prevent settings from being stored on server
                this.settingsSpy = sinon.stub(settings, 'save');
            });

            afterEach(function () {
                this.settingsSpy.restore();
            });

            it('should have a default collection', function () {
                settings.set({defaultCollection: 'unified'});
                this.emoji = emoji.getInstance();

                expect(this.emoji.getCollection()).toBe('unified');
            });

            it('should be possible to have a user defined collection', function () {
                settings.set({userCollection: 'unified'});
                this.emoji = emoji.getInstance();

                expect(this.emoji.getCollection()).toBe('unified');
            });

            it('should parse the availableCollections setting', function () {

                settings.set({availableCollections: ''});

                expect(emoji.getInstance().collections).toEqual([]);

                settings.set({availableCollections: 'unified'});

                expect(emoji.getInstance().collections).toEqual(['unified']);

                settings.set({availableCollections: 'unified,bar'});

                expect(emoji.getInstance().collections).toEqual(['unified', 'bar']);
            });

            it('should be possible to get a custom emoji collection', function () {
                settings.set({});
                settings.set('defaultCollection', 'unified');
                settings.set('availableCollections', 'unified,softbank,japan_carrier');

                var softbank = emoji.getInstance({collection: 'softbank'}),
                    defaultCollection = emoji.getInstance();

                expect(softbank.getCollection()).toBe('softbank');
                expect(defaultCollection.getCollection()).not.toBe('softbank');
            });

            it('should set a valid collection', function () {
                settings.set({});
                settings.set('defaultCollection', 'unified');
                settings.set('availableCollections', 'unified,softbank');
                var collection = emoji.getInstance();
                collection.collections = parseCollections();

                expect(collection.getCollection()).toBe('unified');
                collection.setCollection('softbank');
                expect(collection.getCollection()).toBe('softbank');
            });

            it('should not set an invalid collection', function () {
                settings.set({});
                settings.set('defaultCollection', 'unified');
                settings.set('availableCollections', 'unified');
                var collection = emoji.getInstance();
                collection.collections = parseCollections();

                expect(collection.getCollection()).toBe('unified');
                collection.setCollection('softbank');
                expect(collection.getCollection()).toBe('unified');
            });

            describe('configuring collection precedence', function () {
                beforeEach(function () {
                    this.testIcons = {
                        japan_carrier: '\ud83d\ude09', // winking face - available in all collections
                        softbank: '\ud83d\ude37', // face with medical mask - only available in unified and softbank
                        unified: '\ud83d\udcb3' // 'credit card - only available in unified
                    };
                });

                it('should provide a fallback icon for icons not availabe', function () {
                    var result = {};
                    settings.set({});
                    settings.set('userCollection', 'japan_carrier');
                    settings.set('availableCollections', 'japan_carrier,softbank,unified');

                    result.japan_carrier = emoji.unifiedToImageTag(this.testIcons.japan_carrier);
                    result.softbank = emoji.unifiedToImageTag(this.testIcons.softbank);
                    result.unified = emoji.unifiedToImageTag(this.testIcons.unified);
                    expect(result.japan_carrier).toContain('emoji-japan_carrier');
                    expect(result.softbank).toContain('emoji-softbank');
                    expect(result.unified).toContain('emoji-unified');
                });

                it('should prefer user collection when searching icons', function () {
                    var result = {};
                    settings.set({});
                    settings.set('userCollection', 'unified');
                    settings.set('availableCollections', 'japan_carrier,softbank,unified');

                    result.japan_carrier = emoji.unifiedToImageTag(this.testIcons.japan_carrier);
                    result.softbank = emoji.unifiedToImageTag(this.testIcons.softbank);
                    result.unified = emoji.unifiedToImageTag(this.testIcons.unified);
                    expect(result.japan_carrier).toContain('emoji-unified');
                    expect(result.softbank).toContain('emoji-unified');
                    expect(result.unified).toContain('emoji-unified');
                });

                it('should not prefer user collections when turned of by setting', function () {
                    var result = {};
                    settings.set({});
                    settings.set('userCollection', 'unified');
                    settings.set('availableCollections', 'japan_carrier,softbank,unified');
                    settings.set('overrideUserCollection', true);

                    result.japan_carrier = emoji.unifiedToImageTag(this.testIcons.japan_carrier);
                    result.softbank = emoji.unifiedToImageTag(this.testIcons.softbank);
                    result.unified = emoji.unifiedToImageTag(this.testIcons.unified);
                    expect(result.japan_carrier).toContain('emoji-japan_carrier');
                    expect(result.softbank).toContain('emoji-softbank');
                    expect(result.unified).toContain('emoji-unified');
                });
            });
        });
    });
});
