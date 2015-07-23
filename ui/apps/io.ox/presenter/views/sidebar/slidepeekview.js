/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 */
define('io.ox/presenter/views/sidebar/slidepeekview', [
    'io.ox/backbone/disposable',
    'io.ox/presenter/util',
    'gettext!io.ox/presenter'
], function (DisposableView, Util, gt) {

    var slidepeekView = DisposableView.extend({

        className: 'presenter-sidebar-section',

        initialize: function (options) {
            _.extend(this, options);

            this.slidePeekLoadDef = Util.createAbortableDeferred($.noop);
            this.activeSlideIndex = this.app.mainView.getActiveSlideIndex();

            this.on('dispose', this.disposeView.bind(this));
        },

        render: function () {
            function beginConvertSuccess(convertData) {
                var slideWrapper = $('<div class="slidepeek">'),
                    slideImage = new Image();
                slideImage.className = 'slidepeek-image';
                this.slideImage = slideImage;
                slideWrapper.append(slideImage);
                this.$el.append(slideWrapper);
                this.loadSlidePeek(convertData);
                return convertData;
            }

            function beginConvertError(response) {
                return $.Deferred().reject(response);
            }

            function beginConvertFinished() {
                this.$el.removeClass('io-ox-busy');
            }

            this.$el.empty().addClass('io-ox-busy');
            this.slidePeekLoadDef = Util.beginConvert(this.model.toJSON())
                .done(beginConvertSuccess.bind(this))
                .fail(beginConvertError.bind(this))
                .always(beginConvertFinished.bind(this));

            return this;
        },

        /**
         * Loads the slide peek preview image.
         *
         * @param {Object} convertData
         *  a response object from document converter containing
         *  the convert jobID and the total page count.
         */
        loadSlidePeek: function (convertData) {
            // build thumbnail request param
            var params = {
                    action: 'convertdocument',
                    convert_action: 'getpage',
                    target_format: 'png',
                    target_width: 600,
                    target_zoom: 1,
                    job_id: convertData.jobID,
                    id: encodeURIComponent(this.model.get('id')),
                    folder_id: this.model.get('folder_id'),
                    filename: encodeURIComponent(this.model.get('filename')),
                    version: this.model.get('version')
                },
                slidePeekImage = this.$('.slidepeek-image'),
                self = this;

            // set peek page number to the request param
            var peekPageNumber = this.activeSlideIndex + 2;
            if (peekPageNumber > convertData.pageCount) {
                //#. info text on the next slide preview, which means the presenting user reached the last slide.
                var endNotification = $('<div class="end-notification">').text(gt('End of Slides'));
                this.$('.slidepeek').empty().addClass('end').css(this.app.slidePeekSize).append(endNotification);
                return;
            }

            // load the preview image
            params.page_number = peekPageNumber;
            var thumbnailUrl = Util.getConverterUrl(params);
            slidePeekImage.attr('src', thumbnailUrl)
                .on('load', function () {
                    $(this).show();
                    self.app.slidePeekSize = {
                        width: $(this).width(),
                        height: $(this).height()
                    };
                });
        },

        disposeView: function () {
            var def = this.slidePeekLoadDef;
            // cancel any pending thumbnail loading
            if (def.state() === 'pending') {
                def.abort();
            }
            // close convert jobs while quitting
            def.done(function (response) {
                Util.endConvert(this.model.toJSON(), response.jobID);
            }.bind(this));
        }
    });

    return slidepeekView;
});
