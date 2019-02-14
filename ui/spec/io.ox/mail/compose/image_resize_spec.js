/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2018 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Björn Köster <bjoern.koester@open-xchange.com>
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['io.ox/mail/compose/resize', 'settings!io.ox/mail'], function (imageResize, settings) {

    'use strict';

    var minSize = settings.get('features/imageResize/fileSizeThreshold', 0),
        maxSize = settings.get('features/imageResize/maxSize', 10 * 1024 * 1024),
        minDimension = settings.get('features/imageResize/imageSizeThreshold', 1024);

    function getMockFile(obj) {
        return {
            type: obj.type || 'image/jpg',
            size: obj.size || maxSize - 1,
            _dimensions: {
                width: obj.width || minSize + 1,
                height: obj.height || minSize + 1
            }
        };
    }

    describe('Mail Compose image resize', function () {

        describe('getTargetDimensions', function () {
            it('should get the correct target sizes for horizontal images', function () {
                var file = getMockFile({ width: 2048, height: 1024 }),
                    resultDimensions = imageResize.getTargetDimensions(file, 1024);
                expect(resultDimensions.width).to.equal(1024);
                expect(resultDimensions.height).to.equal(512);
            });

            it('should get the correct target sizes for vertical images', function () {
                var file = getMockFile({ width: 1024, height: 2048 }),
                    resultDimensions = imageResize.getTargetDimensions(file, 1024);
                expect(resultDimensions.width).to.equal(512);
                expect(resultDimensions.height).to.equal(1024);
            });

            it('should get the correct target sizes for cubic images', function () {
                var file = getMockFile({ width: 2048, height: 2048 }),
                    resultDimensions = imageResize.getTargetDimensions(file, 1024);
                expect(resultDimensions.width).to.equal(1024);
                expect(resultDimensions.height).to.equal(1024);
            });
        });

        describe('resizeRecommended', function () {

            it('should be false for images within the thresholds', function () {
                var file = getMockFile({
                    size: minSize,
                    width: minDimension,
                    height: minDimension
                });
                expect(imageResize.resizeRecommended(file)).to.be.false;
            });
            it('should be true for images with too big width', function () {
                var file = getMockFile({
                    size: minSize,
                    width: minDimension + 1,
                    height: minDimension
                });
                expect(imageResize.resizeRecommended(file)).to.be.true;
            });
            it('should be true for images with too big height', function () {
                var file = getMockFile({
                    size: minSize,
                    width: minDimension,
                    height: minDimension + 1
                });
                expect(imageResize.resizeRecommended(file)).to.be.true;
            });
            it('should be true for images with too big filesize', function () {
                var file = getMockFile({
                    size: maxSize + 1,
                    width: minDimension + 1,
                    height: minDimension
                });
                expect(imageResize.resizeRecommended(file)).to.be.false;
            });
        });

        describe('matches', function () {

            describe('type criteria properly', function () {

                it('for jpgs', function () {
                    var jpgFile = getMockFile({ type: 'image/jpg' }),
                        jpegFile = getMockFile({ type: 'image/jpeg' });
                    expect(imageResize.matches('type', jpgFile)).to.be.true;
                    expect(imageResize.matches('type', jpegFile)).to.be.true;
                });
                it('for pngs', function () {
                    var pngFile = getMockFile({ type: 'image/png' });
                    expect(imageResize.matches('type', pngFile)).to.be.true;
                });
                it('for gifs', function () {
                    var gifFile = getMockFile({ type: 'image/gif' });
                    expect(imageResize.matches('type', gifFile)).to.be.false;
                });
                it('for other types', function () {
                    var tiffFile = getMockFile({ type: 'image/tiff' }),
                        applicationFile = { type: 'application/someApp' };
                    expect(imageResize.matches('type', tiffFile)).to.be.false;
                    expect(imageResize.matches('type', applicationFile)).to.be.false;
                });
            });

            describe('size criteria properly', function () {
                it('for small files', function () {
                    expect(imageResize.matches('size', getMockFile({ size: minSize - 1 }))).to.be.false;
                });
                it('for medium files', function () {
                    expect(imageResize.matches('size', getMockFile({ size: minSize }))).to.be.true;
                    expect(imageResize.matches('size', getMockFile({ size: minSize + 1 }))).to.be.true;
                    expect(imageResize.matches('size', getMockFile({ size: maxSize }))).to.be.true;
                });
                it('for large files', function () {
                    expect(imageResize.matches('size', getMockFile({ size: maxSize + 1 }))).to.be.false;
                });
            });

            describe('dimensions criteria properly', function () {
                it('for small files', function () {
                    var file = getMockFile({ width: minDimension, height: minDimension });
                    expect(imageResize.matches('dimensions', file)).to.be.false;
                });
                it('for medium files', function () {
                    var landscape = getMockFile({ width: minDimension + 1, height: minDimension }),
                        portrait = getMockFile({ width: minDimension, height: minDimension + 1 });
                    expect(imageResize.matches('dimensions', landscape)).to.be.true;
                    expect(imageResize.matches('dimensions', portrait)).to.be.true;
                });
                it('for upscaling targets', function () {
                    var landscape = getMockFile({ width: minDimension + 1, height: minDimension });
                    expect(imageResize.matches('dimensions', landscape, { target: minDimension })).to.be.true;
                    expect(imageResize.matches('dimensions', landscape, { target: minDimension + 100 })).to.be.false;
                });
            });
        });
    });
});
