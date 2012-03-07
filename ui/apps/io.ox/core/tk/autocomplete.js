/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2012 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/autocomplete', function () {

    'use strict';

    var popup = $('<div>').addClass('autocomplete-popup'),
        scrollpane = popup.scrollable();

    $.fn.autocomplete = function (o) {

        o = $.extend({
            minLength: 2,
            maxResults: 20,
            delay: 200,
            source: null,
            draw: null,
            blur: $.noop,
            click: $.noop,
            stringify: JSON.stringify
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
                var data = scrollpane.children().eq(Math.max(0, index)).data('data');
                lastValue = o.stringify(data) + '';
                self.val(lastValue);

                // if two related Fields are needed
                if (_.isFunction(o.related)) {
                    var relatedField = o.related(),
                        dataHolder = o.dataHolder(),
                        relatedValue = o.stringifyrelated(data);
                    relatedField.val(relatedValue);
                    dataHolder.data(data);
                }


            },

            select = function (i) {
                    var children;
                    if (i >= 0 && i < (children = scrollpane.children()).length) {
                        children.removeClass('selected')
                            .eq(i).addClass('selected')
                            .intoViewport(popup);
                        index = i;
                        update();
                    }
                },

            fnBlur = function (e) {
                    setTimeout(close, 200);
                },

            blurOff = function (e) {
                    self.off('blur', fnBlur).focus();
                },

            blurOn = function (e) {
                    _.defer(function () {
                        self.on('blur', fnBlur).focus();
                    });
                },

            open = function () {
                    if (!isOpen) {
                        // toggle blur handlers
                        self.off('blur', o.blur).on('blur', fnBlur);
                        // calculate position/dimension and show popup
                        var off = self.offset(),
                            w = self.outerWidth(),
                            h = self.outerHeight();
                        popup.css({ top: off.top + h, left: off.left, width: w })
                            .appendTo('body');
                        isOpen = true;
                    }
                },

            close = function () {
                    if (isOpen) {
                        // toggle blur handlers
                        self.on('blur', o.blur).off('blur', fnBlur);
                        scrollpane.empty();
                        popup.detach();
                        isOpen = false;
                        index = -1;
                    }
                },

            fnSelectItem = function (e) {
                    select(e.data.index);
                    o.click.call(self.get(0), e);
                    close();
                },

            // handle search result
            cbSearchResult = function (query, list) {
                    if (list.length) {
                        // draw results
                        popup.idle();
                        _(list.slice(0, o.maxResults)).each(function (data, index) {
                            var node = $('<div>')
                                .addClass('autocomplete-item')
                                .data('data', data)
                                .on('click', { index: index, contact: data.contact, email: data.email }, fnSelectItem);
                            o.draw.call(node, data);
                            node.appendTo(scrollpane);
                        });
                        // leads to results
                        emptyPrefix = "\u0000";
                        //open();
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
                            scrollpane.empty();
                            popup.busy();
                            open();
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
                    .on('blur', o.blur)
                    .on('blur', fnBlur);
            });

            popup.on('touchstart mousedown', blurOff).on('touchend mouseup', blurOn);
        }

        return this;
    };

    return {};
});