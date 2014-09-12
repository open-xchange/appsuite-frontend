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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define(['io.ox/files/carousel'], function (slideshow) {

    describe('Slideshow for files:', function () {

        var testFiles = [
            { file_mimetype: 'audio/mp3', filename: 'music.mp3', folder_id: '1', id: '1' },
            { file_mimetype: 'image/jpg', filename: '1.jpg', folder_id: '1', id: '2' },
            { file_mimetype: 'image/jpg', filename: '2.jpg', folder_id: '1', id: '3' },
            { file_mimetype: 'video/m4v', filename: 'video.m4v', folder_id: '1', id: '4' },
            { file_mimetype: 'image/jpg', filename: '3.jpg', folder_id: '1', id: '5' },
            { file_mimetype: 'image/jpg', filename: '4.jpg', folder_id: '1', id: '6' },
            { file_mimetype: 'text/html', filename: 'page.html', folder_id: '1', id: '7' }
        ];

        beforeEach(function () {
            $('body', document).append(this.node = $('<div id="testNode">'));
        });

        afterEach(function () {
            $('#testNode', document).remove();
        });

        describe('with multiple images', function () {

            beforeEach(function () {
                slideshow.init({
                    baton: { allIds: testFiles },
                    attachmentMode: false,
                    selector: '#testNode'
                });
            });

            it('should initialize', function () {
                expect(this.node.find('.carousel')).to.have.length.above(0);
            });

            it('should be closable', function () {
                slideshow.close();
                expect(this.node.find('.carousel')).to.have.length(0);
            });

            it('should display the number of configured images at a time', function () {
                expect(this.node.find('img').length).to.equal(slideshow.config.step);
            });

            it('should have a previous button', function () {
                expect(this.node.find('a[data-slide="prev"]')).to.have.length.above(0);
            });

            it('should have a next button', function () {
                expect(this.node.find('a[data-slide="next"]')).to.have.length.above(0);
            });

            it('should display the next button', function () {
                expect(this.node.find('a[data-slide="next"]').attr('style')).not.to.match(/display:\w*none;/);
            });

            it('should have a close button', function () {
                expect(this.node.find('button.btn.closecarousel')).to.have.length.above(0);
            });

            it('should close when close button is clicked', function () {
                this.node.find('.closecarousel').click();
                expect(this.node.find('.carousel')).to.have.length(0);
            });

            it('should close on escape keyup', function () {
                var e = $.Event('keyup', { keyCode: 27 });
                this.node.find('.carousel').trigger(e);
                expect(this.node.find('.carousel')).to.have.length(0);
            });

            it.skip('should trigger "slideshow:start" on global ox object', function () {
                expect(ox).toTrigger('slideshow:start');
                slideshow.show();
            });

            it.skip('should trigger "slideshow:end" event on global ox object', function () {
                expect(ox).toTrigger('slideshow:end');
                slideshow.close();
            });
        });

        describe('with a single image', function () {

            beforeEach(function () {
                slideshow.init({
                    baton: { allIds: [testFiles[1]]},
                    attachmentMode: false,
                    selector: '#testNode'
                });
            });

            it('should hide the previous button', function () {
                expect(this.node.find('a[data-slide="prev"]:hidden')).to.have.length.above(0);
            });

            it('should hide the next button', function () {
                expect(this.node.find('a[data-slide="next"]:hidden')).to.have.length.above(0);
            });
        });

        describe('controls', function () {
            /*
                TODO:
                Add testing for prev, next controls and events - this makes sense when updating to bootstrap 3.
            */
        });
    });
});
