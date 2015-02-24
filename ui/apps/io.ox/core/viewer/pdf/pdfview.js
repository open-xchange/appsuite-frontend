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

define('io.ox/core/viewer/pdf/pdfview', [
    'io.ox/core/viewer/util',
    'io.ox/office/baseframework/lib/pdftextlayerbuilder',// TODO move to web repo
    'less!io.ox/core/viewer/pdf/pdfstyle'
], function (Util, PDFTextLayerBuilder) {

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

        var //self = this,

            pageData = [];

        // ---------------------------------------------------------------------

        function getPageViewport(pdfjsPage, pageZoom) {
            return _.isObject(pdfjsPage) ? pdfjsPage.getViewport(PDFView.getAdjustedZoom(pageZoom)) : null;
        }

        // ---------------------------------------------------------------------

        /**
         * prepares all absolute-positioned textelements for textselection
         * by setting zIndex, margin and padding
         */
        function prepareTextLayerForTextSelection(textLayer) {
            if (textLayer !== null) {
                var pageChildren = textLayer.children(),
                    last = null,
                    childrenCount = pageChildren.length,
                    offset = '2em';

                pageChildren.each(function () {
                    if (this.innerHTML.length === 1) {
                        // workaround for infinte height selections
                        Util.setCssAttributeWithPrefixes(this, 'transform', 'scaleX(1)');
                    }

                    if (last) {

                        var myTop = Util.getElementCssLength(this, 'top'),
                            myLeft = Util.getElementCssLength(this, 'left'),
                            lastTop = Util.getElementCssLength(last, 'top'),
                            lastLeft = Util.getElementCssLength(last, 'left'),
                            letter = Util.getElementCssLength(last, 'font-size'),
                            sameLine = Math.abs((myTop + this.offsetHeight) - (lastTop + last.offsetHeight)),
                            signDist = Math.abs(myLeft - (lastLeft + last.offsetWidth)),
                            addit = '';
                        //  contText = Math.abs(Math.min(myLeft - lastLeft, (myLeft + this.offsetWidth) - (lastLeft + last.offsetWidth)));
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
                    if (!Util.IPAD) {
                        this.style.margin = '-' + offset + ' -' + offset + ' 0 -' + offset;
                        this.style.padding = offset + ' ' + offset + ' 0 ' + offset;
                        Util.setCssAttributeWithPrefixes(this, 'transform-origin', offset + ' 0 0');
                    }

                    this.style.zIndex = childrenCount - index;
                });

                textLayer.append('<div style="bottom: 0; right: 0; padding: 200% 0 0 100%; cursor: default;">&#8203;</div>');
            }
        }

        // methods ------------------------------------------------------------

        /**
         * creates the necessary nodes to render a single PDF page
         *
         * @param {jquery node} parentNode
         *  The parent node to be rendered within.
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
                pageSize.width = Math.floor(pageSize.width * options.pageZoom);
                pageSize.height = Math.ceil(pageSize.height * options.pageZoom);
            }

            // set retrieved PDF page size as page node data and append correctly initialized canvas to given page node
            if (_.isObject(pageSize) && _.isNumber(pageSize.width) && _.isNumber(pageSize.height)) {
                var extentAttr = 'width="' + pageSize.width + '" height="' + pageSize.height + '" ' +
                        'style="width:' + pageSize.width + 'px; height:' + pageSize.height + 'px" ';

                jqParentNode.empty().data('page-size', pageSize).attr(pageSize).append($('<canvas class="pdf-page" ' + extentAttr + '>'));

                if (!options.printing) {
                    jqParentNode.append($('<div class="pdf-textlayer user-select-text" ' + extentAttr + '>'));
                }
            }

            return pageSize;
        };

        // ---------------------------------------------------------------------

        /**
         * Renders the PDF page
         *
         * @param {jquery node} parentNode
         *  The parent node to be rendered within.
         * @param {Number} pageNumber
         *
         * @param {Number} pageZoom
         *
         * @returns {jquery Promise}
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
                pageData[pagePos].curPageZoom = pageZoom;
                pageData[pagePos].isInRendering = true;

                var canvas = jqParentNode.children('canvas'),
                    textLayer = jqParentNode.children('.pdf-textlayer');

                return pdfDocument.getPDFJSPagePromise(pageNumber).then( function (pdfjsPage) {
                    var viewport = getPageViewport(pdfjsPage, pageZoom),
                        pageSize = { width: viewport.width, height: viewport.height },
                        pdfTextBuilder = null;

                    jqParentNode.data('page-zoom', pageZoom);

                    return pdfjsPage.getTextContent().then( function (textContent) {
                        if (jqParentNode.children().length > 0) {
                            (canvas = jqParentNode.children('canvas')).empty().attr(pageSize).css(pageSize);

                            if (textContent && ((textLayer = jqParentNode.children('.pdf-textlayer') !== null))) {
                                textLayer.empty().attr(pageSize).css(pageSize);
                                (pdfTextBuilder = new PDFTextLayerBuilder({
                                    textLayerDiv: textLayer[0],
                                    viewport: viewport,
                                    pageIndex: pageNumber
                                })).setTextContent(textContent);
                            }

                            return pdfjsPage.render({
                                canvasContext: canvas[0].getContext('2d'),
                                viewport: viewport,
                                textlayer: pdfTextBuilder
                            }).then( function () {
                                prepareTextLayerForTextSelection(textLayer);
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

    // exports ================================================================

    // derive this class from class BaseModel
    return _.makeExtendable(PDFView);
});
