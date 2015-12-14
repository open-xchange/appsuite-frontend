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

/* globals Promise */

define('io.ox/core/pdf/pdfviewerlinkservice', [
], function () {

    'use strict';

    /**
     * Helper function to parse query string (e.g. ?param1=value&parm2=...).
     */
    function parseQueryString(query) {
        var parts = query.split('&');
        var params = {};
        for (var i = 0, ii = parts.length; i < ii; ++i) {
            var param = parts[i].split('=');
            var key = param[0].toLowerCase();
            var value = param.length > 1 ? param[1] : null;
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
        return params;
    }

    /**
     * Performs navigation functions inside PDF, such as opening specified page,
     * or destination.
     * @class
     * @implements {IPDFLinkService}
     */
    var PDFViewerLinkService = (function () {
        /**
         * @constructs PDFViewerLinkService
         */
        function PDFViewerLinkService(options) {
            options = options || {};
            this.baseUrl = options.baseUrl || null;
            this.pdfDocument = options.pdfDocument || null;
            this.pdfHistory = options.pdfHistory || null;
            this.eventHub = options.eventHub || null;

            this._pagesRefCache = (this.pdfDocument) ? Object.create(null) : null;
        }

        PDFViewerLinkService.prototype = {
            setDocument: function PDFViewerLinkService_setDocument(pdfDocument, baseUrl) {
                this.baseUrl = baseUrl;
                this.pdfDocument = pdfDocument;
                this._pagesRefCache = Object.create(null);
            },

            setHistory: function PDFViewerLinkService_setHistory(pdfHistory) {
                this.pdfHistory = pdfHistory;
            },

            setEventHub: function PDFViewerLinkService_setEventHub(eventHub) {
                this.eventHub = eventHub;
            },

            /**
             * @returns {number}
             */
            get pagesCount() {
                return this.pdfDocument.numPages;
            },

            /**
             * @param dest - The PDF destination object.
             */
            navigateTo: function PDFViewerLinkService_navigateTo(dest) {
                var destString = '';
                var self = this;

                var goToDestination = function (destRef) {
                    // dest array looks like that: <page-ref> </XYZ|FitXXX> <args..>
                    var pageNumber = destRef instanceof Object ?
                            self._pagesRefCache[destRef.num + ' ' + destRef.gen + ' R'] : (destRef + 1);

                    if (pageNumber) {
                        self.scrollPageIntoView(pageNumber, dest);

                        if (self.pdfHistory) {
                            // Update the browsing history.
                            self.pdfHistory.push({
                                dest: dest,
                                hash: destString,
                                page: pageNumber
                            });
                        }
                    } else {
                        self.pdfDocument.getPageIndex(destRef).then(function (pageIndex) {
                            var pageNum = pageIndex + 1;
                            var cacheKey = destRef.num + ' ' + destRef.gen + ' R';
                            self._pagesRefCache[cacheKey] = pageNum;
                            goToDestination(destRef);
                        });
                    }
                };

                var destinationPromise;
                if (typeof dest === 'string') {
                    destString = dest;
                    destinationPromise = this.pdfDocument.getDestination(dest);
                } else {
                    destinationPromise = Promise.resolve(dest);
                }
                destinationPromise.then(function (destination) {
                    dest = destination;
                    if (!(destination instanceof Array)) {
                        return; // invalid destination
                    }
                    goToDestination(destination[0]);
                });
            },

            /**
             * @param dest - The PDF destination object.
             * @returns {string} The hyperlink to the PDF object.
             */
            getDestinationHash: function PDFViewerLinkService_getDestinationHash(dest) {

                if (typeof dest === 'string') {
                    return this.getAnchorUrl('#' + encodeURIComponent(dest));
                }
                if (dest instanceof Array) {
                    var destRef = dest[0]; // see navigateTo method for dest format
                    var pageNumber = destRef instanceof Object ?
                            this._pagesRefCache[destRef.num + ' ' + destRef.gen + ' R'] : (destRef + 1);

                    if (pageNumber) {
                        var pdfOpenParams = this.getAnchorUrl('#page=' + pageNumber);
                        var destKind = dest[1];
                        if (typeof destKind === 'object' && 'name' in destKind && destKind.name === 'XYZ') {

                            //var scale = (dest[4] || this.pdfViewer.currentScaleValue);
                            var scale = (dest[4] || 1); // default to 100%

                            var scaleNumber = parseFloat(scale);
                            if (scaleNumber) {
                                scale = scaleNumber * 100;
                            }
                            pdfOpenParams += '&zoom=' + scale;
                            if (dest[2] || dest[3]) {
                                pdfOpenParams += ',' + (dest[2] || 0) + ',' + (dest[3] || 0);
                            }
                        }
                        return pdfOpenParams;
                    }
                }
                return '';
            },

            /**
             * Prefix the full url on anchor links to make sure that links are resolved
             * relative to the current URL instead of the one defined in <base href>.
             * @param {String} anchor The anchor hash, including the #.
             * @returns {string} The hyperlink to the PDF object.
             */
            getAnchorUrl: function PDFViewerLinkService_getAnchorUrl(anchor) {
                return (this.baseUrl || '') + anchor;
            },

            /**
             * @param {string} hash
             */
            setHash: function PDFViewerLinkService_setHash(hash) {

                if (hash.indexOf('=') >= 0) {
                    var params = parseQueryString(hash);
                    // borrowing syntax from "Parameters for Opening PDF Files"
                    if ('nameddest' in params) {
                        if (this.pdfHistory) {
                            this.pdfHistory.updateNextHashParam(params.nameddest);
                        }
                        this.navigateTo(params.nameddest);
                        return;
                    }
                    var pageNumber, dest;
                    if ('page' in params) {
                        pageNumber = (params.page | 0) || 1;
                    }
                    if ('zoom' in params) {
                        // Build the destination array.
                        var zoomArgs = params.zoom.split(','); // scale,left,top
                        var zoomArg = zoomArgs[0];
                        var zoomArgNumber = parseFloat(zoomArg);

                        if (zoomArg.indexOf('Fit') === -1) {
                            // If the zoomArg is a number, it has to get divided by 100. If it's
                            // a string, it should stay as it is.
                            dest = [null, { name: 'XYZ' },
                                    zoomArgs.length > 1 ? (zoomArgs[1] | 0) : null,
                                            zoomArgs.length > 2 ? (zoomArgs[2] | 0) : null,
                                                    (zoomArgNumber ? zoomArgNumber / 100 : zoomArg)];
                        } else if (zoomArg === 'Fit' || zoomArg === 'FitB') {
                            dest = [null, { name: zoomArg }];
                        } else if ((zoomArg === 'FitH' || zoomArg === 'FitBH') ||
                                (zoomArg === 'FitV' || zoomArg === 'FitBV')) {
                            dest = [null, { name: zoomArg },
                                    zoomArgs.length > 1 ? (zoomArgs[1] | 0) : null];
                        } else if (zoomArg === 'FitR') {
                            if (zoomArgs.length !== 5) {
                                console.error('PDFViewerLinkService_setHash: ' + 'Not enough parameters for \'FitR\'.');
                            } else {
                                dest = [null, { name: zoomArg },
                                        (zoomArgs[1] | 0), (zoomArgs[2] | 0),
                                        (zoomArgs[3] | 0), (zoomArgs[4] | 0)];
                            }
                        } else {
                            console.error('PDFViewerLinkService_setHash: \'' + zoomArg + '\' is not a valid zoom value.');
                        }
                    }

                    if (pageNumber || dest) {
                        this.scrollPageIntoView(pageNumber, dest);
                    }

                    if ('pagemode' in params) {
                        if (params.pagemode === 'thumbs' || params.pagemode === 'bookmarks' ||
                                params.pagemode === 'attachments') {
                            this.switchSidebarView((params.pagemode === 'bookmarks' ? 'outline' : params.pagemode), true);
                        } else if (params.pagemode === 'none' && this.sidebarOpen) {
                            document.getElementById('sidebarToggle').click();
                        }
                    }
                } else if (/^\d+$/.test(hash)) { // page number
                    this.scrollPageIntoView(hash);

                } else { // named destination
                    if (this.pdfHistory) {
                        this.pdfHistory.updateNextHashParam(decodeURIComponent(hash));
                    }
                    this.navigateTo(decodeURIComponent(hash));
                }
            },

            /**
             * @param {string} action
             */
            executeNamedAction: function PDFViewerLinkService_executeNamedAction(action) {
                // See PDF reference, table 8.45 - Named action
                switch (action) {
                    case 'GoBack':
                        if (this.pdfHistory) this.pdfHistory.back();
                        break;

                    case 'GoForward':
                        if (this.pdfHistory) this.pdfHistory.forward();
                        break;

                    case 'NextPage':
                        this.eventHub.trigger('viewer:document:next');
                        break;

                    case 'PrevPage':
                        this.eventHub.trigger('viewer:document:previous');
                        break;

                    case 'LastPage':
                        this.eventHub.trigger('viewer:document:last');
                        break;

                    case 'FirstPage':
                        this.eventHub.trigger('viewer:document:first');
                        break;

                    case 'Print':
                        this.eventHub.trigger('viewer:document:print');
                        break;

                    default:
                        break; // No action according to spec
                }
            },

            /**
             * @param {number} pageNum - page number.
             * @param {Object} pageRef - reference to the page.
             */
            cachePageRef: function PDFViewerLinkService_cachePageRef(pageNum, pageRef) {
                var refStr = pageRef.num + ' ' + pageRef.gen + ' R';
                this._pagesRefCache[refStr] = pageNum;
            },

            /**
             * Scrolls page into view.
             * @param {number} pageNumber
             * @param {Array} dest - (optional) original PDF destination array:
             *   <page-ref> </XYZ|FitXXX> <args..>
             */
            scrollPageIntoView: function PDFViewerLinkService_scrollPageIntoView(pageNumber, dest) {

                if (!_.isNumber(pageNumber)) {
                    pageNumber = dest instanceof Object ? this._pagesRefCache[dest.num + ' ' + dest.gen + ' R'] : (dest + 1);
                }

                if (_.isNumber(pageNumber)) {
                    pageNumber = Math.min(Math.max(pageNumber, 1), this.pagesCount);
                    this.eventHub.trigger('viewer:document:scrolltopage', pageNumber);
                }
            }
        };

        return PDFViewerLinkService;
    })();

    return PDFViewerLinkService;
});
