/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/list-dnd', [
    'io.ox/core/extensions',
    'gettext!io.ox/core',
    'io.ox/core/tk/draghelper'
], function (ext, gt) {

    'use strict';

    function joinTextNodes(nodes, delimiter) {
        nodes = nodes.map(function () {
            return $.trim($(this).attr('title') || $(this).text());
        });
        return $.makeArray(nodes).join(delimiter || '');
    }

    function defaultMessage(items) {
        var title = joinTextNodes(this.find('.selected .drag-title'), ', ');
        return title || gt.format(gt.ngettext('1 item', '%1$d items', items.length), items.length);
    }

    function enable(options) {

        options = _.extend({
            container: $(),
            data: null,
            draggable: false,
            dragMessage: defaultMessage,
            dragType: '',
            dropzone: false,
            dropzoneSelector: '.selectable',
            dropType: '',
            selection: null,
            selectable: '.selectable',
            simple: false
        }, options);

        var container = options.container || $(),
            data,
            source,
            helper = null,
            fast,
            expandTimer,
            deltaLeft = 15,
            deltaTop = 15,
            // move helper
            px = 0, py = 0, x = 0, y = 0,
            abs = Math.abs;

        function move(e) {
            // use fast access
            x = e.pageX + deltaLeft;
            y = e.pageY + deltaTop;
            if (abs(px - x) >= 5 || abs(py - y) >= 5) {
                fast.left = x + 'px';
                fast.top = y + 'px';
                px = x;
                py = y;
            }
        }

        function firstMove() {
            // trigger DOM event
            container.trigger('selection:dragstart');
        }

        function over() {

            var self = this,
                ft = $(this).closest('.foldertree-container'),
                node = ft[0],
                interval,
                scrollSpeed = 0,
                yMax,
                RANGE = 3 * $(this).height(), // Height of the sensitive area in px. (2 nodes high)
                MAX = 1, // Maximal scrolling speed in px/ms.
                scale = MAX / RANGE,
                nodeOffsetTop = 0;

            $(this).addClass('dnd-over');

            if ($(this).hasClass('expandable')) {
                clearTimeout(expandTimer);
                expandTimer = setTimeout(function () {
                    $(self).find('.folder-arrow').trigger('mousedown');
                }, 1500);
            }

            function canScroll() {
                var scrollTop = node.scrollTop;
                return scrollSpeed < 0 && scrollTop > 0 || scrollSpeed > 0 && scrollTop < yMax;
            }

            // The speed is specified in px/ms. A range of 1 to 10 results
            // in a speed of 100 to 1000 px/s.
            function scroll() {
                if (canScroll()) {
                    var t0 = new Date().getTime(), y0 = node.scrollTop;
                    if (interval !== undefined) clearInterval(interval);
                    interval = setInterval(function () {
                        if (canScroll()) {
                            var dt = new Date().getTime() - t0,
                            y = y0 + scrollSpeed * dt;
                            if (y < 0) y = 0;
                            else if (y > yMax) y = yMax;
                            else {
                                node.scrollTop = y;
                                return;
                            }
                        }
                        clearInterval(interval);
                        interval = undefined;
                    }, 10);
                } else {
                    if (interval !== undefined) clearInterval(interval);
                    interval = undefined;
                }
            }

            $(node).on({
                'mousemove.dnd': function (e) {
                    if (helper === null) return;
                    if (!nodeOffsetTop) { nodeOffsetTop = $(node).offset().top; }
                    var y = e.pageY - nodeOffsetTop;
                    yMax = node.scrollHeight - node.clientHeight;

                    if (y < RANGE) {
                        scrollSpeed = (y - RANGE) * scale;
                    } else if (node.clientHeight - y < RANGE) {
                        scrollSpeed = (RANGE - node.clientHeight + y) * scale;
                    } else {
                        scrollSpeed = 0;
                    }
                    scroll();
                },
                'mouseleave.dnd': function () {
                    scrollSpeed = 0;
                    scroll();
                    $(node).off('mousemove.dnd mouseleave.dnd');
                }
            });
        }

        function out() {
            clearTimeout(expandTimer);
            $(this).removeClass('dnd-over');
        }

        function drag(e) {
            // unbind
            $(document).off('mousemove.dnd', drag);
            // get selected items
            var selected = _(container.find('.selected'));
            // get data now
            data = source.attr('data-drag-data') ?
                [source.attr('data-drag-data')] :
                selected.map(function (node) {
                    return $(node).attr('data-cid');
                });
            // get counter
            var counter = selected.reduce(function (sum, node) {
                var count = $(node).find('.drag-count');
                return sum + (count.length ? parseInt(count.text(), 10) : 1);
            }, 0);
            // create helper
            helper = $('<div class="drag-helper">');
            ext.point('io.ox/core/tk/draghelper').invoke('draw', helper,
                new ext.Baton({
                    container: container,
                    count: counter || data.length,
                    data: data,
                    source: source,
                    dragMessage: options.dragMessage
                }));
            // get fast access
            fast = helper[0].style;
            // initial move
            px = py = x = y = 0;
            move(e);
            // replace in DOM
            helper.appendTo(document.body);
            // bind
            $(document).on('mousemove.dnd', move)
                .one('mousemove.dnd', firstMove)
                .on('mouseover.dnd', options.dropzoneSelector, over)
                .on('mouseout.dnd', options.dropzoneSelector, out);
        }

        function remove() {
            if (helper !== null) {
                helper.remove();
                helper = fast = null;
            }
        }

        function stop() {
            // unbind handlers
            $(document).off('mousemove.dnd mouseup.dnd mouseover.dnd mouseout.dnd');
            $('.dropzone').each(function () {
                var node = $(this), selector = node.attr('data-dropzones');
                (selector ? node.find(selector) : node).off('mouseup.dnd');
            });
            $('.dnd-over').removeClass('dnd-over');
            // trigger DOM event
            container.trigger('selection:dragstop');
            // revert?
            if (helper !== null) remove();
        }

        function drop() {
            clearTimeout(expandTimer);
            var target = $(this).attr('data-obj-id') || $(this).attr('data-cid') || $(this).attr('data-id'),
                baton = new ext.Baton({ data: data, dragType: options.dragType, dropzone: this, target: target });
            $(this).trigger('selection:drop', [baton]);
        }

        function resist(e) {
            var deltaX = Math.abs(e.pageX - e.data.x),
                deltaY = Math.abs(e.pageY - e.data.y);
            if (deltaX > 15 || deltaY > 15) {
                $(document).off('mousemove.dnd').on('mousemove.dnd', drag);
            }
        }

        function start(e) {
            source = $(this);
            data = [];
            // bind events
            $('.dropzone').each(function () {
                var node = $(this), selector = node.attr('data-dropzones');
                (selector ? node.find(selector) : node).on('mouseup.dnd', drop);
            });
            $(document)
                .on('mousemove.dnd', { x: e.pageX, y: e.pageY }, resist)
                .on('mouseup.dnd', stop);
            // prevent text selection and kills the focus
            // if (!_.browser.IE) { // Not needed in IE - See #27981
            //     (options.focus ? container.find(options.focus).first() : container).focus();
            // }
            e.preventDefault();
        }

        // draggable?
        if (options.draggable) {
            container.on('mousedown.dnd', options.selectable, start);
        }

        // dropzone?
        if (options.dropzone) {
            if (options.selection === null) console.error('list-dnd: Selection required for dropzone!', options);
            container.addClass('dropzone')
                .attr('data-dropzones', options.dropzoneSelector)
                .on('drop', function (e, baton) {
                    baton.dropType = options.dropType;
                    options.selection.trigger('selection:drop', baton);
                });
        }
    }

    return {
        // no DND on touch devices
        'enable': _.device('touch') ? $.noop : enable
    };
});
