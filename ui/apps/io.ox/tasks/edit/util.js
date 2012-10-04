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
    
    var detailsTab = {}, //utilClass manages the detailsTab
        currencyArray = ['CAD', 'CHF', 'DKK', 'EUR', 'GBP', 'PLN', 'RUB', 'SEK', 'USD', 'JPY', 'RMB'],
        util = {
        buildLabel: function (text, id) {
            return $('<label>').text(text).addClass("task-edit-label").attr('for', id);
        },
        //build progressField and buttongroup
        buildProgress: function () {
            var progress = $('<input>').attr({type: 'text', id: 'task-edit-progress-field'}).val('0')
                .addClass("span6 progress-field");
            
            $('<div>').addClass('input-append').append(progress,
                    $('<button>').addClass('span3 btn fluid-grid-fix').append($('<i>').addClass('icon-minus'))
                    .on('click', function () {
                        var temp = parseInt(progress.val(), 10);
                        temp -= 25;
                        if (temp < 0) {
                            temp = 0;
                        }
                        if (temp !== parseInt(progress.val(), 10)) {
                            progress.val(temp);
                            progress.trigger('change');
                        }
                    }),
                    $('<button>').addClass('span3 btn fluid-grid-fix').append($('<i>').addClass('icon-plus'))
                    .on('click', function () {
                        var temp = parseInt(progress.val(), 10);
                        temp += 25;
                        if (temp > 100) {
                            temp = 100;
                        }
                        if (temp !== parseInt(progress.val(), 10)) {
                            progress.val(temp);
                            progress.trigger('change');
                        }
                    })
                    );
            
            return progress;
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
                row.children().children().not('label').addClass("span12");
            }
        },
        
        //Tabs
        buildTabs: function (tabs) {
            var table = $('<ul>').addClass("nav nav-tabs"),
                content = $('<div>').addClass("tab-content");
            for (var i = 0; i < tabs.length; i++) {
                $('<li>').css('width', '33%')
                    .append($('<a>').addClass("tab-link").css('text-align', 'center')
                        .attr({href: '#edit-task-tab' + [i], 'data-toggle': "tab"}).text(tabs[i])).appendTo(table);
            }
            for (var i = 0; i < tabs.length; i++) {
                $('<div>').attr('id', "edit-task-tab" + [i]).addClass("tab-pane").appendTo(content);
            }
            table.find('li :first').addClass('active');
            content.find('div :first').addClass('active');
            return {table: table, content: content};
        },
        //detail tab
        getDetailsTab: function () {return detailsTab; },
        
        buildDetailsTab: function (tab) {
            //build TabObject
            detailsTab.main = tab;
            detailsTab.target_duration = $('<input>').attr({type: 'text', id: 'task-edit-target-duration'}).addClass('target-duration');
            detailsTab.actual_duration = $('<input>').attr({type: 'text', id: 'task-edit-actual-duration'}).addClass('actual-duration');
            detailsTab.target_costs = $('<input>').attr({type: 'text', id: 'task-edit-target-costs'}).addClass('target-costs');
            detailsTab.actual_costs = $('<input>').attr({type: 'text', id: 'task-edit-actual-costs'}).addClass('actual-costs');
            detailsTab.billing_information = $('<input>').attr({type: 'text', id: 'task-edit-billing-information'}).addClass('billing-information');
            detailsTab.companies = $('<input>').attr({type: 'text', id: 'task-edit-companies'}).addClass('companies');
            detailsTab.trip_meter = $('<input>').attr({type: 'text', id: 'task-edit-trip-meter'}).addClass('trip_meter');
            detailsTab.currency = $('<select>').addClass('currency').attr('id', 'task-edit-currency');
            for (var i = 0; i < currencyArray.length; i++) {
                $('<option>').text(currencyArray[i]).appendTo(detailsTab.currency);
            }
            detailsTab.currency.prop('selectedIndex', 3);
            
            //build Output
            this.buildRow(detailsTab.main, [[this.buildLabel(gt("Estimated time") + ' ' + gt("in minutes"),
                                             detailsTab.target_duration.attr('id')), detailsTab.target_duration],
                                            [this.buildLabel(gt("Actual time") + ' ' + gt("in minutes"),
                                             detailsTab.actual_duration.attr('id')), detailsTab.actual_duration]]);
            this.buildRow(detailsTab.main, [[this.buildLabel(gt("Estimated costs"),
                                             detailsTab.target_costs.attr('id')), detailsTab.target_costs],
                                            [this.buildLabel(gt("Actual costs"),
                                             detailsTab.actual_costs.attr('id')), detailsTab.actual_costs],
                                            [this.buildLabel(gt("Currency"),
                                             detailsTab.currency.attr('id')), detailsTab.currency]],
                                            [6, 4, 2]);
            this.buildRow(detailsTab.main, [[this.buildLabel(gt("Distance"),
                                             detailsTab.trip_meter.attr('id')), detailsTab.trip_meter]]);
            this.buildRow(detailsTab.main, [[this.buildLabel(gt("Billing information"),
                                             detailsTab.billing_information.attr('id')), detailsTab.billing_information]]);
            this.buildRow(detailsTab.main, [[this.buildLabel(gt("Companies"),
                                             detailsTab.companies.attr('id')), detailsTab.companies]]);
            
            return detailsTab;
        },
        
        fillDetailsTab: function (task) {
            if (task.target_duration) {
                detailsTab.target_duration.val(task.target_duration);
            }
            if (task.actual_duration) {
                detailsTab.actual_duration.val(task.actual_duration);
            }
            if (task.target_costs) {
                detailsTab.target_costs.val(task.target_costs);
            }
            if (task.actual_costs) {
                detailsTab.actual_costs.val(task.actual_costs);
            }
            if (task.billing_information) {
                detailsTab.billing_information.val(task.billing_information);
            }
            if (task.companies) {
                detailsTab.companies.val(task.companies);
            }
            if (task.trip_meter) {
                detailsTab.trip_meter.val(task.trip_meter);
            }
            if (task.currency) {
                var temp = currencyArray.indexOf(task.currency);
                if (temp !== -1) {
                    detailsTab.currency.prop('selectedIndex', temp);
                }
            }
        },
        
        updateDetailTabValues: function (data) {
            data.target_duration = detailsTab.target_duration.val();
            data.actual_duration = detailsTab.actual_duration.val();
            data.target_costs = detailsTab.target_costs.val();
            data.actual_costs = detailsTab.actual_costs.val();
            data.billing_information = detailsTab.billing_information.val();
            data.companies = detailsTab.companies.val();
            data.trip_meter = detailsTab.trip_meter.val();
            data.currency = detailsTab.currency.val();
        },
        
        buildAttachmentNode: function (node, attachments) {
            var tempNodes = [];
            node.empty();
            for (var i = 0; i < attachments.length; i++) {
                tempNodes.push([$('<i>').addClass("icon-remove task-remove-attachment").attr('lnr', i),
                                $('<i>').addClass('icon-paper-clip'),
                                $('<div>').text(attachments[i].name).addClass("task-attachment-name"),
                                $('<div>').text(strings.fileSize(attachments[i].size)).addClass("task-attachment-filesize")]);
            }
            //check if we have an odd number of attachements
            if (tempNodes.length !== 0 && tempNodes.length % 2 !== 0) {
                tempNodes.push({});
            }
            
            for (var i = 0; i < tempNodes.length; i += 2) {
                this.buildRow(node, [tempNodes[i], tempNodes[i + 1]]);
            }
        }
    };
    
    return util;
});
