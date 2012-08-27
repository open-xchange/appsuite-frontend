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

define("io.ox/tasks/actions", ['io.ox/core/extensions',
                              'io.ox/core/extPatterns/links',
                              "io.ox/tasks/api",
                              'gettext!io.ox/tasks/actions',
                              'io.ox/core/config',
                              "less!io.ox/tasks/style.css"], function (ext, links, api, gt, conf) {

    "use strict";
    
    var Action = links.Action;
    
    new Action('io.ox/tasks/actions/reminder', {
        id: 'reminder',
        action: function (data) {
            require(['io.ox/core/tk/dialogs'], function (dialogs)
                    {
                        //create popup dialog
                        var popup = new dialogs.ModalDialog()
                            .addPrimaryButton('create', gt('Create reminder'))
                            .addButton('cancel', gt('Cancel'));
                        
                        //Header
                        popup.getHeader()
                            .append($("<h4>")
                                    .text(gt('Create a new reminder task')));
                        
                        //fill popup body
                        var popupBody = popup.getBody();
                        popupBody.append("<div>" + gt('Subject') + ": " + "</div>");
                        var titleInput = $('<input>', { type: 'text', value: data.subject, width: '90%' })
                        .appendTo(popupBody);
                        
                        popupBody.append("<div>" + gt('Remind me in') + ": " + "</div>");
                        var dateSelector = $('<select>', {name: "dateselect"})
                        .appendTo(popupBody);
                        dateSelector.append("<option>" + gt('one hour') + "</option>" +
                                "<option>" + gt('three hours') + "</option>" +
                                "<option>" + gt('six hours') + "</option>" +
                                "<option>" + gt('one day') + "</option>" +
                                "<option>" + gt('three days') + "</option>" +
                                "<option>" + gt('one week') + "</option>");
                        
                        popupBody.append("<br>");
                        var alarmbox = $('<input>', {type: 'checkbox', name: 'alarm', checked: 'checked'}).appendTo(popupBody);
                        popupBody.append("<span> " + gt('Alarm') + "?<span>");
                        
                        //ready for work
                        popup.show()
                            .done(function (action) {
                                
                                if (action === "create")
                                    {
                                    
                                    //Calculate the right time
                                    var endDate = new Date();
                                    var offset = endDate.getTimezoneOffset() * -1 * 60000;
                                    
                                    switch (dateSelector.val())
                                    {
                                    case gt('one hour'):
                                        endDate.setTime(endDate.getTime() + 60000 * 60 + offset);
                                        break;
                                    case gt('three hours'):
                                        endDate.setTime(endDate.getTime() + 60000 * 60 * 3 + offset);
                                        break;
                                    case gt('six hours'):
                                        endDate.setTime(endDate.getTime() + 60000 * 60 * 6 + offset);
                                        break;
                                    case gt('one day'):
                                        endDate.setTime(endDate.getTime() + 60000 * 60 * 24 + offset);
                                        break;
                                    case gt('three days'):
                                        endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * 3 + offset);
                                        break;
                                    case gt('one week'):
                                        endDate.setTime(endDate.getTime() + 60000 * 60 * 24 * 7 + offset);
                                        break;
                                    }
                                    
                                    //notification one minute before task expires or no notification at all
                                    var alarmTime;
                                    if (alarmbox.attr("checked"))
                                        alarmTime = endDate.getTime() - 60000;

                                    api.CreateTask({title: gt('Email reminder') + ": " + titleInput.val(),
                                        folder_id: conf.get('folder.tasks'),
                                        end_date: endDate.getTime(),
                                        start_date: endDate.getTime(),
                                        alarm: alarmTime,
                                        note: gt('Email reminder for') + ": " + data.subject + " \n" +
                                        gt('From') + ": " + data.from[0][0] + ", " + data.from[0][1]
                                        });
                                }
                            });
                    });
            
        }
    });
    
    ext.point('io.ox/mail/links/inline').extend(new links.Link({
        id: 'reminder',
        index: 10,
        label: gt("Reminder"),
        ref: 'io.ox/tasks/actions/reminder'
    }));
});