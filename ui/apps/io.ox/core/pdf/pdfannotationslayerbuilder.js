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

define('io.ox/core/pdf/pdfannotationslayerbuilder', [
    'io.ox/core/pdf/pdfpolyfill',
    'io.ox/core/pdf/pdfsimplelinkservice',
    'io.ox/core/pdf/esmloader!pdfjs-dist/build/pdf'
    // 'pdfjs-dist/build/pdf.worker'
], function (Polyfill, SimpleLinkService, PDFJSLib) {

    'use strict';

    var mozL10n = document.mozL10n || document.webL10n;

    /**
     * @typedef {Object} AnnotationsLayerBuilderOptions
     * @property {HTMLDivElement} pageDiv
     * @property {PDFPage} pdfPage
     * @property {IPDFLinkService} linkService
     */

    /**
     * @class
     */
    var AnnotationLayerBuilder = (function AnnotationLayerBuilderClosure() {
        /**
         * @param {AnnotationLayerBuilderOptions} options
         * @constructs AnnotationLayerBuilder
         */
        function AnnotationLayerBuilder(options) {
            this.pageDiv = options.pageDiv;
            this.pdfPage = options.pdfPage;
            this.linkService = options.linkService || new SimpleLinkService();

            this.div = null;
        }

        AnnotationLayerBuilder.prototype = /** @lends AnnotationLayerBuilder.prototype */ {

            /**
             * @param {PageViewport} viewport
             * @param {String} intent (default value is 'display')
             */
            render: function AnnotationLayerBuilder_render(viewport, intent) {
                var self = this;
                var parameters = {
                    intent: (intent === undefined ? 'display' : intent)
                };

                this.pdfPage.getAnnotations(parameters).then(function (annotations) {
                    var alayer;
                    // TODO update does not work like this, need to find a solution
                    if (self.div) {
                        // If an annotationLayer already exists, refresh its children's
                        // transformation matrices.
                        alayer.update(parameters);
                    } else {
                        // Create an annotation layer div and render the annotations
                        // if there is at least one annotation.
                        if (annotations.length === 0) {
                            return;
                        }

                        viewport = viewport.clone({ dontFlip: true });
                        self.div = document.createElement('div');
                        self.div.className = 'annotationLayer';
                        self.pageDiv.appendChild(self.div);
                        parameters.div = self.div;

                        parameters = {
                            viewport: viewport,
                            div: self.div,
                            annotations: annotations,
                            page: self.pdfPage,
                            linkService: self.linkService,
                            // Path for image resources, mainly for annotation icons. Include trailing slash.
                            imageResourcesPath: ox.abs + ox.root + '/apps/pdfjs-dist/web/images/'
                        };
                        alayer = new PDFJSLib.AnnotationLayer({
                            div: self.div, //                         div: self.pageDiv,
                            page: self.pdfPage,
                            viewport: viewport
                        });

                        // self.div = document.createElement('div');
                        // self.div.className = 'annotationLayer';
                        // self.pageDiv.appendChild(self.div);
                        // parameters.div = self.div;

                        alayer.render(parameters);
                        if (typeof mozL10n !== 'undefined') {
                            mozL10n.translate(self.div);
                        }
                    }
                });
            },

            hide: function AnnotationLayerBuilder_hide() {
                if (!this.div) {
                    return;
                }
                this.div.setAttribute('hidden', 'true');
            }
        };

        return AnnotationLayerBuilder;
    })();

    return AnnotationLayerBuilder;
});
