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
    'io.ox/core/tk/doc-converter-utils',
    'io.ox/presenter/util',
    'gettext!io.ox/presenter'
], function (DisposableView, DocConverterUtils, Util, gt) {

    var slidepeekView = DisposableView.extend({

        className: 'presenter-sidebar-section',

        initialize: function (options) {
            _.extend(this, options);

            this.slidePeekLoadDef = Util.createAbortableDeferred($.noop);
            this.activeSlideIndex = this.app.mainView.getActiveSlideIndex();

            this.onResizeDebounced = _.debounce(this.onResize.bind(this), 500);
            this.listenTo(this.presenterEvents, 'presenter:resize', this.onResizeDebounced);
            this.listenTo(this.presenterEvents, 'presenter:page:loaded', this.onPageLoaded);

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
            this.slidePeekLoadDef = DocConverterUtils.beginConvert(this.model)
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
            var self = this;
            var slidePeek = this.$('.slidepeek');
            var slidePeekImage = this.$('.slidepeek-image');
            var peekPageNumber = this.activeSlideIndex + 2;
            // build thumbnail request param
            var params = {
                    action: 'convertdocument',
                    convert_action: 'getpage',
                    target_format: 'png',
                    target_width: 600,
                    target_zoom: 1,
                    page_number: peekPageNumber,
                    job_id: convertData.jobID,
                    id: encodeURIComponent(this.model.get('id')),
                    folder_id: this.model.get('folder_id'),
                    filename: encodeURIComponent(this.model.get('filename')),
                    version: this.model.get('version')
                };

            if (peekPageNumber > convertData.pageCount) {
                //#. info text on the next slide preview, which means the presenting user reached the last slide.
                var endNotification = $('<div class="end-notification">').text(gt('End of Slides'));
                // apply slide size to slide peek
                slidePeek.empty().addClass('end').append(endNotification);
                this.updateSlidePeekSize();

            } else {
                // load the preview image
                var thumbnailUrl = DocConverterUtils.getConverterUrl(params);
                slidePeekImage.attr('src', thumbnailUrl)
                .on('load', function () {
                    $(this).show();
                    self.updateSlidePeekSize();
                });
            }
        },

        /**
        * Sets the size of the slide peek according to the main slide size.
        * - the slide peek matches 50% of the main slide size.
        */
        updateSlidePeekSize: function () {
            var slidePeek = this.$('.slidepeek');
            var pageSize = this.app.mainView.presentationView.pdfDocument.getOriginalPageSize();
            var zoom = this.app.mainView.presentationView.currentZoomFactor * 0.01;
            var factor = zoom * 0.5;

            if (pageSize && pageSize.width > 0 && pageSize.height > 0) {
                slidePeek.css({
                    width: pageSize.width * factor,
                    height: pageSize.height * factor
                });
            }
        },

        /**
         * Handles page loaded events.
         *
         * @param {Number} page
         *  The 1-based page number.
         *
         */
        onPageLoaded: function (page) {
            if (this.disposed || ox.ui.App.getCurrentApp().getName() !== 'io.ox/presenter') {
                return;
            }

            if (page === (this.activeSlideIndex + 1)) {
                this.updateSlidePeekSize();
            }
        },

        /**
         * Handles presenter resize events
         */
        onResize: function () {
            if (this.disposed || ox.ui.App.getCurrentApp().getName() !== 'io.ox/presenter') {
                return;
            }

            this.updateSlidePeekSize();
        },

        disposeView: function () {
            var def = this.slidePeekLoadDef;
            // cancel any pending thumbnail loading
            if (def.state() === 'pending') {
                def.abort();
            }
            // close convert jobs while quitting
            def.done(function (response) {
                DocConverterUtils.endConvert(this.model, response.jobID);
            }.bind(this));
        }
    });

    return slidepeekView;
});
