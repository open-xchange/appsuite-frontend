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

    grunt.config.merge({
        concat: {
            bootjs: {
                options: {
                    banner: 'dependencies = {};\n'
                },
                files: [
                    {
                        src: [
                            'bower_components/jquery/dist/jquery.js',
                            'lib/jquery.mobile.touch.min.js',
                            'bower_components/underscore/underscore.js', // load this before require.js to keep global object
                            'build/ox.js',
                            //add backbone and dot.js may be a AMD-variant would be better
                            'bower_components/backbone/backbone.js',
                            'bower_components/backbone-validation/dist/backbone-validation.js',
                            'bower_components/moment/min/moment-with-locales.min.js',
                            'bower_components/moment-timezone/builds/moment-timezone-with-data.js',
                            'bower_components/requirejs/require.js',
                            'lib/require-fix.js',
                            'lib/modernizr.js',
                            'bower_components/bigscreen/bigscreen.js',
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
                            'bower_components/bootstrap-accessibility-plugin/plugins/js/bootstrap-accessibility.js',
                            // add mandatory UI sources
                            'apps/io.ox/core/http.js',
                            'apps/io.ox/core/uuids.js',
                            'apps/io.ox/core/session.js',
                            'apps/io.ox/core/cache.js',
                            'apps/io.ox/core/extensions.js',
                            'apps/io.ox/core/manifests.js',
                            'apps/io.ox/core/capabilities.js',
                            'apps/io.ox/core/settings.js',
                            'apps/io.ox/core/gettext.js',
                            'apps/io.ox/core/event.js',
                            'apps/io.ox/core/cache/indexeddb.js',
                            'apps/io.ox/core/cache/localstorage.js',
                            'apps/io.ox/core/cache/simple.js',
                            'apps/plugins/halo/register.js',
                            'apps/io.ox/core/settings/defaults.js',
                            // missing for signin
                            'apps/io.ox/core/boot/config.js',
                            'apps/io.ox/core/boot/fixes.js',
                            'apps/io.ox/core/boot/form.js',
                            'apps/io.ox/core/boot/i18n.js',
                            'apps/io.ox/core/boot/language.js',
                            'apps/io.ox/core/boot/load.js',
                            'apps/io.ox/core/boot/util.js',
                            'apps/io.ox/core/boot/login/auto.js',
                            'apps/io.ox/core/boot/login/standard.js',
                            'apps/io.ox/core/boot/login/token.js',
                            'apps/io.ox/core/boot/main.js',
                            'build/apps/io.ox/core/boot.en_US.js',
                            'build/apps/io.ox/core/boot.de_DE.js',
                            'src/boot.js'
                        ],
                        dest: 'build/boot.js',
                        nonull: true
                    }
                ]
            },
            precore: {
                options: {
                    banner: 'define(ox.base + "/precore.js", ["io.ox/core/boot/config", "io.ox/core/manifests"], function (config) {\n\n' +
                                '"use strict";\n\n' +
                                'var def = $.Deferred();\n' +
                                'ox.once("login:success", function () {\n' +
                                '    config.user().then(def.resolve, def.reject);\n' +
                                '});\n' +
                                'def.then(function () {\n',
                    footer: '});\n});\n' //closing the precore definition and the resolve callback for def variable
                },
                files: [
                    {
                        src: [
                            // 2nd wave
                            'apps/io.ox/core/desktop.js',
                            'apps/io.ox/core/api/apps.js',
                            'apps/io.ox/core/extPatterns/stage.js',
                            'apps/io.ox/core/date.js',
                            'apps/io.ox/core/yell.js',
                            'apps/io.ox/core/notifications.js',
                            'apps/io.ox/core/commons.js',
                            'apps/io.ox/core/upsell.js',
                            'apps/io.ox/core/ping.js',
                            'apps/io.ox/core/relogin.js',
                            'apps/io.ox/core/uuids.js',
                            // 3rd wave
                            'apps/io.ox/core/extPatterns/links.js',
                            'apps/io.ox/core/adaptiveLoader.js',
                            'apps/io.ox/core/tk/dialogs.js',
                            'apps/io.ox/core/tk/draghelper.js',
                            // mobile stuff
                            'apps/io.ox/core/page-controller.js',
                            'apps/io.ox/core/toolbars-mobile.js',
                            // folder support
                            'apps/io.ox/core/folder/util.js',
                            'apps/io.ox/core/folder/sort.js',
                            'apps/io.ox/core/folder/blacklist.js',
                            'apps/io.ox/core/folder/title.js',
                            'apps/io.ox/core/folder/bitmask.js',
                            'apps/io.ox/core/folder/api.js',
                            'apps/io.ox/core/folder/node.js',
                            'apps/io.ox/core/folder/selection.js',
                            'apps/io.ox/core/folder/tree.js',
                            'apps/io.ox/core/folder/favorites.js',
                            'apps/io.ox/core/folder/view.js',
                            'apps/io.ox/core/folder/extensions.js',
                            // defaults
                            'apps/io.ox/core/settings/defaults.js',
                            'apps/io.ox/core/settingOptions/settings/defaults.js',
                            'apps/io.ox/mail/settings/defaults.js',
                            'apps/io.ox/contacts/settings/defaults.js',
                            'apps/io.ox/calendar/settings/defaults.js',
                            'apps/io.ox/tasks/settings/defaults.js',
                            'apps/io.ox/files/settings/defaults.js',
                            // 4th wave
                            'apps/io.ox/core/collection.js',
                            'apps/io.ox/core/extPatterns/actions.js',
                            'apps/io.ox/core/api/account.js',
                            'apps/io.ox/core/tk/selection.js',
                            // core
                            'apps/io.ox/core/main.js',
                            'apps/io.ox/core/links.js',
                            // mail app
                            'apps/io.ox/mail/util.js',
                            'apps/io.ox/mail/api.js',
                            'apps/io.ox/mail/listview.js',
                            'apps/io.ox/core/tk/list-control.js',
                            'apps/io.ox/mail/threadview.js',
                            'apps/io.ox/core/toolbars-mobile.js',
                            'apps/io.ox/core/page-controller.js',
                            'apps/io.ox/mail/actions.js',
                            'apps/io.ox/mail/toolbar.js',
                            'apps/io.ox/mail/import.js',
                            'apps/io.ox/mail/folderview-extensions.js',
                            // mobile mail
                            'apps/io.ox/mail/mobile-navbar-extensions.js',
                            'apps/io.ox/mail/mobile-toolbar-actions.js',
                            // mail app - 2nd wave
                            'apps/io.ox/core/util.js',
                            'apps/io.ox/core/api/factory.js',
                            'apps/io.ox/core/api/collection-pool.js',
                            'apps/io.ox/core/api/collection-loader.js',
                            'apps/io.ox/mail/common-extensions.js',
                            'apps/io.ox/core/tk/list.js',
                            'apps/io.ox/mail/view-options.js',
                            'apps/io.ox/core/api/backbone.js',
                            'apps/io.ox/mail/detail/view.js',
                            'apps/io.ox/mail/detail/mobileView.js',
                            'apps/io.ox/core/tk/list-dnd.js',
                            'apps/io.ox/mail/mobile-toolbar-actions.js',
                            'apps/io.ox/mail/mobile-navbar-extensions.js',
                            'apps/io.ox/core/print.js',
                            'apps/io.ox/contacts/api.js',
                            'apps/io.ox/core/tk/flag-picker.js',
                            'apps/io.ox/backbone/mini-views/dropdown.js',
                            'apps/io.ox/core/tk/upload.js',
                            'apps/io.ox/core/dropzone.js',
                            // mail app - 3rd wave
                            'apps/io.ox/core/strings.js',
                            'apps/io.ox/core/attachments/backbone.js',
                            'apps/io.ox/core/attachments/view.js',
                            'apps/io.ox/core/api/user.js',
                            'apps/io.ox/contacts/util.js',
                            'apps/l10n/ja_JP/io.ox/collation.js',
                            'apps/io.ox/core/tk/list-selection.js',
                            'apps/io.ox/backbone/mini-views/abstract.js',
                            'apps/io.ox/mail/detail/content.js',
                            'apps/io.ox/core/emoji/util.js',
                            'apps/io.ox/mail/detail/links.js',
                            // mail app - main
                            'apps/io.ox/mail/main.js'
                        ],
                        dest: 'build/precore.js',
                        nonull: true
                    }
                ]
            },
            mobiscroll: {
                files: [
                    {
                        src: [
                            'bower_components/mobiscroll/js/mobiscroll.core.js',
                            'bower_components/mobiscroll/js/mobiscroll.util.datetime.js',
                            'bower_components/mobiscroll/js/mobiscroll.widget.js',
                            'bower_components/mobiscroll/js/mobiscroll.scroller.js',
                            'bower_components/mobiscroll/js/mobiscroll.datetimebase.js',
                            'bower_components/mobiscroll/js/mobiscroll.datetime.js',
                            'bower_components/mobiscroll/js/mobiscroll.widget.ios.js'
                        ],
                        dest: 'build/static/3rd.party/mobiscroll/mobiscroll.js',
                        nonull: true
                    },
                    {
                        src: [
                            'bower_components/mobiscroll/css/mobiscroll.widget.css',
                            'bower_components/mobiscroll/css/mobiscroll.widget.ios.css',
                            'bower_components/mobiscroll/css/mobiscroll.scroller.css',
                            'bower_components/mobiscroll/css/mobiscroll.scroller.ios.css'
                        ],
                        dest: 'build/apps/3rd.party/mobiscroll/mobiscroll.css',
                        nonull: true
                    }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
};
