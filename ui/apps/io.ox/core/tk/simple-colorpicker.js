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

define('io.ox/core/tk/simple-colorpicker', [], function () {

    'use strict';

    var colors = [
        // grey
        '#FFFFFF', '#EEEEEE', '#DDDDDD', '#CCCCCC', '#BBBBBB', '#AAAAAA', '#888888', '#555555', '#333333', '#000000',
        // blue
        '#0B3861', '#084B8A', '#045FB4', '#0174DF', '#2E9AFE', '#81BEF7', '#A9D0F5', '#CEE3F6', '#E0ECF8', '#EFF5FB',
        // green
        '#38610B', '#4B8A08', '#5FB404', '#74DF00', '#80FF00', '#9AFE2E', '#ACFA58', '#BEF781', '#D0F5A9', '#E3F6CE',
        // yellow
        '#AEB404', '#D7DF01', '#FFFF00', '#F7FE2E', '#F4FA58', '#F3F781', '#F2F5A9', '#F5F6CE', '#F5F6CE', '#F7F8E0',
        // red
        '#3B0B0B', '#610B0B', '#8A0808', '#B40404', '#DF0101', '#FF0000', '#FE2E2E', '#FA5858', '#F78181', '#F5A9A9',
        // pink
        '#610B21', '#8A0829', '#B40431', '#DF013A', '#FF0040', '#FE2E64', '#FA5882', '#F7819F', '#F5A9BC', '#F6CED8',
        // viollet
        '#610B5E', '#8A0886', '#B404AE', '#DF01D7', '#FF00FF', '#FE2EF7', '#F781F3', '#F5A9F2', '#F6CEF5', '#F6CEF5'
    ];

    $.fn.simpleColorPicker = function () {

        var node, self, preview;

        function set(e) {
            var color = e.data.color + '';
            e.preventDefault();
            preview.css('backgroundColor', color).insertAfter(self);
            self.val(color).trigger('change');
        }

        function focus(e) {
            var node = e.data.node;
            node.empty();
            _.each(colors, function (color, index) {
                node.append(
                    $('<div>').css({
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        margin: '0 1px 1px 0',
                        backgroundColor: color
                    })
                    .on('mousedown', { color: color }, set)
                );
                if (index % 10 === 9) {
                    node.append('<br>');
                }
            });
            node.insertAfter(this);
        }

        function blur(e) {
            var val = $.trim($(this).val());
            e.data.node.detach();
            if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/.test(val)) {
                preview.css('backgroundColor', val).insertAfter(self);
            }
        }

        if (this.get(0).tagName === 'INPUT') {

            self = this.attr({ maxLength: 7 }).addClass('nice-input');

            node = $('<div>').css({
                lineHeight: '8px',
                margin: '0.5em 0 1em 0'
            });

            preview = $('<div>').css({
                    width: '16px',
                    height: '16px',
                    margin: '3px 0 3px 8px',
                    backgroundColor: 'transparent',
                    display: 'inline-block',
                    verticalAlign: 'top'
                });

            this.on('focus', { node: node }, focus);
            this.on('blur', { node: node }, blur);
        }

        return this;
    };
});
