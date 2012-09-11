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
define('io.ox/lessons/lessons/basic_jquery/register', ['io.ox/core/extensions', 'io.ox/lessons/editor', 'io.ox/lessons/toc'], function (ext, Editor, TOC) {
    "use strict";
    ext.point("io.ox/lessons/lesson").extend({
        id: 'basic_jquery',
        index: 100,
        title: 'Basic JQuery',
        description: 'In which DOM nodes will be selected and the JQuery API will be explored',
        section: 'Basics',
        start: function (options) {
            require(["text!io.ox/lessons/lessons/basic_jquery/lesson.html"], function (html) {
                var win = options.win;
                
                win.nodes.main.empty().append($(html));
                
                Editor.setUp(win.nodes.main);
                TOC.setUp(win.nodes.main);
                
                // Selector experiments
                win.nodes.main.find(".selector_experiment").each(function (index, element) {
                    var selectorField, runExperiment, editor, experimentDiv, firstTime, htmlCode;
                    element = $(element);

                    element.before($('<form class="form-inline">').append(
                        $('<span class="muted">').text("node.find('"),
                        selectorField = $('<input type="text">').on("keydown", function (e) {
                            if (e.which === 13) {
                                e.preventDefault();
                                runExperiment();
                            }
                        }),
                        $('<span class="muted">').text("') "),
                        $("<button>").text("Try it").on("click", function () {
                            runExperiment();
                        })
                    ).css({marginBottom: "5px"}));

                    if (element.data("selector")) {
                        selectorField.val(element.data("selector"));
                    }
                    htmlCode = element.html();

                    experimentDiv = $("<div>").css({
                        marginTop: "10px"
                    });
                    firstTime = true;

                    element.after(experimentDiv);

                    editor = Editor.edit(element, { language: 'html'});
                    editor.setValue(htmlCode);
                    editor.clearSelection();

                    runExperiment = function () {
                        var found;
                        experimentDiv.empty();
                        if (firstTime) {
                            firstTime = false;
                            experimentDiv.addClass("well");
                        }
                        experimentDiv.html(editor.getValue());
                        found = experimentDiv.find(selectorField.val()).css({
                            border: "2px solid green"
                        }).length;
                        experimentDiv.append($('<span>').html("Your selector selected <strong>" + found + "</strong> elements."));
                    };

                });
                
                win.idle();
            });
        }
    
    });
});