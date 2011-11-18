/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2009 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/autocomplete', function () {

    'use strict';

    var popup = $('<div>').addClass('autocomplete-popup');

    $.fn.autocomplete = function (o) {

        o = $.extend({
            minLength: 2,
            delay: 200,
            source: null,
            draw: null,
            toString: JSON.stringify
        }, o || {});

        var self = $(this),

            // last search
            lastValue = '',
            // no-results prefix
            emptyPrefix = "\u0000",
            // current search result index
            index = -1,
            // state
            isOpen = false,

            update = function () {
                // get data from current item and update input field
                var data = popup.children().eq(index).data('data');
                lastValue = o.toString(data) + '';
                self.val(lastValue);
            },

            select = function (i) {
                    var children;
                    if (i >= 0 && i < (children = popup.children()).length) {
                        children.removeClass('selected')
                            .eq(i).addClass('selected');
                        index = i;
                        update();
                    }
                },

            open = function () {
                    if (!isOpen) {
                        // calculate position/dimension and show popup
                        var o = self.offset(),
                            w = self.outerWidth(),
                            h = self.outerHeight();
                        popup.css({ top: o.top + h, left: o.left, width: w })
                            .appendTo('body');
                        isOpen = true;
                    }
                },

            close = function () {
                    if (isOpen) {
                        popup.empty().detach();
                        isOpen = false;
                        index = -1;
                    }
                },

            fnSelectItem = function (e) {
                    e.preventDefault(); // avoids a full click to keep focus
                    select(e.data.index);
                    close();
                },

            // handle search result
            cbSearchResult = function (query, list) {
                    if (list.length) {
                        // draw results
                        popup.empty();
                        _(list).each(function (data, index) {
                            var node = $('<div>')
                                .addClass('autocomplete-item')
                                .data('data', data)
                                // 'click' would steal the focus too early
                                .on('mousedown', { index: index }, fnSelectItem);
                            o.draw.call(node, data);
                            node.appendTo(popup);
                        });
                        // leads to results
                        emptyPrefix = "\u0000";
                        open();
                        index = -1;
                    } else {
                        // leads to no results
                        emptyPrefix = query;
                        close();
                    }
                },

            // handle key down (esc/cursor only)
            fnKeyDown = function (e) {
                    if (isOpen) {
                        switch (e.which) {
                        case 27: // escape
                            close();
                            break;
                        case 39: // cursor right
                        case 13: // enter
                        case 9:  // tab
                            e.preventDefault();
                            if (!e.shiftKey) { // ignore back-tab
                                update();
                                close();
                            }
                            break;
                        case 38: // cursor up
                            e.preventDefault();
                            if (index > 0) {
                                select(index - 1);
                            }
                            break;
                        case 40: // cursor down
                            e.preventDefault();
                            select(index + 1);
                            break;
                        }
                    }
                },

            // handle key up (debounced)
            fnKeyUp = _.debounce(function (e) {
                    var val = $.trim($(this).val());
                    if (val.length >= o.minLength) {
                        if (val !== lastValue && val.indexOf(emptyPrefix) === -1) {
                            // trigger search
                            lastValue = val;
                            o.source(val).done(_.lfo(cbSearchResult, val));
                        }
                    } else {
                        lastValue = val;
                        close();
                    }
                }, o.delay);

        if (_.isFunction(o.source) && _.isFunction(o.draw)) {

            $.each(this, function () {
                // bind fundamental handlers
                $(this)
                    .on('keydown', fnKeyDown)
                    .on('keyup', fnKeyUp)
                    .on('blur', close);
            });
        }

        return this;
    };

    return {};
});