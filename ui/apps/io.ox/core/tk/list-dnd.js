/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/tk/list-dnd', [
    'io.ox/core/extensions',
    'io.ox/core/collection',
    'gettext!io.ox/core',
    'io.ox/core/tk/draghelper'
], function (ext, Collection, gt) {

    'use strict';

    function joinTextNodes(nodes, delimiter) {
        nodes = nodes.map(function () {
            return $.trim($(this).attr('title') || $(this).text());
        });
        return $.makeArray(nodes).join(delimiter || '');
    }

    function defaultMessage(items) {
        var title = joinTextNodes(this.find('.selected .drag-title'), ', ');
        return title || gt.ngettext('%1$d item', '%1$d items', items.length, items.length);
    }

    //toggleTime must be defined here to give over and drop event handlers the same scope, see Bug 37605
    var toggleTimer;

    function enable(options) {

        options = _.extend({
            container: $(),
            data: null,
            delegate: false,
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
            selected,
            dragged = false,
            helper = null,
            fast,
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

        function toggle() {
            this.trigger('click');
        }

        function over(e) {

            // avoid handling bubbling events
            if (e.isDefaultPrevented()) return;

            e.preventDefault();

            // use first here or we get the arrows of the subfolder nodes as well
            var arrow = $(this).find('.folder-arrow:first');

            // css hover doesn't work!
            $(this).addClass('dnd-over');

            if (arrow.length) {
                clearTimeout(toggleTimer);
                toggleTimer = setTimeout(toggle.bind(arrow), 1500);
            }
        }

        function out() {
            clearTimeout(toggleTimer);
            $(this).removeClass('dnd-over');
        }

        //
        // Auto-scroll
        //

        var scroll = (function () {

            var y = 0, timer = null;

            return {
                move: function (e) {
                    y = e.pageY - $(this).offset().top;
                },
                out: function () {
                    clearInterval(timer);
                    timer = null;
                },
                over: function () {
                    if (timer) return;
                    var height = this.clientHeight, direction, px, speed;
                    timer = setInterval(function () {
                        direction = y < (height / 2) ? -1 : +1;
                        px = Math.min(y, height - y);
                        // smaller area that triggers auto-scroll;
                        // to avoid unwanted scrolling
                        if (px > 24) return;
                        // and another even smaller area that causes faster scrolling
                        speed = px < 8 ? 3 : 1;
                        this.scrollTop += direction * speed;
                    }.bind(this), 5);
                }
            };

        }());

        function drag(e) {
            $('body').addClass('dragging');
            // unbind
            $(document).off('mousemove.dnd', drag);
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
            dragged = true;
            // bind
            $(document)
                .one('mousemove.dnd', firstMove)
                .on('mousemove.dnd', move)
                .on('mouseover.dnd', '.folder-tree', scroll.over)
                .on('mouseout.dnd', '.folder-tree', scroll.out)
                .on('mousemove.dnd', '.folder-tree', scroll.move)
                .on('mouseover.dnd', options.dropzoneSelector, over)
                .on('mouseout.dnd', options.dropzoneSelector, out)
                .on('keyup.dnd', onEscape);
        }

        function remove() {
            if (helper !== null) {
                $('body').removeClass('dragging');
                helper.remove();
                helper = fast = null;
            }
        }

        function onEscape(e) {
            if (e.which === 27) stop();
        }

        function stop() {
            $('body').removeClass('dragging');
            // stop auto-scroll
            scroll.out();
            // unbind handlers
            $(document).off('mousemove.dnd mouseup.dnd mouseover.dnd mouseout.dnd keyup.dnd');
            $('.dropzone').each(function () {
                var node = $(this),
                    selector = node.attr('data-dropzones'),
                    delegate = node.attr('data-delegate');
                if (delegate && selector) {
                    return node.off('mouseup.dnd', selector);
                }
                (selector ? node.find(selector) : node).off('mouseup.dnd');
            });
            $('.dnd-over').removeClass('dnd-over');
            // trigger DOM event
            container.trigger('selection:dragstop');
            // revert?
            if (helper !== null) remove();
            // clean up
            source = selected = data = null;
        }

        function drop(e) {
            // avoid multiple events on parent tree nodes
            if (e.isDefaultPrevented()) return;
            $('body').removeClass('dragging');

            e.preventDefault();
            // process drop
            clearTimeout(toggleTimer);
            // abort unless it was a real drag move
            if (!dragged) return;
            var target = $(this).attr('data-model') || $(this).attr('data-id') || $(this).attr('data-cid') || $(this).attr('data-obj-id'),
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

        function getObjects(cid) {
            // simple id check for folders, prevents errors if folder id contains '.'
            if (cid.indexOf('folder.') === 0) {
                return { folder_id: 'folder', id: cid.replace(/^folder./, '') };
            }
            return _.cid(cid.replace(/^thread./, ''));
        }

        function start(e) {
            // get source, selected items, and data
            dragged = false;
            source = $(this);
            selected = _(container.find('.selected'));
            data = source.attr('data-drag-data') ?
                [source.attr('data-drag-data')] :
                selected.map(function (node) {
                    return $(node).attr('data-cid');
                });
            // check permissions - need 'delete' access for a move
            var collection = new Collection(_(data).map(getObjects));
            collection.getProperties();
            if (collection.isResolved() && !collection.has('delete')) return;
            // bind events
            $('.dropzone').each(function () {
                var node = $(this),
                    selector = node.attr('data-dropzones'),
                    delegate = node.attr('data-delegate');
                // pitfall: re-render after bind
                if (delegate && selector) {
                    return node.on('mouseup.dnd', selector, drop);
                }
                (selector ? node.find(selector) : node).on('mouseup.dnd', drop);
            });
            $(document)
                .on('mousemove.dnd', { x: e.pageX, y: e.pageY }, resist)
                .on('mouseup.dnd', stop);
            e.preventDefault();
        }

        // draggable?
        if (options.draggable) {
            container.on('mousedown.dnd', options.selectable, start);
        }

        // use delegate for drop binding?
        if (options.delegate) {
            container.attr('data-delegate', true);
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
