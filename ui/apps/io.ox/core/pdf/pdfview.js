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
 * @author Kai Ahrens <kai.ahrens@open-xchange.com>
 */

define('io.ox/core/pdf/pdfview', [
    'io.ox/core/pdf/pdftextlayerbuilder',
    'io.ox/core/pdf/pdfannotationslayerbuilder',
    'less!io.ox/core/pdf/pdfstyle'
], function (PDFTextLayerBuilder, PDFAnnotationsLayerBuilder) {

    'use strict';

    var PDFPAGE_SCALING = 96.0 / 72.0,

        MAX_DEVICE_PIXEL_RATIO = 2.0,

        DEVICE_PIXEL_RATIO = (function () {
            var devicePixelRatio = 1;

            if (('deviceXDPI' in screen) && ('logicalXDPI' in screen) && (screen.logicalXDPI > 0)) {
                // IE mobile or IE
                devicePixelRatio = screen.deviceXDPI / screen.logicalXDPI;
            } else if (window.hasOwnProperty('devicePixelRatio')) {
                // other devices
                devicePixelRatio = window.devicePixelRatio;
            }
            return devicePixelRatio;
        })(),

        DEVICE_PDFPAGE_SCALING = PDFPAGE_SCALING,

        DEVICE_OUTPUTSCALING = Math.min(DEVICE_PIXEL_RATIO, MAX_DEVICE_PIXEL_RATIO),

        // max size of canvas width & height
        // https://github.com/mozilla/pdf.js/issues/2439
        // http://stackoverflow.com/a/22345796/4287795
        MAXIMUM_SIDE_SIZE = (_.browser.iOS || _.browser.Android || _.browser.Safari || _.browser.IE <= 10) ? 2156 : 4096,

        /**
         * Queues the render calls for execution. The first call added
         * is the first one to be executed (first in, first out).
         * Waits after every render call an amount of 250ms before executing the next one.
         */
        handleRenderQueue = (function () {
            var lastDef = $.when(),
                queue = [];

            return function (deferred) {
                // add the deferred to the end of the queue
                queue.push(deferred);

                lastDef = lastDef.then(function () {
                    var def = $.Deferred(),
                        // remove the first deferred from the queue
                        queuedDef = queue.shift();

                    queuedDef.resolve();
                    setTimeout(function () {
                        def.resolve();
                    }, 250);

                    return def;
                });
            };
        }());

    // - class PDFView ---------------------------------------------------------

    /**
     * The PDF view of a PDF document.
     *
     * @constructor
     *
     * @extends n/a
     */
    /**
     * @param {PDFDocumentLoadingTask} pdfDocument
     */
    function PDFView(pdfDocument, globalOptions) {

        var self = this,

            pageData = [],

            renderCallbacks = null,

            renderedPageNumbers = [],

            blockRenderCount = 0,

            intervalId = 0;

        // ---------------------------------------------------------------------

        function getPageViewport(pdfjsPage, pageZoom) {
            return _.isObject(pdfjsPage) ? pdfjsPage.getViewport(PDFView.getAdjustedZoom(pageZoom)) : null;
        }

        function intersects(aFrom, aTo, bFrom, bTo) {
            return (aFrom >= bFrom && bTo >= aFrom) || (bFrom >= aFrom && aTo >= bFrom);
        }

        function updateLine(line, child, allLines) {
            if (!line) {
                line = { min: 99999999, max: 0, childs: [] };
                var lastLine = _.last(allLines);
                if (lastLine) {
                    lastLine = _.last(lastLine.childs);
                    lastLine.innerHTML = lastLine.innerHTML + '\r\n';
                }
                allLines.push(line);
            }
            var cV = PDFView.convertCssLength(child.style.top, 'px', 1);
            var cH = PDFView.convertCssLength(child.style.fontSize, 'px', 1);

            line.min = Math.min(line.min, cV);
            line.max = Math.max(line.max, cV + cH);
            var lastChild = _.last(line.childs);
            line.childs.push(child);

            if (lastChild) {
                var letter = PDFView.convertCssLength(lastChild.style.fontSize, 'px', 1);
                var dist = PDFView.convertCssLength(child.style.left, 'px', 1) - ($(lastChild).width() + PDFView.convertCssLength(lastChild.style.left, 'px', 1));
                if (dist < letter * 4) {
                    lastChild.innerHTML = lastChild.innerHTML + ' ';
                } else {
                    lastChild.innerHTML = lastChild.innerHTML + '\t';
                }
            }
            return line;
        }

        // ---------------------------------------------------------------------

        /**
         * prepares all absolute-positioned textelements for textselection
         * by setting zIndex, margin and padding
         */
        function prepareTextLayerForTextSelection(textWrapperNode) {
            if (textWrapperNode) {
                var pageChildren = textWrapperNode.children(),
                    childrenCount = pageChildren.length,
                    //top right bottom left
                    margin = '-500px -2em 0 -10em',
                    padding = '+500px +2em 0 +10em',
                    origin = '10em 0 0',
                    lines = [],
                    currentLine = null;

                pageChildren.detach();

                _.each(pageChildren, function (child) {
                    if (child.innerHTML.length === 1) {
                        // workaround for infinite height selections
                        child.style.transform = 'scaleX(1)';
                    }

                    var childMin = PDFView.convertCssLength(child.style.top, 'px', 1);
                    var childMax = PDFView.convertCssLength(child.style.fontSize, 'px', 1) + childMin;

                    if (currentLine && !intersects(currentLine.min, currentLine.max, childMin, childMax)) {
                        currentLine = null;
                    }
                    currentLine = updateLine(currentLine, child, lines);
                });

                lines.sort(function (a, b) { return a.min - b.min; });

                _.each(lines, function (line) {
                    textWrapperNode.append(line.childs);
                });

                //much bigger element for a smooth forward selection!
                pageChildren = textWrapperNode.children();
                _.each(pageChildren, function (child, index) {
                    // Non IPAD case
                    if (!(_.device('touch') && _.browser.iOS && _.browser.Safari)) {
                        child.style.margin = margin;
                        child.style.padding = padding;
                        child.style.transformOrigin = origin;
                    }
                    child.style.zIndex = childrenCount - index;
                });

                pageChildren.appendTo(textWrapperNode);

                textWrapperNode.append('<div style="bottom: 0; right: 0; padding: 200% 0 0 100%; cursor: default;">&#8203;</div>');
            }
        }

        // ---------------------------------------------------------------------

        /**
         * Returns the page data object for a page with a given page position.
         * If the page data doesn't exist, it is created
         *
         * @param {Number} pagePos
         *  The 0-based index of the page
         *
         * @returns {pageData}
         *  The page's data object.
         */
        function getPageData(pagePos) {
            // create internal rendering data structure for every page node
            if (!pageData[pagePos]) {
                pageData[pagePos] = {};
            }

            return pageData[pagePos];
        }

        /**
         * Returns the page node object for a page with the given number,
         * if a getPageNode handler function is set.
         *
         * @param {Number} pageNumber
         *  The 0-based index of the page
         *
         * @returns {jQuery.Node}
         *  The page's data object.
         */
        function getPageNode(pageNumber) {
            var pageNode = renderCallbacks ? renderCallbacks.getPageNode(pageNumber) : null;
            return (pageNode ? $(pageNode) : null);
        }

        // ---------------------------------------------------------------------

        function intervalHandler() {
            if (_.isObject(renderCallbacks) && !self.isRenderingSuspended()) {
                var curPageNumbersToRender = renderCallbacks.getVisiblePageNumbers();

                if (_.isArray(curPageNumbersToRender) && (curPageNumbersToRender.length > 0)) {
                    curPageNumbersToRender = _.sortBy(curPageNumbersToRender);

                    // determine complete range of pages to render (visible pages + 2 before + 2 after);
                    for (var i = 0; i < 2; ++i) {
                        if (curPageNumbersToRender[0] > 1) {
                            curPageNumbersToRender.unshift(curPageNumbersToRender[0] - 1);
                        }

                        if (curPageNumbersToRender[curPageNumbersToRender.length - 1] < pdfDocument.getPageCount()) {
                            curPageNumbersToRender.push(curPageNumbersToRender[curPageNumbersToRender.length - 1] + 1);
                        }
                    }

                    curPageNumbersToRender = _.intersection(curPageNumbersToRender, _.range(1, pdfDocument.getPageCount() + 1));

                    // do the final page rendering/removal step
                    var pagesToRender = _.difference(curPageNumbersToRender, renderedPageNumbers),
                        pagesToClear = _.difference(renderedPageNumbers, curPageNumbersToRender);

                    // fill/render all new page nodes
                    if (pagesToRender && (pagesToRender.length > 0)) {
                        var renderDefs = [];

                        // notify possible <code>renderCallbacks.beginRendering</code> callback function
                        if (_.isFunction(renderCallbacks.beginRendering)) {
                            renderCallbacks.beginRendering(pagesToRender);
                        }

                        self.suspendRendering();

                        _.each(pagesToRender, function (pageNumber) {
                            var jqPageNode = renderCallbacks.getPageNode(pageNumber);

                            if (jqPageNode) {
                                if (jqPageNode.children().length === 0) {
                                    self.createPDFPageNode(jqPageNode, _.extend({ pageZoom: self.getPageZoom(pageNumber) }, globalOptions));
                                }

                                // do async. rendering and save all render Deferreds to be
                                // able to notify when rendering will have been finished
                                renderDefs.push(self.renderPDFPage(jqPageNode, pageNumber, self.getPageZoom(pageNumber)));

                                jqPageNode.css({ visibility: 'visible' });
                            }
                        });

                        $.when.apply($, renderDefs).always(function () {
                            // notify possible <code>renderCallbacks.endRendering</code> callback function
                            if (_.isObject(renderCallbacks) && _.isFunction(renderCallbacks.endRendering)) {
                                renderCallbacks.endRendering(pagesToRender);
                            }

                            self.resumeRendering();
                        });
                    }

                    // clear all invisible page nodes
                    if (pagesToClear && (pagesToClear.length > 0)) {
                        _.each(pagesToClear, function (pageNumber) {
                            var jqPageNode = getPageNode(pageNumber);

                            if (jqPageNode) {
                                jqPageNode.css({ visibility: 'hidden' }).empty();
                            }
                        });
                    }

                    renderedPageNumbers = curPageNumbersToRender;
                }
            }
        }

        // methods ------------------------------------------------------------

        this.destroy = function () {
            this.clearRenderCallbacks();
        };

        // ---------------------------------------------------------------------

        /**
         * Set an object with callback functions to enable
         * automatic rendering.
         *
         * @param {Object} callbacks
         * The object, containing all callback functions.
         * Functions, that  need to be set are
         * <code>callbacks.getVisiblePageNumbers</code> and
         * <code>callbacks.getPageNode</code>.
         * All other callback functions are optional.
         *  @param {Function} callbacks.getVisiblePageNumbers
         *  The callback function that returns an array of
         *  <code>Integer Numbers</code>, containing all currently
         *  visible pages. The page numbers are 1-based.
         *  If no pages are currently visible, the return value is
         *  either <code>null</code> or an empty array.
         *  @param {Function} callbacks.getPageNode
         *  The callback function that returns a <code>jquery.Node</code>
         *  object for the requested page number or null.
         *  The given page number is 1-based.
         *  @param {Function} [callbacks.beginRendering]
         *  The callback function that is called before an range of pages
         *  is going to be rendered. The callback function is called
         *  with an array, containing the 1-based <code>Integer Numbers</code>
         *  of the rendering pages.
         *  @param {Function} [callbacks.endRendering].pdf-textlayer.user-select-text
         *  The callback function that is called after a range of pages
         *  has been rendered. The callback function is called
         *  with an array, containing the 1-based <code>Integer Numbers</code>
         *  of the rendered pages.
         */

        this.setRenderCallbacks = function (callbacks) {
            this.clearRenderCallbacks();

            if (_.isObject(callbacks) && _.isFunction(callbacks.getVisiblePageNumbers) && _.isFunction(callbacks.getPageNode)) {
                renderCallbacks = callbacks;
                intervalId = window.setInterval(intervalHandler, 100);
            }
        };

        // ---------------------------------------------------------------------

        this.clearRenderCallbacks = function () {
            this.suspendRendering();

            if (intervalId) {
                window.clearInterval(intervalId);
            }

            renderCallbacks = null;
            this.resumeRendering();
        };

        /**
         * There will be no rendering calls made/possible, if
         * rendering callbacks are set and as long  as resumeRendering
         * ultimately sets the internal semaphore back to 0.
         * A suspend call needs to be followed by a resume call
         * in standard use cases to reenable rendering again.
         * Calling this function increases the internal semaphore by 1.
         *
         */
        this.suspendRendering = function () {
            ++blockRenderCount;
        };

        /**
         * Rendering calls are made/possible again, if rendering
         * callbacks are set and the internal semaphore reaches 0.
         * A resume call needs to be preceded by a suspend call
         * in standard use cases.
         * Calling this function decreases the internal semaphore by 1.
         */
        this.resumeRendering = function () {
            --blockRenderCount;
        };

        /**
         * Returns the state of the the automatic rendering process.
         *
         * @returns true, if the the rendering of pages is currently suspended,
         *  either by an external call to <code>suspendRendering</code> or by
         *  internal program logic
         */
        this.isRenderingSuspended = function () {
            return (blockRenderCount > 0);
        };

        /**
         * creates the necessary nodes to render a single PDF page
         *
         * @param {jquery.Node} parentNode
         *  The parent node to be rendered within.
         *
         * @param {Object} options
         *  Additional rendering options, defaulted by the global options.
         *
         *  @param {Number} [pageNumber]
         *      The 1-based page number.
         *
         *  @param {Number} [pageZoom]
         *      The page zoom level.
         *
         *  @param {Boolean} [textOverlay]
         *      If true overlay divs over the PDF text are created
         *      to provide text-selection functionality for the PDF.
         *
         * @returns {Object}
         *  The page size object the page was rendered with.
         */
        this.createPDFPageNode = function (parentNode, options) {
            var opt = _.extend({}, globalOptions, options);
            var pageSize = opt.pageSize;
            var pageNumer = opt.pageNumer;
            var pageZoom = opt.pageZoom;

            if (!(_.isObject(pageSize) && _.isNumber(pageSize.width) && _.isNumber(pageSize.height))) {
                pageSize = _.isNumber(pageNumer) ? pdfDocument.getOriginalPageSize(pageNumer) : pdfDocument.getDefaultPageSize();
            }

            if (_.isNumber(pageZoom)) {
                pageSize = PDFView.getNormalizedSize({ width: pageSize.width * pageZoom, height: pageSize.height * pageZoom });
            }

            // set retrieved PDF page size as page node data and append correctly initialized canvas to given page node
            if (_.isObject(pageSize) && _.isNumber(pageSize.width) && _.isNumber(pageSize.height)) {
                var extentAttr = 'width="' + pageSize.width + '" height="' + pageSize.height + '" style="width:' + pageSize.width + 'px; height:' + pageSize.height + 'px"',
                    pageNode = $('<div class="pdf-page" ' + extentAttr + '>'),
                    canvasWrapper = $('<div class="canvas-wrapper" ' + extentAttr + '>');

                pageNode.append(canvasWrapper.append($('<canvas ' + extentAttr + '>')));

                if (opt.textOverlay) {
                    var textWrapper = $('<div class="text-wrapper user-select-text" ' + extentAttr + '>');
                    pageNode.append(textWrapper);
                }

                $(parentNode).append(pageNode);
            }

            return pageSize;
        };

        // ---------------------------------------------------------------------

        /**
         * Sets the zoom factor for one or all pages
         *
         * @param {Number} pageZoom
         *  The zoom factor to set for one or all pages
         *
         * @param {Number} [pageNumber]
         *  The optional 1-based page number of the page to set the zoom factor for.
         *  If not given, the zoom factor of all pages is set to the given zoom factor
         *
         *  returns {Number}
         *   The current pageZoom or 1.0, if no zoom has been set before
         */
        this.setPageZoom = function (pageZoom, pageNumber) {
            if (_.isNumber(pageZoom)) {
                this.suspendRendering();

                if (!pageNumber) {
                    _.times(pdfDocument.getPageCount(), function (pageIndex) {
                        self.setPageZoom(pageZoom, pageIndex + 1);
                    });
                } else {
                    var curPageData = getPageData(pageNumber - 1);

                    if (curPageData.pageZoom !== pageZoom) {
                        var curPageNode = getPageNode(pageNumber);

                        if (curPageNode) {
                            curPageNode.empty();
                        }

                        curPageData.pageZoom = pageZoom;
                        renderedPageNumbers = _.without(renderedPageNumbers, pageNumber);
                    }
                }

                this.resumeRendering();
            }
        };

        /**
         * Returns zoom factor of the page
         *
         * @param {Number} pageNumber
         *  The 1-based page number of the page
         *
         *  returns {Number}
         *   The current pageZoom or 1.0, if no zoom has been set before
         */
        this.getPageZoom = function (pageNumber) {
            var curPageData = getPageData(pageNumber - 1);
            return _.isNumber(pageNumber) && curPageData.pageZoom ? curPageData.pageZoom : 1.0;
        };

        // ---------------------------------------------------------------------

        /**
         * Returns the size of the zoomed page in pixels
         *
         * @param {Number} pageNumber
         *  The 1-based page number of the page
         *
         * @param {Number} [pageZoom]
         *  The optional zoom of the page for which the page size
         *  is to be calculated. If no pageZoom is given, the current/last
         *  pageZoom is returned.
         *
         *  returns { width, height }
         *   The real size of the page in pixels, based on the original size and the pageZoom
         */
        this.getRealPageSize = function (pageNumber, pageZoom) {
            var pageSize = null,
                curPageZoom = _.isNumber(pageZoom) ? pageZoom : this.getPageZoom(pageNumber);
            if (_.isObject(pdfDocument)) {
                pageSize = _.isNumber(pageNumber) ?
                            pdfDocument.getOriginalPageSize(pageNumber) :
                            pdfDocument.getDefaultPageSize();
            }
            return _.isObject(pageSize) ? { width: Math.ceil(curPageZoom * pageSize.width), height: Math.ceil(curPageZoom * pageSize.height) } : { width: 0, height: 0 };
        };

        // ---------------------------------------------------------------------

        /**
         * Renders the PDF page
         *
         * @param {Node} parentNode
         *  The parent node to be rendered within.
         *
         * @param {Number} pageNumber
         *  The 1-based page number of the page to be rendered
         *
         * @param {Number} [pageZoom]
         *  The optional zoom for the current rendering.
         *  If not set, the previously set zoom is used for rendering.
         *  If no zoom has been set before, 1.0 is set as default zoom.
         *
         * @returns {jquery.Promise}
         *  The promise of the rendering function, that is resolved, when rendering is finshed.
         */
        this.renderPDFPage = function (parentNode, pageNumber, pageZoom) {
            var def = $.Deferred(),
                pageNode = $(parentNode).children().eq(0),
                pagePos = pageNumber - 1;

            // create internal rendering data structure for every page node
            if (!pageData[pagePos]) {
                pageData[pagePos] = {};
            }

            // reset isInRendering flag after rendering is done or in failure case
            def.always(function () {
                if (pageData[pagePos]) {
                    pageData[pagePos].isInRendering = null;
                }
            });

            if (pageNode.length && !pageData[pagePos].isInRendering) {
                pageData[pagePos].curPageZoom = pageZoom;
                pageData[pagePos].isInRendering = true;

                var renderDef = $.Deferred();
                renderDef.done(function () {
                    pdfDocument.getPDFJSPage(pageNumber).then(function (pdfjsPage) {
                        if (pageNode.children().length) {
                            var viewport = getPageViewport(pdfjsPage, pageZoom),
                                pageSize = PDFView.getNormalizedSize({ width: viewport.width, height: viewport.height }),
                                scaledSize = { width: pageSize.width, height: pageSize.height },
                                canvasWrapperNode = pageNode.children('.canvas-wrapper'),
                                canvasNode = canvasWrapperNode.children('canvas'),
                                textWrapperNode = pageNode.children('.text-wrapper'),
                                pdfTextBuilder = null,
                                pdfAnnotationsBuilder = null,
                                getScale = function (orgSize) {
                                    if (orgSize * DEVICE_OUTPUTSCALING > MAXIMUM_SIDE_SIZE) {
                                        return MAXIMUM_SIDE_SIZE / (orgSize * DEVICE_OUTPUTSCALING);
                                    }
                                    return DEVICE_OUTPUTSCALING;
                                },
                                xScale = getScale(scaledSize.width),
                                yScale = getScale(scaledSize.height);

                            scaledSize.width *= xScale;
                            scaledSize.height *= yScale;

                            canvasNode.empty();

                            pageNode.attr(pageSize).css(pageSize);
                            pageNode.parent('.document-page').css(pageSize);
                            canvasWrapperNode.attr(pageSize).css(pageSize);
                            canvasNode.attr(scaledSize).css(pageSize);

                            if (textWrapperNode.length) {
                                textWrapperNode.empty().attr(pageSize).css(pageSize);

                                pdfTextBuilder = new PDFTextLayerBuilder({
                                    textLayerDiv: textWrapperNode[0],
                                    viewport: viewport,
                                    pageIndex: pageNumber
                                });
                            }

                            if (globalOptions.annotationsOverlay) {
                                pdfAnnotationsBuilder = new PDFAnnotationsLayerBuilder({
                                    pageDiv: pageNode[0],
                                    pdfPage: pdfjsPage,
                                    linkService: globalOptions.linkService
                                });

                                pdfAnnotationsBuilder.setupAnnotations(viewport);
                            }

                            var canvasCtx = canvasNode[0].getContext('2d');

                            canvasCtx._transformMatrix = [xScale, 0, 0, yScale, 0, 0];
                            canvasCtx.scale(xScale, yScale);

                            return pdfjsPage.render({
                                canvasContext: canvasCtx,
                                viewport: viewport
                            }).then(function () {
                                if (pdfTextBuilder) {
                                    return pdfjsPage.getTextContent().then(function (pdfTextContent) {
                                        pdfTextBuilder.setTextContent(pdfTextContent);
                                        pdfTextBuilder.render();
                                        prepareTextLayerForTextSelection(textWrapperNode);
                                        return def.resolve();
                                    });
                                }
                                def.resolve();
                            });
                        }
                        return def.reject();
                    });
                });
                handleRenderQueue(renderDef);
            } else {
                def.reject();
            }

            return def.promise();
        };

    } // class PDFView

    // ---------------------------------------------------------------------

    PDFView.getAdjustedZoom = function (zoom) {
        return (_.isNumber(zoom) ? zoom * DEVICE_PDFPAGE_SCALING : 1.0);
    };

    // ---------------------------------------------------------------------

    PDFView.getZoom = function (adjustedZoom) {
        return (_.isNumber(adjustedZoom) ? adjustedZoom / DEVICE_PDFPAGE_SCALING : 1.0);
    };

    // ---------------------------------------------------------------------

    PDFView.getNormalizedSize = function (size) {
        return (size && _.isNumber(size.width) && _.isNumber(size.height)) ?
                { width: Math.ceil(size.width), height: Math.ceil(size.height) } :
                    null;
    };

    // ---------------------------------------------------------------------

    PDFView.round = function (value, precision) {
        // Multiplication with small value may result in rounding errors (e.g.,
        // 227*0.1 results in 22.700000000000003), division by inverse value
        // works sometimes (e.g. 227/(1/0.1) results in 22.7), rounding the
        // inverse before division finally should work in all(?) cases, but
        // restricts valid precisions to inverses of integer numbers.
        value = Math.round((precision < 1) ? (value * Math.round(1 / precision)) : (value / precision));
        return (precision < 1) ? (value / Math.round(1 / precision)) : (value * precision);
    };

    // ---------------------------------------------------------------------

    PDFView.convertLength = (function () {
        var // the conversion factors between pixels and other units
            FACTORS = {
                'px': 1,
                'pc': 1 / 9,
                'pt': 4 / 3,
                'in': 96,
                'cm': 96 / 2.54,
                'mm': 96 / 25.4
            };

        return function convertLength(value, fromUnit, toUnit, precision) {
            value *= (FACTORS[fromUnit] || 1) / (FACTORS[toUnit] || 1);
            return _.isFinite(precision) ? PDFView.round(value, precision) : value;
        };
    }());

    // ---------------------------------------------------------------------

    PDFView.convertCssLength = function (valueAndUnit, toUnit, precision) {
        var value = parseFloat(valueAndUnit);

        if (!_.isFinite(value)) {
            value = 0;
        }

        if (value && (valueAndUnit.length > 2)) {
            value = PDFView.convertLength(value, valueAndUnit.substr(-2), toUnit, precision);
        }

        return value;
    };

    // exports ================================================================

    return PDFView;
});
