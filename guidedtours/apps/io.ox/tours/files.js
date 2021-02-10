/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/tours/files', [
    'io.ox/core/extensions',
    'io.ox/core/notifications',
    'io.ox/core/tk/wizard',
    'gettext!io.ox/tours',
    'io.ox/files/api',
    'io.ox/core/capabilities',
    'settings!io.ox/core'
], function (ext, notifications, Tour, gt, api, capabilities, settings) {

    'use strict';

    /* Tour: files / ... */
    Tour.registry.add({
        id: 'default/io.ox/files',
        app: 'io.ox/files',
        priority: 1
    }, function () {
        var SAMPLE_CONTENT = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
            blob = new window.Blob([SAMPLE_CONTENT], { type: 'text/plain' }),
            standardFolder = settings.get('folder/infostore'),
            file,
            key,
            current = {},
            tour = new Tour();

        function cleanup() {
            api.get(file).done(function (newData) {
                api.remove([newData]);
                api.trigger('refresh.all');
            });
            // restore
            var app = ox.ui.App.getCurrentApp();
            app.folder.set(current.folder);
            app.props.set('layout', current.view);
        }

        //define as function or key is undefined
        function getSelector() {
            return '.list-view li[data-cid="' + key + '"]';
        }

        tour.step()
                .title(gt('The Drive app'))
                .content(gt('Welcome to your cloud storage app. This Guided Tour will introduce you to your new online storage solution - your one point to access online stored files from all your accounts. This is where you can upload and save your files, share them and synchronize them with different devices.  '))
                .on('wait', function () {
                    if ($('.launcher-dropdown:visible').length === 0) $('.launcher-btn').click();
                    $('#io-ox-launcher').attr('forceOpen', true);
                })
                .on('hide', function () {
                    $('#io-ox-launcher').attr('forceOpen', false);
                    if ($('.launcher-dropdown:visible').length) $('.launcher-btn').click();
                })
                .waitFor('.launcher-dropdown:visible')
                .hotspot('.launcher-dropdown [data-app-name="io.ox/files"]')
                .spotlight('.launcher-dropdown [data-app-name="io.ox/files"]')
                .on('close', cleanup)
                .end()
            .step()
                .title(gt('Folder tree'))
                .content(gt('On the left you can see the folder tree. It displays your folder structure and allows you to navigate to specific folders and subfolders. To make your life easier, we have already included folders for your Documents, Music, Pictures and Videos.'))
                .on('before:show', function () {
                    if ($('.folder-tree:visible').length === 0) {
                        $('.generic-toolbar.bottom a').click();
                    }
                })
                .waitFor('.folder-tree:visible')
                .hotspot('.folder-icon.visible.myfiles')
                .spotlight('.folder-icon.visible.myfiles')
                .end()
            .step()
                .title(gt('Folder content'))
                .content(gt('Clicking on a folder displays all the subfolders, documents, media and other files that it contains.'))
                .waitFor(getSelector)
                .spotlight(getSelector, { position: 'left' })
                .hotspot(getSelector)
                .end()
            .step()
                .title(gt('Select a view'))
                .content(gt('Different views are available. Just select the one you like best.'))
                .spotlight('.classic-toolbar-container .pull-right ul', { position: 'left' })
                .hotspot('.classic-toolbar-container .pull-right li.dropdown-header', { position: 'left' })
                .on('before:show', function () {
                    if ($('.classic-toolbar-container dropdown.open .dropdown-menu:visible').length === 0) {
                        $('.classic-toolbar-container .pull-right').addClass('open').attr('forceOpen', true);
                    }
                })
                .on('next', function () {
                    $('.classic-toolbar-container .pull-right').removeClass('open').attr('forceOpen', false);
                })
                .end()
            .step()
                .title(gt('Toolbar'))
                .content(gt('At the top you can find the toolbar with many functions and additional options. You can easily create new folders, new files and much more.'))
                .spotlight('.classic-toolbar-container [data-action="io.ox/files/actions/add-folder"]', { position: 'left' })
                .hotspot('.classic-toolbar-container [data-action="io.ox/files/actions/add-folder"]', { position: 'left' })
                .on('before:show', function () {
                    if ($('.classic-toolbar-container [data-action="io.ox/files/actions/add-folder"]').closest('.dropdown.open:visible').length === 0) {
                        $('.classic-toolbar-container [data-action="io.ox/files/actions/add-folder"]').closest('.dropdown').addClass('open').attr('forceOpen', true);
                    }
                })
                .end()
            .step()
                .title(gt('Upload a new file'))
                .content(gt('To upload a new file from your local device, simply click on Add local file and select the file you would like to upload. It is even easier if you just drag and drop files from your local device into Drive. The uploaded file is now available in Drive on all your devices.'))
                .spotlight('.classic-toolbar-container [data-action="io.ox/files/actions/upload"]', { position: 'left' })
                .hotspot('.classic-toolbar-container [data-action="io.ox/files/actions/upload"]', { position: 'top' })
                .on('before:show', function () {
                    if ($('.classic-toolbar-container [data-action="io.ox/files/actions/upload"]').closest('.dropdown.open:visible').length === 0) {
                        $('.classic-toolbar-container [data-action="io.ox/files/actions/upload"]').closest('.dropdown').addClass('open');
                    }
                })
                .on('next', function () {
                    $('.classic-toolbar-container [data-action="create"]').closest('.dropdown').removeClass('open').attr('forceOpen', false);
                })
                .end()
            .step()
                .title(gt('Preview files'))
                .content(gt('Clicking on the view icon leads you to a preview of the selected file.'))
                .on('before:show', function () {
                    if (_.device('touch')) return $('.list-view li[data-cid="' + key + '"]').tap();
                    $('.list-view li[data-cid="' + key + '"]').click();
                })
                .waitFor('.classic-toolbar-container [data-action="io.ox/files/actions/viewer"]')
                .spotlight('.classic-toolbar-container [data-action="io.ox/files/actions/viewer"]', { position: 'right' })
                .hotspot('.classic-toolbar-container [data-action="io.ox/files/actions/viewer"] i', { position: 'right' })
                .end()
            .step()
                .title(gt('Preview mode'))
                .content(gt('From preview you can also select other options to help you manage and work on your files.'))
                .on('before:show', function () {
                    $('.classic-toolbar-container [data-action="io.ox/files/actions/viewer"]').click();
                })
                .on('back', function () {
                    $('.viewer-toolbar [data-action="close"]').click();
                })
                .waitFor('.io-ox-viewer .viewer-toolbar')
                .spotlight('.viewer-toolbar [data-action="editor"]', { position: 'left' })
                .hotspot('.viewer-toolbar [data-action="editor"]', { position: 'bottom' })
                .end()
            .step()
                .title(gt('Share files'))
                .content(gt('Here you can share files with your colleagues and external contacts. You can also collaborate on a document and set different rights.'))
                .on('before:show', function () {
                    $('.viewer-toolbar [data-action="io.ox/core/viewer/actions/toolbar/close"]').click();
                })
                .spotlight('.classic-toolbar-container [data-action="io.ox/files/actions/invite"]', { position: 'right' })
                .hotspot('.classic-toolbar-container [data-action="io.ox/files/actions/invite"]', { position: 'left' })
                .end()
            .step()
                .title(gt('Sharing option - Invite people'))
                .content(gt('Choose from two alternatives to share your files and folders. Use "Invited people only" if you want to manage access rights and allow recipients to create and edit files. Internal and external participants are also able to collaborate with you on documents at the same time.'))
                .on('before:show', function () {
                    if ($('.share-permissions-dialog .modal-dialog').length === 0) {
                        $('.classic-toolbar-container [data-action="io.ox/files/actions/invite"]').click();
                    } else {
                        $('.share-permissions-dialog .modal-dialog .access-select select option[value="1"]').attr('selected', null);
                        $('.share-permissions-dialog .modal-dialog .access-select select option[value="0"]').attr('selected', 'selected');
                    }
                })
                .waitFor('.share-permissions-dialog .modal-dialog .access-select select')
                .spotlight('.share-permissions-dialog .modal-dialog .access-select select', { position: 'right' })
                .hotspot('.share-permissions-dialog .modal-dialog .access-select select', { position: 'left' })
                .on('back', function () {
                    $('.share-permissions-dialog .modal-dialog [data-action="abort"]').click();
                })
                .on('close', function () {
                    $('.share-permissions-dialog .modal-dialog [data-action="abort"]').click();
                })
                .end()
            .step()
                .title(gt('Sharing option - Everyone who has the link'))
                .content(gt('It is also possible to get a sharing link to let others view or download your files. You can use an expiration date and password protection if you like.'))
                .waitFor('.share-permissions-dialog .modal-dialog .access-select select')
                .on('show', function () {
                    $('.share-permissions-dialog .modal-dialog .access-select select option[value="0"]').attr('selected', null);
                    $('.share-permissions-dialog .modal-dialog .access-select select option[value="1"]').attr('selected', 'selected');
                })
                .spotlight('.share-permissions-dialog .modal-dialog .access-select select', { position: 'right' })
                .hotspot('.share-permissions-dialog .modal-dialog .access-select select', { position: 'left' })
                .on('close', function () {
                    $('.share-permissions-dialog .modal-dialog [data-action="abort"]').click();
                })
                .on('next', function () {
                    $('.share-permissions-dialog .modal-dialog [data-action="abort"]').click();
                })
                .end()
            .step()
                .title(gt('Edit documents'))
                .content(gt('Did you know that you can edit text documents and spreadsheets online? Drive will automatically update your edited file, but thanks to versioning the original file stays available.'))
                .spotlight('.classic-toolbar-container [data-action="io.ox/files/actions/editor"]', { position: 'right' })
                .hotspot('.classic-toolbar-container [data-action="io.ox/files/actions/editor"]', { position: 'right' })
                .on('back', function () {
                    $('.classic-toolbar-container [data-action="io.ox/files/actions/invite"]').click();
                })
                .end()
            .step()
                .title(gt('File details'))
                .content(gt('The file details side bar offers additional information about your files. Just enable the File details option from the View drop down menu and select a file to see the details.'))

                .on('before:show', function () {
                    if ($('.classic-toolbar-container [data-action="io.ox/files/actions/invite"]').closest('.dropdown.open').length > 0) {
                        $('.classic-toolbar-container [data-action="io.ox/files/actions/invite"]').closest('.dropdown').removeClass('open').attr('forceOpen', false);
                    }
                    if ($('.viewer-sidebar:visible').length === 0) {
                        $('.classic-toolbar-container [data-dropdown="io.ox/files/action/view"] li [data-name="details"]').click();
                    }
                })
                .spotlight('.viewer-sidebar', { position: 'left' })
                .hotspot('.viewer-sidebar', { position: 'left' })
                .end()
            .step()
                .title(gt('Add another account'))
                .content(gt('Drive allows you to connect to other storage solutions if you already have a cloud storage account you use to save and sync your files. Simply click on the appropriate logo to access your existing data.'))
                .on('before:show', function () {
                    $('a[data-action="add-storage-account"]').focus();
                })
                .spotlight('a[data-action="add-storage-account"]', { position: 'right' })
                .hotspot('a[data-action="add-storage-account"]', { position: 'right' })
                .end()
            .on('stop', cleanup);
        if (!capabilities.has('text') || !capabilities.has('spreadsheet')) {
            tour.steps.splice(10, 2);
        }

        $.when(
            api.upload({ folder: standardFolder, file: blob, filename: gt('The Drive app tour.txt') }),
            ox.launch('io.ox/files/main')
        ).then(function (fileData) {
            file = fileData;
            key = _.cid(fileData);
            api.trigger('refresh.all');

            var app = ox.ui.App.getCurrentApp();
            // remember current state
            current.folder = app.folder.get();
            current.view = app.props.get('layout');

            // set folder and layout: ensure we find the uploaded 'drive app tour.txt'
            if (current.folder === standardFolder) return cont();
            return app.folder.set(standardFolder).then(cont);

            function cont() {
                if (current.view === 'tile') app.props.set('layout', 'list');
                ox.trigger('refresh^');
                tour.start();
            }
        });
    });
});
