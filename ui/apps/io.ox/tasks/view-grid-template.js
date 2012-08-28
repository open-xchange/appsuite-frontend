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
     'less!io.ox/tasks/style.css'], function (VGrid) {

    'use strict';
    
    
    //grid-based list for portal
    var gridTemplate = {
         // main grid template
            main: {
                build: function () {
                    var title, status, priority, note, end_date;
                    this.addClass('tasks').append(
                        $('<div>').append(
                            end_date = $('<span>').addClass('end_date'),
                            title = $('<div>').addClass('title')
                        ),
                        $('<div>').append(
                            status = $('<span>').addClass('status'),
                            priority = $('<span>').addClass('priority'),
                            $('<div>').addClass('note')
                                .append(note = $('<span>'))
                        )
                    );
                    
                    //sliding animation
                    this.toggle(function ()
                            {
                        title.parent().animate({height: "+=50"}, "slow");
                        note.parent().animate({height: "+=80"}, "slow");
                        title.css("white-space", "pre-wrap");
                        note.css("white-space", "pre-wrap");
                    }, function ()
                            {
                        title.parent().animate({height: "-=50"}, "slow");
                        note.parent().animate({height: "-=80"}, "slow");
                        note.css("white-space", "nowrap");
                        title.css("white-space", "nowrap");
                    });
                    
                    return { title: title, status: status, priority: priority, note: note, end_date: end_date };
                },
                
                set: function (data, fields, index) {
                    
                    if (data.priority === 2)
                        {
                        fields.priority.text("\u2605\u2605\u2605");
                    }
                    //set badgecolor
                    switch (data.color)
                    {
                    case "grey":
                        fields.status.addClass("badge");
                        break;
                    case "green":
                        fields.status.addClass("badge badge-success");
                        break;
                    case "yellow":
                        fields.status.addClass("badge badge-warning");
                        break;
                    case "blue":
                        fields.status.addClass("badge badge-important");
                        break;
                    case "red":
                        fields.status.addClass("badge badge-info");
                        break;
                    }
                    
                    fields.status.text($.trim(data.status));
                    fields.title.text($.trim(data.title));
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