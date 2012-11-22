/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

var vows = require("vows");
var assert = require("assert");

var utils = require("../lib/build/fileutils");

vows.describe("Merge of two arrays").addBatch({
    "single insert": {
        topic: utils.mergeArrays([1, 3], [2]),
        "should find the right place":
            function(topic) { assert.deepEqual(topic, [1, 2, 3]); }
    },
    "duplicates": {
        topic: utils.mergeArrays([1, 2], [2]),
        "should be eliminated":
            function(topic) { assert.deepEqual(topic, [1, 2]); }
    },
    "multple insert": {
        topic: utils.mergeArrays([1, 3], [2, 4]),
        "should keep sort order":
            function(topic) { assert.deepEqual(topic, [1, 2, 3, 4]); }
    },
    "custom function": {
        topic: utils.mergeArrays([3, 1], [4, 2],
                                 function(x, y) { return y - x; }),
        "should be used if specified":
            function(topic) { assert.deepEqual(topic, [4, 3, 2, 1]); }
    }
}).export(module);