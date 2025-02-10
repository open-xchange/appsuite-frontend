/* eslint-disable license-header/header */
/* -*- Mode: Java; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define('io.ox/core/pdf/pdftextlayerbuilder', [
    'io.ox/core/pdf/pdfpolyfill',
    'io.ox/core/pdf/pdfcustomstyle',
    // 'pdfjs-dist/build/pdf'
    'io.ox/core/pdf/esmloader!pdfjs-dist/build/pdf'
    // 'pdfjs-dist/build/pdf.worker'
], function (Polyfill, CustomStyle, PDFJSLib) {

    'use strict';

    /*
     * var CSS_UNITS = 96.0 / 72.0; var DEFAULT_SCALE = 'auto'; var
     * UNKNOWN_SCALE = 0; var MAX_AUTO_SCALE = 1.25; var
     * SCROLLBAR_PADDING = 40; var VERTICAL_PADDING = 5;
     */

    /*
     * TODO (KA) rmeove? function getFileName(url) { var anchor =
     * url.indexOf('#'); var query = url.indexOf('?'); var end =
     * Math.min( anchor > 0 ? anchor : url.length, query > 0 ? query :
     * url.length); return url.substring(url.lastIndexOf('/', end) + 1,
     * end); }
     */

    /**
     * Returns scale factor for the canvas. It makes sense for the HiDPI
     * displays.
     *
     * @return {Object} The object with horizontal (sx) and vertical
     *         (sy) scales. The scaled property is set to false if
     *         scaling is not required, true otherwise.
     */
    /*
     * TODO (KA) rmeove? function getOutputScale(ctx) { var
     * devicePixelRatio = window.devicePixelRatio || 1; var
     * backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
     * ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio ||
     * ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
     * var pixelRatio = devicePixelRatio / backingStoreRatio; return {
     * sx: pixelRatio, sy: pixelRatio, scaled: pixelRatio !== 1 }; }
     */

    /**
     * Use binary search to find the index of the first item in a given
     * array which passes a given condition. The items are expected to
     * be sorted in the sense that if the condition is true for one item
     * in the array, then it is also true for all following items.
     *
     * @returns {Number} Index of the first array element to pass the
     *          test, or |items.length| if no such element exists.
     */
    /*
     * TODO (KA) rmeove? function binarySearchFirstItem(items,
     * condition) { var minIndex = 0; var maxIndex = items.length - 1;
     *
     * if (items.length === 0 || !condition(items[maxIndex])) { return
     * items.length; } if (condition(items[minIndex])) { return
     * minIndex; }
     *
     * while (minIndex < maxIndex) { var currentIndex = (minIndex +
     * maxIndex) >> 1; var currentItem = items[currentIndex]; if
     * (condition(currentItem)) { maxIndex = currentIndex; } else {
     * minIndex = currentIndex + 1; } } return minIndex; }
     */

    /**
     * Generic helper to find out what elements are visible within a
     * scroll pane.
     */
    /*
     * TODO (KA) rmeove? function getVisibleElements(scrollEl, views,
     * sortByVisibility) { var top = scrollEl.scrollTop, bottom = top +
     * scrollEl.clientHeight; var left = scrollEl.scrollLeft, right =
     * left + scrollEl.clientWidth;
     *
     * function isElementBottomBelowViewTop(view) { var element =
     * view.div; var elementBottom = element.offsetTop +
     * element.clientTop + element.clientHeight; return elementBottom >
     * top; }
     *
     * var visible = [], view, element; var currentHeight, viewHeight,
     * hiddenHeight, percentHeight; var currentWidth, viewWidth; var
     * firstVisibleElementInd = (views.length === 0) ? 0 :
     * binarySearchFirstItem(views, isElementBottomBelowViewTop);
     *
     * for (var i = firstVisibleElementInd, ii = views.length; i < ii;
     * i++) { view = views[i]; element = view.div; currentHeight =
     * element.offsetTop + element.clientTop; viewHeight =
     * element.clientHeight;
     *
     * if (currentHeight > bottom) { break; }
     *
     * currentWidth = element.offsetLeft + element.clientLeft; viewWidth =
     * element.clientWidth; if (currentWidth + viewWidth < left ||
     * currentWidth > right) { continue; } hiddenHeight = Math.max(0,
     * top - currentHeight) + Math.max(0, currentHeight + viewHeight -
     * bottom); percentHeight = ((viewHeight - hiddenHeight) * 100 /
     * viewHeight) | 0;
     *
     * visible.push({ id: view.id, x: currentWidth, y: currentHeight,
     * view: view, percent: percentHeight }); }
     *
     * var first = visible[0]; var last = visible[visible.length - 1];
     *
     * if (sortByVisibility) { visible.sort(function(a, b) { var pc =
     * a.percent - b.percent; if (Math.abs(pc) > 0.001) { return -pc; }
     * return a.id - b.id; // ensure stability }); } return {first:
     * first, last: last, views: visible}; }
     */

    /**
     * Event handler to suppress context menu.
     */

    /*
     * TODO (KA) rmeove? function noContextMenuHandler(e) {
     * e.preventDefault(); }
     */

    /**
     * Returns the filename or guessed filename from the url (see issue
     * 3455). url {String} The original PDF location.
     *
     * @return {String} Guessed PDF file name.
     */
    /*
     * TODO (KA) rmeove? function getPDFFileNameFromURL(url) { var reURI =
     * /^(?:([^:]+:)?\/\/[^\/]+)?([^?#]*)(\?[^#]*)?(#.*)?$/; // SCHEME
     * HOST 1.PATH 2.QUERY 3.REF // Pattern to get last matching
     * NAME.pdf var reFilename = /[^\/?#=]+\.pdf\b(?!.*\.pdf\b)/i; var
     * splitURI = reURI.exec(url); var suggestedFilename =
     * reFilename.exec(splitURI[1]) || reFilename.exec(splitURI[2]) ||
     * reFilename.exec(splitURI[3]); if (suggestedFilename) {
     * suggestedFilename = suggestedFilename[0]; if
     * (suggestedFilename.indexOf('%') !== -1) { // URL-encoded
     * %2Fpath%2Fto%2Ffile.pdf should be file.pdf try {
     * suggestedFilename =
     * reFilename.exec(decodeURIComponent(suggestedFilename))[0]; }
     * catch(e) { // Possible (extremely rare) errors: // URIError
     * "Malformed URI", e.g. for "%AA.pdf" // TypeError "null has no
     * properties", e.g. for "%2F.pdf" } } } return suggestedFilename ||
     * 'document.pdf'; }
     */

    /*
     * TODO (KA) rmeove? var ProgressBar = (function
     * ProgressBarClosure() {
     *
     * function clamp(v, min, max) { return Math.min(Math.max(v, min),
     * max); }
     *
     * function ProgressBar(id, opts) { this.visible = true; // Fetch
     * the sub-elements for later. this.div = document.querySelector(id + '
     * .progress'); // Get the loading bar element, so it can be resized
     * to fit the viewer. this.bar = this.div.parentNode; // Get
     * options, with sensible defaults. this.height = opts.height ||
     * 100; this.width = opts.width || 100; this.units = opts.units ||
     * '%'; // Initialize heights. this.div.style.height = this.height +
     * this.units; this.percent = 0; }
     *
     * ProgressBar.prototype = {
     *
     * updateBar: function ProgressBar_updateBar() { if
     * (this._indeterminate) { this.div.classList.add('indeterminate');
     * this.div.style.width = this.width + this.units; return; }
     *
     * this.div.classList.remove('indeterminate'); var progressSize =
     * this.width * this._percent / 100; this.div.style.width =
     * progressSize + this.units; },
     *
     * get percent() { return this._percent; },
     *
     * set percent(val) { this._indeterminate = isNaN(val);
     * this._percent = clamp(val, 0, 100); this.updateBar(); },
     *
     * setWidth: function ProgressBar_setWidth(viewer) { if (viewer) {
     * var container = viewer.parentNode; var scrollbarWidth =
     * container.offsetWidth - viewer.offsetWidth; if (scrollbarWidth >
     * 0) { this.bar.setAttribute('style', 'width: calc(100% - ' +
     * scrollbarWidth + 'px);'); } } },
     *
     * hide: function ProgressBar_hide() { if (!this.visible) { return; }
     * this.visible = false; this.bar.classList.add('hidden');
     * document.body.classList.remove('loadingInProgress'); },
     *
     * show: function ProgressBar_show() { if (this.visible) { return; }
     * this.visible = true;
     * document.body.classList.add('loadingInProgress');
     * this.bar.classList.remove('hidden'); } };
     *
     * return ProgressBar; })();
     */

    // --------------------------
    // - PDFTextLayerBuilder.js -
    // --------------------------

    var MAX_TEXT_DIVS_TO_RENDER = 100000;

    var NonWhitespaceRegexp = /\S/;

    function isAllWhitespace(str) {
        return !NonWhitespaceRegexp.test(str);
    }

    /**
     * @typedef {Object} TextLayerBuilderOptions
     * @property {HTMLDivElement} textLayerDiv - The text layer
     *           container.
     * @property {number} pageIndex - The page index.
     * @property {PageViewport} viewport - The viewport of the text
     *           layer.
     * @property {PDFFindController} findController
     */

    /**
     * TextLayerBuilder provides text-selection functionality for the
     * PDF. It does this by creating overlay divs over the PDF text.
     * These divs contain text that matches the PDF text they are
     * overlaying. This object also provides a way to highlight text
     * that is being searched for.
     *
     * @class
     */
    var TextLayerBuilder = (function TextLayerBuilderClosure() {
        function TextLayerBuilder(options) {
            this.textLayerDiv = options.textLayerDiv;
            this.renderingDone = false;
            this.divContentDone = false;
            this.pageIdx = options.pageIndex;
            this.pageNumber = this.pageIdx + 1;
            this.matches = [];
            this.viewport = options.viewport;
            this.textDivs = [];
            this.findController = options.findController || null;
        }

        TextLayerBuilder.prototype = {
            _finishRendering: function TextLayerBuilder_finishRendering() {
                this.renderingDone = true;

                var event = document.createEvent('CustomEvent');
                event.initCustomEvent('textlayerrendered', true, true, {
                    pageNumber: this.pageNumber
                });
                this.textLayerDiv.dispatchEvent(event);
            },

            renderLayer: function TextLayerBuilder_renderLayer() {
                var textLayerFrag = document.createDocumentFragment();
                var textDivs = this.textDivs;
                var textDivsLength = textDivs.length;
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');

                // No point in rendering many divs as it would make the
                // browser
                // unusable even after the divs are rendered.
                if (textDivsLength > MAX_TEXT_DIVS_TO_RENDER) {
                    this._finishRendering();
                    return;
                }

                var lastFontSize;
                var lastFontFamily;
                for (var i = 0; i < textDivsLength; i++) {
                    var textDiv = textDivs[i];
                    if (textDiv.dataset.isWhitespace !== undefined) {
                        continue;
                    }

                    var fontSize = textDiv.style.fontSize;
                    var fontFamily = textDiv.style.fontFamily;

                    // Only build font string and set to context if
                    // different from last.
                    if (fontSize !== lastFontSize || fontFamily !== lastFontFamily) {
                        ctx.font = fontSize + ' ' + fontFamily;
                        lastFontSize = fontSize;
                        lastFontFamily = fontFamily;
                    }

                    var width = ctx.measureText(textDiv.textContent).width;
                    if (width > 0) {
                        textLayerFrag.appendChild(textDiv);
                        var transform;
                        if (textDiv.dataset.canvasWidth !== undefined) {
                            // Dataset values come of type string.
                            var textScale = textDiv.dataset.canvasWidth / width;
                            transform = 'scaleX(' + textScale + ')';
                        } else {
                            transform = '';
                        }
                        var rotation = textDiv.dataset.angle;
                        if (rotation) {
                            transform = 'rotate(' + rotation + 'deg) ' + transform;
                        }
                        if (transform) {
                            CustomStyle.setProp('transform', textDiv, transform);
                        }
                    }
                }

                this.textLayerDiv.appendChild(textLayerFrag);
                this._finishRendering();
                this.updateMatches();
            },

            /**
             * Renders the text layer.
             *
             * @param {number}
             *            timeout (optional) if specified, the rendering
             *            waits for specified amount of ms.
             */
            render: function TextLayerBuilder_render(timeout) {
                if (!this.divContentDone || this.renderingDone) {
                    return;
                }

                if (this.renderTimer) {
                    clearTimeout(this.renderTimer);
                    this.renderTimer = null;
                }

                if (!timeout) { // Render right away
                    this.renderLayer();
                } else { // Schedule
                    var self = this;
                    this.renderTimer = setTimeout(function () {
                        self.renderLayer();
                        self.renderTimer = null;
                    }, timeout);
                }
            },

            appendText: function TextLayerBuilder_appendText(geom, styles) {
                var style = styles[geom.fontName];
                var textDiv = document.createElement('div');
                this.textDivs.push(textDiv);
                if (isAllWhitespace(geom.str)) {
                    textDiv.dataset.isWhitespace = true;
                    return;
                }
                var tx = PDFJSLib.Util.transform(this.viewport.transform, geom.transform);
                var angle = Math.atan2(tx[1], tx[0]);
                if (style.vertical) {
                    angle += Math.PI / 2;
                }
                var fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
                var fontAscent = fontHeight;
                if (style.ascent) {
                    fontAscent = style.ascent * fontAscent;
                } else if (style.descent) {
                    fontAscent = (1 + style.descent) * fontAscent;
                }

                var left;
                var top;
                if (angle === 0) {
                    left = tx[4];
                    top = tx[5] - fontAscent;
                } else {
                    left = tx[4] + (fontAscent * Math.sin(angle));
                    top = tx[5] - (fontAscent * Math.cos(angle));
                }
                textDiv.style.left = left + 'px';
                textDiv.style.top = top + 'px';
                textDiv.style.fontSize = fontHeight + 'px';
                textDiv.style.fontFamily = style.fontFamily;

                textDiv.textContent = geom.str;
                // |fontName| is only used by the Font Inspector. This
                // test will succeed
                // when e.g. the Font Inspector is off but the Stepper
                // is on, but it's
                // not worth the effort to do a more accurate test.
                if (PDFJSLib.pdfBug) {
                    textDiv.dataset.fontName = geom.fontName;
                }
                // Storing into dataset will convert number into string.
                if (angle !== 0) {
                    textDiv.dataset.angle = angle * (180 / Math.PI);
                }
                // We don't bother scaling single-char text divs,
                // because it has very
                // little effect on text highlighting. This makes
                // scrolling on docs with
                // lots of such divs a lot faster.
                if (textDiv.textContent.length > 1) {
                    if (style.vertical) {
                        textDiv.dataset.canvasWidth = geom.height * this.viewport.scale;
                    } else {
                        textDiv.dataset.canvasWidth = geom.width * this.viewport.scale;
                    }
                }
            },

            setTextContent: function TextLayerBuilder_setTextContent(textContent) {
                this.textContent = textContent;

                var textItems = textContent.items;
                for (var i = 0, len = textItems.length; i < len; i++) {
                    this.appendText(textItems[i], textContent.styles);
                }
                this.divContentDone = true;
            },

            convertMatches: function TextLayerBuilder_convertMatches(matches) {
                var i = 0;
                var iIndex = 0;
                var bidiTexts = this.textContent.items;
                var end = bidiTexts.length - 1;
                var queryLen = (this.findController === null ? 0
                    : this.findController.state.query.length);
                var ret = [];

                for (var m = 0, len = matches.length; m < len; m++) {
                    // Calculate the start position.
                    var matchIdx = matches[m];

                    // Loop over the divIdxs.
                    while (i !== end && matchIdx >= (iIndex + bidiTexts[i].str.length)) {
                        iIndex += bidiTexts[i].str.length;
                        i++;
                    }

                    if (i === bidiTexts.length) {
                        console.error('Could not find a matching mapping');
                    }

                    var match = {
                        begin: {
                            divIdx: i,
                            offset: matchIdx - iIndex
                        }
                    };

                    // Calculate the end position.
                    matchIdx += queryLen;

                    // Somewhat the same array as above, but use >
                    // instead of >= to get
                    // the end position right.
                    while (i !== end && matchIdx > (iIndex + bidiTexts[i].str.length)) {
                        iIndex += bidiTexts[i].str.length;
                        i++;
                    }

                    match.end = {
                        divIdx: i,
                        offset: matchIdx - iIndex
                    };
                    ret.push(match);
                }

                return ret;
            },

            renderMatches: function TextLayerBuilder_renderMatches(matches) {
                // Early exit if there is nothing to render.
                if (matches.length === 0) {
                    return;
                }

                var bidiTexts = this.textContent.items;
                var textDivs = this.textDivs;
                var prevEnd = null;
                var pageIdx = this.pageIdx;
                var isSelectedPage = (this.findController === null ? false
                    : (pageIdx === this.findController.selected.pageIdx));
                var selectedMatchIdx = (this.findController === null ? -1
                    : this.findController.selected.matchIdx);
                var highlightAll = (this.findController === null ? false
                    : this.findController.state.highlightAll);
                var infinity = {
                    divIdx: -1,
                    offset: undefined
                };

                function beginText(begin, className) {
                    var divIdx = begin.divIdx;
                    textDivs[divIdx].textContent = '';
                    appendTextToDiv(divIdx, 0, begin.offset, className);
                }

                function appendTextToDiv(divIdx, fromOffset, toOffset, className) {
                    var div = textDivs[divIdx];
                    var content = bidiTexts[divIdx].str.substring(
                        fromOffset, toOffset);
                    var node = document.createTextNode(content);
                    if (className) {
                        var span = document.createElement('span');
                        span.className = className;
                        span.appendChild(node);
                        div.appendChild(span);
                        return;
                    }
                    div.appendChild(node);
                }

                var i0 = selectedMatchIdx, i1 = i0 + 1;
                if (highlightAll) {
                    i0 = 0;
                    i1 = matches.length;
                } else if (!isSelectedPage) {
                    // Not highlighting all and this isn't the selected
                    // page, so do nothing.
                    return;
                }

                for (var i = i0; i < i1; i++) {
                    var match = matches[i];
                    var begin = match.begin;
                    var end = match.end;
                    var isSelected = (isSelectedPage && i === selectedMatchIdx);
                    var highlightSuffix = (isSelected ? ' selected'
                        : '');

                    if (this.findController) {
                        this.findController.updateMatchPosition(
                            pageIdx, i, textDivs, begin.divIdx,
                            end.divIdx);
                    }

                    // Match inside new div.
                    if (!prevEnd || begin.divIdx !== prevEnd.divIdx) {
                        // If there was a previous div, then add the
                        // text at the end.
                        if (prevEnd !== null) {
                            appendTextToDiv(prevEnd.divIdx,
                                prevEnd.offset, infinity.offset);
                        }
                        // Clear the divs and set the content until the
                        // starting point.
                        beginText(begin);
                    } else {
                        appendTextToDiv(prevEnd.divIdx, prevEnd.offset,
                            begin.offset);
                    }

                    if (begin.divIdx === end.divIdx) {
                        appendTextToDiv(begin.divIdx, begin.offset,
                            end.offset, 'highlight' + highlightSuffix);
                    } else {
                        appendTextToDiv(begin.divIdx, begin.offset,
                            infinity.offset, 'highlight begin' + highlightSuffix);
                        for (var n0 = begin.divIdx + 1, n1 = end.divIdx; n0 < n1; n0++) {
                            textDivs[n0].className = 'highlight middle' + highlightSuffix;
                        }
                        beginText(end, 'highlight end' + highlightSuffix);
                    }
                    prevEnd = end;
                }

                if (prevEnd) {
                    appendTextToDiv(prevEnd.divIdx, prevEnd.offset, infinity.offset);
                }
            },

            updateMatches: function TextLayerBuilder_updateMatches() {
                // Only show matches when all rendering is done.
                if (!this.renderingDone) {
                    return;
                }

                // Clear all matches.
                var matches = this.matches;
                var textDivs = this.textDivs;
                var bidiTexts = this.textContent.items;
                var clearedUntilDivIdx = -1;

                // Clear all current matches.
                for (var i = 0, len = matches.length; i < len; i++) {
                    var match = matches[i];
                    var begin = Math.max(clearedUntilDivIdx, match.begin.divIdx);
                    for (var n = begin, end = match.end.divIdx; n <= end; n++) {
                        var div = textDivs[n];
                        div.textContent = bidiTexts[n].str;
                        div.className = '';
                    }
                    clearedUntilDivIdx = match.end.divIdx + 1;
                }

                if (this.findController === null || !this.findController.active) {
                    return;
                }

                // Convert the matches on the page controller into the
                // match format
                // used for the textLayer.
                this.matches = this.convertMatches(this.findController.pageMatches[this.pageIdx] || []);
                this.renderMatches(this.matches);
            }
        };
        return TextLayerBuilder;
    })();

    return TextLayerBuilder;
});
