/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define(['io.ox/mail/compose/resize', 'settings!io.ox/mail'], function (imageResize, settings) {

    'use strict';

    var maxSize = settings.get('features/imageResize/maxSize', 10 * 1024 * 1024),
        minDimension = settings.get('features/imageResize/imageSizeThreshold', 1024);

    function getMockFile(obj) {
        return {
            type: obj.type || 'image/jpg',
            size: obj.size || maxSize - 1,
            _dimensions: {
                width: obj.width || 1024 + 1,
                height: obj.height || 1024 + 1
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
                    width: minDimension,
                    height: minDimension
                });
                expect(imageResize.resizeRecommended(file)).to.be.false;
            });
            it('should be true for images with too big width', function () {
                var file = getMockFile({
                    width: minDimension + 1,
                    height: minDimension
                });
                expect(imageResize.resizeRecommended(file)).to.be.true;
            });
            it('should be true for images with too big height', function () {
                var file = getMockFile({
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
                it('for medium files', function () {
                    expect(imageResize.matches('size', getMockFile({ size: maxSize / 2 }))).to.be.true;
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
