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
    '3rd.party/pdf/pdftextlayerbuilder',
    'less!io.ox/core/pdf/pdfstyle'
], function (PDFTextLayerBuilder) {

    'use strict';

    var DEFAULT_PDFPAGE_SCALING = 96.0 / 72.0;

    // class PDFView =======================================================

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
    function PDFView(pdfDocument) {

        var self = this,

            pageData = [],

            getVisiblePageNumbersHandler = null,

            getPageNodeHandler = null,

            renderedPageNumbers = [],

            blockRenderCount = 0,

            intervalId = 0;

        // ---------------------------------------------------------------------

        function getPageViewport(pdfjsPage, pageZoom) {
            return _.isObject(pdfjsPage) ? pdfjsPage.getViewport(PDFView.getAdjustedZoom(pageZoom)) : null;
        }

        // ---------------------------------------------------------------------

        /**
         * prepares all absolute-positioned textelements for textselection
         * by setting zIndex, margin and padding
         */
        function prepareTextLayerForTextSelection(textOverlay) {
            if (textOverlay) {
                var pageChildren = textOverlay.children(),
                    last = null,
                    childrenCount = pageChildren.length,
                    offset = '2em';

                pageChildren.each(function () {
                    if (this.innerHTML.length === 1) {
                        // workaround for infinte height selections
                        PDFView.setCssAttributeWithPrefixes(this, 'transform', 'scaleX(1)');
                    }

                    if (last) {

                        var jqThis = $(this),
                            jqLast = $(last),
                            myTop = PDFView.convertCssLength(jqThis.css('top'), 'px', 1),
                            myLeft = PDFView.convertCssLength(jqThis.css('left'), 'px', 1),
                            lastTop = PDFView.convertCssLength(jqLast.css('top'), 'px', 1),
                            lastLeft = PDFView.convertCssLength(jqLast.css('left'), 'px', 1),
                            letter = PDFView.convertCssLength(jqLast.css('font-size'), 'px', 1),
                            sameLine = Math.abs((myTop + jqThis.offsetHeight) - (lastTop + last.offsetHeight)),
                            signDist = Math.abs(myLeft - (lastLeft + last.offsetWidth)),
                            addit = '';

                        if (sameLine > letter * 2) {
                            addit = '\r\n';
                        } else if (sameLine < letter) {
                            if (signDist > letter * 0.6) {
                                addit = '\t';
                            }
                        } else if (sameLine > letter) {
                            addit = ' ';
                        }

                        last.innerHTML = last.innerHTML + addit;
                    }

                    last = this;
                });

                //much bigger element for a smooth forward selection!
                pageChildren.each(function (index) {
                    // Non IPAD case
                    if (!(Modernizr.touch && _.browser.iOS && _.browser.Safari)) {
                        this.style.margin = '-' + offset + ' -' + offset + ' 0 -' + offset;
                        this.style.padding = offset + ' ' + offset + ' 0 ' + offset;
                        PDFView.setCssAttributeWithPrefixes(this, 'transform-origin', offset + ' 0 0');
                    }

                    this.style.zIndex = childrenCount - index;
                });

                textOverlay.append('<div style="bottom: 0; right: 0; padding: 200% 0 0 100%; cursor: default;">&#8203;</div>');
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
            var pageNode = _.isObject(getPageNodeHandler) ? getPageNodeHandler(pageNumber) : null;
            return (pageNode ? $(pageNode) : null);
        }

        // ---------------------------------------------------------------------

        function intervalHandler() {
            var curPageNumbersToRender = getVisiblePageNumbersHandler();

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

                // fill/render all remaining, new page nodes
                _.each(_.difference(curPageNumbersToRender, renderedPageNumbers), function (pageNumber) {
                    var jqPageNode = getPageNodeHandler(pageNumber);

                    if (jqPageNode) {
                        if (jqPageNode.children().length === 0) {
                            self.createPDFPageNode(jqPageNode, { pageZoom: self.getPageZoom(pageNumber) });
                        }

                        self.renderPDFPage(jqPageNode, pageNumber, self.getPageZoom(pageNumber));
                        jqPageNode.css({ visibility: 'visible' });
                    }
                });

                // clear all page nodes, that are not visible anymore
                _.each(_.difference(renderedPageNumbers, curPageNumbersToRender), function (pageNumber) {
                    var jqPageNode = getPageNode(pageNumber);

                    if (jqPageNode) {
                        jqPageNode.css({ visibility: 'hidden' }).empty();
                    }
                });

                renderedPageNumbers = curPageNumbersToRender;
            }
        }

        // methods ------------------------------------------------------------

        this.destroy = function () {
            this.clearRenderCallbacks();
        };

        // ---------------------------------------------------------------------

        this.setRenderCallbacks = function (getVisiblePageNumbers, getPageNode) {
            this.clearRenderCallbacks();

            if (_.isObject(getVisiblePageNumbers) && _.isObject(getPageNode)) {
                getVisiblePageNumbersHandler = getVisiblePageNumbers;
                getPageNodeHandler = getPageNode;

                intervalId = window.setInterval(intervalHandler, 100);
            }
        };

        // ---------------------------------------------------------------------

        this.clearRenderCallbacks = function () {
            if (intervalId) {
                window.clearInterval(intervalId);
            }

            getVisiblePageNumbersHandler = getPageNodeHandler = null;
        };

        // methods ------------------------------------------------------------

        /**
         * creates the necessary nodes to render a single PDF page
         *
         * @param {jquery.Node} parentNode
         *  The parent node to be rendered within.
         *
         * @param {Number} pageNumber
         *
         * @param {Number} pageZoom
         *
         * @returns {jquery Promise}
         *  The promise of the rendering function, that is resolved, when rendering is finshed.
         */
        this.createPDFPageNode = function (parentNode, options) {
            var // the jquery parent node
                jqParentNode = $(parentNode),
                options = options || {},
                pageSize = options.pageSize;

            if (!(_.isObject(pageSize) && _.isNumber(pageSize.width) && _.isNumber(pageSize.height))) {
                pageSize = _.isNumber(options.pageNumer) ? pdfDocument.getOriginalPageSize(options.pageNumer) : pdfDocument.getDefaultPageSize();
            }

            if (_.isNumber(options.pageZoom)) {
                pageSize = PDFView.getNormalizedSize({ width: pageSize.width * options.pageZoom, height: pageSize.height * options.pageZoom });
            }

            // set retrieved PDF page size as page node data and append correctly initialized canvas to given page node
            if (_.isObject(pageSize) && _.isNumber(pageSize.width) && _.isNumber(pageSize.height)) {
                var extentAttr = 'width="' + pageSize.width + '" height="' + pageSize.height + '" style="width:' + pageSize.width + 'px; height:' + pageSize.height + 'px"',
                    canvasNode = $('<canvas ' + extentAttr + '>');

                jqParentNode.append(canvasNode);

                if (options.textOverlay) {
                    var textOverlayNode = $('<div class="pdf-textlayer user-select-text" ' + extentAttr + '>');
                    jqParentNode.append(textOverlayNode);
                }
            }

            return pageSize;
        };

        // ---------------------------------------------------------------------

        /**
         * Sets the zoom factor for one or all pages
         *
         * @param {Number} pageZoom
         *  The zoom to set at one or all pages
         *
         * @param {Number} [pageNumber]
         *  The optional 1-based page number of the page to set the zoom for.
         *  If not given, the zoom of all pages is set to the given zoom factor
         *
         *  returns {Number}
         *   The current pageZoom or 1.0, if no zoom has been set before
         */
        this.setPageZoom = function (pageZoom, pageNumber) {
            if (_.isNumber(pageZoom)) {
                ++blockRenderCount;

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
                    }
                }

                --blockRenderCount;
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

            return _.isNumber(pageNumber) ? (curPageData.pageZoom ? curPageData.pageZoom : 1.0) : 1.0;
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
            var pageSize = _.isNumber(pageNumber) ? pdfDocument.getOriginalPageSize(pageNumber) : pdfDocument.getDefaultPageSize(),
                curPageZoom = this.getPageZoom(pageNumber, pageZoom);

            return { width: Math.floor(curPageZoom * pageSize.width), height: Math.floor(curPageZoom * pageSize.height) };
        };

        // ---------------------------------------------------------------------

        /**
         * Renders the PDF page
         *
         * @param {jquery.Node} parentNode
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
                jqParentNode = $(parentNode),
                pagePos = pageNumber - 1;

            // create internal rendering data structure for every page node
            if (!pageData[pagePos]) {
                pageData[pagePos] = {};
            }

            // reset isInRendering flag after rendering is done or in failure case
            def.always( function () {
                if (pageData[pagePos]) {
                    pageData[pagePos].isInRendering = null;
                }
            });

            if (!pageData[pagePos].isInRendering && (jqParentNode.children().length > 0)) {
                var canvas = jqParentNode.children('canvas'),
                    textOverlay = jqParentNode.children('.pdf-textlayer');

                pageData[pagePos].curPageZoom = pageZoom;
                pageData[pagePos].isInRendering = true;

                return pdfDocument.getPDFJSPage(pageNumber).then( function (pdfjsPage) {
                    var viewport = getPageViewport(pdfjsPage, pageZoom),
                        pageSize = PDFView.getNormalizedSize({ width: viewport.width, height: viewport.height }),
                        overlayDeferred = textOverlay ? pdfjsPage.getTextContent() : $.Deferred().resolve(),
                        pdfTextBuilder = null;

                    return overlayDeferred.then( function (textContent) {
                        if (jqParentNode.children().length > 0) {
                            (canvas = jqParentNode.children('canvas')).empty().attr(pageSize).css(pageSize);

                            if (textContent && (textOverlay = jqParentNode.children('.pdf-textlayer'))) {
                                textOverlay.empty().attr(pageSize).css(pageSize);

                                (pdfTextBuilder = new PDFTextLayerBuilder({
                                    textLayerDiv: textOverlay[0],
                                    viewport: viewport,
                                    pageIndex: pageNumber })).setTextContent(textContent);
                            }

                            var canvasCtx = canvas[0].getContext('2d');

                            return pdfjsPage.render({
                                canvasContext: canvasCtx,
                                viewport: viewport,
                                textlayer: pdfTextBuilder
                            }).then( function () {
                                prepareTextLayerForTextSelection(textOverlay);
                                return def.resolve();
                            });
                        } else {
                            return def.reject();
                        }
                    });
                }, function () {
                    return def.reject();
                });
            } else {
                def.reject();
            }

            return def.promise();
        };

    } // class PDFView

    // ---------------------------------------------------------------------

    PDFView.getAdjustedZoom = function (zoom) {
        return (_.isNumber(zoom) ? zoom * DEFAULT_PDFPAGE_SCALING : 1.0);
    };

    // ---------------------------------------------------------------------

    PDFView.getZoom = function (adjustedZoom) {
        return (_.isNumber(adjustedZoom) ? adjustedZoom / DEFAULT_PDFPAGE_SCALING : 1.0);
    };

    // ---------------------------------------------------------------------

    PDFView.getNormalizedSize = function (size) {
        return (size && _.isNumber(size.width) && _.isNumber(size.height)) ?
                { width: Math.floor(size.width), height: Math.floor(size.height) } :
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

    PDFView.setCssAttributeWithPrefixes = (function () {

        var // the prefix for the current browser
            prefix = _.browser.WebKit ? '-webkit-' : _.browser.Firefox ? '-moz-' : _.browser.IE ? '-ms-' : '';

        return function (node, name, value) {
            var object = {};

            object[name] = value;

            if (prefix) {
                object[prefix + name] = value;
            }

            $(node).css(object);
        };
    }());

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
