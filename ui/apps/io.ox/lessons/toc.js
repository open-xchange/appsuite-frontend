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
define("io.ox/lessons/toc",  function () {
    "use strict";
    var id = 0;
    var TOC = {
        setUp: function (node) {
            var toc = {
                sections: {},
                elements: {},
                scrollTo: function (id) {
                    var section = this.sections[id];
                    node.scrollTop(node.scrollTop() + section.offset().top - 100);
                    if (toc.activeSection) {
                        this.elements[this.activeSection.attr("id")].removeClass("active");
                    }
                    this.activeSection = section;
                    this.elements[id].addClass("active");
                    
                },
                makeActive: function (id) {
                    var section = this.sections[id];
                    if (toc.activeSection) {
                        this.elements[this.activeSection.attr("id")].removeClass("active");
                    }
                    this.activeSection = section;
                    this.elements[id].addClass("active");
                },
                activeSection: null
            };
            id++;
            
            var $nav = node.find(".navigation"),
                $toc = $('<ul class="nav nav-stacked nav-pills span2">').attr("id", "io-ox-lessons-toc-" + id);
            if ($nav.length === 0) {
                return;
            }
            
            node.find("section").each(function (index, section) {
                section = $(section);
                var id = section.attr("id");
                
                var title = section.find(":header:first").text(), $item;
                $toc.append(
                    $item = $('<li>').append($('<a href="#">').on("click", function (e) {
                        e.preventDefault();
                        toc.scrollTo(id);
                        
                    }).text(title).attr({href: '#' + section.attr('id')}))
                );
                
                toc.sections[id] = section;
                toc.elements[id] = $item;
            });
            
            $toc.appendTo($nav);
            // Glue in place
            $toc.css({
                position: 'fixed',
                top: $toc.offset().top
            });
            
            node.on("scroll", function () {
                var visibleSection = _(toc.sections).chain().select(function (section) {
                    return section.offset().top - 300 < 0;
                }).sortBy(function (section) {
                    return -(section.offset().top - 300);
                }).first().value();
                
                if (!visibleSection) {
                    return;
                }
                
                if (visibleSection !== toc.activeSection) {
                    toc.makeActive(visibleSection.attr("id"));
                }
            });
            
            return toc;
        }
    };
    
    
    return TOC;
});