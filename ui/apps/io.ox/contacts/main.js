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

    ["io.ox/contacts/util", "io.ox/contacts/api", "io.ox/core/tk/vgrid",
     "io.ox/core/tk/dialogs", "io.ox/help/hints",
     "io.ox/contacts/view-detail",
     "io.ox/core/config",
     "css!io.ox/contacts/style.css"
    ], function (util, api, VGrid, dialogs, hints, viewDetail, config) {

    
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
            .css({ left: gridWidth + 39 + "px", overflow: "auto" })
            .addClass("rightside default-content-padding")
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
                    fields.name.text(util.getFullName(data));
                    fields.email.text(util.getMail(data));
                    fields.job.text(util.getJob(data));
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
                .on("click", { text: char }, grid.scrollToLabelText);
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
        
        
        // bind all refresh
        api.bind("refresh.all", function (data) {
            grid.refresh();
        });
        
        // bind list refresh
        api.bind("refresh.list", function (data) {
            grid.repaint();
        });
        
        // go!
        win.show(function () {
            grid.paint();
            
            /* turn off for demo purposes
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
            */
        });
        // NewContact Form
        (function () {



            var pane = new dialogs.CreateDialog(),//SlidingPane(),
                pane_edit = new dialogs.CreateDialog(),//SlidingPane(),
                
                // create formblocks
                $divblock_name = $('<div/>').addClass('block new_contact name'),
                $divblock_company = $('<div/>').addClass('block new_contact company'),
                $divblock_b_address = $('<div/>').addClass('block new_contact address'),
                $divblock_b_phone = $('<div/>').addClass('block new_contact phone'),
                  
                $divblock_edit_name = $('<div/>').addClass('block edit_contact name'),
                $divblock_edit_company = $('<div/>').addClass('block edit_contact company'),
                $divblock_b_edit_address = $('<div/>').addClass('block edit_contact address'),
                $divblock_b_edit_phone = $('<div/>').addClass('block edit_contact phone');
    
            function field_html(label, id) {
                return $('<div/>').addClass('field').append('<label>' + label + '</label>')
                .append('<input class="' + id + '"type="text"> </input>');
            
            }

            var $first_name = field_html("first name", "first_name"),
                $last_name = field_html("last name", "last_name"),
                $company = field_html("company", "company"),
                $position = field_html("position", "position"),
                $profession = field_html("profession", "profession"),
                $department = field_html("department", "department"),
                $street_business = field_html("street", "street_business"),
                $postal_code_business = field_html("postal code", "postal_code_business"),
                $city_business = field_html("city", "city_business"),
                $phone_business1 = field_html("tel.", "telephone_business1");
    

            pane.getContentNode().addClass("create-contact");
            pane_edit.getContentNode().addClass("create-contact");
            
            // assemble the crate form
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
                
            pane.addButton("resolveNewContact", "Save");
            pane.addButton("cancelNewContact", "Cancel");
            
                // assemble the edit form
                
            pane_edit.append($divblock_edit_name);
            $first_name.clone().appendTo($divblock_edit_name);
            $last_name.clone().appendTo($divblock_edit_name);
                
            pane_edit.append($divblock_edit_company);
            $company.clone().appendTo($divblock_edit_company);
            $department.clone().appendTo($divblock_edit_company);
            $position.clone().appendTo($divblock_edit_company);
            $profession.clone().appendTo($divblock_edit_company);
                
            pane_edit.append($divblock_b_edit_address);
            $street_business.clone().appendTo($divblock_b_edit_address);
            $postal_code_business.clone().appendTo($divblock_b_edit_address);
            $city_business.clone().appendTo($divblock_b_edit_address);
                
            pane_edit.append($divblock_b_edit_phone);
            $phone_business1.clone().appendTo($divblock_b_edit_phone);
            $('<input type="hidden" class="id"></input>').appendTo($divblock_b_edit_phone);
                
            pane_edit.addButton("resolveEditContact", "Save");
            pane_edit.addButton("cancelEditContact", "Cancel");
    
            $(".content .block .field:nth-child(even)").addClass('even');
    
    //fill the edit form
    
            var getContact;
                
            function fillForm(selected) {
                    $('.content .edit_contact input').each(function (index) {
                        var name = $(this).attr('class');
                        $(this).val(selected[name]);
                    });
                }
    
            getContact = function (obj) {
                    api.get(obj)
                        .done(_.lfo(fillForm))
                        .fail(_.lfo(drawFail, obj)); // needs function
                };
            
             
             
            function removeContact() {
                new dialogs.ModalDialog()
                    .text("Are you really sure about your decision? Are you aware of all consequences you have to live with?")
                    .addButton("cancel", "No, rather not")
                    .addButton("delete", "Shut up and delete it!")
                    .show()
                    .done(function (action) {
                            if (action === "delete") {
                                //statusBar.busy();
                                var data = grid.selection.get(),
                                   getContact_del;
                                getContact_del = function (obj) {
                                    api.get(obj)
                                    .done(_.lfo(api.remove))
                                    .fail(_.lfo(drawFail, obj)); // needs function
                                };
                               
                                getContact_del(data[0]);
                              
                                
                                grid.selection.selectNext();
                            }
                        });

                    
            }
                
            
            var actions = {
                resolveNewContact: function () {
                                        var fId = config.get("folder.contacts"),
                                            formdata = {},
                                            displayName;
                                        $(".content .new_contact input")
                                        .each(function (index) {
                                            var value =  $(this).val();
                                            var id = $(this).attr('class');
                                            if (value !== "") {
                                                formdata[id] = value;
                                            }
                                        });
                                        if (!_.isEmpty(formdata)) {
                                            formdata.folder_id = fId;
                                        //create display_name TODO improve and export to util
                                            if (!formdata.first_name) {
                                                formdata.first_name = "undefined";
                                            }
                                            if (!formdata.last_name) {
                                                formdata.last_name = "undefined";
                                            }
                                            displayName = formdata.first_name + "," + formdata.last_name;
                                            console.log(displayName);
                                            
                                            api.create(formdata);
                                        }
                                        
                                        //clear the form
                                        $(".content .new_contact input")
                                        .each(function (index) {
                                            $(this).val("");
                                        });
                                    },
            
                cancelNewContact: function () {
                                        $(".content .new_contact input")
                                        .each(function (index) {
                                                    $(this).val("");
                                                });
                                    },
                resolveEditContact: function () {
                                        //grid.selection.clear();
                                        var fId = config.get("folder.contacts"),
                                        formdata = {};
                                        $(".content .edit_contact input")
                                        .each(function (index) {
                                                var value =  $(this).val(),
                                                    id = $(this).attr('class');
                                                if (value !== "") {
                                                    formdata[id] = value;
                                                }

                                            });
                                        if (!_.isEmpty(formdata)) {
                                            var fDataId = parseInt(formdata.id, 10),
                                                timestamp = new Date().getTime();
                                            formdata.folderId = fId;
                                            formdata.id = fDataId;
                                            formdata.timestamp = timestamp;
                                            api.update(formdata);
                                        }
                                        
                                    },
                
                cancelEditContact: function () {
                                    console.log("cancel");
                                }
            };
                
            var showNewContactPane = function () {
                                    pane.show().done(function (action) {
                                        actions[action]();
                                    });
                                };
                
            var showEditContactPane = function () {
                                    pane_edit.show().done(function (action) {
                                                                actions[action]();
                                                            });
                                };

            var newContactButton = win.addButton({ // something weird - button keeps the action
                label: "New Contact",
                action: showNewContactPane
            });

            var editContactButton = win.addButton({
                label: "Edit",
                action: showEditContactPane
            })
.bind('click', function () {
                var data = grid.selection.get();
                getContact(data[0]);
            });

            var deleteContactButton = win.addButton({
                label: "Delete",
                action: removeContact
            })
.bind('click', function () {
                var data = grid.selection.get();
                getContact(data[0]);
            });

//pane.relativeTo(newContactButton);
//pane_edit.relativeTo(newContactButton);
        }());

    });
    
    return {
        getApp: app.getInstance
    };
});
