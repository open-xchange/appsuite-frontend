/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) 2004-2012 Open-Xchange, Inc.
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/autocomplete',
    ['io.ox/core/util',
     'settings!io.ox/contacts',
     'gettext!io.ox/mail'
    ], function (util, settings, gt) {

    'use strict';

    //returns the input elem
    $.fn.autocomplete = function (o) {

        o = $.extend({
            // use Math.max here to make sure we don't get a zero (strange behavior then & look-up is too expensive)
            minLength: Math.max(1, settings.get('search/minimumQueryLength', 3)),
            maxResults: 25,
            delay: 100,
            collection: null,
            draw: null,
            blur: $.noop,
            click: $.noop,
            parentSelector: 'body',
            autoselect: false,
            api: null,
            node: null,
            container: $('<div>').addClass('autocomplete-popup'),
            mode: 'participant',

            //get data
            source: function (val) {
                return this.api.search(val).then(function (data) {
                    return o.placement === 'top' ? data.reverse() : data;
                });
            },

            //remove untwanted items
            reduce: function (data) {
                return data;
            },

            name: function (data) {
                return util.unescapedisplay_name(data.display_name);
            },

            // object related unique string
            stringify: function (data) {

                if (data.type === 2 || data.type === 3)
                    return this.name(data.contact);

                var name = this.name(data);
                return name ? '"' + name + '" <' + data.email + '>' : data.email;
            }
        }, o || {});

        var scrollpane = o.container.scrollable();

        var self = $(this),

            // last search
            lastValue = '',
            // no-results prefix
            emptyPrefix = '\u0000',
            // current search result index
            index = -1,
            // state
            isOpen = false,

            update = function () {
                // get data from current item and update input field
                var data = scrollpane.children().eq(Math.max(0, index)).data();
                lastValue = data !== undefined ? String(o.stringify(data)) : lastValue;
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

            select = function (i, processData) {
                    processData = typeof processData === 'undefined' ? true : processData;
                    var children;
                    if (i >= 0 && i < (children = scrollpane.children()).length) {
                        children.removeClass('selected').eq(i).addClass('selected').intoViewport(o.container);

                        //TODO: select next one
                        if (o.mode === 'search') {
                            if (scrollpane.children().eq(i).hasClass('unselectable')) {
                                var next = index < i ? i + 1 : i - 1;
                                select(next, processData);
                                return;
                            }
                        }

                        index = i;
                        if (processData) {
                            update();
                        }
                    }
                },

            selectFirst = function () {
                var length = scrollpane.children().length;
                if (o.placement === 'top') {
                    select(length - 1, false);
                } else {
                    select(0, false);
                }
            },

            fnBlur = function () {
                    setTimeout(close, 200);
                },

            blurOff = function () {
                    self.off('blur', fnBlur).focus();
                },

            blurOn = function () {
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
                        o.container.hide().appendTo(self.closest(o.parentSelector));


                        var parent = self.closest(o.parentSelector).offsetParent(),
                            parentOffset = parent.offset(),
                            myTop = off.top + h - parentOffset.top + parent.scrollTop(),
                            myLeft = off.left - parentOffset.left;

                        o.container.removeClass('top-placement bottom-placement');
                        if (o.placement === 'top') {
                            // top
                            o.container.addClass('top-placement').css({ top: myTop - h - o.container.outerHeight(), left: myLeft + 4, width: w });
                        } else {
                            // bottom
                            o.container.addClass('bottom-placement').css({ top: myTop, left: myLeft + 4, width: w });
                        }

                        o.container.show();

                        window.container = o.container;

                        isOpen = true;
                    }
                },

            close = function () {
                    if (isOpen) {
                        // toggle blur handlers
                        self.on('blur', o.blur).off('blur', fnBlur);
                        scrollpane.empty();
                        o.container.detach();
                        isOpen = false;
                        index = -1;
                    }
                },

            create = function (list, query) {
                if (o.mode === 'participant') {
                    _(list.slice(0, o.maxResults)).each(function (data, index) {
                        var node = $('<div class="autocomplete-item">')
                            .data({
                                index: index,
                                contact: data.data,
                                email: data.email,
                                field: data.field || '',
                                phone: data.phone || '',
                                type: data.type,
                                distlistarray: data.data.distribution_list,
                                id: data.data.id,
                                folder_id: data.data.folder_id,
                                image1_url: data.data.image1_url,
                                first_name: data.data.first_name,
                                last_name: data.data.last_name,
                                display_name: data.data.display_name
                            })
                            .on('click', fnSelectItem);
                        o.draw.call(node, data, query);
                        node.appendTo(scrollpane);
                    });
                } else {
                    var index = 0, regular, childs;

                    //apply style
                    o.container
                        .addClass('autocomplete-search');

                    //ignore hidden facets
                    list = _(list).filter(function (facet) {
                        return !facet.hidden;
                    });

                    _(list).each(function (facet) {
                        regular = !(facet.field_facet) && !!facet.display_name;
                        childs = facet.values.length > 0;
                        //delimiter
                        if (index !== 0 && childs && regular) {
                            $('<hr class="unselectable">')
                                .appendTo(scrollpane);
                        }
                        //facet
                        $('<div class="autocomplete-item group unselectable">')
                            .css('display', regular && childs ? 'inline' : 'none')
                            .text(facet.display_name)
                            .data({
                                index: index++,
                                id: facet.id,
                                label: facet.display_name,
                                type: 'group'
                            })
                            .appendTo(scrollpane);
                        //values
                        _(facet.values).each(function (value) {
                            value.facet = facet.id;
                            var node = $('<div class="autocomplete-item">')
                                .on('click', fnSelectItem);
                            //intend
                            if (regular)
                                node.addClass('indent');
                            o.draw.call(node, value);
                            node.appendTo(scrollpane);
                        });
                    });
                }
            },

            fnSelectItem = function (e) {
                    e.data = $(this).data();
                    select(e.data.index);
                    o.click.call(self.get(0), e);
                    close();
                },

            // handle search result
            cbSearchResult = function (query, data) {
                    open();
                    var list = data.list;
                    if (list.length) {
                        o.container.idle();
                        // draw results

                        create.call(self, list, query);

                        // leads to results
                        emptyPrefix = '\u0000';
                        index = -1;
                        //select first element without updating input field
                        if (o.autoselect) {
                            selectFirst();
                        }
                    } else {
                        // leads to no results if returned data wasn't filtered before (allready participant)
                        emptyPrefix = data.hits ? emptyPrefix : query;
                        close();
                    }
                },

            // adds 'retry'-item to popup
            cbSearchResultFail = function () {
                    o.container.idle();
                    var node = $('<div>')
                        .addClass('io-ox-center')
                        .append(
                            // fail container/content
                            $('<div class="io-ox-fail">').append(
                                $.txt(gt('Could not load this list')),
                                $.txt('. '),
                                //link
                                $('<a href="#">').text(gt('Retry'))
                                .on('click', function () {
                                        self.trigger('keyup', { isRetry: true });
                                    }
                                )

                            )
                        );
                    node.appendTo(scrollpane);
                },

            // handle key down (esc/cursor only)
            fnKeyDown = function (e) {

                var selected;

                if (isOpen) {
                    switch (e.which) {
                    case 27: // escape
                        close();
                        break;
                    case 39: // cursor right
                        e.preventDefault();
                        if (!e.shiftKey) update();
                        break;
                    case 13: // enter

                        // two different behaviors are possible:
                        // 1. use the exact value that is in the input field
                        // 2. use selected item or auto-select first item
                        // we use second approach here - this still allows to add custom mail addresses

                        selected = scrollpane.find('.selected');

                        if (selected.length) {
                            // use selected item
                            selected.trigger('click');
                        } else {
                            // auto-select first item
                            scrollpane.find('.autocomplete-item').first().click();
                        }

                        // calendar: add string
                        var value = $.trim($(this).val());
                        if (value.length > 0) $(this).trigger('selected', val);

                        break;
                    case 9:  // tab
                        if (!e.shiftKey) { // ignore back-tab
                            selected = scrollpane.find('.selected');
                            if (selected.length) {
                                e.preventDefault();
                                selected.trigger('click');
                            } else {
                                $(this).val(val = '');
                                close();
                            }
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
                } else {
                    switch (e.which) {
                    case 27: // escape
                        $(this).val(''); //empty it
                        close();
                        break;
                    /*case 39: // cursor right
                        e.preventDefault();
                        if (!e.shiftKey) {
                            update();
                            close();
                        }
                        break;*/
                    case 13:
                    case 9:
                        var val = $.trim($(this).val());
                        if (val.length > 0) {
                            $(this).trigger('selected', val);
                        }
                        break;
                    }
                }
            },

            // handle key up (debounced)
            fnKeyUp = _.debounce(function (e, isRetry) {
                e.stopPropagation();
                var val = $.trim($(this).val());
                isRetry = isRetry || false;
                if (val.length >= o.minLength) {
                    if (isRetry || (val !== lastValue && val.indexOf(emptyPrefix) === -1)) {
                        lastValue = val;
                        scrollpane.empty();
                        o.container.busy();
                        o.source(val)
                            .then(o.reduce)
                            .then(_.lfo(cbSearchResult, val), cbSearchResultFail);
                    }
                } else {
                    lastValue = val;
                    close();
                }
            }, o.delay);

       /**
        * get the selected item
        *
        * @return {object|boolean} data object or false
        */
        this.getSelectedItem = function () {
            var data = scrollpane.children().eq(Math.max(0, index)).data();
            return index < 0 ? false : data;
        };

        if (_.isFunction(o.source) && _.isFunction(o.draw)) {

            $.each(this, function () {
                // bind fundamental handlers
                $(this)
                    .on('keydown', fnKeyDown)
                    .on('keyup', fnKeyUp)
                    .on('compositionend', fnKeyUp) // for IME support
                    .on('blur', o.blur)
                    .on('blur', fnBlur)
                    .attr({
                        autocapitalize: 'off',
                        autocomplete: 'off', //naming conflict with function
                        autocorrect: 'off'
                    });
            });

            if (_.device('!desktop') || _.device('ie')) {//internet explorer needs this fix too or it closes if you try to scroll
                o.container.on('mousedown', blurOff).on('mouseup', blurOn);
            }
        }

        return this;
    };

    return {};
});
