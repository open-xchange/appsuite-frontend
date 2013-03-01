/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/teamview/controller',
    ['io.ox/calendar/api',
     'io.ox/calendar/util',
     'gettext!io.ox/teamview',
     'settings!io.ox/teamview'
    ], function (api, util, gt, settings) {

    'use strict';

    // var calendarGridInstances = {};
    // var CG_ROW_HEIGHT = 50; // in px
    // var CG_PX2EM = 12;
    // var CG_HEAD_ZOOM = 75; // in % (show hours in header if > x%)
    // var CG_HOUR_ZOOM = 50; // in % (show hours in grid if > x%)

    // function getCalendarGrid(id) {
    //     // no instance for current view?
    //     if (!calendarGridInstances[id]) {
    //         // create new instance
    //         calendarGridInstances[id] = new CalendarGrid();
    //     }
    //     // return instance
    //     return calendarGridInstances[id];
    // }

    // function getCalendarGridIfExists(id, callback) {
    //     var grid = calendarGridInstances[id];
    //     if (grid) {
    //         callback(grid);
    //     }
    // }

    // // TODO:
    // // register for event "something" that is triggered if calendar data is
    // // changed. Might become unnecessary if this whole thing works with the cache.
    // // However, CalendarGrid's property "appointments" must be cleared and the grid
    // // must be repainted [e.g., grid.update()]. This should get it done.

    // var calendarGridHandlers = {

    //     addTeamMember: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             if (!grid.participantsDialog) {
    //                 // wrapper
    //                 var wrapper = function (list) {
    //                     // this list is as good as a team
    //                     grid.addTeam(list);
    //                 };
    //                 grid.participantsDialog = new ParticipantsSmall(
    //                     null, wrapper, true, true, true,
    //                     false, "Select Members", /* i18n */
    //                     "grid", false, false, true
    //                 );
    //             }
    //             grid.participantsDialog.openAddParticipantsWindow();
    //         });
    //     },

    //     removeTeamMember: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             grid.removeSelectedRows();
    //             grid.clearPartial();
    //             grid.update();
    //         });
    //     },

    //     removeAllTeamMembers: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             grid.removeAll();
    //             grid.clearPartial();
    //             grid.update();
    //         });
    //     },

    //     sortTeamMembers: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             grid.sort();
    //             grid.clearPartial();
    //             grid.update();
    //         });
    //     },

    //     appointmentSelected: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             // set (magical) global vars
    //             selectedAppointment = grid.appointmentSelection.getSelectedItems();
    //             lastSelectedAppointment = selectedAppointment;
    //             lastUpdateOfCalendarTimestamp = 0;
    //             // trigger global event
    //             triggerEvent("Selected", selectedAppointment);
    //         });
    //     },

    //     refresh: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             // clear appointments
    //             grid.invalidateAppointments();
    //             // update grid
    //             grid.clearPartial();
    //             grid.update();
    //         });
    //     },

    //     refreshAppointments: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             // clear appointments
    //             grid.invalidateAppointments();
    //             // update grid
    //             grid.paintAppointments();
    //         });
    //     },

    //     update: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             // update grid
    //             grid.clearPartial();
    //             grid.update();
    //         });
    //     },

    //     clearSelection: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             // clear selection
    //             grid.appointmentSelection.clear();
    //         });
    //     },

    //     gotoToday: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             var current = new Date(now());
    //             // update mini calendar
    //             activeYear = current.getUTCFullYear();
    //             activeMonth = current.getUTCMonth();
    //             activeDay = current.getUTCDate();
    //             if (oMiniCalendar) {
    //                 oMiniCalendar.setSelectedByDate(activeYear, activeMonth, activeDay);
    //             }
    //             // update grid
    //             if (grid.isDateVisible(activeYear, activeMonth, activeDay)) {
    //                 grid.scroll2Date(Date.UTC(activeYear, activeMonth, activeDay), grid.ONE_DAY);
    //             } else {
    //                 // update view
    //                 grid.setGridInterval(activeYear, activeMonth, activeDay);
    //                 grid.applyView();
    //                 grid.clearPartial();
    //                 grid.update();
    //             }
    //         });
    //     },

    //     gotoDay: function (year, month, day) {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             // update mini calendar
    //             activeYear = year;
    //             activeMonth = month;
    //             activeDay = day;
    //             if (oMiniCalendar) {
    //                 oMiniCalendar.setSelectedByDate(activeYear, activeMonth, activeDay);
    //             }
    //             // update grid
    //             if (grid.isDateVisible(activeYear, activeMonth, activeDay)) {
    //                 grid.scroll2Date(Date.UTC(activeYear, activeMonth, activeDay), grid.ONE_DAY);
    //             } else {
    //                 // update view
    //                 grid.setGridInterval(year, month, day);
    //                 grid.applyView();
    //                 grid.clearPartial();
    //                 grid.update();
    //             }
    //         });
    //     },

    //     setColorLabel: function (labelNumber) {
    //         lastUpdateOfCalendarTimestamp = (new Date()).getTime();
    //         calendarAddTag(labelNumber, true);
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             grid.invalidateAppointments();
    //         });
    //     },

    //     setCategories: function (action, category) {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             // get cloned selected objects as we may have to modify them later
    //             var apps = clone(grid.appointmentSelection.getSelectedItems());
    //             // flatten
    //             var cats = [];
    //             for (var i in apps) {
    //                 if (apps[i].categories) {
    //                     cats.push(apps[i].categories);
    //                 }
    //             }
    //             // re-enable hover
    //             //if (calendarhovers["teamday"]) { calendarhovers["teamday"].enable(); }

    //             function update(list, str) {
    //                 // update appointments
    //                 var multiple = [], $l = apps.length;
    //                 for (var i = 0; i < $l; i++) {
    //                     var request = {
    //                         "action": "update",
    //                         "module": "calendar",
    //                         "folder": apps[i].folder,
    //                         "id": apps[i].id,
    //                         "data": {
    //                             "categories": (str || apps[i].categories || null)
    //                         },
    //                         "timestamp": (new Date()).getTime()
    //                     };
    //                     // add recurrence_position?
    //                     if (apps[i].recurrence_position) {
    //                         request.recurrence_position = apps[i].recurrence_position;
    //                     }
    //                     multiple.push(request);
    //                 }
    //                 // go!
    //                 json.put(AjaxRoot + "/multiple?session=" + session, multiple, null, function (response) {
    //                     calendarGridHandlers.refreshAppointments();
    //                 });
    //             }

    //             if (action === "add") {
    //                 // iterate over all apps and add the new category to
    //                 // each of it
    //                 for (var i in apps) {
    //                     if (apps[i].categories) {
    //                         apps[i].categories = ox.categories.utils.paramToString(
    //                                 ox.categories.getByString(
    //                                         (category[0] + ", " + apps[i].categories),
    //                                             ox.categories.match.ALL, true), "name");
    //                     } else {
    //                         apps[i].categories = category[0];
    //                     }
    //                 }
    //                 update();

    //             } else if (action === "delete_all") {
    //                 // just in case, delete the old categories
    //                 for (var i in apps) {
    //                     delete (apps[i].categories);
    //                 }
    //                 update(cats, null);

    //             } else {
    //                 // open dialog
    //                 ox.categories.ui.open(cats.join(","), update);
    //             }
    //         });
    //     },

    //     configurationChanged: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             // update team
    //             if (grid.currentTeam !== null) {
    //                 grid.loadTeamByIndex(grid.currentTeam);
    //             }
    //             // update working time
    //             grid.loadWorkingDay();
    //             grid.workingTimeOnly = configGetKey("gui.calendar.teamview.workingTimeOnly") === true;
    //             grid.workingTimeCheckBox.attr("checked", grid.workingTimeOnly);
    //             grid.applyWorkingTime();
    //             // refresh
    //             calendarGridHandlers.refresh();
    //         });
    //     },

    //     sidepanelCollapse: function () {
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             if (grid.autoZoomOn) {
    //                 grid.autoZoom();
    //             }
    //         });
    //     },

    //     registerAll: function () {
    //         register("OX_Calendar_Teammember_Add", calendarGridHandlers.addTeamMember);
    //         register("OX_Calendar_Teammember_Remove", calendarGridHandlers.removeTeamMember);
    //         register("OX_Calendar_Teammember_Sort", calendarGridHandlers.sortTeamMembers);
    //         register("OX_Calendar_Teammember_RemoveAll", calendarGridHandlers.removeAllTeamMembers);
    //         register("OX_Calendar_Appointment_Selected", calendarGridHandlers.appointmentSelected);
    //         register('LanguageChanged', calendarGridHandlers.update);
    //         register('OX_Refresh', calendarGridHandlers.refreshAppointments);
    //         register('OX_After_Delete_Appointment', calendarGridHandlers.refreshAppointments);
    //         register('OX_After_Update_Appointment', calendarGridHandlers.refreshAppointments);
    //         register('OX_After_New_Appointment', calendarGridHandlers.refreshAppointments);
    //         register('OX_After_MoveCopy_Appointment', calendarGridHandlers.clearSelection);
    //         register('OX_Calendar_Today', calendarGridHandlers.gotoToday);
    //         register('OX_Mini_Calendar_Date_Picked', calendarGridHandlers.gotoDay);
    //         register("OX_Add_Flag", calendarGridHandlers.setColorLabel);
    //         register("OX_Sidepanel_Collapse", calendarGridHandlers.sidepanelCollapse);
    //     },

    //     registerOnce: function () {
    //         // this one is registered once (and stays registered) to support
    //         // changing the teams in the config view and getting informed about that
    //         register("OX_Configuration_Changed", calendarGridHandlers.configurationChanged);
    //     },

    //     unregisterAll: function () {
    //         // unregister
    //         unregister("OX_Calendar_Teammember_Add", calendarGridHandlers.addTeamMember);
    //         unregister("OX_Calendar_Teammember_Remove", calendarGridHandlers.removeTeamMember);
    //         unregister("OX_Calendar_Teammember_Sort", calendarGridHandlers.sortTeamMembers);
    //         unregister("OX_Calendar_Teammember_RemoveAll", calendarGridHandlers.removeAllTeamMembers);
    //         unregister("OX_Calendar_Appointment_Selected", calendarGridHandlers.appointmentSelected);
    //         unregister('LanguageChanged', calendarGridHandlers.update);
    //         unregister('OX_Refresh', calendarGridHandlers.refreshAppointments);
    //         unregister('OX_After_Delete_Appointment', calendarGridHandlers.refreshAppointments);
    //         unregister('OX_After_Update_Appointment', calendarGridHandlers.refreshAppointments);
    //         unregister('OX_After_New_Appointment', calendarGridHandlers.refreshAppointments);
    //         unregister('OX_After_MoveCopy_Appointment', calendarGridHandlers.clearSelection);
    //         unregister('OX_Calendar_Today', calendarGridHandlers.gotoToday);
    //         unregister('OX_Mini_Calendar_Date_Picked', calendarGridHandlers.gotoDay);
    //         unregister("OX_Add_Flag", calendarGridHandlers.setColorLabel);
    //         unregister("OX_Sidepanel_Collapse", calendarGridHandlers.sidepanelCollapse);
    //         // clear current selection
    //         getCalendarGridIfExists("teamview", function (grid) {
    //             grid.invalidateAppointments();
    //         });
    //     }
    // };

    // calendarGridHandlers.registerOnce();

    // function calendarGrid_deleteSelectedAppointments() {
    //     getCalendarGridIfExists("teamview", function (grid) {

    //         // get selection
    //         var apps = grid.appointmentSelection.getSelectedItems();
    //         // define delete routine // user will be asked first (see below)
    //         var deleteRoutine = function () {
    //             // 0. clear appointments
    //             grid.invalidateAppointments();
    //             // the tricky part here is that we cannot directly delete the appointment
    //             // but remove the particular team member from the participants list. Thus:
    //             // 1. we prepare the given appointment data for a server request
    //             var multiple = [];
    //             for (var i = 0; i < apps.length; i++) {
    //                 var request = {
    //                     "action": "get",
    //                     "module": "calendar",
    //                     "folder": apps[i].folder,
    //                     "id": apps[i].id
    //                 };
    //                 // add recurrence_position?
    //                 if (apps[i].recurrence_position) {
    //                     request.recurrence_position = apps[i].recurrence_position;
    //                 }
    //                 multiple.push(request);
    //             }
    //             // 2. we ask the server for appointments details, i.e. the participants
    //             json.put(AjaxRoot + "/multiple?session=" + session, multiple, null, function (response) {
    //                 // 3. now loop through the response to consolidate appointments.
    //                 // we need to do this because the selection might refer to identical appointments
    //                 // and we want to avoid that the last update overrides the previous ones
    //                 var hash = {};
    //                 var deleteHash = {};
    //                 var timestamp = 0;
    //                 for (var r = 0; r < response.length; r++) {
    //                     var app = response[r].data;
    //                     // tidy up
    //                     grid.tidyUpAppointment(app);
    //                     // create composite id (just the id & position; not the folder!)
    //                     var compId = [app.id, app.recurrence_position].join(".");
    //                     // update timestamp
    //                     timestamp = Math.max(timestamp, response[r].timestamp);
    //                     // add to hash
    //                     hash[compId] = app;
    //                 }
    //                 // now, hash is free of duplicates
    //                 // 4. we loop again through the selected appointments
    //                 for (var i = 0; i < apps.length; i++) {
    //                     // split up the selection id; format: folder.app_id.app_pos @ user_id
    //                     var keys = apps[i].selectionId.match(/^\w+\.(\w+\.\w+)\@(\w+)$/);
    //                     // get the appointment composite key and the participant id
    //                     var compId = keys[1];
    //                     var id = parseInt(keys[2], 10);
    //                     var app = hash[compId];
    //                     // found one?
    //                     if (app !== undefined) {
    //                         // 5a. do we delete the owner?
    //                         if (id === app.created_by) {
    //                             deleteHash[compId] = app;
    //                         } else {
    //                             // 5b. we look for this participant by looping through the list
    //                             for (var p = 0; p < app.participants.length; p++) { // fifth element (see columns)
    //                                 var part = app.participants[p];
    //                                 // match?
    //                                 if (part.id === id) {
    //                                     // 6. delete it
    //                                     app.participants.splice(p, 1);
    //                                     break;
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 }
    //                 // clean up "drop list" (these appointments do not require an update, since they will be deleted)
    //                 for (var compId in deleteHash) {
    //                     delete hash[compId];
    //                 }
    //                 // 7. throw the new data back to the server (delete participants)
    //                 var multipleDrop = [];
    //                 var localTimestamp = timestamp;
    //                 for (var compId in hash) {
    //                     var app = {
    //                         module: "calendar",
    //                         action: "update",
    //                         folder: hash[compId].folder_id,
    //                         id: hash[compId].id,
    //                         data: {
    //                             participants: hash[compId].participants
    //                         },
    //                         timestamp: localTimestamp
    //                     };
    //                     // add an hour to the timestamp (workaround) to prevent update collision errors
    //                     localTimestamp += 1000 * 60 * 60;
    //                     // add recurrence_id?
    //                     if (hash[compId].recurrence_id) {
    //                         app.data.recurrence_id = hash[compId].recurrence_id;
    //                     }
    //                     // add recurrence_position?
    //                     if (hash[compId].recurrence_position) {
    //                         app.data.recurrence_position = hash[compId].recurrence_position;
    //                     }
    //                     multipleDrop.push(app);
    //                 }
    //                 // send first request
    //                 json.put(AjaxRoot + "/multiple?session=" + session + "&continue=true", multipleDrop, null, function (response) {
    //                     // update timestamp (only available if appointments have been updated)
    //                     for (var i = 0; i < response.length; i++) {
    //                         timestamp = Math.max(timestamp, response[i].timestamp || 0);
    //                     }
    //                     // prepare 2nd request
    //                     var multipleDelete = [];
    //                     for (var compId in deleteHash) {
    //                         var app = {
    //                             module: "calendar",
    //                             action: "delete",
    //                             data: {
    //                                 folder: deleteHash[compId].folder_id,
    //                                 id: deleteHash[compId].id,
    //                                 pos: deleteHash[compId].recurrence_position
    //                             },
    //                             timestamp: timestamp
    //                         };
    //                         multipleDelete.push(app);
    //                     }
    //                     // send 2nd request
    //                     json.put(AjaxRoot + "/multiple?session=" + session + "&continue=true", multipleDelete, null, function (response) {
    //                         // finally...
    //                         calendarGridHandlers.refresh();
    //                     });
    //                 });
    //             });
    //         }; // end deleteRoutine

    //         // ask first
    //         if (apps.length === 1) {
    //             newConfirm(_("Delete Appointment"), _("Are you sure you want to delete the selected item?"),
    //                 AlertPopup.YESNO, null, null, deleteRoutine, null, null); /* i18n */
    //         } else {
    //             newConfirm(_("Delete Appointment"), _("Are you sure you want to delete the selected items?"),
    //                 AlertPopup.YESNO, null, null, deleteRoutine, null, null); /* i18n */
    //         }
    //     });
    // }

    // // util
    // function getCumulativeOffset(elem) {
    //     var top = 0, left = 0;
    //     while (elem) {
    //         top += elem.offsetTop || 0;
    //         left += elem.offsetLeft || 0;
    //         elem = elem.offsetParent;
    //     }
    //     return { "top": top, "left": left };
    // }

    // function CalendarGrid() {

    //     this.domNode = null;
    //     this.statusValid = false;

    //     // rows
    //     this.rows = [];
    //     this.rowIndex = {};
    //     this.lastSelectedRowIndex = 0;
    //     this.autoSortEnabled = false;
    //     this.sortAsc = true;
    //     this.isSorted = false;

    //     // appointments
    //     this.appointments = {};
    //     this.folders = {};
    //     // create/get selection for appointments
    //     this.appointmentSelection = getSimpleSelection("gridCalendarAppointments");
    //     this.appointmentSelection.setChangedEvent("OX_Calendar_Appointment_Selected");

    //     // grid & day interval
    //     this.gridIntervalStart = 0;
    //     this.gridIntervalEnd = 0;
    //     this.gridIntervalLength = 28;
    //     this.dayIntervalStart = 0;
    //     this.dayIntervalEnd = 23;
    //     this.workdayStart = 8;
    //     this.workdayEnd = 17;

    //     this.loadWorkingDay();

    //     this.firstDayOfWeek = 1;
    //     this.ONE_HOUR = 1000 * 60 * 60;
    //     this.ONE_DAY = this.ONE_HOUR * 24;
    //     this.ONE_WEEK = this.ONE_DAY * 7;

    //     // use working time only?
    //     this.workingTimeOnly = configGetKey("gui.calendar.teamview.workingTimeOnly") === true;
    //     this.applyWorkingTime();

    //     // initialize date
    //     this.setGridInterval();
    //     this.setGridIntervalLength(28); // 4 weeks

    //     // zoom level
    //     this.zoom = 100;

    //     // title bar, container, autoComplete
    //     this.titleBar = jQuery("#teamViewNavigation").get(0);
    //     this.container = newnode("div", {
    //         position: "absolute",
    //         top: "0px",
    //         right: "0px",
    //         bottom: "0px",
    //         left: "0px"
    //     });
    //     this.dataGrid = null;
    //     this.autoCompleteContainer = newnode("div", {
    //         position: "absolute",
    //         top: "0px",
    //         left: "0px",
    //         width: "600px",
    //         height: "70px",
    //         zIndex: 1000,
    //         visibility: "hidden",
    //         backgroundColor: "white",
    //         border: "1px solid #aaa",
    //         fontSize: "8pt",
    //         overflow: "auto",
    //         overflowX: "hidden",
    //         overflowY: "auto",
    //         MozBoxShadow: "#333 5px 5px 8px"
    //     });
    //     document.body.appendChild(this.autoCompleteContainer);

    //     // participants dialog
    //     this.participantsDialog = null;
    //     this.currentTeam = null;

    //     // selection
    //     this.rowSelection = {};

    //     // events
    //     this.selectionChangedEvent = null;
    //     this.teamMemberChangedEvent = null;
    //     this.zoomLevelChangedEvent = null;

    //     // status information
    //     this.firstRun = true;
    //     this.manualScroll = false;

    //     // prefs
    //     this.view = "DAY";
    //     this.mode = "details";
    //     this.showFineGrid = false;
    //     this.autoZoomOn = configGetKey("gui.calendar.teamview.autoZoomOn") || false;

    //     this.filter = {
    //         free: ox.api.config.get("gui.calendar.teamview.filter.free", true),
    //         tentative: ox.api.config.get("gui.calendar.teamview.filter.tentative", true),
    //         absent: ox.api.config.get("gui.calendar.teamview.filter.absent", true),
    //         reserved: ox.api.config.get("gui.calendar.teamview.filter.reserved", true)
    //     };

    //     // global resize handler
    //     var Self = this;
    //     addDOMEvent(window, "resize", function () {
    //         if (Self.autoZoomOn) {
    //             Self.autoZoom();
    //         }
    //     });
    // }

    // CalendarGrid.prototype.applyWorkingTime = function () {
    //     // get start & end
    //     var start, end;
    //     if (this.workingTimeOnly) {
    //         start = Math.max(0, this.workdayStart - 1);
    //         end = Math.min(this.workdayEnd + 1, 24);
    //     } else {
    //         start = 0;
    //         end = 24;
    //     }
    //     this.setDayInterval(start, end);
    // };

    // CalendarGrid.prototype.applyView = function (view, firstDayOfWeek) {
    //     this.view = view || this.view || "DAY";
    //     firstDayOfWeek = firstDayOfWeek || this.firstDayOfWeek || 1;
    //     // get start date
    //     var t = this.gridIntervalStart.getTime();
    //     // helper
    //     var round = function (timestamp, step) {
    //         step = step || this.ONE_DAY;
    //         return Math.floor(timestamp / step) * step;
    //     };
    //     // invalidate scrolling positions
    //     this.invalidScrollPositions = true;
    //     // view?
    //     switch (this.view) {
    //     case "DAY":
    //         // round to day
    //         var d = new Date(round(t, this.ONE_DAY));
    //         this.setGridInterval(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 1);
    //         break;
    //     case "WORKWEEK":
    //         // first day of week
    //         var first = configGetKey("gui.calendar.workweek.startday");
    //         this.setFirstDayOfWeek(first !== null ? first : 1);
    //         // get length
    //         var l = configGetKey("gui.calendar.workweek.countdays") || 5;
    //         // set
    //         this.setGridIntervalToWeek(t, l);
    //         break;
    //     case "WEEK":
    //         // first day of week
    //         this.setFirstDayOfWeek(1);
    //         // set
    //         this.setGridIntervalToWeek(t, 7);
    //         break;
    //     case "MONTH":
    //         // round to day
    //         var d = new Date(round(t, this.ONE_DAY));
    //         var l = this.getMonthLength(d.getUTCFullYear(), d.getUTCMonth());
    //         // set
    //         this.setGridInterval(d.getUTCFullYear(), d.getUTCMonth(), 1, l);
    //         break;
    //     case "CUSTOM":
    //         var l = configGetKey("gui.calendar.custom.countdays") || 3;
    //         var d = new Date(round(t, this.ONE_DAY));
    //         this.setGridInterval(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), l);
    //         break;
    //     }
    // };

    // CalendarGrid.prototype.isDateVisible = function (y, m, d) {
    //     var t = Date.UTC(y, m, d);
    //     var start = this.gridIntervalStart.getTime();
    //     var l = this.gridIntervalLength * this.ONE_DAY;
    //     return t >= start && t < start + l; // first might be equal, second must be less(!)
    // };

    // CalendarGrid.prototype.loadWorkingDay = function () {
    //     // read config
    //     var start = configGetKey("gui.calendar.starttime");
    //     this.workdayStart = start !== null ? start : 8;
    //     var end = configGetKey("gui.calendar.endtime");
    //     this.workdayEnd = end !== null ? end : 17;
    // };

    // CalendarGrid.prototype.setDayInterval = function (hourStart, hourEnd) {
    //     if (!isNaN(hourStart) && !isNaN(hourEnd) && hourStart <= (hourEnd - 1)) {
    //         this.dayIntervalStart = hourStart;
    //         this.dayIntervalEnd = hourEnd - 1;
    //     } else {
    //         this.dayIntervalStart = 0;
    //         this.dayIntervalEnd = 23;
    //     }
    // };

    // CalendarGrid.prototype.scroll2Date = function (date, roundTo) {
    //     // adjust parameter
    //     roundTo = roundTo === undefined ? this.ONE_HOUR : roundTo;
    //     // date or timestamp?
    //     if (typeof date === "number") {
    //         date = new Date(date);
    //     }
    //     // inside time interval?
    //     var t = Math.floor((date.getTime()) / roundTo) * roundTo;
    //     if (this.insideGridInterval(t)) {
    //         var x = this.time2pixel(t);
    //         this.dataGridContainer.scrollLeft = x; // set this only, then use exact value
    //         this.gridHeader.scrollLeft = this.dataGridContainer.scrollLeft;
    //         this.lastScrollLeft = this.dataGridContainer.scrollLeft;
    //     }
    // };

    // CalendarGrid.prototype.insideGridInterval = function (timestamp) {
    //     return timestamp >= this.gridIntervalStart.getTime() && timestamp <= this.gridIntervalEnd.getTime();
    // };

    // CalendarGrid.prototype.setGridIntervalToWeek = function (timestamp, intervalLength) {
    //     // timestamp?
    //     timestamp = timestamp || this.gridIntervalStart.getTime() || (new Date()).getTime();
    //     // round down to days
    //     var t = Math.floor(timestamp / this.ONE_DAY) * this.ONE_DAY;
    //     // check week day
    //     var w = (new Date(t)).getUTCDay() - this.firstDayOfWeek;
    //     // sub "firstDay" since it starts with Sunday (=0)
    //     // subtract days (so that t points at Monday morning) & create date
    //     var d = new Date(t - w * this.ONE_DAY);
    //     // set interval (default length = 4 weeks)
    //     this.setGridInterval(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), intervalLength || this.gridIntervalLength);
    // };

    // CalendarGrid.prototype.setFirstDayOfWeek = function (day) {
    //     this.firstDayOfWeek = day || 1;
    // };

    // CalendarGrid.prototype.setGridIntervalLength = function (intervalLength) {
    //     // new value?
    //     if (this.gridIntervalLength !== intervalLength) {
    //         this.gridIntervalLength = intervalLength;
    //         if (this.gridIntervalStart) {
    //             var d = this.gridIntervalStart;
    //             this.setGridInterval(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    //         }
    //     }
    // };

    // CalendarGrid.prototype.setGridInterval = function (UTCyear, UTCmonth, UTCday, intervalLength) {
    //     // no date given?
    //     var year = UTCyear === null || isNaN(UTCyear) ? activeYear : UTCyear;
    //     var month = UTCmonth === null || isNaN(UTCmonth) ? activeMonth : UTCmonth;
    //     var day = UTCday === null || isNaN(UTCday) ? activeDay : UTCday;
    //     // set date
    //     var utc_start = Date.UTC(year, month, day, 0, 0, 0);
    //     var maxDay = intervalLength || this.gridIntervalLength || this.getMonthLength(year, month);
    //     this.gridIntervalStart = new Date(utc_start);
    //     var utc_end = utc_start + Math.max(0, maxDay - 1) * this.ONE_DAY + (this.dayIntervalEnd + 1) * this.ONE_HOUR - 1;
    //     this.gridIntervalEnd = new Date(utc_end);
    //     // set interval length
    //     this.gridIntervalLength = maxDay;
    //     // invalidate scrolling positions
    //     this.invalidScrollPositions = true;
    //     // invalidate appointments
    //     this.invalidateAppointments();
    // };

    // CalendarGrid.prototype.invalidateAppointments = function () {
    //     // clear selection
    //     this.appointmentSelection.clear();
    //     // clear appointments
    //     this.appointments = {};
    // };

    // CalendarGrid.prototype.getAppointments = function (callback) {

    //     // create multiple requests
    //     var multiple = { requests: [], objects: [] };
    //     var skipRequest = true;

    //     // get timestamps
    //     var start = this.gridIntervalStart.getTime();
    //     var end = this.gridIntervalEnd.getTime();

    //     // loop members
    //     for (var i = 0; i < this.rows.length; i++) {
    //         // get row data
    //         var data = this.rows[i].data;
    //         // prepare request object
    //         var req = {};
    //         req.module = "calendar";
    //         req.action = "freebusy";
    //         req.id = data.id;
    //         req.type = data.type; // 1 = user; 3 = resource
    //         req.start = start;
    //         req.end = end;
    //         // add to request list
    //         multiple.requests.push(req);
    //         // appointments already loaded?
    //         var rowId = data.id; // + ":" + data.type;
    //         skipRequest = skipRequest && typeof(this.appointments[rowId]) !== "undefined";
    //     }

    //     // send server request
    //     if (this.rows.length > 0 && !skipRequest) {
    //         var Self = this;
    //         json.put(AjaxRoot + "/multiple?session=" + session, multiple.requests, null, function (responses) {
    //             var tFolders = { };
    //             // to prevent an empty folder array later we always add the users default calendar
    //             tFolders[configGetKey("folder.calendar")] = configGetKey("folder.calendar");
    //             if (responses && responses.length) {
    //                 // loop responses
    //                 for (var r = 0; r < responses.length; r++) {
    //                     var response = responses[r].data;
    //                     var row = Self.rows[r];
    //                     var id = row.rowId;
    //                     // not yet loaded?
    //                     if (!Self.appointments[id]) {
    //                         // create new list for this id
    //                         Self.appointments[id] = [];
    //                         // loop data
    //                         for (var i = 0; i < response.length; i++) {
    //                             var app = response[i];
    //                             // tidy up recurrence appointments
    //                             Self.tidyUpAppointment(app);
    //                             // add
    //                             Self.appointments[id].push(app);
    //                             // store folder_id in hash to check permissions later
    //                             if (app.folder_id && !tFolders[app.folder_id]) {
    //                                 tFolders[app.folder_id] = app.folder_id;
    //                             }
    //                             // folder_id vs. folder
    //                             app.folder = app.folder_id;
    //                         }
    //                     }
    //                 }
    //                 // now we have the relevant appointments for each row.
    //                 // we can get the appointments of a row by looking up its id
    //                 // and then using this id to find the appointments in the
    //                 // variable "appointments"
    //             }

    //             // convert folder hash to array
    //             var folders = [];
    //             for (var i in tFolders) {
    //                 folders.push(tFolders[i]);
    //             }
    //             // fetch folder permissions aka "get all affected folders"
    //             ox.api.folder.getMultiple({
    //                 list: folders,
    //                 success: function (data) {
    //                     // remember folders for further requests (see below)
    //                     Self.folders = data;
    //                     ox.util.call(callback, data);
    //                 }
    //             });
    //         });
    //     } else {
    //         // callback directly
    //         ox.util.call(callback, this.folders);
    //     }
    // };

    // CalendarGrid.prototype.tidyUpAppointment = function (app) {
    //     // position?
    //     if (!app.recurrence_position) {
    //         app.recurrence_position = 0;
    //     }
    //     // recurrence?
    //     if (typeof(app.recurrence_id) === "undefined") {
    //         app.recurrence_id = app.id;
    //     }
    //     // add alias of folder_id
    //     if (typeof(app.folder_id) === "undefined") {
    //         app.folder = app.folder_id;
    //     }
    // };

    // CalendarGrid.prototype.triggerTeamMemberChanged = function () {
    //     // event defined?
    //     if (this.teamMemberChangedEvent) {
    //         // trigger (selected or all)
    //         triggerEvent(this.teamMemberChangedEvent, this.getSelectedRowsOrAll());
    //     }
    // };

    // CalendarGrid.prototype.add = function (row) {
    //     // check for duplicates
    //     if (this.hasRow(row)) {
    //         // item exists
    //         var index = this.rowIndex[row.rowId], test = this.rows[index];
    //         // resource overwrites contact?
    //         if (test.type === 1 && row.type === 3) {
    //             // replace
    //             this.replaceAt(row, index);
    //         }
    //     } else {
    //         // add to list
    //         this.rowIndex[row.rowId] = row.index = this.rows.length;
    //         this.rows.push(row);
    //         // sort rows
    //         this.autoSort();
    //         // invalidate current team
    //         this.currentTeam = null;
    //         // trigger event
    //         this.triggerTeamMemberChanged();
    //     }
    // };

    // CalendarGrid.prototype.insertAt = function (row, index) {
    //     if (!this.hasRow(row)) {
    //         // adjust
    //         index = Math.max(0, Math.min(index, this.rows.length));
    //         // add to list and update index
    //         this.rows.splice(index, 0, row);
    //         this.updateRowIndex();
    //         // sort rows
    //         this.autoSort();
    //         // invalidate current team
    //         this.currentTeam = null;
    //         // trigger event
    //         this.triggerTeamMemberChanged();
    //     }
    // };

    // CalendarGrid.prototype.replaceAt = function (row, index) {
    //     if (this.hasRow(row)) {
    //         // adjust
    //         index = Math.max(0, Math.min(index, this.rows.length));
    //         // add to list and update index
    //         this.rows.splice(index, 1, row);
    //         this.updateRowIndex();
    //         // sort rows
    //         this.autoSort();
    //         // invalidate current team
    //         this.currentTeam = null;
    //         // trigger event
    //         this.triggerTeamMemberChanged();
    //     }
    // };

    // CalendarGrid.prototype.hasRow = function (row) {
    //     return typeof(this.rowIndex[row.rowId]) !== "undefined";
    // };

    // CalendarGrid.prototype.getRowHash = function () {
    //     var hash = {};
    //     for (var i = 0; i < this.numRows(); i++) {
    //         var row = this.rows[i];
    //         hash[row.rowId] = row;
    //     }
    //     return hash;
    // };

    // CalendarGrid.prototype.makeFunky = function (hash) {
    //     var list = [];
    //     for (var id in hash) {
    //         var row = hash[id];
    //         // some storage style? don't ask me
    //         list.push([0, 0, row.display_name, 0, row.id, 0, 0, row.type]);
    //     }
    //     return list;
    // };

    // CalendarGrid.prototype.createAppointment = function (startDate, endDate, members) {
    //     // is all day?
    //     var allDay = startDate.getTime() < endDate.getTime() && startDate.getUTCHours() === 0 && endDate.getUTCHours() === 0;
    //     // create date (activefolder is global)
    //     calendar_createNewAppointment(startDate, activefolder, allDay, {
    //         data: this.makeFunky(members),
    //         module: "contacts"
    //     }, endDate);
    // };

    // CalendarGrid.prototype.createAppointmentForSelectedMembers = function (startDate, endDate) {
    //     // get selected members (or all)
    //     var rows = this.numSelectedRows() > 0 ? this.getSelectedHash() : this.getRowHash();
    //     this.createAppointment(startDate, endDate, rows);
    // };

    // CalendarGrid.prototype.autoSort = function () {
    //     if (this.autoSortEnabled) {
    //         this.sort();
    //     }
    // };

    // CalendarGrid.prototype.sort = function () {
    //     // sort rows
    //     var Self = this;
    //     this.rows.sort(function () {
    //         // bind to "this"
    //         return CalendarGrid.prototype.rowSorter.apply(Self, arguments);
    //     });
    //     this.isSorted = true;
    //     // update row index (required after sort)
    //     this.updateRowIndex();
    //     // trigger event
    //     this.triggerTeamMemberChanged();
    // };

    // CalendarGrid.prototype.updateRowIndex = function () {
    //     for (var i = 0; i < this.numRows(); i++) {
    //         var row = this.rows[i];
    //         this.rowIndex[row.rowId] = row.index = i;
    //     }
    // };

    // CalendarGrid.prototype.addMultiple = function (list) {
    //     // loop through list
    //     for (var i = 0; i < list.length; i++) {
    //         var row = list[i];
    //         if (!this.hasRow(row)) {
    //             // add to list
    //             this.rows.push(row);
    //             // invalidate current team
    //             this.currentTeam = null;
    //         }
    //     }
    //     // sort rows
    //     this.autoSort();
    //     // trigger event
    //     this.triggerTeamMemberChanged();
    // };

    // CalendarGrid.prototype.rowSorter = function (a, b) {
    //     var v = false;
    //     if (a.type < b.type) {
    //         v = false;
    //     } else if (a.type > b.type) {
    //         v = true;
    //     } else {
    //         v = a.display_name.toLowerCase() >= b.display_name.toLowerCase();
    //     }
    //     return (this.sortAsc ? v : !v) ? 1 : -1; // Safari needs -1!
    // };

    // CalendarGrid.prototype.loadDefaultTeam = function () {
    //     // exist in configuration?
    //     if (configContainsKey("gui.calendar.teams") && this.currentTeam === null) {
    //         var teams = configGetKey("gui.calendar.teams"),
    //             self = this,
    //             set = function (index) {
    //                 self.currentTeam = index;
    //             };
    //         // loop teams
    //         for (var i = 0; i < teams.length; i++) {
    //             // marked as default?
    //             if (teams[i].team_default) {
    //                 // load team
    //                 this.loadTeam(teams[i].children, i, set);
    //                 break;
    //             }
    //         }
    //     }
    // };

    // CalendarGrid.prototype.loadTeamByIndex = function (index, callback) {
    //     // exist in configuration?
    //     if (configContainsKey("gui.calendar.teams")) {
    //         var teams = configGetKey("gui.calendar.teams"),
    //             self = this,
    //             set = function (index) {
    //                 self.currentTeam = index;
    //                 if (callback) { callback(); }
    //             };
    //         // loop teams
    //         for (var i = 0; i < teams.length; i++) {
    //             if (i === index) {
    //                 // load team
    //                 this.loadTeam(teams[i].children, i, set);
    //                 break;
    //             }
    //         }
    //     }
    // };

    // CalendarGrid.prototype.loadTeam = function (team, index, callback) {
    //     // remove all
    //     this.removeAll();
    //     // load/add team
    //     this.addTeam(team, function () {
    //         callback(index);
    //     });
    // };

    // CalendarGrid.prototype.addTeam = function (team, callback) {

    //     var Self = this;

    //     // clear
    //     Self.clearPartial();

    //     // get team members
    //     var groups = [];
    //     for (var i = 0; i < team.length; i++) {
    //         var member = team[i];
    //         // handle different types
    //         switch (member.type) {
    //         case 1: // user
    //         case 3: // resource
    //             var row = new CalendarGridRow(member.type, member.id, member.display_name);
    //             row.data = member;
    //             this.add(row);
    //             break;
    //         case 2: // group
    //             groups.push(member);
    //         }
    //     }

    //     // local function
    //     var cg_localCallback = function () {
    //         // sort rows
    //         Self.autoSort();
    //         // lazy update
    //         setTimeout(function () { Self.update(); }, 50);
    //         // trigger event
    //         Self.triggerTeamMemberChanged();
    //         // callback?
    //         if (callback) {
    //             callback();
    //         }
    //     };

    //     var cg_resolvedGroups = function (groups) {
    //         // "groups" is a hash, so...
    //         var ids = [];
    //         for (var id in groups) {
    //             var group = groups[id];
    //             // loop through members (also a hash)
    //             for (var memberId in group.members) {
    //                 ids.push(group.members[memberId]);
    //             }
    //         }
    //         if (ids.length > 0) {
    //             // ask cache about these users (async)
    //             internalCache.getUsers(ids, cg_resolvedUsers);
    //         } else {
    //             cg_localCallback();
    //         }
    //     };

    //     var cg_resolvedUsers = function (users) {
    //         var rows = [];
    //         for (var i in users) {
    //             var user = users[i];
    //             // add row
    //             user.type = 1;
    //             var row = new CalendarGridRow(user.type, user.id, user.display_name);
    //             row.data = user;
    //             rows.push(row);
    //         }
    //         Self.addMultiple(rows);
    //         cg_localCallback();
    //     };

    //     // groups to resolve?
    //     if (groups.length > 0) {
    //         // ask cache about these groups (async)
    //         internalCache.getObjects(groups, cg_resolvedGroups);
    //     } else {
    //         cg_localCallback();
    //     }
    // };

    // CalendarGrid.prototype.removeAll = function () {
    //     // delete rows
    //     this.rows = [];
    //     // clear index
    //     this.rowIndex = {};
    //     // clear selection
    //     this.rowSelection = {};
    //     // invalidate current team
    //     this.currentTeam = null;
    //     // trigger selection event?
    //     if (this.selectionChangedEvent) {
    //         triggerEvent(this.selectionChangedEvent, this.getSelectedRows());
    //     }
    //     // trigger changed event
    //     this.triggerTeamMemberChanged();
    // };

    // CalendarGrid.prototype.removeById = function (id) {
    //     // find row
    //     for (var i = 0; i < this.rows.length; i++) {
    //         if (this.rows[i].rowId === id) {
    //             this.removeAt(i);
    //             break;
    //         }
    //     }
    // };

    // CalendarGrid.prototype.removeAt = function (index) {
    //     // get row
    //     var row = this.rows[index];
    //     // delete from list
    //     delete this.rowIndex[row.rowId];
    //     this.rows.splice(index, 1);
    //     // invalidate current team
    //     this.currentTeam = null;
    //     // delete from selection
    //     for (var id in this.rowSelection[row.rowId]) {
    //         if (id === row.rowId) {
    //             delete this.rowSelection[id];
    //             // trigger event?
    //             if (this.selectionChangedEvent) {
    //                 triggerEvent(this.selectionChangedEvent, this.getSelectedRows());
    //             }
    //         }
    //     }
    //     // trigger changed event
    //     this.triggerTeamMemberChanged();
    // };

    // CalendarGrid.prototype.removeSelectedRows = function (index) {
    //     var i = 0;
    //     while (i < this.rows.length) {
    //         var row = this.rows[i];
    //         // is selected?
    //         if (this.rowSelection[row.rowId]) {
    //             this.rows.splice(i, 1);
    //             delete this.rowIndex[row.rowId];
    //             delete this.rowSelection[row.rowId];
    //             // invalidate current team
    //             this.currentTeam = null;
    //             continue;
    //         }
    //         i++;
    //     }
    //     // trigger event?
    //     if (this.selectionChangedEvent) {
    //         triggerEvent(this.selectionChangedEvent, this.getSelectedRows());
    //     }
    //     // trigger changed event
    //     this.triggerTeamMemberChanged();
    // };

    // CalendarGrid.prototype.clickRow = function (index, e) {
    //     // event given?
    //     e = e || { shiftKey: false, ctrlKey: false };
    //     // shift?
    //     if (e.shiftKey && this.numSelectedRows() > 0) {
    //         // holds shift!
    //         this.selectNone();
    //         this.selectRows(this.lastSelectedRowIndex, index);
    //     } else if (this.rows[index]) {
    //         // multiple?
    //         if (!e.ctrlKey) {
    //             this.selectNone();
    //         }
    //         if (this.rowSelection[this.rows[index].rowId]) {
    //             // <ctrl> and click on selected row
    //             var row = this.rows[index];
    //             row.node.className = "member";
    //             delete this.rowSelection[row.rowId];
    //         } else {
    //             this.selectRows(index, index);
    //         }
    //         this.lastSelectedRowIndex = index;
    //     }
    // };

    // CalendarGrid.prototype.selectRows = function (start, end) {
    //     if (start > end) {
    //         var tmp = end;
    //         end = start;
    //         start = tmp;
    //     }
    //     for (var i = start; i <= end; i++) {
    //         var row = this.rows[i];
    //         row.node.className = "member rowSelected";
    //         this.rowSelection[row.rowId] = row;
    //     }

    //     // trigger event?
    //     if (this.selectionChangedEvent) {
    //         triggerEvent(this.selectionChangedEvent, this.getSelectedRows());
    //     }
    //     // trigger changed event
    //     this.triggerTeamMemberChanged();
    // };

    // CalendarGrid.prototype.selectNone = function () {
    //     for (var id in this.rowSelection) {
    //         this.rowSelection[id].node.className = "member";
    //         delete this.rowSelection[id];
    //     }
    //     // trigger changed event
    //     this.triggerTeamMemberChanged();
    // };

    // CalendarGrid.prototype.numSelectedRows = function (row) {
    //     var count = 0;
    //     for (var id in this.rowSelection) {
    //         count++;
    //     }
    //     return count;
    // };

    // CalendarGrid.prototype.setSelectionChangedEvent = function (eventName) {
    //     this.selectionChangedEvent = eventName;
    // };

    // CalendarGrid.prototype.setTeamMemberChangedEvent = function (eventName) {
    //     var oldEvent = this.teamMemberChangedEvent;
    //     this.teamMemberChangedEvent = eventName;
    //     // fire now?
    //     if (oldEvent !== eventName) {
    //         this.triggerTeamMemberChanged();
    //     }
    // };

    // CalendarGrid.prototype.numRows = function (row) {
    //     return this.rows.length;
    // };

    // CalendarGrid.prototype.getSelectedHash = function () {
    //     return this.rowSelection;
    // };

    // CalendarGrid.prototype.getSelectedRows = function () {
    //     var selection = [];
    //     for (var id in this.rowSelection) {
    //         selection.push(this.rowSelection[id]);
    //     }
    //     return selection;
    // };

    // CalendarGrid.prototype.getSelectedRowsOrAll = function () {
    //     return this.numSelectedRows() > 0 ? this.getSelectedRows() : this.rows;
    // };

    // CalendarGrid.prototype.getSelectedIndexes = function () {
    //     var selection = [];
    //     for (var id in this.rowSelection) {
    //         selection.push(this.rowIndex[id]);
    //     }
    //     return selection;
    // };

    // CalendarGrid.prototype.getSelectedIDs = function () {
    //     var selection = [];
    //     for (var id in this.rowSelection) {
    //         selection.push(id);
    //     }
    //     return selection;
    // };

    // CalendarGrid.prototype.setParentDOMNode = function (node) {
    //     // set node
    //     this.domNode = node;
    //     // set class
    //     this.domNode.className += " calendarGrid";
    //     // add children
    //     node.appendChild(this.container);
    //     // prevent selection
    //     node.onselectstart = function () { return false; };
    //     node.style.MozUserSelect = "none";
    // };

    // CalendarGrid.prototype.validate = function () {
    //     if (!this.statusValid && this.domNode !== null) {
    //         this.draw();
    //         this.statusValid = true;
    //     }
    // };

    // CalendarGrid.prototype.update = function () {
    //     if (this.domNode !== null) {
    //         this.drawPartial();
    //     }
    // };

    // CalendarGrid.prototype.validateOrUpdate = function () {
    //     if (this.domNode !== null) {
    //         if (!this.statusValid) {
    //             this.validate();
    //         } else {
    //             this.update();
    //         }
    //     }
    // };

    // CalendarGrid.prototype.getMonthLength = function (year, month) {
    //     var d = Date.UTC(year, month + 1, 1);
    //     d -= this.ONE_DAY;
    //     d = new Date(d);
    //     return d.getUTCDate();
    // };

    // CalendarGrid.prototype.moveInterval = function (type, steps) {
    //     // get current interval start
    //     var start = new Date(this.gridIntervalStart);
    //     var year = start.getUTCFullYear();
    //     var month = start.getUTCMonth();
    //     var day = start.getUTCDate();
    //     // get sign
    //     var sign = steps / Math.abs(steps);
    //     // iterate
    //     for (var i = 0; i < Math.abs(steps); i++) {
    //         // consider type
    //         switch (type) {
    //         case "MONTH":
    //             month += sign;
    //             break;
    //         case "WEEK":
    //         case "WORKWEEK":
    //             day += sign * 7;
    //             break;
    //         case "DAY":
    //         case "CUSTOM":
    //             day += sign;
    //             break;
    //         }
    //     }
    //     // update grid interval
    //     this.setGridInterval(year, month, day);
    //     // update grid
    //     this.clearPartial();
    //     this.update();
    // };

    // CalendarGrid.prototype.draw = function () {

    //     var Self = this;

    //     // title
    //     var arrowLeft = newnode("span", { cursor: "pointer" }, null, [
    //         newtext(" "),
    //         newnode("img", {
    //             width: "4px",
    //             height: "7px",
    //             margin: "0px 5px 0px 20px"
    //         }, {
    //             src: getFullImgSrc("img/arrows/arrow_darkgrey_left.gif"),
    //             alt: ""
    //         }),
    //         newtext(" ")
    //     ]);
    //     addDOMEvent(arrowLeft, "click", function (e) {
    //         // change interval
    //         Self.moveInterval(Self.view, Self.view === "CUSTOM" ? -Self.gridIntervalLength : -1);
    //         // update calendar
    //         activeYear = Self.gridIntervalStart.getUTCFullYear();
    //         activeMonth = Self.gridIntervalStart.getUTCMonth();
    //         activeDay = Self.gridIntervalStart.getUTCDate();
    //         if (oMiniCalendar) {
    //             oMiniCalendar.setSelectedByDate(activeYear, activeMonth, activeDay);
    //         }
    //     });
    //     this.titleBar.appendChild(arrowLeft);
    //     this.titleDates = newtext("");
    //     this.drawDateInterval();
    //     this.titleBar.appendChild(this.titleDates);
    //     // right arrow
    //     var arrowRight = newnode("span", { cursor: "pointer" }, null, [
    //         newtext(" "),
    //         newnode("img", {
    //             width: "4px",
    //             height: "7px",
    //             margin: "0px 20px 0px 5px"
    //         }, {
    //             src: getFullImgSrc("img/arrows/arrow_darkgrey_right.gif"),
    //             alt: ""
    //         }),
    //         newtext(" ")
    //     ]);
    //     addDOMEvent(arrowRight, "click", function (e) {
    //         // change interval
    //         Self.moveInterval(Self.view, Self.view === "CUSTOM" ? Self.gridIntervalLength : 1);
    //         // update calendar
    //         activeYear = Self.gridIntervalStart.getUTCFullYear();
    //         activeMonth = Self.gridIntervalStart.getUTCMonth();
    //         activeDay = Self.gridIntervalStart.getUTCDate();
    //         if (oMiniCalendar) {
    //             oMiniCalendar.setSelectedByDate(activeYear, activeMonth, activeDay);
    //         }
    //     });
    //     this.titleBar.appendChild(arrowRight);

    //     // --------------------------------------------------------------------------

    //     // container
    //     this.drawPartial();

    //     // --------------------------------------------------------------------------

    //     // controls
    //     // slider
    //     this.zoomSlider = newnode("div", null, { className: "zoomSlider" });
    //     this.zoomLevel = newtext(Self.zoom + " %");
    //     var zoomLevelBox = newnode("span", {
    //         fontSize: "8pt",
    //         color: "white"
    //     }, null); //, [this.zoomLevel]
    //     this.zoomSliderBox = newnode("div", null,
    //         { className: "zoomSliderBox" }, [this.zoomSlider, zoomLevelBox]
    //     );
    //     // combo box
    //     this.zoomCombo = newnode("select", null, { size: 1 });
    //     // add options
    //     var zoomLevels = ["", "10", "50", "75", "100", "200", "400", "700", "1000"];
    //     for (var i = 0; i < zoomLevels.length; i++) {
    //         var text = newtext(zoomLevels[i] ? zoomLevels[i] + " %" : "");
    //         var option = newnode("option", null, { value: zoomLevels[i] }, [text]);
    //         this.zoomCombo.appendChild(option);
    //     }
    //     var zoomComboBox = newnode("div", null, { className: "zoomComboBox" }, [this.zoomCombo]);
    //     // add listener to combo box
    //     addDOMEvent(this.zoomCombo, "mousedown", function () {
    //         Self.zoomCombo.firstChild.innerHTML = "";
    //         Self.zoomCombo.firstChild.value = "";
    //     });
    //     addDOMEvent(this.zoomCombo, "change", function () {
    //         var v = Self.zoomCombo.value;
    //         if (v) {
    //             Self.zoomCombo.firstChild.innerHTML = "";
    //             Self.zoomCombo.firstChild.value = "";
    //             // initialize scroll/zoom fix
    //             //Self.scrollPositionFix.style.left = Self.roundEm(Self.dataGridContainer.scrollLeft/Self.zoom) + 1 + "em";
    //             // change zoom level
    //             Self.changeZoomLevel(v);
    //         }
    //     });

    //     // update zoom level
    //     this.updateZoomControls(this.zoom);

    //     // add listener
    //     this.zooming = false;
    //     this.zoomSliderLeft = 0;
    //     this.zoomTimeout = null;
    //     this.lastZoom = this.zoom;
    //     addDOMEvent(this.zoomSlider, "mousedown", CalendarGrid_startSlider);
    //     addDOMEvent(this.zoomSliderBox, "mousedown", CalendarGrid_startSlider);
    //     function CalendarGrid_startSlider(e) {
    //         // hide appointments
    //         try {
    //             Self.dataGrid.removeChild(Self.appContainer);
    //         } catch (e) { }
    //         // remove scroll handler
    //         removeDOMEvent(Self.dataGridContainer, "scroll", Self.scrollHandler);
    //         // start zooming
    //         Self.zooming = true;
    //         Self.zoomSliderLeft = getCumulativeOffset(Self.zoomSliderBox).left + 10;
    //         // make first move
    //         addDOMEvent(document, "mousemove", calendarGrid_moveSlider);
    //         calendarGrid_moveSlider(e);
    //     }
    //     addDOMEvent(document, "mouseup", function () {
    //         if (Self.zooming) {
    //             // stop zooming
    //             Self.zooming = false;
    //             window.setTimeout(function () {
    //                 try {
    //                     // show appointments
    //                     Self.dataGrid.appendChild(Self.appContainer);
    //                     removeDOMEvent(document, "mousemove", calendarGrid_moveSlider);
    //                     // add scroll handler
    //                     addDOMEvent(Self.dataGridContainer, "scroll", Self.scrollHandler);
    //                 } catch (e) { }
    //             }, 100);
    //         }
    //     });
    //     function calendarGrid_moveSlider(e) {
    //         if (Self.zooming) {
    //             var x = e.clientX - Self.zoomSliderLeft;
    //             x = Math.max(0, Math.min(90, x)) * 2 + 10;
    //             // snap to grid (5 pixel)
    //             x = Math.round(x / 5) * 5;
    //             // get zoom level
    //             var z = x <= 100 ? x : 100 + (x - 100) * 10;
    //             if (!isNaN(z) && z !== Self.lastZoom) {
    //                 Self.changeZoomLevel(z);
    //             }
    //         }
    //     }

    //     // get config
    //     Self.mode = configGetKey("gui.calendar.teamview.mode") || "details";
    //     Self.showFineGrid = configGetKey("gui.calendar.teamview.showFineGrid") || false;
    //     Self.showFineGrid = configGetKey("gui.calendar.teamview.showFineGrid") || false;

    //     // adjust height
    //     CG_ROW_HEIGHT = Self.mode === "minimized" ? 21 : 50;

    //     // shortcut
    //     var $ = jQuery;

    //     // helper
    //     var updateFilter = function (name, flag) {
    //         // set
    //         Self.filter[name] = flag;
    //         configSetKey("gui.calendar.teamview.filter." + name, flag);
    //         // redraw
    //         Self.clearPartial();
    //         Self.update();
    //     };

    //     // controls
    //     $("#teamViewQuickConfig")
    //     .find("table")
    //     .css("width", "100%")
    //     .empty()
    //     .append(
    //         $("<tr/>")
    //         .append(
    //             $("<th/>").css("width", "40%").append(addTranslated("Mode")) /*i18n*/
    //         )
    //         .append(
    //             $("<th/>").css("width", "40%").append(addTranslated("Grid")) /*i18n*/
    //         )
    //         .append(
    //             $("<th/>").append(addTranslated("Zoom")) /*i18n*/
    //         )
    //         .append(
    //             $("<th/>").text("")
    //         )
    //         .append(
    //             $("<th/>").text("")
    //         )
    //     )
    //     .append(
    //         $("<tr/>")
    //         .append(
    //             $("<td/>")
    //             .append(
    //                 // details
    //                 $.radio("calendarGridMode", "details", Self.mode === "details", addTranslated("Details") /*i18n*/, function () {
    //                     Self.changeMode("details");
    //                 })
    //             )
    //             .append($("<span/>").text(" \u00a0 "))
    //             .append(
    //                  // bars
    //                 $.radio("calendarGridMode", "bars", Self.mode === "bars", addTranslated("Bars") /*i18n*/, function () {
    //                     Self.changeMode("bars");
    //                 })
    //             )
    //             .append($("<span/>").text(" \u00a0 "))
    //             .append(
    //                  // minimized
    //                 $.radio("calendarGridMode", "minimized", Self.mode === "minimized", addTranslated("Minimized") /*i18n*/, function () {
    //                     Self.changeMode("minimized");
    //                 })
    //             )
    //         )
    //         .append(
    //             $("<td/>")
    //             .append(
    //                 // fine grid
    //                 $.checkbox("fineGrid", "1", this.showFineGrid, addTranslated("Fine grid") /*i18n*/, function () {
    //                     // update
    //                     Self.showFineGrid = this.checked;
    //                     configSetKey("gui.calendar.teamview.showFineGrid", this.checked);
    //                     // redraw (less buggy esp. for IE)
    //                     Self.clearPartial();
    //                     Self.update();
    //                 })
    //             )
    //             .append($("<br/>"))
    //             .append(
    //                 // fine grid
    //                 this.workingTimeCheckBox = $.checkbox("workingTimeOnly", "1",
    //                     this.workingTimeOnly,
    //                     addTranslated(_("Hide non-working time")),
    //                     function () {
    //                         // update
    //                         Self.workingTimeOnly = this.checked;
    //                         configSetKey("gui.calendar.teamview.workingTimeOnly",
    //                                      this.checked);
    //                         Self.applyWorkingTime();
    //                         // redraw (less buggy esp. for IE)
    //                         Self.clearPartial();
    //                         Self.update();
    //                     })
    //             )
    //         )
    //         .append(
    //             $("<td/>")
    //             .append(
    //                 // auto zoom
    //                 $.checkbox("calendarGridAutoZoom", "1", this.autoZoomOn, addTranslated("Auto") /*i18n*/, function () {
    //                     Self.autoZoomOn = !!this.checked;
    //                     configSetKey("gui.calendar.teamview.autoZoomOn", Self.autoZoomOn);
    //                     if (Self.autoZoomOn) {
    //                         Self.autoZoom();
    //                     }
    //                 })
    //             )
    //         )
    //         .append(
    //             $("<td/>").append(zoomComboBox)
    //         )
    //         .append(
    //             $("<td/>").append(this.zoomSliderBox)
    //         )
    //     )
    //     .append(
    //         $("<tr/>")
    //         .append(
    //             $("<th/>").append(addTranslated("Show") /*i18n*/)
    //         )
    //     )
    //     .append(
    //         $("<tr/>")
    //         .append(
    //             $("<td/>", { colspan: "2" })
    //             .append(
    //                 // free
    //                 //#. appointment availability
    //                 $.checkbox("calendarFilterFree", "free", this.filter.free, addTranslated("Free") /*i18n*/, function () {
    //                     updateFilter("free", this.checked);
    //                 })
    //             )
    //             .append($("<span/>").text(" \u00a0 "))
    //             .append(
    //                 // temporary
    //                 $.checkbox("calendarFilterTentative", "tentative", this.filter.tentative, addTranslated("Tentative") /*i18n*/, function () {
    //                     updateFilter("tentative", this.checked);
    //                 })
    //             )
    //             .append($("<span/>").text(" \u00a0 "))
    //             .append(
    //                 // absent
    //                 $.checkbox("calendarFilterAbsent", "absent", this.filter.absent, addTranslated("Absent on business") /*i18n*/, function () {
    //                     updateFilter("absent", this.checked);
    //                 })
    //             )
    //             .append($("<span/>").text(" \u00a0 "))
    //             .append(
    //                 // absent
    //                 $.checkbox("calendarFilterReserved", "reserved", this.filter.reserved, addTranslated("Booked") /*i18n*/, function () {
    //                     updateFilter("reserved", this.checked);
    //                 })
    //             )
    //         )
    //     );
    // };

    // CalendarGrid.prototype.changeMode = function (mode) {
    //     // set new mode
    //     var oldmode = this.mode || "details";
    //     this.mode = mode || "details";
    //     // clean up
    //     switch (oldmode) {
    //     case "details":
    //         break;
    //     case "bars":
    //         break;
    //     case "minimized":
    //         CG_ROW_HEIGHT = 50;
    //         break;
    //     }
    //     // update view
    //     switch (this.mode) {
    //     case "details":
    //         break;
    //     case "bars":
    //         break;
    //     case "minimized":
    //         CG_ROW_HEIGHT = 21;
    //         break;
    //     }
    //     // redraw (less buggy esp. for IE)
    //     this.clearPartial();
    //     this.update();
    //     // update config
    //     configSetKey("gui.calendar.teamview.mode", this.mode);
    // };

    // CalendarGrid.prototype.autoZoom = function () {
    //     // prepare
    //     var hourStart = this.dayIntervalStart;
    //     var hourStop = this.dayIntervalEnd;
    //     var numHours = hourStop - hourStart + 1;
    //     var dayWidth = CG_PX2EM / 24 * numHours;
    //     // get outer width
    //     var iw = this.gridIntervalLength * dayWidth;
    //     var ow = this.dataGridContainer.clientWidth;
    //     // dec/inc by 2 pixel(s)?
    //     ow += IE ? +2 : -2;
    //     // calculate new zoom level
    //     var z = Math.floor(ow / iw * 100) / 100;
    //     // set zoom level
    //     this.changeZoomLevel(z);
    // };

    // CalendarGrid.prototype.changeZoomLevel = function (z) {
    //     // check value
    //     z = Math.max(1, Math.min(1000, z));
    //     // set
    //     this.zoom = z;
    //     this.lastZoom = z;
    //     var Self = this;
    //     // speed!
    //     window.setTimeout(function () { Self.updateZoomControls(Self.zoom); }, 0);
    //     window.clearTimeout(this.zoomTimeout);
    //     this.zoomTimeout = window.setTimeout(function () {
    //         // new font size
    //         var fs = Self.zoom + "px";
    //         // set new zoom level
    //         Self.dataGrid.style.fontSize = fs;
    //         Self.gridHeader.style.fontSize = fs;
    //         // hide/show hours?
    //         Self.gridHeader.className = Self.zoom >= CG_HEAD_ZOOM ? "gridHeader zoom1" : "gridHeader zoom0";
    //         Self.dataGrid.className = Self.zoom >= CG_HEAD_ZOOM ? "zoom1" : "zoom0";
    //         // still has scroll bars? (IE needs this)
    //         if (Self.dataGrid.clientWidth < Self.dataGridContainer.clientWidth) {
    //             // no!
    //             Self.scrollPositionFix.style.left = "0px";
    //         }
    //         // restore correct scroll position
    //         Self.dataGridContainer.scrollLeft = Self.scrollPositionFix.offsetLeft;
    //         Self.gridHeader.scrollLeft = Self.scrollPositionFix.offsetLeft;
    //         // trigger event?
    //         if (Self.zoomLevelChangedEvent) {
    //             triggerEvent(Self.zoomLevelChangedEvent, Self.zoom);
    //         }
    //     }, 250);
    // };

    // CalendarGrid.prototype.updateZoomControls = function (zoomLevel) {
    //     // get x
    //     var x = zoomLevel <= 100 ?
    //             zoomLevel : Math.round(zoomLevel / 10) + 90;
    //     // update slider
    //     if (this.zoomSlider) {
    //         this.zoomSlider.style.left = ((x / 2 >> 0) - 5) + "px";
    //     }
    //     // update combo box
    //     if (this.zoomCombo) {
    //         this.zoomCombo.firstChild.innerHTML = "";
    //         this.zoomCombo.firstChild.value = "";
    //         this.zoomCombo.value = this.zoom;
    //         // check
    //         if (this.zoomCombo.value !== this.zoom) {
    //             this.zoomCombo.firstChild.innerHTML = this.zoom + " %";
    //             this.zoomCombo.firstChild.value = this.zoom;
    //             this.zoomCombo.value = this.zoom;
    //         }
    //     }
    // };

    // CalendarGrid.prototype.setZoomLevelChangedEvent = function (eventName) {
    //     this.zoomLevelChangedEvent = eventName;
    // };

    // CalendarGrid.prototype.getSnapFactor = function () {
    //     if (this.zoom < 100) {
    //         return 2; // half hour
    //     } else if (this.zoom < 300) {
    //         return 4; // quarter hour
    //     } else {
    //         return 12; // 5 minutes
    //     }
    // };

    // CalendarGrid.prototype.snapX2grid = function (x, factor) {
    //     // snap  x position to grid (pixel; half hours / quarter hours)
    //     var factor = factor ? factor : this.getSnapFactor();
    //     var snapper = 100 * CG_PX2EM * this.zoom / 100 / 24 / factor;
    //     return Math.round(Math.round(x / snapper) * snapper);
    // };

    // CalendarGrid.prototype.time2pixel = function (t) {

    //     var Self = this,
    //         gridStart = this.gridIntervalStart.getTime(),
    //         dayStart = this.dayIntervalStart,
    //         dayEnd = this.dayIntervalEnd,
    //         dayGap = dayStart + (24 - dayEnd - 1),
    //         hourStart = dayStart * this.ONE_HOUR,
    //         h = 0,
    //         d = new Date(t);

    //     // out of working time?

    //     // get start hour
    //     h = d.getUTCHours();

    //     // shift?
    //     if (h < dayStart) {
    //         // move to start of day
    //         t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), dayStart, 0, 0);
    //     } else if (h > dayEnd) {
    //         // move start to end of day
    //         t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), dayEnd, 0, 0);
    //     }

    //     var shrink = function (t) {
    //         return t - (t / Self.ONE_DAY >> 0) * dayGap * Self.ONE_HOUR;
    //     };

    //     // get relative start
    //     var rel = t - gridStart;
    //     // consider missing hours
    //     rel = shrink(rel) - hourStart;

    //     // convert into time (~1200 Pixel = 1 Day if zoom = 100%)
    //     return rel * this.zoom * 100 * CG_PX2EM / this.ONE_DAY / 100;
    // };

    // CalendarGrid.prototype.pixel2time = function (x, snap2Grid) {
    //     // prepare
    //     var dayStart = this.dayIntervalStart;
    //     var dayEnd = this.dayIntervalEnd;
    //     var hours = dayEnd - dayStart + 1;
    //     var hourStart = this.dayIntervalStart * this.ONE_HOUR;
    //     // get relative time
    //     var rel = Math.round(this.ONE_DAY * x * 100 / this.zoom / 100 / CG_PX2EM);
    //     // shift x?
    //     if (rel > (hours * this.ONE_HOUR)) {
    //         // yeah, first attempt works! ">> 0" is like Math.floor
    //         rel += ((rel / (hours * this.ONE_HOUR)) >> 0) * (24 - hours) * this.ONE_HOUR;
    //     }
    //     // convert into time (1200 Pixel = 1 Day if zoom = 100%)
    //     var t = this.gridIntervalStart.getTime() + hourStart + rel;
    //     // snap to grid?
    //     if (snap2Grid) {
    //         // half hour / quarter hour
    //         var snapper = this.ONE_HOUR / this.getSnapFactor();
    //         t = Math.round(t / snapper) * snapper;
    //     }
    //     return t;
    // };

    // CalendarGrid.prototype.roundEm = function (em) {
    //     return Math.round(em * 1000) / 1000;
    // };

    // CalendarGrid.prototype.drawDateInterval = function () {
    //     var startDate = formatDate(this.gridIntervalStart, "date");
    //     var endDate = formatDate(this.gridIntervalEnd, "date");
    //     this.titleDates.nodeValue = "" +
    //         // start date
    //         startDate + " " +
    //         // start calendar week
    //         "(" + _("CW") + " " + formatDateTime("w", new Date(this.gridIntervalStart)) + ")" + /* i18n */
    //         // different?
    //         (startDate !== endDate ?
    //             // dash
    //             " - " +
    //             // end date
    //             endDate + " " +
    //             // end calendar week
    //             "(" + _("CW") + " " + formatDateTime("w", new Date(this.gridIntervalEnd)) + ")" /* i18n */
    //             :
    //             ""
    //         );
    // };

    // CalendarGrid.prototype.drawPartial = function () {

    //     var Self = this;

    //     // scroll position fix
    //     if (this.invalidScrollPositions) {
    //         this.scrollPositionFix = null;
    //         this.manualScroll = false;
    //     }

    //     // -------------------------------------------------------------------------

    //     // update title
    //     this.drawDateInterval();

    //     // -------------------------------------------------------------------------

    //     // current zoom -> pixel
    //     var fs = Math.round(this.zoom) + "px";

    //     // container
    //     this.dataGrid = newnode("div", { fontSize: fs }, { "className": "zoom0" });
    //     var dataGridClass = this.mode === "minimized" ? "dataGrid minimized" : "dataGrid";
    //     this.dataGridContainer = newnode("div", null,
    //         { "className": dataGridClass }, [this.dataGrid]
    //     );

    //     var maxRows = this.numRows();
    //     var maxCols = Math.ceil((this.gridIntervalEnd.getTime() - this.gridIntervalStart.getTime()) / this.ONE_DAY);
    //     var hourStart = this.dayIntervalStart;
    //     var hourStop = this.dayIntervalEnd;
    //     var numHours = hourStop - hourStart + 1;
    //     var hourWidth = CG_PX2EM / 24; // use 24 hours; not numHours!
    //     var gridDayWidth = CG_PX2EM * numHours / 24; // ok here!

    //     // set data grid width
    //     this.dataGrid.style.width = (maxCols * gridDayWidth) + "em";

    //     // in minimalist view? (no fine grid && minimized && week, workweek, custom, or month, i.e. not day)
    //     var minimalistView = this.mode === "minimized" && !this.showFineGrid && currentpath2[2] !== "day";

    //     // hours (vertical; one extra row for new members)
    //     var frag = newfrag(); // speed up via document fragment
    //     var wdStart = this.workdayStart - 1, wdEnd = this.workdayEnd - 1;
    //     var hourZ = 0;
    //      // day template
    //     var dayTemplate = newnode("div", {
    //         position: "absolute",
    //         left: "0em",
    //         top: "0px",
    //         bottom: "0px"
    //     });
    //     // minimalist view?
    //     if (minimalistView) {
    //         // just show the very first hour
    //         var hourClassName = "hour borderColorMidnight borderThin", h = hourStart;
    //         var hour = newnode("div", {
    //             left: this.roundEm(((h - hourStart) * hourWidth)) + "em",
    //             width: this.roundEm(hourWidth) + "em",
    //             height: ((maxRows + 1) * CG_ROW_HEIGHT) + "px"
    //         }, { className: hourClassName }, [newnode("div", { fontSize: "10px" })]);
    //         dayTemplate.appendChild(hour);
    //     }
    //     else {
    //         // extra lines template
    //         var extraLinesTemplate = newnode("div", {
    //             position: "absolute",
    //             width: "1px"
    //         }, { className: "hour fineLine" }, [newnode("div", { fontSize: "10px" })]);
    //         // loop over one day
    //         for (var h = hourStart; h <= hourStop; h++) {
    //             var hourClassName = "hour ";
    //             hourClassName += ((h <= wdStart) || (h > wdEnd)) ? "dark " : "bright ";
    //             if (i !== 0 || h !== 0) {
    //                 hourClassName += h === 0 ? "borderColorMidnight " : h <= wdStart + 1 || h > wdEnd ? "borderColorDark " : "borderColorBright ";
    //                 hourClassName += h === 0 ? "borderThick" : "borderThin";
    //             }
    //             var hour = newnode("div", {
    //                 left: this.roundEm(((h - hourStart) * hourWidth)) + "em",
    //                 width: this.roundEm(hourWidth) + "em",
    //                 height: ((maxRows + 1) * CG_ROW_HEIGHT) + "px"
    //             }, { className: hourClassName }, [newnode("div", { fontSize: "10px" })]);
    //             dayTemplate.appendChild(hour);
    //             // extra lines?
    //             if (this.showFineGrid && !minimalistView) {
    //                 for (var j = 1; j < 12; j++) {
    //                     var bStyle = j % 3 === 0 ? " solid" : " dotted";
    //                     var bColor = h <= wdStart || h > wdEnd ? " #b1c2e4" : " #ddd";
    //                     var helper = extraLinesTemplate.cloneNode(true); // speed up
    //                     helper.style.borderLeft = "1px" + bStyle + bColor;
    //                     helper.style.left = this.roundEm((h - hourStart) * hourWidth + j * hourWidth / 12) + "em";
    //                     helper.style.height = ((maxRows + 1) * CG_ROW_HEIGHT) + "px";
    //                     dayTemplate.appendChild(helper);
    //                 }
    //             }
    //         }
    //     }
    //     // queue
    //     Self.dataGridContainer.className += " busy";
    //     Self.dataGrid.style.visibility = "hidden";
    //     window.setTimeout(function () {
    //         // loop over days
    //         var width = CG_PX2EM * (Self.dayIntervalEnd - Self.dayIntervalStart + 1)  / 24;
    //         for (var i = 0; i < maxCols; i++) {
    //             // clone day
    //             var day = dayTemplate.cloneNode(true);
    //             // set left
    //             day.style.left = i * width + "em";
    //             // add to fragment
    //             frag.appendChild(day);
    //         }
    //         // shadows (horizontal; one extra row for new members)
    //         for (var r = 0; r <= maxRows; r++) {
    //             if (r % 2 === 1) { // IE ||
    //                 var shadowsPerRow = IE ? Math.ceil(maxCols / 2) : 1; // IE opacity fix
    //                 for (var i = 0; i < shadowsPerRow; i++) {
    //                     var shadow = newnode("div", {
    //                         top: (r * CG_ROW_HEIGHT - 1) + "px",
    //                         left: Self.roundEm(i * maxCols * gridDayWidth / shadowsPerRow) + "em",
    //                         width: Self.roundEm(maxCols * gridDayWidth / shadowsPerRow) + "em",
    //                         backgroundColor: IE && false ? "transparent" : "black"
    //                     }, { className: "rowShadow" }, [newnode("div", { fontSize: "10px" })]);
    //                     frag.appendChild(shadow);
    //                 }
    //             }
    //         }
    //         var lastRow = newnode("div", {
    //             top: ((maxRows + 1) * CG_ROW_HEIGHT - 1) + "px",
    //             width: (maxCols * gridDayWidth) + "em"
    //         }, { className: "lastRow" }, [newnode("div", { fontSize: "10px" })]);
    //         frag.appendChild(lastRow);

    //         // add fragment
    //         Self.dataGrid.appendChild(frag);

    //         // auto zoom?
    //         if (Self.autoZoomOn) {
    //             Self.autoZoom();
    //         }

    //         // show
    //         Self.dataGrid.style.visibility = "visible";
    //         var n = Self.dataGridContainer;
    //         n.className = n.className.replace(/busy/g, "");

    //     }, 10);

    //     //--------------------------------------------------------------------------

    //     // add scroll/zoom position fix
    //     // this one is required to keep the horizontal scroll position during zoom
    //     var top = "0px", left = "0px";
    //     if (this.scrollPositionFix) {
    //         top = this.scrollPositionFix.style.top || "0px";
    //         left = this.scrollPositionFix.style.left || "0px";
    //     }
    //     this.scrollPositionFix = newnode("div", {
    //         position: "absolute",
    //         top: top,
    //         height: "1px",
    //         left: left,
    //         width: "1px",
    //         zIndex: 0
    //     });
    //     this.dataGrid.appendChild(this.scrollPositionFix);

    //     //--------------------------------------------------------------------------

    //     // draw header
    //     var leftHeaderText = newtext(_("Team Members")); /* i18n */
    //     var src = !this.isSorted ? "img/dummy.gif" :
    //         this.sortAsc ? "img/arrows/sort_up.gif" : "img/arrows/sort_down.gif";
    //     var leftHeaderSort = newnode("img", {
    //         position: "absolute",
    //         right: "2px",
    //         top: "8px",
    //         width: "16px",
    //         height: "16px",
    //         border: "0px none"
    //     }, {
    //         src: getFullImgSrc(src),
    //         alt: ""
    //     });
    //     var src = this.numRows() > 0 ? "img/menu/remove_teammember.gif" : "img/menu/remove_teammember_d.gif";
    //     var leftHeaderRemove = newnode("img", {
    //         position: "absolute",
    //         left: "10px",
    //         top: "8px",
    //         width: "16px",
    //         height: "16px",
    //         border: "0px none"
    //     }, {
    //         src: getFullImgSrc(src),
    //         alt: ""
    //     });
    //     var leftHeader = newnode("div", {
    //         position: "absolute",
    //         top: "0px",
    //         left: "0px",
    //         width: "163px",
    //         height: "30px",
    //         lineHeight: "30px",
    //         fontSize: "9pt",
    //         textAlign: "left",
    //         paddingLeft: "36px",
    //         borderRight: "1px solid #ccc",
    //         cursor: "pointer"
    //     }, null, [leftHeaderRemove, leftHeaderText, leftHeaderSort]);
    //     // add event (sort)
    //     addDOMEvent(leftHeader, "click", function () {
    //         // sort
    //         Self.sort();
    //         // change sort direction
    //         Self.sortAsc = !Self.sortAsc;
    //         // update
    //         Self.clearPartial();
    //         Self.update();
    //     });
    //     // add event (remove)
    //     addDOMEvent(leftHeaderRemove, "click", function (e) {
    //         // remove all members
    //         Self.removeAll();
    //         // update
    //         Self.clearPartial();
    //         Self.update();
    //         stopEvent(e);
    //     });
    //     this.gridHeader = newnode("div", {
    //         position: "absolute",
    //         top: "0px",
    //         left: "200px",
    //         right: "0px",
    //         height: "30px",
    //         fontSize: fs,
    //         overflow: "hidden",
    //         cursor: "ew-resize"
    //     }, {
    //         className: "gridHeader"
    //     });
    //     var header = newnode("div", {
    //         position: "absolute",
    //         top: "0px",
    //         right: "0px",
    //         left: "0px",
    //         height: "28px",
    //         backgroundColor: "#eee",
    //         borderBottom: "1px solid #ccc"
    //     }, null, [leftHeader, this.gridHeader]);

    //     //--------------------------------------------------------------------------

    //     // add days & hours to time grid header
    //     var view = this.view;
    //     var localFormatDate = function (d) {
    //         // show date number only in month view
    //         return view === "MONTH" ? formatDateTime("dd", new Date(d)) : formatDate(d, "dateshortday");
    //     };
    //     var baseTime = this.gridIntervalStart.getTime(), time, centerClass = "";
    //     var dayWidth = CG_PX2EM * (hourStop - hourStart + 1) / 24;
    //     for (var i = 0, hoursTotal = 0; i < maxCols; i++) {
    //         // create days
    //         var dayText;
    //         // get time
    //         time = baseTime + i * this.ONE_DAY;
    //         // LEFT
    //         dayText = localFormatDate(time);
    //         this.gridHeader.appendChild(newnode("div", {
    //             left: (i * dayWidth) + "em",
    //             width: dayWidth / 3 + "em",
    //             textAlign: "center"
    //         }, {
    //             className: "smallDayContainer"
    //         }, [ newnode("div", 0, {className : "day" }, [newtext(dayText)]) ]));
    //         // CENTER
    //         weekday = (new Date(time).getUTCDay() + 6) % 7 + 1;
    //         centerClass = weekday > 5 ? "dayContainer weekend" : "dayContainer";
    //         this.gridHeader.appendChild(newnode("div", {
    //             left: (i * dayWidth + 1 * dayWidth / 3) + "em",
    //             width: dayWidth / 3 + "em",
    //             textAlign: "center"
    //         }, {
    //             className: centerClass
    //         }, [ newnode("div", 0, {className : "day" }, [newtext(dayText)]) ]));
    //         // RIGHT
    //         this.gridHeader.appendChild(newnode("div", {
    //             left: (i * dayWidth + 2 * dayWidth / 3) + "em",
    //             width: dayWidth / 3 + "em",
    //             textAlign: "center"
    //         }, {
    //             className: "smallDayContainer"
    //         }, [ newnode("div", 0, { className : "day" }, [newtext(dayText)]) ]));
    //         // add hours
    //         for (var h = hourStart; h <= hourStop; h++) {
    //             // create hour
    //             var left = (i * dayWidth) + ((h - hourStart) * hourWidth) + "em";
    //             var hour = newnode("div", {
    //                 "left": left,
    //                 "width": hourWidth + "em",
    //                 textAlign: "center"
    //             }, {
    //                 className: "hourContainer",
    //                 title: dayText
    //             }, [ newnode("div", 0, { className: "hour" }, [newtext(formatDate(baseTime + i * this.ONE_DAY + h * this.ONE_HOUR, "time"))])]);
    //             this.gridHeader.appendChild(hour);
    //             hoursTotal++;
    //         }
    //     }

    //     // add extra space on the very right to sync scrolling
    //     this.gridHeaderScrollBarFix = newnode("div", {
    //         position: "absolute",
    //         left: (hoursTotal * CG_PX2EM) + "em",
    //         width: "15px",
    //         height: "30px"
    //     });
    //     this.gridHeader.appendChild(this.gridHeaderScrollBarFix);

    //     // --------------------------------------------------------------------------

    //     // add "drag-scroll" (with "flick" gesture)
    //     this.gridHeaderScrolling = {
    //         on: false,
    //         start: 0,
    //         x: 0,
    //         lastX: 0,
    //         decel: 0,
    //         wait4decel: false,
    //         time: 0
    //     };
    //     addDOMEvent(this.gridHeader, "mousedown", function (e) {
    //         var ghs = Self.gridHeaderScrolling;
    //         ghs.x = Self.gridHeader.scrollLeft;
    //         ghs.start = e.clientX;
    //         ghs.decel = 0;
    //         ghs.wait4decel = false;
    //         ghs.on = true;
    //         ghs.time = (new Date()).getTime();
    //         // hide hours (since they make this terribly slow)
    //         Self.gridHeader.className = "gridHeader zoom0";
    //     });
    //     addDOMEvent(document, "mouseup", function (e) {
    //         var ghs = Self.gridHeaderScrolling;
    //         // turn scrolling off
    //         ghs.on = false;
    //         // get last scroll duration
    //         var duration = (new Date()).getTime() - ghs.time;
    //         // gesture?
    //         if (duration < 750 && ghs.wait4decel) {
    //             ghs.decel = 20 * (e.clientX - ghs.start > 0 ? +1 : -1);
    //             ghs.x = Self.dataGridContainer.scrollLeft;
    //             gridCalendarDecelerate();
    //         } else {
    //             // show hours
    //             Self.gridHeader.className = Self.zoom >= CG_HEAD_ZOOM ? "gridHeader zoom1" : "gridHeader zoom0";
    //         }
    //     });
    //     addDOMEvent(this.gridHeader, "mousemove", function (e) {
    //         var ghs = Self.gridHeaderScrolling;
    //         if (ghs.on) {
    //             var x = e.clientX - ghs.start;
    //             Self.dataGridContainer.scrollLeft = ghs.x - x;
    //             Self.gridHeader.scrollLeft = ghs.x - x;
    //             Self.manualScroll = true;
    //             ghs.wait4decel = true;
    //         }
    //     });
    //     function gridCalendarDecelerate() {
    //         var ghs = Self.gridHeaderScrolling;
    //         if (ghs.decel !== 0) {
    //             ghs.x = Math.round(ghs.x - ghs.decel);
    //             Self.dataGridContainer.scrollLeft = ghs.x;
    //             Self.gridHeader.scrollLeft = ghs.x;
    //             ghs.decel += ghs.decel > 0 ? -0.25 : +0.25;
    //             setTimeout(function () { gridCalendarDecelerate(); }, 5);
    //         } else {
    //             // show hours
    //             Self.gridHeader.className = Self.zoom >= CG_HEAD_ZOOM ? "gridHeader zoom1" : "gridHeader zoom0";
    //         }
    //     }

    //     // --------------------------------------------------------------------------

    //     // draw left column container
    //     var leftClass = this.mode === "minimized" ? "leftColumn minimized" : "leftColumn";
    //     this.leftColumn = newnode("div", null, { className: leftClass });
    //     this.leftColumnScrollBarFix = newnode("div", {
    //         position: "absolute",
    //         top: ((maxRows + 1) * CG_ROW_HEIGHT) + "px",
    //         left: "0px",
    //         width: "199px",
    //         height: "15px",
    //         zIndex: 0
    //     });
    //     this.leftColumn.appendChild(this.leftColumnScrollBarFix);

    //     // sync scrolling
    //     this.scrollSyncTimeout = null;
    //     this.scrollXAdjusted = false;
    //     this.scrollYAdjusted = false;
    //     // longer, "complicated" code for better scroll performance:
    //     this.scrollHandler = function () {

    //         // prevent double scrolling // following zooming
    //         if (Self.gridHeaderScrolling.on || Self.zooming) {
    //             return;
    //         }

    //         // update
    //         setTimeout(function () { Self.gridHeader.scrollLeft = Self.dataGridContainer.scrollLeft; }, 0);
    //         setTimeout(function () { Self.leftColumn.scrollTop = Self.dataGridContainer.scrollTop; }, 1);
    //         setTimeout(function () {
    //             Self.scrollPositionFix.style.left = Self.roundEm(Self.dataGridContainer.scrollLeft / Self.zoom) + "em";
    //             Self.scrollPositionFix.style.top = Self.dataGridContainer.scrollTop + "px";
    //         }, 2);

    //         // unimportant things
    //         setTimeout(function () {
    //             // remember if even scrolled
    //             Self.manualScroll = true;
    //             // adjustments
    //             if (!Self.scrollXAdjusted) {
    //                 var clientHeightDiff = Self.leftColumn.clientHeight - Self.dataGridContainer.clientHeight;
    //                 Self.gridHeaderScrollBarFix.style.width = clientHeightDiff + "px";
    //                 Self.scrollXAdjusted = true;
    //             }
    //             if (!Self.scrollYAdjusted) {
    //                 var clientHeightDiff = Self.leftColumn.clientHeight - Self.dataGridContainer.clientHeight;
    //                 Self.leftColumnScrollBarFix.style.height = clientHeightDiff + "px";
    //                 Self.scrollYAdjusted = true;
    //             }
    //         }, 10);
    //     };
    //     addDOMEvent(this.dataGridContainer, "scroll", this.scrollHandler);

    //     // --------------------------------------------------------------------------

    //     // draw members
    //     Self.memberDrag = {};
    //     var wrapper = function (Self, index) {
    //         return function (e) {
    //             Self.clickRow(index, e);
    //         };
    //     };
    //     for (var r = 0; r < maxRows; r++) {
    //         var row = this.rows[r];
    //         var className = "member" + (this.rowSelection[row.rowId] ? " rowSelected" : "");
    //         var div = newnode("div",
    //             { top: (r * CG_ROW_HEIGHT) + "px" },
    //             { "className": className }
    //         );
    //         this.drawLeftColumn(row, r, div);
    //         this.leftColumn.appendChild(div);
    //         // remember node
    //         row.node = div;
    //         // add listener
    //         addDOMEvent(div, "mousedown", wrapper(self, r));
    //     }

    //     // --------------------------------------------------------------------------

    //     // clear
    //     this.container.innerHTML = "";
    //     // add
    //     this.container.appendChild(this.dataGridContainer);
    //     this.container.appendChild(this.leftColumn);
    //     this.container.appendChild(header);
    //     // restore zoom level
    //     this.gridHeader.className = this.zoom >= CG_HEAD_ZOOM ? "gridHeader zoom1" : "gridHeader zoom0";
    //     this.dataGrid.className = this.zoom >= CG_HEAD_ZOOM ? "zoom1" : "zoom0";
    //     // restore scroll position
    //     this.dataGridContainer.scrollTop = Self.scrollPositionFix.offsetTop;
    //     this.dataGridContainer.scrollLeft = Self.scrollPositionFix.offsetLeft;
    //     this.gridHeader.scrollLeft = Self.scrollPositionFix.offsetLeft;
    //     this.invalidScrollPositions = false;

    //     //--------------------------------------------------------------------------

    //     // add "new" row (it might set the focus)
    //     var div = newnode("div",
    //         { top: (maxRows * CG_ROW_HEIGHT) + "px" },
    //         { "className": "member new" }
    //     );
    //     this.leftColumn.appendChild(div);
    //     this.drawLeftNewColumn(div);
    //     addDOMEvent(div, "click", function () {
    //         Self.selectNone();
    //     });

    //     // add "drop zone" for members
    //     this.memberDropZone = newnode("div", 0, { className: "dropzone" });
    //     this.leftColumn.appendChild(this.memberDropZone);

    //     //--------------------------------------------------------------------------

    //     // add "new appointment" dragger
    //     this.newAppDragger = newnode("div", {
    //         position: "absolute",
    //         top: "0px",
    //         height: ((maxRows + 1) * CG_ROW_HEIGHT) + "px",
    //         backgroundColor: "#555",
    //         opacity: "0.5",
    //         filter: "alpha(opacity=50)",
    //         zIndex: 20,
    //         visibility: "hidden"
    //     });
    //     this.dataGrid.appendChild(this.newAppDragger);

    //     // dragging logic
    //     this.newAppDrag = 0;
    //     this.newAppDragX = 0;
    //     this.newAppDragBase = 0;
    //     this.newAppDragTimeout = 0;
    //     addDOMEvent(this.dataGrid, "mousedown", function (e) {
    //         // ignore context menu
    //         if (e.button !== 2) {
    //             // potential drag
    //             Self.newAppDrag = 1;
    //             // remember position
    //             Self.newAppDragBase = getCumulativeOffset(Self.dataGridContainer).left;
    //             Self.newAppDragX = Self.snapX2grid(e.clientX + Self.dataGridContainer.scrollLeft - Self.newAppDragBase);
    //         }
    //     });
    //     addDOMEvent(this.dataGrid, "mouseup", function (e) {
    //         // create appointment?
    //         if (Self.newAppDrag === 2) {
    //             // get positions
    //             var x1 = Self.newAppDragX;
    //             var x2 = Self.snapX2grid(e.clientX + Self.dataGridContainer.scrollLeft - Self.newAppDragBase);
    //             // swap?
    //             if (x1 > x2) {
    //                 var tmp = x1;
    //                 x1 = x2;
    //                 x2 = tmp;
    //             }
    //             if (x2 !== x1) {
    //                 var startDate = new Date(Self.pixel2time(x1, true));
    //                 var endDate = new Date(Self.pixel2time(x2, true));
    //                 Self.createAppointmentForSelectedMembers(startDate, endDate);
    //             }
    //         }
    //         // stop dragging
    //         Self.newAppDrag = 0;
    //         Self.newAppDragger.style.visibility = "hidden";
    //         Self.newAppDragger.style.left = "0px";
    //     });
    //     addDOMEvent(this.dataGrid, "mousemove", function (e) {
    //         if (Self.newAppDrag === 1) {
    //             // show new appointment dragger
    //             Self.newAppDragger.style.visibility = "visible";
    //             Self.newAppDrag = 2;
    //         }
    //         if (Self.newAppDrag === 2) {
    //             var x = Self.snapX2grid(e.clientX + Self.dataGridContainer.scrollLeft - Self.newAppDragBase);
    //             // set width
    //             var width = x - Self.newAppDragX;
    //             if (width > 0) {
    //                 Self.newAppDragger.style.left = Self.newAppDragX + "px";
    //                 Self.newAppDragger.style.width = Math.max(1, width) + "px";
    //             } else {
    //                 Self.newAppDragger.style.left = (Self.newAppDragX + width) + "px";
    //                 Self.newAppDragger.style.width = Math.max(1, -width) + "px";
    //             }
    //         }
    //     });



    //     // add mousewheel support
    //     // get proper event name for mousewheel
    //     var eventName = navigator.userAgent.indexOf('Gecko') > -1 &&
    //         navigator.userAgent.indexOf('KHTML') === -1 ? "DOMMouseScroll" : "mousewheel";
    //     // zoom via mouse wheel
    //     addDOMEvent(this.dataGridContainer, eventName, function (e) {
    //         e.delta = 0;
    //         e.deltaSign = 0;
    //         if (e.wheelDelta) {
    //             e.delta = e.wheelDelta;
    //         } else if (e.detail) {
    //             e.delta = -e.detail;
    //         }
    //         // signed delta
    //         if (e.delta !== 0) {
    //             e.deltaSign = e.delta / Math.abs(e.delta);
    //         }
    //         // set new zoom level
    //         if (e.shiftKey) {
    //             Self.changeZoomLevel(Self.zoom + e.deltaSign * 20);
    //             stopEvent(e);
    //         } else {
    //             // always scroll horizontally (vertical scroll via mouse wheel is less important)
    //             var x = Self.snapX2grid(Self.dataGridContainer.scrollLeft, 1);
    //             x += Math.round(-e.deltaSign * 100 * CG_PX2EM * Self.zoom / 100 / 24);
    //             Self.dataGridContainer.scrollLeft = x;
    //             Self.gridHeader.scrollLeft = x;
    //             Self.manualScroll = true;
    //             stopEvent(e);
    //         }
    //     });

    //     // -------------------------------------------------------------------------

    //     // "double click to create appointment"
    //     addDOMEvent(this.dataGridContainer, "dblclick", function (e) {
    //         // get position
    //         var x = e.clientX + Self.dataGridContainer.scrollLeft - getCumulativeOffset(Self.dataGridContainer).left;
    //         var y = e.clientY + Self.dataGridContainer.scrollTop - getCumulativeOffset(Self.dataGridContainer).top;
    //         // convert pixel into time
    //         var t = Self.pixel2time(x, true);
    //         // get row index to get the member
    //         var r = Math.floor(y / CG_ROW_HEIGHT);
    //         // valid index?
    //         if (Self.rows[r]) {
    //             var row = Self.rows[r];
    //             // one member only
    //             var member = {};
    //             member[row.rowId] = row;
    //             // adjust member selection
    //             Self.clickRow(r);
    //             // open "create appointment" dialog (duration: one hour)
    //             var now = (new Date(t)).getTime();
    //             var start = new Date(Math.floor(now / Self.ONE_HOUR) * Self.ONE_HOUR);
    //             var end = new Date(Math.ceil(now / Self.ONE_HOUR) * Self.ONE_HOUR);
    //             Self.createAppointment(start, end, member);
    //         }
    //     });

    //     // -------------------------------------------------------------------------

    //     // update controls
    //     this.updateZoomControls(this.zoom);

    //     // -------------------------------------------------------------------------

    //     // add appointment container
    //     this.appContainer = newnode("div", {
    //         position: "absolute",
    //         top: "0px",
    //         left: "0px",
    //         width: (maxCols * gridDayWidth) + "em",
    //         height: (maxRows * CG_ROW_HEIGHT) + "px",
    //         zIndex: 10000
    //     });
    //     this.dataGrid.appendChild(this.appContainer);

    //     /* initialize hover */
    //     if (this.firstRun) {
    //         var hover = new Hover($("teamViewCalendarGrid"), OXAppointmentHover.getContent().node);
    //         hover.setSize(OXAppointmentHover.contentobject.node);
    //         /* event got triggered on each mouse move */
    //         hover.getTarget = function (node) {
    //             try {
    //                 while (node && ("getAttribute" in node)) {
    //                     if (node.getAttribute("ox_object_id")) {
    //                         return node.parentNode ? node : null;
    //                     }
    //                     node = node.parentNode;
    //                 }
    //             } catch (e) { /*see default implementation*/ }
    //         };
    //         /* event fired when getTarget found a node with valid attributes */
    //         hover.onShow = function (node, manual) {
    //             OXAppointmentHover.actualHover = this;
    //             var ref       = node.getAttribute("ox_rowId");
    //             var folder_id = node.getAttribute("ox_folder_id");
    //             var object_id = node.getAttribute("ox_object_id");
    //             var rec_pos   = node.getAttribute("ox_rec_pos");
    //             if (object_id !== null && folder_id !== null) {
    //                 // we have a folder and a object id so we can use the regular hover
    //                 OXAppointmentHover.refillContent(object_id, folder_id, rec_pos);
    //             } else if (ref !== undefined && Self.appointments && Self.appointments[ref]) {
    //                 // we don't have read permission so we just show content we are allowed to
    //                 var obj = { };
    //                 for (var i in Self.appointments[ref]) {
    //                     if (object_id === Self.appointments[ref][i].id) {
    //                         obj = clone(Self.appointments[ref][i]);
    //                         break;
    //                     }
    //                 }
    //                 // disable tabs we don't need
    //                 OXAppointmentHover.slider.getTabById("participants").show(false);
    //                 OXAppointmentHover.slider.getTabById("attachments").show(false);
    //                 OXAppointmentHover.slider.getTabById("others").show(false);
    //                 OXAppointmentHover.refillContentByObject(obj);
    //             }
    //         };
    //         hover.onHide = function (node) {
    //             // re-enable tabs for later use
    //             OXAppointmentHover.slider.getTabById("participants").show(true);
    //             OXAppointmentHover.slider.getTabById("attachments").show(true);
    //             OXAppointmentHover.slider.getTabById("others").show(true);
    //         };
    //         calendarhovers.teamday = hover;
    //         // must be fired once here to enable it, later a change view does it for us
    //         calendarhovers.teamday.enable();
    //         this.hoverInitialized = true;
    //     }

    //     this.paintAppointments();
    // };

    // CalendarGrid.prototype.paintAppointments = function () {

    //     // clear app container
    //     this.appContainer.style.visiblity = "hidden";
    //     this.appContainer.innerHTML = "";

    //     var Self = this;

    //     // required to get the right class names for different appointment types
    //     var shownAs2Class = { "1": "reserved", "2": "temporary", "3": "absent", "4": "free" };
    //     var shownAs2ZIndex = { "1": 4, "2": 2, "3": 3, "4": 1 };
    //     var shownAs2Filter = { "1": "reserved", "2": "tentative", "3": "absent", "4": "free" };

    //     // colorize
    //     var colorize = function (node, app) {
    //         // process categories
    //         var cat = ox.categories.getFirstMatch(app.categories);
    //         // category?
    //         if (cat && cat.color > 0) {
    //             // found category
    //             node.className += " colorLabel" + cat.color;
    //             return true;
    //         }
    //         // flag?
    //         else if (app.color_label) {
    //             node.className += " hasColorLabel flagColor" + app.color_label;
    //             return true;
    //         }
    //         // default
    //         else {
    //             node.style.backgroundColor = "white";
    //             node.style.color = "black";
    //             return false;
    //         }
    //     };

    //     Self.firstRun = false;

    //     // get and draw appointments (async.; should be the last thing to do here)
    //     this.getAppointments(function (folders) {
    //         try {
    //             // get milliseconds of start date
    //             var gridStart = Self.gridIntervalStart.getTime();
    //             var gridEnd = Self.gridIntervalEnd.getTime();
    //             var dayStart = Self.dayIntervalStart;
    //             var dayEnd = Self.dayIntervalEnd;
    //             var dayGap = dayStart + (24 - dayEnd - 1);
    //             var hourStart = Self.dayIntervalStart * Self.ONE_HOUR;

    //             // helper
    //             var getBounds = function (app) {

    //                 // get local copies
    //                 var start = app.start_date, stop = app.end_date, h;

    //                 function shrink(t) {
    //                     return t - (t / Self.ONE_DAY >> 0) * dayGap * Self.ONE_HOUR;
    //                 }

    //                 function shrinkRange(start, stop) {
    //                     var d1 = new Date(start), d2 = new Date(stop);
    //                     var overlap = d1.getUTCDate() !== d2.getUTCDate() ? 1 : 0;
    //                     return (stop - start) - Math.max(((stop - start) / Self.ONE_DAY) >> 0, overlap) * dayGap * Self.ONE_HOUR;
    //                 }

    //                 // too far left?
    //                 start = start > gridStart ? start : gridStart;
    //                 // too far right?
    //                 stop = stop < gridEnd ? stop : gridEnd;

    //                 // get date objects
    //                 var d1 = new Date(start);
    //                 var d2 = new Date(stop);

    //                 // get start hour
    //                 h = d1.getUTCHours();
    //                 // shift?
    //                 if (h < Self.dayIntervalStart) {
    //                     // move start date
    //                     start = Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate(), Self.dayIntervalStart, 0, 0);
    //                 } else if (h > Self.dayIntervalEnd) {
    //                     // move start to next day
    //                     start = Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate() + 1, Self.dayIntervalStart, 0, 0);
    //                 }
    //                 h = d2.getUTCHours();
    //                 // shift?
    //                 if (h >= Self.dayIntervalEnd + 1) {
    //                     // move stop date
    //                     stop = Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate(), Self.dayIntervalEnd + 1, 0, 0);
    //                 } else if (h < Self.dayIntervalStart) {
    //                     // move stop to yesterday
    //                     stop = Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate() - 1, Self.dayIntervalEnd + 1, 0, 0);
    //                 }
    //                 // get relative start
    //                 var rel = start - gridStart;
    //                 // get days
    //                 var days = ((rel / Self.ONE_DAY) >> 0);
    //                 // consider missing hours
    //                 rel = shrink(rel) - hourStart;

    //                 // calculate position & width
    //                 var left = rel * CG_PX2EM / Self.ONE_DAY;
    //                 var width = shrinkRange(start, stop) * CG_PX2EM / Self.ONE_DAY;

    //                 return { left: left, width: width };
    //             };

    //             // loop rows
    //             for (var r = 0; r < Self.numRows(); r++) {
    //                 var row = Self.rows[r];
    //                 // look up appointments
    //                 var appointments = Self.appointments[row.rowId];
    //                 var userId = row.id;
    //                 var filter;
    //                 // loop appointments
    //                 for (var i = 0; i < appointments.length; i++) {
    //                     var app = appointments[i];
    //                     // filter?
    //                     filter = shownAs2Filter[app.shown_as];
    //                     if (!Self.filter[filter]) {
    //                         // do not show!
    //                         continue;
    //                     }
    //                     var canRead = app.folder_id !== undefined;
    //                     var canWrite = false;
    //                     // check object write permissions
    //                     if (canRead && folders[app.folder_id] !== undefined) {
    //                         canWrite = ox.api.folder.can("write", folders[app.folder_id]);
    //                         // @todo: i'm not sure if it's enough to check the own permissions. i assume it fails
    //                         // as soon as you are member of a group. in this case the permissions array has to
    //                         // be checked -> similar to function 'permissionsToViewObjects'.
    //                     }
    //                     var innerDiv = null;
    //                     var wholeday = !!app.full_time;
    //                     // mode?
    //                     if (Self.mode === "minimized") {
    //                         // minimized
    //                         var className = "appointment";
    //                         var appTitle = app.title || "\u2013"; // aka &ndash;
    //                         innerDiv = newnode("div", {
    //                             padding: "2px 0px 1px 5px",
    //                             fontSize: "8pt",
    //                             fontWeight: "bold"
    //                         }, {
    //                             className: className
    //                         }, [newtext(appTitle)]);
    //                         // colorize
    //                         if (!colorize(innerDiv, app)) {
    //                             // add border
    //                             innerDiv.style.border = "1px solid #555";
    //                         }
    //                     }
    //                     else if (Self.mode === "bars") {
    //                         // bars only
    //                         var className = "appointment bar " + shownAs2Class[app.shown_as];
    //                         innerDiv = newnode("div", null, { "className": className });
    //                     }
    //                     else {
    //                         // show details
    //                         // create inner div
    //                         var className = "appointment " + shownAs2Class[app.shown_as] +
    //                             // read permission?
    //                             (canWrite ? "" : " norights") +
    //                             // all day?
    //                             (wholeday ? " wholeday": "");
    //                         // title
    //                         var appTitle = app.title || "\u2014"; // aka &mdash;
    //                         // is owner?
    //                         if (app.created_by === userId) {
    //                             appTitle += " \u2022"; // aka &bull;
    //                         }
    //                         innerDiv = newnode("div", null, { "className": className }, [
    //                             // add title
    //                             newnode("b", 0, 0, [newtext(appTitle)]),
    //                             // add time interval / wholeday
    //                             newnode("br"),
    //                             newtext(wholeday ? _("All day") : /* i18n */
    //                                 formatDate(app.start_date, "time") + " - " +
    //                                 formatDate(app.end_date, "time")
    //                             ),
    //                             newtext(", "), //newnode("br"),
    //                             // start date
    //                             newtext(formatDate(app.start_date, "dateday") +
    //                                 // add end date?
    //                                 (app.end_date - app.start_date > Self.ONE_DAY
    //                                     ? " - " + formatDate(app.end_date - 1,
    //                                                          "dateday")
    //                                     : "")
    //                             ),
    //                             // add blank line
    //                             newnode("br"),
    //                             newtext("\u00A0") // aka &nbsp;
    //                         ]);
    //                         // colorize
    //                         colorize(innerDiv, app);
    //                     }
    //                     // set required attributes to enable hovers
    //                     if (canRead) {
    //                         innerDiv.setAttribute("ox_folder_id", app.folder_id);
    //                     }
    //                     innerDiv.setAttribute("ox_object_id", app.id);
    //                     if (app.recurrence_position) {
    //                         innerDiv.setAttribute("ox_rec_pos", app.recurrence_position);
    //                     }
    //                     innerDiv.setAttribute("ox_rowId", row.rowId);
    //                     // now convert microseconds to "em"!
    //                     var top, height;
    //                     switch (Self.mode) {
    //                     case "details":
    //                         top = r * CG_ROW_HEIGHT + 5 + (wholeday ? 0 : -3);
    //                         height = CG_ROW_HEIGHT - 10 - 1 + (wholeday ? 0 : 6);
    //                         break;
    //                     case "bars":
    //                         top = r * CG_ROW_HEIGHT + 2;
    //                         height = CG_ROW_HEIGHT - 10 - 1;
    //                         break;
    //                     case "minimized":
    //                         top = r * CG_ROW_HEIGHT + 0;
    //                         height = CG_ROW_HEIGHT - 2;
    //                         break;
    //                     }
    //                     // get bounds
    //                     var bounds = getBounds(app);
    //                     var left = bounds.left;
    //                     var width = bounds.width;
    //                     if (width <= 0) continue;
    //                     // get z-index
    //                     var z = 12 + (shownAs2ZIndex[app.shown_as] || 1);
    //                     // is series?
    //                     if (app.recurrence_position) {
    //                         z -= 4;
    //                     }
    //                     // is wholeday
    //                     if (wholeday) {
    //                         z -= 8;
    //                     }
    //                     // create outer div
    //                     var div = newnode("div", {
    //                         "position": "absolute", "top": top + "px", "left": Self.roundEm(left) + "em",
    //                         "width": Self.roundEm(width) + "em", "height": height + "px",
    //                         "zIndex": z
    //                     }, null, [innerDiv]);
    //                     // add to dom
    //                     Self.appContainer.appendChild(div);
    //                     // add listener
    //                     if (canWrite) {
    //                         // observe by selection
    //                         var id = app.folder_id+"."+app.id+"."+app.recurrence_position+"@"+row.rowId;
    //                         Self.appointmentSelection.observe(innerDiv, id, app);
    //                         // add double click edit
    //                         var wrapper = (function (Self, app) {
    //                             return function (e) {
    //                                 // copy
    //                                 selectedAppointment = app;
    //                                 stopEvent(e);
    //                                 triggerEvent("OX_Calendar_Edit");
    //                             };
    //                         })(Self, app);
    //                         addDOMEvent(innerDiv, "dblclick", wrapper);

    //                         // add context menu
    //                         addDOMEvent(innerDiv, "contextmenu", function (e) {
    //                             globalContextMenus.teamview.display(
    //                                e.clientX, e.clientY, Self.appointmentSelection.fetch()
    //                             );
    //                         });
    //                     }
    //                 }
    //             }

    //             // "deselect all" click
    //             addDOMEvent(Self.dataGridContainer, "click", function (e) {
    //                 Self.appointmentSelection.clear();
    //                 stopEvent(e);
    //             });

    //             // trigger initial selection event
    //             triggerEvent("Selected", Self.appointmentSelection.getSelectedItems());

    //         } catch(e) { if (console && console.error) { console.error("Unexpected", e); } }

    //         Self.appContainer.style.visiblity = "visible";

    //         // scroll to "now" or working start time
    //         if (!Self.manualScroll) {
    //             var d, t;
    //             // use current date of mini calendar
    //             if (oMiniCalendar) {
    //                 d = new Date(Date.UTC(activeYear, activeMonth, activeDay));
    //             } else {
    //                 d = new Date();
    //             }
    //             // inside interval?
    //             if (Self.insideGridInterval(d)) {
    //                 // scroll to now (today's working start)
    //                 t = Math.floor(d.getTime()/Self.ONE_DAY) * Self.ONE_DAY + ((Self.workdayStart || 0)-1) * Self.ONE_HOUR;
    //             } else {
    //                 // scroll to working day start
    //                 t = Self.gridIntervalStart.getTime() + ((Self.workdayStart || 0)-1) * Self.ONE_HOUR;
    //             }
    //             // scroll
    //             setTimeout(function () {
    //                 Self.scroll2Date(new Date(t), Self.ONE_HOUR);
    //             }, 10);
    //         }
    //     });
    // };

    // CalendarGrid.prototype.clearPartial = function () {
    //     // clear
    //     if (this.dataGrid && this.appContainer && this.leftColumn) {
    //         // hide first (responsiveness)
    //         this.dataGrid.style.visibility = "hidden";
    //         this.appContainer.style.visibility = "hidden";
    //         this.leftColumn.style.visibility = "hidden";
    //         // clear
    //         this.dataGrid.innerHTML = "";
    //         this.appContainer.innerHTML = "";
    //         this.leftColumn.innerHTML = "";
    //         // show
    //         this.dataGrid.style.visibility = "visible";
    //         this.appContainer.style.visibility = "visible";
    //         this.leftColumn.style.visibility = "visible";
    //     }
    // };

    // CalendarGrid.prototype.drawLeftColumn = function (row, index, parentNode) {

    //     var Self = this;

    //     // icon
    //     var src = "";
    //     switch (row.data.type) {
    //         default: /* no break */
    //         case 1: src = "icons/16/user.png"; break;
    //         case 3: src = "img/calendar/ressourcen.gif"; break;
    //     }
    //     var icon = newnode("img", 0, {
    //         src: getFullImgSrc(src), alt: ""
    //     });
    //     parentNode.appendChild(icon);

    //     // remove member "X"
    //     var remove = newnode("div", 0, { className: "memberX" }, [newtext("\u00d7")]); // &times;
    //     parentNode.appendChild(remove);
    //     addDOMEvent(remove, "click", function (e) {
    //         // trigger event
    //         // this row is already selected since the selection routine waits for mousedown
    //         triggerEvent('OX_Calendar_Teammember_Remove');
    //     });

    //     // text
    //     // remove surrounding quoting marks
    //     row.display_name = row.display_name.replace(/(^"|"$)/g, '');
    //     // add node
    //     parentNode.appendChild(newtext(row.display_name));

    //     // add dragger
    //     addDOMEvent(parentNode, "mousedown", function (e) {
    //         if (!Self.memberDrag.on) {
    //             // stand by
    //             Self.memberDrag.standBy = true;
    //             Self.memberDrag.startY = e.clientY - parentNode.offsetTop;
    //             // define listener
    //             Self.memberDrag.mover = function (e) {
    //                 if (!Self.memberDrag.on && Self.memberDrag.standBy) {
    //                     Self.memberDrag.on = true;
    //                     Self.memberDrag.standBy = false;
    //                     // make clone
    //                     Self.memberDrag.clone = parentNode.cloneNode(false);
    //                     // adjust node design
    //                     parentNode.className += " drag";
    //                     // add clone
    //                     parentNode.parentNode.appendChild(Self.memberDrag.clone);
    //                     // adjust clone design
    //                     Self.memberDrag.clone.className += " clone";
    //                     // show drop zone
    //                     Self.memberDropZone.style.visibility = "visible";
    //                 }
    //                 if (Self.memberDrag.on) {
    //                     // move node
    //                     var y = Math.max(0, e.clientY - Self.memberDrag.startY);
    //                     parentNode.style.top = y + "px";
    //                     // move drop zone
    //                     var index = Math.min(Math.round(y/CG_ROW_HEIGHT), Self.numRows());
    //                     Self.memberDropZone.style.top = (index * CG_ROW_HEIGHT-2) + "px";
    //                 }
    //             };
    //             // add event
    //             Self.memberDrag.stopper = handler;
    //             addDOMEvent(document, "mouseup", Self.memberDrag.stopper);
    //             addDOMEvent(document, "mousemove", Self.memberDrag.mover);
    //         }
    //     });
    //     var handler = function (e) {
    //         // get state
    //         var wasOn = Self.memberDrag.on;
    //         // remove event
    //         removeDOMEvent(document, "mouseup", Self.memberDrag.stopper);
    //         removeDOMEvent(document, "mousemove", Self.memberDrag.mover);
    //         // stop
    //         Self.memberDrag.on = false;
    //         Self.memberDrag.standBy = false;
    //         // hide drop zone
    //         Self.memberDropZone.style.visibility = "hidden";
    //         // get last position
    //         var y = Math.max(0, e.clientY - Self.memberDrag.startY);
    //         if (wasOn) {
    //             // determine indexes
    //             var oldIndex = row.index;
    //             var index = Math.min(Math.round(y/CG_ROW_HEIGHT), Self.numRows()+1);
    //             // anything to do?
    //             if (Math.abs(oldIndex-index) >= 1) {
    //                 // remove row
    //                 Self.removeById(row.rowId);
    //                 // adjust index
    //                 index = oldIndex < index ? index-1 : index;
    //                 // insert row
    //                 Self.insertAt(row, index);
    //             }
    //             // update
    //             Self.selectNone();
    //             Self.clearPartial();
    //             Self.update();
    //         }
    //     };
    // };

    // CalendarGrid.prototype.drawLeftNewColumn = function (parentNode) {

    //     var Self = this;

    //     // icon
    //     var icon = newnode("img", 0, {
    //         src: getFullImgSrc("img/menu/add_member_participant.gif"), alt: ""
    //     });
    //     parentNode.appendChild(icon);
    //     // open dialog when clicking the icon
    //     addDOMEvent(icon, "click", function (e) {
    //         triggerEvent('OX_Calendar_Teammember_Add');
    //     });

    //     // text
    //     var inputField = newnode("input",
    //         { width: "150px" }, { value: "" }
    //     );
    //     inputField.type = "text";
    //     parentNode.appendChild(inputField);

    //     // set focus if visible
    //     if (this.isShowing()) {
    //         inputField.focus();
    //         inputField.select();
    //         // better safe then sorry (IE)
    //         Self.leftColumn.scrollTop = Self.dataGridContainer.scrollTop;
    //         setTimeout(function () {
    //             Self.leftColumn.scrollTop = Self.dataGridContainer.scrollTop;
    //         }, 50); // yes, twice!
    //     }

    //     // add auto complete feature (in place editing)
    //     var autoCom = new AutoComplete(inputField, this.autoCompleteContainer, 25, configGetKey("minimumSearchCharacters") || 2, 100);
    //     autoCom.autoAdjustHeight = false;
    //     autoCom.showDisplayNamesOnly = true;
    //     autoCom.showSystemUsersOnly = true;
    //     autoCom.additionalRequests = function(pattern) {
    //         // search for resource
    //         return [{
    //             module: "resource",
    //             action: "search",
    //             data: { pattern: pattern }
    //         }];
    //     };
    //     autoCom.onAdditionalResponse = function(response, index) {
    //         for (var i = 0; i < response.data.length; i++) {
    //             var data = response.data[i];
    //             var objectData = {
    //                 type: 3, // resource
    //                 id: data.id,
    //                 folder: 0,
    //                 display_name: data.display_name
    //             };
    //             var key = data.display_name + " <" + data.mailaddress + ">";
    //             this.cache.add(key, [key]);
    //             this.nameIndex[key] = objectData;
    //         }
    //     };

    //     // override onKeyEnter
    //     autoCom.onSelect = function (elem, st) {
    //         // get name & id
    //         var display_name = elem.getAttribute("oval");
    //         var member = autoCom.nameIndex[display_name];
    //         if (member) {
    //             // create member
    //             var row = new CalendarGridRow(member.type, member.id, member.display_name);
    //             row.data = member;
    //             Self.add(row);
    //             // update grid
    //             Self.clearPartial();
    //             Self.update();
    //         }
    //     };
    // };

    // CalendarGrid.prototype.isShowing = function () {
    //     // start with dataGridContainer instead of dataGrid (the latter is invisible during refresh)
    //     var node = this.dataGridContainer;
    //     do {
    //         // return false if parent nodes are invisible
    //         if (node.style.visibility === "hidden" || node.style.display === "none") {
    //             return false;
    //         }
    //         // climb up
    //         node = node.parentNode;
    //     } while (node !== document.body);
    //     return true;
    // };

    // function CalendarGridRow(type, id, name, data) {
    //     this.type = type;
    //     this.id = id;
    //     // sequenced "id:type" to allow cooperation with team week:
    //     this.rowId = id; // + ":" + type;
    //     this.display_name = name || "New member";
    //     // keep original data (might be useful in future)
    //     this.data = data || {};
    //     // reference to DOM node / makes selection of rows much easier
    //     this.node = null;
    //     // current index
    //     this.index = 0;
    // }

    // //------------------------------------------------------------------------------

    // var simpleSelectionHash = {};

    // function getSimpleSelection(id) {
    //     // exists?
    //     if (typeof(simpleSelectionHash[id]) === "undefined") {
    //         simpleSelectionHash[id] = new SimpleSelection();
    //     }
    //     return simpleSelectionHash[id];
    // }

    // function SimpleSelection() {
    //     this.multiple = true;
    //     this.domNodes = {};
    //     this.selectedItems = {};
    //     this.observedItems = {};
    //     this.changedEvent = null;
    //     this.lastSelectedItem = null;
    // }

    // SimpleSelection.prototype.setMultiple = function (flag) {
    //     this.multiple = !!flag;
    // };

    // SimpleSelection.prototype.setChangedEvent = function (eventName) {
    //     this.changedEvent = eventName;
    //     this.triggerChangedEvent();
    // };

    // SimpleSelection.prototype.triggerChangedEvent = function () {
    //     if (this.changedEvent) {
    //         triggerEvent(this.changedEvent, this.getSelectedItems());
    //     }
    // };

    // SimpleSelection.prototype.observe = function (DOMNode, id, item) {
    //     if (DOMNode) {
    //         // add listener
    //         var wrapper = (function (Self, id) {
    //              return function (e) {
    //                  Self.click(id, e.ctrlKey, e.shiftKey);
    //              };
    //         })(this, id);
    //         addDOMEvent(DOMNode, "click", wrapper);
    //         addDOMEvent(DOMNode, "click", stopEvent);
    //         // add second listener (context menu)
    //         var contextWrapper = (function (Self, id) {
    //             return function (e) {
    //                 if (!Self.isSelected(id)) {
    //                     Self.click(id, false, false);
    //                 }
    //             };
    //         })(this, id);
    //         addDOMEvent(DOMNode, "contextmenu", contextWrapper);
    //         // add to observation list
    //         this.observedItems[id] = item;
    //         // add to dom node list
    //         this.domNodes[id] = DOMNode;
    //     }
    // };

    // SimpleSelection.prototype.click = function (id, multiple, range) {
    //     // multiple?
    //     if (!this.multiple || !multiple) {
    //         // clear selection
    //         this.clear();
    //     }
    //     // range?
    //     if (range && this.lastSelectedItem) {
    //         // select range
    //         this.selectRange(this.lastSelectedItem, id);
    //     } else {
    //         // add single item to selection
    //         this.toggle(id);
    //         // remember last item
    //         this.lastSelectedItem = id;
    //     }
    //     // trigger event
    //     this.triggerChangedEvent();
    // };

    // SimpleSelection.prototype.selectRange = function (lastId, newId) {
    //     var Self = this;
    //     // get grid
    //     getCalendarGridIfExists("teamview", function (grid) {
    //         // get user id
    //         var fromUser = lastId.match(/@(\d+:\d+)$/);
    //         var toUser = newId.match(/@(\d+:\d+)$/);
    //         if (fromUser.length && toUser.length) {
    //             var members = [];
    //             // get indexes
    //             var fromIndex = grid.rowIndex[fromUser[1]];
    //             var toIndex = grid.rowIndex[toUser[1]];
    //             // swap?
    //             if (fromIndex > toIndex) {
    //                 var tmp = fromIndex; fromIndex = toIndex; toIndex = tmp;
    //             }
    //             // loop through rows
    //             for (var i = fromIndex; i <= toIndex; i++) {
    //                 members.push(grid.rows[i].rowId);
    //             }
    //             // create regex
    //             var regex = new RegExp("@(" + members.join("|") + ")$");
    //             // get start time
    //             var fromDate = Self.observedItems[lastId].start_date;
    //             var toDate = Self.observedItems[newId].start_date;
    //             // swap?
    //             if (fromDate > toDate) {
    //                 var tmp = fromDate; fromDate = toDate; toDate = tmp;
    //             }
    //             // now loop through appointments
    //             for (var id in Self.observedItems) {
    //                 var item = Self.observedItems[id];
    //                 // check item
    //                 if (item.start_date >= fromDate && item.start_date <= toDate && regex.test(id) ) {
    //                     Self.select(id);
    //                 }
    //             }
    //         }
    //     });
    // };

    // SimpleSelection.prototype.select = function (id) {
    //     this.selectedItems[id] = this.observedItems[id];
    //     this.selectedItems[id].selectionId = id;
    //     var node = this.domNodes[id];
    //     if (node) {
    //         node.className += " isSelected";
    //     }
    // };

    // SimpleSelection.prototype.deselect = function (id) {
    //     delete this.selectedItems[id];
    //     var node = this.domNodes[id];
    //     if (node) {
    //         node.className = node.className.replace(/\s?isSelected/, "");
    //     }
    // };

    // SimpleSelection.prototype.isSelected = function (id) {
    //     return typeof(this.selectedItems[id]) !== "undefined";
    // };

    // SimpleSelection.prototype.toggle = function (id) {
    //     if (this.isSelected(id)) {
    //         this.deselect(id);
    //     } else {
    //         this.select(id);
    //     }
    // };

    // SimpleSelection.prototype.clear = function () {
    //     // deselect items
    //     for (var id in this.selectedItems) {
    //         this.deselect(id);
    //     }
    //     // trigger event
    //     this.triggerChangedEvent();
    // };

    // SimpleSelection.prototype.numSelected = function () {
    //     var count = 0;
    //     for (var id in this.selectedItems) {
    //         count++;
    //     }
    //     return count;
    // };

    // SimpleSelection.prototype.getSelectedItems = function () {
    //     var list = [];
    //     for (var id in this.selectedItems) {
    //         list.push(this.selectedItems[id]);
    //     }
    //     return list;
    // };

    // SimpleSelection.prototype.getSelection = function () {
    //     var list = [];
    //     for (var id in this.selectedItems) {
    //         list.push(id);
    //     }
    //     return list;
    // };

    // /* to work with context menus */
    // SimpleSelection.prototype.fetch = function () {
    //     return this;
    // };

});
