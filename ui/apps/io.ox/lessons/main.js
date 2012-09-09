/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("io.ox/lessons/main", ['io.ox/core/extensions', 'io.ox/lessons/actions', 'io.ox/lessons/lessonlist'], function (ext) {

    "use strict";

    var app = ox.ui.createApp({ name: 'io.ox/lessons', title: 'Lessons' }),
        // app window
        win,
        openLesson = function (lesson) {
            return function () {
                lesson.start({
                    app: app,
                    win: win
                });
                app.lesson = lesson;
                app.setState({lesson: lesson.id});
            };
        };
    // launcher
    app.setLauncher(function () {
        // get window
        win = ox.ui.createWindow({
            name: 'io.ox/lessons',
            title: "Lessons",
            toolbar: true,
            search: true
        });
        
        win.nodes.main.css({
            overflow: 'auto'
        });

        app.setWindow(win);

        win.show(function () {
            var state = app.getState();
            if (state && state.lesson) {
                
                var lesson = ext.point('io.ox/lessons/lesson').get(state.lesson, function (lesson) {
                    lesson.start({
                        app: app,
                        win: win
                    });
                    app.lesson = lesson;
                });
            }
            if (!app.lesson) {
                app.tableOfContents();
            }
        });
    });
    
    app.tableOfContents = function () {
        app.setState({lesson: null});
        win.nodes.main.empty();
        var lessons = {};
        ext.point('io.ox/lessons/lesson').each(function (lesson) {
            var section = lessons[lesson.section] || (lessons[lesson.section] = []);
            section.push(lesson);
        });
        var $all = $("<div>").appendTo(win.nodes.main);
        $all.css({
            margin: "20px"
        });
        win.nodes.main.css({overflow: 'auto'});
        
        _(lessons).each(function (lessons, sectionName) {
            $all.append($("<h2>").text(sectionName));
            var $list = $("<div>").appendTo(win.nodes.main);
            _(lessons).each(function (lesson) {
                var $lessonDiv = $("<div>").appendTo($all);
                $lessonDiv.append($("<h3>").append($('<a href="#">').text(lesson.title)).on("click", openLesson(lesson)));
                $lessonDiv.append($("<div>").text(lesson.description));
                $lessonDiv.on("click", openLesson(lesson));
                $lessonDiv.css({
                    margin: "20px"
                });
            });
        });
        
    };

    return {
        getApp: app.getInstance
    };
});
