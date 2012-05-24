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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
define('io.ox/calendar/edit/ext-helper',
      ['io.ox/core/extensions'], function (ext) {

    'use strict';

    var helper = {


        /**
         * This function is used to define an extesionpoint on a dom-node
         * detach it and draw it in the corresponding draw-method
         */
        extendPoint: function (index, $ext_item, pointName, $fragment) {
            var self = this;
            var id = $ext_item.attr('data-extid');
            var myindex = (index + 1) * 100;
            var point = ext.point(pointName);
            var myfrag = $ext_item.detach(); //keep everything else but remove it from fragment

            // nasty unneeded hack :(
            // second time we need to replace it because we keep a reference to $fragment
            var operation = 'extend';
            if (_(point.keys()).indexOf(id) !== -1) {
                operation = 'replace';
            }

            // first extend
            point[operation]({
                id: id,
                index: myindex,
                draw: function (options) {
                    // just use fragment here - cause its the original parent of the group
                    // so we draw what we already have
                    this.append(myfrag);
                }
            });
        },

        /**
         * finds the deepest occurence of a [data-extgroup] element
         * its important for nested extension points, to process the
         * deepest first and then retrigger it until no element is left.
         */
        deepest: function (el) {
            var sel = '*[data-extgroup]';
            var levels = 0;
            var deepests = [];

            $(el).find('*[data-extgroup]').each(function (index, item) {
                if (!this.firstChild || this.firstChild.nodeType !== 1) {
                    // FIXME: could be optimized, by going to parentsuntil(el)
                    var levelsFromHere = $(this).parentsUntil('body').length;
                    if (levelsFromHere > levels) {
                        deepests = [];
                        levels = levelsFromHere;
                        deepests.push($(item));
                    } else if (levelsFromHere === levels) {
                        deepests.push($(item));
                    }
                }
            });
            return deepests;
        }

    };

    return {
        processDomFragment: function (el, namespace) {
            // HANDLE DYNAMIC EXTENSION POINTS
            // DO NOT TOUCH, EXCEPT YOU KNOW WHAT YOU DO :)
            namespace = namespace || 'undefined_namespace';

            var extpoints = {};
            var handleElement = function ($item, index) {
                var $parent = $item.parent();
                var extgroup = $item.attr('data-extgroup');
                var pointname = namespace + '/' + extgroup;

                // just tidy up to prevent endless loop by accident
                $item.removeAttr('data-extgroup');
                helper.extendPoint(index, $item, pointname, $parent);
                extpoints[pointname] = $parent;
            };

            var invokePoint = function ($parent, pointname) {
                // points are keeping a reference to their original occurence-parent
                // so we just need to call the draw function
                // but we leave the this assignment to global space
                // so if there is any
                console.log('invoking: ' + pointname);
                ext.point(pointname).invoke('draw', $parent);
            };


            var deepests = helper.deepest(el);
            while (deepests.length > 0) {
                console.log(deepests);
                //work with deepests
                extpoints = {};
                _(deepests).each(handleElement);

                //apply them to their parent with in el
                _(extpoints).each(invokePoint);

                // redefine deepests after first run, so now every deepest element should be rendered in the el-Node
                deepests = helper.deepest(el);
            }
            // DYNAMIC EXTENSION POINTS END
        }

    };

});
