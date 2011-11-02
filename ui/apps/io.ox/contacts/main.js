/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define("io.ox/contacts/main",
    ["io.ox/contacts/base", "io.ox/contacts/api", "io.ox/core/tk/vgrid",
     "io.ox/core/tk/dialogs", "io.ox/help/hints",
     "io.ox/contacts/view-detail",
     "io.ox/core/config",
     "css!io.ox/contacts/style.css"
    ], function (base, api, VGrid, dialogs, hints, viewDetail, config) {
    
    "use strict";
    
    // application object
    var app = ox.ui.createApp(),
        // app window
        win,
        // grid
        grid,
        gridWidth = 290,
        // nodes
        left,
        thumbs,
        right;
    
    // launcher
    app.setLauncher(function () {
        
        // get window
        win = ox.ui.createWindow({
            title: "Global Address Book",
            search: true
        });
        
        app.setWindow(win);
        
    
        // left panel
        left = $("<div/>")
            .addClass("leftside border-right")
            .css({
                width: gridWidth + "px",
                overflow: "auto"
            })
            .appendTo(win.nodes.main);
        
        // thumb index
        thumbs = $("<div/>")
            .addClass("atb contact-grid-index border-left border-right")
            .css({
                left: gridWidth + 3 + "px",
                width: "34px"
            })
            .appendTo(win.nodes.main);
        
        // right panel
        right = $("<div/>")
            .css({ left: gridWidth + 39 + "px", overflow: "auto", padding: "30px" })
            .addClass("rightside")
            .appendTo(win.nodes.main);

        // grid
        grid = new VGrid(left);
        
        // add template
        grid.addTemplate({
            build: function () {
                var name, email, job;
                this
                    .addClass("contact")
                    .append(name = $("<div/>").addClass("fullname"))
                    .append(email = $("<div/>"))
                    .append(job = $("<div/>").addClass("bright-text"));
                return { name: name, job: job, email: email };
            },
            set: function (data, fields, index) {
                if (data.mark_as_distributionlist === true) {
                    fields.name.text(data.display_name || "");
                    fields.email.text("");
                    fields.job.text("Distribution list");
                } else {
                    fields.name.text(base.getFullName(data));
                    fields.email.text(base.getMail(data));
                    fields.job.text(base.getJob(data));
                }
            }
        });
        
        // add label template
        grid.addLabelTemplate({
            build: function () {
            },
            set: function (data, fields, index) {
                var name = data.last_name || data.display_name || "#";
                this.text(name.substr(0, 1).toUpperCase());
            }
        });
        
        // requires new label?
        grid.requiresLabel = function (i, data, current) {
            var name = data.last_name || data.display_name || "#",
                prefix = name.substr(0, 1).toUpperCase();
            return (i === 0 || prefix !== current) ? prefix : false;
        };
        
        // all request
        grid.setAllRequest(function () {
            return api.getAll();
        });
        
        // search request
        grid.setAllRequest("search", function () {
            //alert('hier');
            return api.search(win.search.query);
        });
        
        // list request
        grid.setListRequest(function (ids) {
            return api.getList(ids);
        });
        
        /*
         * Search handling
         */
        win.bind("search", function (q) {
            grid.setMode("search");
        });
        
        win.bind("cancel-search", function () {
            grid.setMode("all");
        });
        
        // LFO callback
        var showContact, drawContact, drawFail;
        
        showContact = function (obj) {
            // get contact
            right.busy(true);
            api.get(obj)
                .done(_.lfo(drawContact))
                .fail(_.lfo(drawFail, obj));
        };
        
        drawContact = function (data) {
            //right.idle().empty().append(base.draw(data));
            right.idle().empty().append(viewDetail.draw(data));
        };
        
        drawFail = function (obj) {
            right.idle().empty().append(
                $.fail("Connection lost.", function () {
                    showContact(obj);
                })
            );
        };
        /*
         * Selection handling
         */
        grid.selection.bind("change", function (selection) {
            if (selection.length === 1) {
                showContact(selection[0]);
            } else {
                right.empty();
            }
        });

        /**
         * Thumb index
         */
        
        function drawThumb(char) {
            return $("<div/>").addClass("thumb-index border-bottom")
                .text(char)
                .bind("click", char, grid.scrollToLabelText);
        }
        
        // draw thumb index
        grid.bind("ids-loaded", function () {
            // get labels
            thumbs.empty();
            var textIndex = grid.getLabels().textIndex, char = "";
            for (char in textIndex) {
                // add thumb
                thumbs.append(drawThumb(char));
            }
        });
        
        win.bind("show", function () {
            grid.selection.keyboard(true);
        });
        win.bind("hide", function () {
            grid.selection.keyboard(false);
        });
        
        // go!
        win.show(function () {
            grid.paint();
             
            var searchAdapter = {
                    search: function (options) {
                        api.search(options.query)
                            .done(_.lfo(options.success))
                            .fail(_.lfo(options.fail));
                    }
                };
            
            $("#autocomplete").tokenInput(searchAdapter, {
                searchDelay: 500,
                minChars: 3,
                tokenLimit: 3,
                propertyToSearch: 'display_name',
                preventDuplicates: false,
                theme: 'ox',
                onResult: function (result, query) {
                    //console.log('on Result');
                    console.log(arguments);
                    result.unshift({display_name: query, last_name: query});
                    return result;
                },
                onAdd: function (input, tokenlist) {
                    var q = "";
                    console.log("ONADD");
                    console.log(tokenlist);
                    _.each(tokenlist, function (token) {
                        q += " " + token.last_name;
                    });
                    $(this).val($.trim(q));
                },
                onDelete: function (token_data, tokenlist) {
                    var q = "";
                    console.log('onDelete');
                    console.log(token_data);
                    _.each(tokenlist, function (token) {
                        q += " " + token.last_name;
                    });
                    $(this).val($.trim(q));
                },
                onReady: function () {
                    console.log('onReady');
                }

            });
           
        });
        // NewContact Form
        (function () {
            
                    
                    var pane = new dialogs.SlidingPane(),
                        // create formblocks
                    
                        $divblock_name = $('<div/>').addClass('block new_contact name'),
                        $divblock_company = $('<div/>').addClass('block new_contact company'),
                        $divblock_b_address = $('<div/>').addClass('block new_contact address'),
                        $divblock_b_phone = $('<div/>').addClass('block new_contact phone'),
                        
                        // create inputfields - a function for reducing code is needed
                        
                        $first_name = $('<div class="field"><label>first name</label><input id="first_name" type="text" ></input></div>'),
                        $last_name  = $('<div class="field"><label>last name</label><input id="last_name" type="text"></input></div>'),
                        $company = $('<div class="field"><label>company</label><input id="company" type="text"></input></div>'),
                        $position = $('<div class="field"><label>position</label><input id="position" type="text"></input></div>'),
                        $profession = $('<div class="field"><label>profession</label><input id="profession" type="text"></input></div>'),
                        $department = $('<div class="field"><label>department</label><input id="department" type="text"></input></div>'),
                        $street_business = $('<div class="field"><label>street</label><input id="street_business" type="text"></input></div>'),
                        $postal_code_business = $('<div class="field"><label>postal code</label><input id="postal_code_business" type="text"></input></div>'),
                        $city_business = $('<div class="field"><label>city</label><input id="city_business" type="text"></input></div>'),
                        $phone_business1 = $('<div class="field"><label>tel.</label><input id="$phone_business1" type="text"></input></div>');
                   
                    // assemble the form
                    pane.append($divblock_name);
                    $first_name.appendTo($divblock_name);
                    $last_name.appendTo($divblock_name);
                    
                    pane.append($divblock_company);
                    $company.appendTo($divblock_company);
                    $department.appendTo($divblock_company);
                    $position.appendTo($divblock_company);
                    $profession.appendTo($divblock_company);
                    
                    pane.append($divblock_b_address);
                    $street_business.appendTo($divblock_b_address);
                    $postal_code_business.appendTo($divblock_b_address);
                    $city_business.appendTo($divblock_b_address);
                    $city_business.appendTo($divblock_b_address);
                    
                    pane.append($divblock_b_phone);
                    $phone_business1.appendTo($divblock_b_phone);
                    
                    $(".content .block .field:nth-child(even)").addClass('even');
                   
                    pane.addButton("resolveNewContact", "Save");
                    pane.addButton("cancelNewContact", "Cancel");
                    
                    //collect the data
                    var actions = {
                        resolveNewContact: function () {
                                            var f_id = config.get("folder.contacts");
                                            var formdata = {folder_id: f_id};
                                            $(".content input").each(function (index) {
                                                                        var value =  $(this).val();
                                                                        var id = $(this).attr('id');
                                                                        formdata[id] = value;
                                                                    });
                                            api.newContact(formdata);
                            
                                        },
                    
                        cancelNewContact: function () {
                                                $(".content input").each(function (index) {
                                                    $(this).val("");
                                                });
                                            }
                        
                    };
                    
                    var showNewContactPane = function () {
                        pane.show().done(function (action) {
                            actions[action]();
                        });
                    };
                    var newContactButton = win.addButton({
                        label: "New Contact",
                        action: showNewContactPane
                    });
                    pane.relativeTo(newContactButton);
                }());
    });
    
    return {
        getApp: app.getInstance
    };
});
