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

define('io.ox/tasks/view-grid-template',
    ['io.ox/core/tk/vgrid',
     'io.ox/core/strings',
     'less!io.ox/tasks/style.css'], function (VGrid, strings) {

    'use strict';
    
    
    //grid-based list for portal
    var gridTemplate = {
         // main grid template
            main: {
                build: function () {
                    var title, status, priority, note, end_date;
                    this.addClass('tasks').append(
                        $('<div>').append(
                            status = $('<span>').addClass('status'),
                            title = $('<div>').addClass('title')
                        ),
                        $('<div>').append(
                            priority = $('<span>').addClass('priority'),
                            end_date = $('<span>').addClass('end_date'),
                            $('<div>').addClass('note')
                                .append(note = $('<span>'))
                        )
                    );
                    
                    //sliding animation
                    this.toggle(function ()
                            {
                        title.parent().animate({height: "+=30"}, "slow");
                        note.parent().animate({height: "+=100"}, "slow");
                        title.css("white-space", "pre-wrap");
                        note.css("white-space", "pre-wrap");
                    }, function ()
                            {
                        title.parent().animate({height: "-=30"}, "slow");
                        note.parent().animate({height: "-=100"}, "slow");
                        note.css("white-space", "nowrap");
                        title.css("white-space", "nowrap");
                    });
                    
                    return { title: title, status: status, priority: priority, note: note, end_date: end_date };
                },
                
                set: function (data, fields, index) {
                    
                    for (var i = 0; i < data.priority; i++)
                        {
                        fields.priority.append($('<i>').addClass('icon-star'));
                    }
                    
                    fields.status.text($.trim(data.status));
                    fields.title.text(strings.shorten($.trim(data.title), 70));
                    fields.end_date.text(data.end_date);
                    fields.note.text($.trim(data.note));
                    this.attr('data-index', index);
                }
            },
            
            drawSimpleGrid: function (taskList) {
            

                // use template
                var tmpl = new VGrid.Template(),
                $div = $('<div>');

                // add template
                tmpl.add(gridTemplate.main);

                _(taskList).each(function (data, i) {
                    var clone = tmpl.getClone();
                    clone.update(data, i);
                    clone.appendTo($div).node
                    .css('position', 'relative')
                    .data('object-data', data)
                    .addClass('hover');
                });

                return $div;
            }
        };
    
    return gridTemplate;
});