/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

'use strict';

module.exports = function (grunt) {

    grunt.config.extend('concat', {

        bootjs: {
            options: {
                banner: 'dependencies = {};\n'
            },
            files: [
                {
                    src: ['bower_components/jquery/dist/jquery.js',
                         'lib/jquery.mobile.touch.min.js',
                         'bower_components/underscore/underscore.js', // load this before require.js to keep global object
                         'build/ox.js',
                         //add backbone and dot.js may be a AMD-variant would be better
                         'bower_components/backbone/backbone.js',
                         'bower_components/backbone-validation/dist/backbone-validation.js',
                         'bower_components/requirejs/require.js',
                         'lib/require-fix.js',
                         'lib/modernizr.js',
                         'bower_components/bigscreen/bigscreen.js',
                         'bower_components/jquery-placeholder/jquery.placeholder.js',
                         'bower_components/textarea-helper/textarea-helper.js',
                         'bower_components/jquery.lazyload/jquery.lazyload.js',
                         'src/util.js',
                         'src/browser.js',
                         'src/plugins.js',
                         'src/jquery.plugins.js',
                         // add bootstrap JavaScript
                         'bower_components/bootstrap/js/transition.js',
                         'bower_components/bootstrap/js/alert.js',
                         'bower_components/bootstrap/js/button.js',
                         'bower_components/bootstrap/js/carousel.js',
                         'bower_components/bootstrap/js/collapse.js',
                         'lib/bootstrap-custom-dropdown/custom-dropdown.js',
                         'bower_components/bootstrap/js/modal.js',
                         'bower_components/bootstrap/js/tooltip.js',
                         'bower_components/bootstrap/js/popover.js',
                         'bower_components/bootstrap/js/scrollspy.js',
                         'bower_components/bootstrap/js/tab.js',
                         'bower_components/bootstrap/js/affix.js',
                         // add bootstrap plugins
                         //'bower_components/bootstrap-accessibility-plugin/plugins/js/bootstrap-accessibility.js',
                         'bower_components/bootstrap-typeahead/bootstrap3-typeahead.js',
                         'bower_components/bootstrap-datepicker/js/bootstrap-datepicker.js',
                         'lib/bootstrap-combobox.js',
                         // add mandatory UI sources
                         'apps/io.ox/core/http.js',
                         'apps/io.ox/core/session.js',
                         'apps/io.ox/core/cache.js',
                         'apps/io.ox/core/extensions.js',
                         'apps/io.ox/core/manifests.js',
                         'apps/io.ox/core/capabilities.js',
                         'apps/io.ox/core/settings.js',
                         'apps/io.ox/core/gettext.js',
                         'src/boot.js',
                         // 2nd wave
                         'apps/io.ox/core/event.js',
                         'apps/io.ox/core/cache/indexeddb.js',
                         'apps/io.ox/core/cache/localstorage.js',
                         'apps/io.ox/core/cache/simple.js',
                         'apps/io.ox/core/desktop.js',
                         'apps/io.ox/core/api/apps.js',
                         'apps/io.ox/core/extPatterns/stage.js',
                         'apps/io.ox/core/date.js',
                         'apps/io.ox/core/notifications.js',
                         'apps/io.ox/core/commons.js',
                         'apps/io.ox/core/upsell.js',
                         'apps/io.ox/core/ping.js',
                         'apps/io.ox/core/relogin.js',
                         // 3rd wave
                         'apps/io.ox/core/extPatterns/links.js',
                         'apps/io.ox/core/adaptiveLoader.js',
                         'apps/io.ox/core/commons-folderview.js',
                         'apps/io.ox/core/api/folder.js',
                         'apps/io.ox/core/tk/dialogs.js',
                         // 4th wave
                         'apps/io.ox/core/collection.js',
                         'apps/io.ox/core/extPatterns/actions.js',
                         'apps/io.ox/core/api/account.js',
                         'apps/io.ox/filter/folder.js',
                         // core
                         'apps/io.ox/core/main.js'
                    ],
                    dest: 'build/boot.js',
                    nonull: true
                }
            ]
        },
        mobiscroll: {
            files: [
                {
                    src: ['lib/mobiscroll/js/mobiscroll.core.js', 'lib/mobiscroll/js/mobiscroll.datetime.js', 'lib/mobiscroll/js/mobiscroll.ios7.js'],
                    dest: 'build/apps/3rd.party/mobiscroll/mobiscroll.js',
                    nonull: true
                }
            ]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
};
