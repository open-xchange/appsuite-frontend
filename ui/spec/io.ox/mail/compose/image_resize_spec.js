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
 */
define(['io.ox/mail/compose/resize', 'settings!io.ox/mail'], function (imageResize, settings) {

    'use strict';

    describe('Mail Compose', function () {
        describe('image resize', function () {
            describe('getTargetDimensions', function () {
                it('should get the correct target sizes for horizontal images', function () {
                    var dimensions = { width: 2048, height: 1024 },
                        targetsize = 1024,
                        expectedWidth = 1024,
                        expectedHeight = 512;
                    var resultDimensions = imageResize.getTargetDimensions(dimensions, targetsize);
                    expect(resultDimensions.width).to.equal(expectedWidth);
                    expect(resultDimensions.height).to.equal(expectedHeight);
                });

                it('should get the correct target sizes for vertical images', function () {
                    var dimensions = { width: 1024, height: 2048 },
                        targetsize = 1024,
                        expectedWidth = 512,
                        expectedHeight = 1024;
                    var resultDimensions = imageResize.getTargetDimensions(dimensions, targetsize);
                    expect(resultDimensions.width).to.equal(expectedWidth);
                    expect(resultDimensions.height).to.equal(expectedHeight);
                });

                it('should get the correct target sizes for cubic images', function () {
                    var dimensions = { width: 2048, height: 2048 },
                        targetsize = 1024,
                        expectedWidth = 1024,
                        expectedHeight = 1024;
                    var resultDimensions = imageResize.getTargetDimensions(dimensions, targetsize);
                    expect(resultDimensions.width).to.equal(expectedWidth);
                    expect(resultDimensions.height).to.equal(expectedHeight);
                });
            });
            describe('isResizableImage', function () {

                var fileSizeMax = settings.get('features/imageResize/fileSizeMax', 10 * 1024 * 1024);

                it('should be true for jpgs', function () {
                    var jpgFile = { type: 'image/jpg', size: fileSizeMax - 1 },
                        jpegFile = { type: 'image/jpeg', size: fileSizeMax - 1 };
                    expect(imageResize.isResizableImage(jpgFile)).to.be.true;
                    expect(imageResize.isResizableImage(jpegFile)).to.be.true;
                });
                it('should be true for pngs', function () {
                    var pngFile = { type: 'image/png', size: fileSizeMax - 1 };
                    expect(imageResize.isResizableImage(pngFile)).to.be.true;
                });
                it('should be false for gifs', function () {
                    var gifFile = { type: 'image/gif', size: fileSizeMax - 1 };
                    expect(imageResize.isResizableImage(gifFile)).to.be.false;
                });
                it('should be false for other types', function () {
                    var tiffFile = { type: 'image/tiff', size: fileSizeMax - 1 },
                        applicationFile = { type: 'application/someApp', size: fileSizeMax - 1 };
                    expect(imageResize.isResizableImage(tiffFile)).to.be.false;
                    expect(imageResize.isResizableImage(applicationFile)).to.be.false;
                });
                it('should be false for files bigger than filesize maximum', function () {
                    var jpgFile = { type: 'image/jpg', size: fileSizeMax + 1 },
                        jpegFile = { type: 'image/jpeg', size: fileSizeMax + 1 },
                        pngFile = { type: 'image/png', size: fileSizeMax + 1 },
                        gifFile = { type: 'image/gif', size: fileSizeMax + 1 };
                    expect(imageResize.isResizableImage(jpgFile)).to.be.false;
                    expect(imageResize.isResizableImage(jpegFile)).to.be.false;
                    expect(imageResize.isResizableImage(pngFile)).to.be.false;
                    expect(imageResize.isResizableImage(gifFile)).to.be.false;
                });
            });
            describe('resizeRecommended', function () {

                var fileSizeThreshold = settings.get('features/imageResize/fileSizeThreshold', 1024 * 1024),
                    imageSizeThreshold = settings.get('features/imageResize/imageSizeThreshold', 1024);

                it('should be false for images within the thresholds', function () {
                    var dimensions = { width: imageSizeThreshold, height: imageSizeThreshold },
                        size = fileSizeThreshold;
                    expect(imageResize.resizeRecommended(dimensions, size)).to.be.false;
                });
                it('should be true for images with too big width', function () {
                    var dimensions = { width: imageSizeThreshold + 1, height: imageSizeThreshold },
                        size = fileSizeThreshold;
                    expect(imageResize.resizeRecommended(dimensions, size)).to.be.true;
                });
                it('should be true for images with too big height', function () {
                    var dimensions = { width: imageSizeThreshold, height: imageSizeThreshold + 1 },
                        size = fileSizeThreshold;
                    expect(imageResize.resizeRecommended(dimensions, size)).to.be.true;
                });
                it('should be true for images with too big filesize', function () {
                    var dimensions = { width: imageSizeThreshold, height: imageSizeThreshold },
                        size = fileSizeThreshold + 1;
                    expect(imageResize.resizeRecommended(dimensions, size)).to.be.true;
                });
            });
        });
    });
});
