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

define("io.ox/calendar/main", ["io.ox/calendar/api", "io.ox/core/config"], function (api, config) {

    // application object
    var app = ox.ui.createApp(),
        // app window
        win;
    
    // launcher
    app.setLauncher(function () {
    
        // get window
        app.setWindow(win = ox.ui.createWindow({
            title: "Calendar",
            subtitle: new Date() + "",
            search: true,
            settings: true
        }));
        
        var view = "day",
            container = $(),
            dom = {},
            startDate = api.floor(new Date(/*"Mon Feb 22 2010"*/).getTime() + api.HOUR, "week"),
            HOUR_HEIGHT = 40,
            zoom = 150,
            weekStart = 0,
            weekEnd = 0,
            step = 50,
            // time
            startTime = config.get("gui.calendar.starttime", 8),
            endTime = config.get("gui.calendar.endtime", 18),
            // sliders
            sliderA,
            sliderB;
        
        // dom scaffold
        win.nodes.main
            .append(
                container = $("<div/>").addClass("abs").css({
                    bottom: "30px", right: "10px"
                })
            )
            .append(
                $("<div/>").addClass("abs").css({
                    top: "auto", height: "19px", paddingTop: "10px",
                    backgroundColor: "#f0f0f0", borderTop: "1px solid #ccc"
                })
                .append(
                    sliderA = $("<div/>").css({ display: "inline-block", margin: "0 20px 0 20px" })
                )
                .append(
                    sliderB = $("<div/>").css({ display: "inline-block" })
                )
            );
        
        var formatDate = function (d) {
            return d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear();
        };
        
        var getAppointments = function (startDate, callback) {
            var start = startDate, end = start + api.DAY;
            api.list(0, start, end)
                .done(callback);
        };
        
        var updateZoom = function () {
            if (dom.zoomContainer) {
                var z = Math.round(zoom);
                dom.zoomContainer.css({ height: z + "%" });
            }
        };
        
        var clear = function () {
            // clear container
            container.empty();
            // remove references
            for (var id in dom) {
                dom[id] = null;
                delete dom[id];
            }
        };
        
        var styles = {
            1: { background: "#f7fbff", border: "#1c4a82" }, // reserved
            2: { background: "#f3eee0", border: "#f3b411" }, // temporary
            3: { background: "#fff6f6", border: "#8b1717" }, // absent
            4: { background: "#faffe5", border: "#72881b" }  // free
        };
            
        var paintDayAppointment = function (app, startDate, node) {
            // convert dates to dimension
            var pct = 100/24;
            var top = api.floor(app.start_date - startDate) / api.HOUR * pct;
            var height = (app.end_date - app.start_date) / api.HOUR * pct;
            // colors
            var shown_as = app.shown_as || 1;
            var backgroundColor = styles[shown_as].background;
            var border = styles[shown_as].border;
            // paint appointment
            var outer = $("<div/>").
                css({
                    position: "absolute", zIndex: 10,
                    left: "5px", right: "5px", top: top + "%", height: height + "%",
                    MozBorderRadius: "10px", webkitBorderRadius: "10px",
                    backgroundColor: "white", //backgroundColor,
                    border: "1px solid #555",
                    borderLeft: (border ? "10px solid " + border : "10px solid #555")
                }).
                addClass("discoAppointment").
                appendTo(node);
            
            var inner = $("<div/>").
                css({
                    position: "absolute",
                    top: "0px", right: "0px", bottom: "0px", left: "0px",
                    MozBorderRadius: "10px",
                    padding: "2px 0px 2px 10px", fontSize: "9pt", fontWeight: "bold", color: "black"
                }).
                text(app.title).
                appendTo(outer);
        };
        
        var paintParticipants = function (participants, node) {
            var tmp = [], i = 0, $l = participants.length;
            for(; i < $l; i++) {
                if (participants[i].type !== 5) {
                    tmp.push(participants[i]);
                }
            }
            // get participants TODO
            /*internalCache.getObjects(tmp, function(data) {
                var tmp = [];
                for (var id in data) {
                    tmp.push(data[id].display_name);
                }
                // sort
                tmp.sort();
                // add mark up
                var sorted = [];
                for (var id in tmp) {
                    sorted.push("<span style='color: #333; font-style: italic;'>" + tmp[id] + "</span>");
                }
                node.html("Teilnehmer: " + sorted.join(". "));
            });*/
        };
        
        var paintDetails = function (data, startDate) {
            // clear
            dom.detailContainer.empty();
            // sort by start date
            data.sort(function (a,b) { return a.start_date - b.start_date; });
            // fill
            for (var index in data) {
                var app = data[index];
                var shown_as = app.shown_as || 1;
                var color = styles[shown_as].border;
                var node = $("<div/>").
                    css({
                        position: "static", borderBottom: "1px dotted #aaa",
                        margin: "0px 10px 10px 10px", padding: "0px 0px 10px 0px",
                        fontSize: "10pt", lineHeight: "1.5em", color: "black"
                    }).
                    html(
                        "<div style='font-size: 14pt; color: " + color + "'>" + app.title + "</div>" +
                        "<div style='font-size: 11pt; font-weight: bold;'>" +
                            formatDate(new Date(app.start_date), "time") + " &ndash; " +
                            formatDate(new Date(app.end_date), "time") +
                        "</div>" +
                        (app.note ? "<div style='line-height: 1.25em; font-family: monospace; white-space: pre-wrap;'>" + app.note + "</div>" : "")
                    ).
                    appendTo(dom.detailContainer);
                // participants?
                if (app.participants && app.participants.length) {
                    var participantNode = $("<div/>").css({ lineHeight: "1.25em" }).appendTo(node);
                    paintParticipants(app.participants, participantNode);
                }
            }
        };
        
        var updateDay = function (start) {
            
            // start?
            if (start === undefined) {
                start = startDate + weekStart;
            }
            
            // remove app container
            $("div.appContainer", dom.dayContainer).remove();
            // remove old appointments
            $("div.discoAppointment", dom.dayContainer).remove();
            // remove dates
            $("div.date", dom.topContainer).remove();
            
            var days = weekEnd - weekStart + 1;
            var width = 100/Math.max(2, days);

            var drawAppointment = function (i, node) {
                var start = startDate + i * api.DAY;
                getAppointments(start, function (response) {
                    // loop appointments
                    for (var index in response) {
                        paintDayAppointment(response[index], start, node);
                    }
                    // add detail view?
                    if (days === 1) {
                        paintDetails(response, start);
                        dom.detailContainer.show();
                    } else {
                        dom.detailContainer.hide();
                    }
                });
            };
            
            // appointment container
            for (var i = weekStart, l = 0; i <= weekEnd; i++, l++) {
                // header: date
                var format = days <= 2 ? "dateday" : "date";
                var fontSize = days <= 2 ? "14pt" : "12pt";
                var id = "appContainer" + l;
                
                var dateNode = dom[id] = $("<div/>").css({
                    position: "absolute", top: "0px", bottom: "0px", left: (l*width) + "%",
                    width: width + "%",
                    fontSize: fontSize, lineHeight: "50px", color: "#333",
                    textAlign: "center"
                }).addClass("date").appendTo(dom.topContainer);
                
                dateNode.text( formatDate(new Date(startDate + i * api.DAY), format) );
                
                // app container
                var node = dom[id] = $("<div/>").css({
                    position: "absolute", top: "0px", bottom: "0px", left: (l*width) + "%", width: width + "%",
                    borderLeft: l > 0 ? "1px dotted #ccc" : "0px none"
                }).addClass("appContainer").appendTo(dom.dayContainer);
                
                // draw appointments
                drawAppointment(i, node);
            }
        };
        
        var paintDay = function (start) {
            
            // start?
            if (start === undefined) {
                start = startDate + weekStart;
            }
            
            // content area (top)
            dom.topContainer = $("<div/>").css({
                position: "absolute", top: "0px", right: "16px", height: "50px", left: "50px"
            }).appendTo(container);
            
            // content area (bottom)
            dom.bottomContainer = $("<div/>").css({
                position: "absolute", top: "50px", right: "0px", bottom: "0px", left: "0px",
                overflow: "auto", overflowX: "hidden", overflowY: "scroll"
            }).appendTo(container);
            
            // content area
            dom.zoomContainer = $("<div/>").css({
                position: "absolute", top: "0px", right: "0px", left: "0px",
                height: zoom + "%"
            }).appendTo(dom.bottomContainer);
            
            // hour container
            dom.hourContainer = $("<div/>").css({
                position: "absolute", top: "0%", left: "0px", width: "49px",
                height: "100%", borderRight: "1px solid #aaa"
            }).appendTo(dom.zoomContainer);
            
            // hours
            start = startTime;
            var end = endTime, hour, h, color;
            var i, height = 100/24, top = height;
            for (i = 1; i < 24; i++) {
                hour = $("<div/>").css({
                    position: "absolute", top: top + "%", left: "0px", right: "0px",
                    fontSize: "9pt", textAlign: "right", paddingRight: "5px",
                    marginTop: "-6pt"
                }).
                text(i + ":00").
                appendTo(dom.hourContainer);
                top += height;
            }
            
            // day
            dom.dayContainer = $("<div/>").css({
                position: "absolute", top: "0px", right: "0px", bottom: "0px", left: "50px"
            }).appendTo(dom.zoomContainer);
            
            // hour grid
            for (i = 0, top = 0; i < 48; i++) {
                h = Math.floor(i/2);
                height = 100/48;
                color = h >= start && h <= end ? "white" : "#F2F6FA";
                hour = $("<div/>").css({
                    position: "absolute", top: top + "%", left: "0px", right: "0px",
                    height: height + "%"
                }).
                append(
                    $("<div/>").css({
                        position: "absolute", top: "0px", right: "0px", bottom: "0px",
                        left: "0px",
                        backgroundColor: color,
                        borderTop: "1px solid #ccc",
                        borderTopColor: (i % 2 === 0 ? "#bbb" : "#ddd")
                    })
                ).
                appendTo(dom.dayContainer);
                top += height;
            }
            
            // detail view
            dom.detailContainer = $("<div/>").css({
                position: "absolute", top: "0px", bottom: "0px", left: "50%", width: "50%",
                backgroundColor: "white", display: "none", borderLeft: "1px solid #ccc",
                overflow: "visible"
            }).appendTo(dom.dayContainer);
            
            updateDay(start);
        };
        
        var paintWeek = function () {
        };
        
        var paint = function() {
            // clear
            clear();
            // view?
            switch (view) {
                case "day":
                    paintDay(startDate + weekStart);
                    break;
                case "week":
                    paintWeek();
                    break;
            }
        };
        
        // initialize slider
        sliderA.css("width", "200px").slider({
            range: "min",
            value: zoom,
            min: 100,
            max: 1000,
            step: step,
            slide: function (e, ui) {
                zoom = ui.value;
                updateZoom();
            }
        });
        
        sliderB.css("width", "200px").slider({
            range: true,
            values: [weekStart, weekEnd],
            min: 0,
            max: 6,
            step: 1,
            slide: function (e, ui) {
                weekStart = ui.values[0];
                weekEnd = ui.values[1];
                updateDay();
            }
        });
        
        win.show(function () {
            paint();
        });
    });
    
    return {
        getApp: app.getInstance
    };
});