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

define('io.ox/core/pdf/pdfsimplelinkservice', [
], function () {

    'use strict';

    var SimpleLinkService = (function SimpleLinkServiceClosure() {
        function SimpleLinkService() {}

        SimpleLinkService.prototype = {

            /**
             * @returns {number}
             */
            get pagesCount() {
                return 0;
            },

            /**
             * @param dest - The PDF destination object.
             */
            navigateTo: function (/*dest*/) {
            },

            /**
             * @param dest - The PDF destination object.
             * @returns {string} The hyperlink to the PDF object.
             */
            getDestinationHash: function (/*dest*/) {
                return '#';
            },

            /**
             * @param hash - The PDF parameters/hash.
             * @returns {string} The hyperlink to the PDF object.
             */
            getAnchorUrl: function (/*hash*/) {
                return '#';
            },

            /**
             * @param {string} hash
             */
            setHash: function (/*hash*/) {
            },

            /**
             * @param {string} action
             */
            executeNamedAction: function (/*action*/) {
            },

            /**
             * @param {number} pageNum - page number.
             * @param {Object} pageRef - reference to the page.
             */
            cachePageRef: function (/*pageNum, pageRef*/) {
            }
        };
        return SimpleLinkService;
    })();

    return SimpleLinkService;
});
