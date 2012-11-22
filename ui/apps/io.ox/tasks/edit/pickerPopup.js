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

define('io.ox/tasks/edit/pickerPopup', ['io.ox/core/tk/dialogs',
                                         'io.ox/core/date',
                                         'gettext!io.ox/tasks',
                                         'less!io.ox/tasks/edit/style.css'], function (dialogs, date, gt) {
    "use strict";
    
    var picker  = {
        create: function (startDate) { //startdate must be timestamp in milliseconds like date.getTime()
            var pickDate,
                tempDate,
                popup,
                node,
                table,
                clickfunction,
                selected,
                monthLabel,
                yearLabel,
                prevMonthButton,
                nextMonthButton,
                prevYearButton,
                nextYearButton;
            
            //prepare dates
            if (startDate) {
                pickDate = new date.Local(startDate);
            } else { //no startdate, use now
                pickDate = new date.Local();
            }
            
            pickDate.setDate(1);
            pickDate.setHours(6, 0, 0, 0);
            tempDate = new date.Local(pickDate);
            
            //setup dialog
            var popup = new dialogs.ModalDialog();
            
            //buttons
            popup.addPrimaryButton('ok', gt('OK'))
                .addButton('cancel', gt('Cancel'));
            
            //Header
            popup.getHeader().append($("<h4>").text(gt('Pick a date')));
            
            node = popup.getBody();
            
            //buildbody
            table = $('<table>').addClass("picker-table");
            
            prevYearButton = $('<button>').addClass('btn picker-button-left').on('click', function () {
                table.empty();
                selected = undefined;
                pickDate.setYear(pickDate.getYear() - 1);
                tempDate.setYear(pickDate.getYear());
                tempDate.setMonth(pickDate.getMonth());
                buildTable();
                yearLabel.text(pickDate.getYear());
            })
            .append($('<i>').addClass('icon-chevron-left'))
            .appendTo(node);
            
            yearLabel = $('<div>').text(gt.noI18n(pickDate.getYear())).addClass('picker-label').appendTo(node);
            
            nextYearButton = $('<button>').addClass('btn picker-button-right').on('click', function () {
                table.empty();
                selected = undefined;
                pickDate.setYear(pickDate.getYear() + 1);
                tempDate.setYear(pickDate.getYear());
                tempDate.setMonth(pickDate.getMonth());
                buildTable();
                yearLabel.text(pickDate.getYear());
            })
            .append($('<i>').addClass('icon-chevron-right'))
            .appendTo(node);
            
            node.append($('<br>'));
            node.append($('<br>'));
            
            prevMonthButton = $('<button>').addClass('btn picker-button-left').on('click', function () {
                table.empty();
                selected = undefined;
                pickDate.setMonth(pickDate.getMonth() - 1);
                tempDate.setYear(pickDate.getYear());
                tempDate.setMonth(pickDate.getMonth());
                buildTable();
                monthLabel.text(date.locale.months[pickDate.getMonth()]);
            })
            .append($('<i>').addClass('icon-chevron-left'))
            .appendTo(node);
            
            monthLabel = $('<div>').text(gt.noI18n(date.locale.months[pickDate.getMonth()])).addClass('picker-label').appendTo(node);
            
            nextMonthButton = $('<button>').addClass('btn picker-button-right').on('click', function () {
                table.empty();
                selected = undefined;
                pickDate.setMonth(pickDate.getMonth() + 1);
                tempDate.setYear(pickDate.getYear());
                tempDate.setMonth(pickDate.getMonth());
                buildTable();
                monthLabel.text(date.locale.months[pickDate.getMonth()]);
            })
            .append($('<i>').addClass('icon-chevron-right'))
            .appendTo(node);
            
            table.appendTo(node);
            buildTable();
            
            //build table, assign clickevents
            function buildTable() {
                tempDate.setDate(1);
                var i = 0,
                currentRow = $('<tr>').appendTo(table);
                
                while (tempDate.getMonth() === pickDate.getMonth()) {
                    var temp = $('<th>').text(gt.noI18n(tempDate.getDate()))
                        .attr('timevalue', tempDate.getTime())
                        .addClass("picker-day")
                        .appendTo(currentRow);
                    
                    
                    if (i > 5) {
                        currentRow = $('<tr>').appendTo(table);
                        i = 0;
                    } else {
                        i++;
                    }
                    tempDate.add(date.DAY);
                }
                
                table.delegate("th", "click", function () {
                    if (selected) {
                        $(selected).removeClass("picked-day");
                        selected = this;
                        $(this).addClass("picked-day");
                    } else {
                        selected = this;
                        $(this).addClass("picked-day");
                    }
                });
            }
            
            //returns timestamp or -1 if no valid time was created(no day selected, user pressed cancel etc.)
            return popup.show().pipe(function (action) {
                if (action === 'ok' && selected) {
                    return parseInt($(selected).attr("timevalue"), 10);
                } else {
                    return -1;
                }
            });
        }
        
        
    };
    
    return picker;
});
