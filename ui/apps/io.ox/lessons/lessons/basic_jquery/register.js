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
define('io.ox/lessons/lessons/basic_jquery/register', ['io.ox/core/extensions', 'io.ox/lessons/editor'], function (ext, Editor) {
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
                
                win.nodes.main.find(".code").each(function (index, element) {
                    Editor.highlight(element);
                });

                win.nodes.main.find(".node_experiment").each(function (index, element) {
                    var experimentDiv = $("<div>").css({
                        marginTop: "10px"
                    });
                    var firstTime = true;
                    $(element).after(experimentDiv);
                    
                    Editor.edit(element, {
                        padding: 45,
                        run: function (jsText) {
                            experimentDiv.empty();
                            if (firstTime) {
                                firstTime = false;
                                experimentDiv.addClass("well");
                            }
                            var parentNode = experimentDiv;
                            
                            var runIt = function () {
                                eval(jsText);
                            };
                            
                            runIt.apply(parentNode);
                        }
                    });
                });
                
            });
            
            
        }
    
    });
});