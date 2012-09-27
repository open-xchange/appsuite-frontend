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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define("io.ox/tasks/edit/util", ['gettext!io.ox/tasks',
                                'io.ox/core/strings'], function (gt, strings) {
    "use strict";
    
    var util = {
        buildLabel: function (text) {
            return $('<span>').text(text).addClass("task-edit-label");
        },
        //build progressField and buttongroup
        buildProgress: function () {
            var progress = $('<input>').attr({type: 'text', readonly: 'readonly'}).val('0 %'),
                buttons = $('<div>').addClass('btn-group').append(
                    $('<button>').text('+').addClass('btn').on('click', function () {
                        var temp = parseInt(progress.val(), 10);
                        temp += 25;
                        if (temp > 100) {
                            temp = 100;
                        }
                        if (temp !== parseInt(progress.val(), 10)) {
                            progress.val(temp + " %");
                            progress.trigger('change');
                        }
                    }),
                    $('<button>').text('-').addClass('btn').on('click', function () {
                        var temp = parseInt(progress.val(), 10);
                        temp -= 25;
                        if (temp < 0) {
                            temp = 0;
                        }
                        if (temp !== parseInt(progress.val(), 10)) {
                            progress.val(temp + " %");
                            progress.trigger('change');
                        }
                    })
            );
            return {progress: progress, buttons: buttons};
        },
        
        buildRow: function (parent, nodes, widths, fillGrid) {
            
            //check for impossible number of rows to avoid dividing by 0 or overflowing rows
            if (!nodes || nodes.length === 0 || nodes.length > 12) {
                return;
            }
            
            //check for valid widths
            if (!widths || nodes.length !== widths.length) {
                var temp = 12 / nodes.length;
                temp = parseInt(temp, 10); //we don't want floats
                widths = [];
                for (var i = 0; i < nodes.length; i++) {
                    widths.push(temp);
                }
            }
            
            var row = $('<div>').addClass("row-fluid task-edit-row").appendTo(parent);
            for (var i = 0; i < nodes.length; i++) {
                if (_.isArray(widths[i])) {
                    $('<div>').addClass("span" + widths[i][0] + " offset" + widths[i][1]).append(nodes[i]).appendTo(row);
                } else {
                    $('<div>').addClass("span" + widths[i]).append(nodes[i]).appendTo(row);
                }
            }
            
            //fillout gridCells
            if (fillGrid || fillGrid === undefined) {
                row.children().children().addClass("row-content");
            }
        },
        
        buildTabs: function (tabs) {
            var table = $('<ul>').addClass("nav nav-tabs"),
                content = $('<div>').addClass("tab-content");
            for (var i = 0; i < tabs.length; i++) {
                $('<li>').css('width', '33%')
                    .append($('<a>').addClass("tab-link")
                        .attr({href: '#edit-task-tab' + [i], 'data-toggle': "tab"}).text(tabs[i])).appendTo(table);
            }
            for (var i = 0; i < tabs.length; i++) {
                $('<div>').attr('id', "edit-task-tab" + [i]).addClass("tab-pane").appendTo(content);
            }
            table.find('li :first').addClass('active');
            content.find('div :first').addClass('active');
            return {table: table, content: content};
        }
    };
    
    return util;
});
