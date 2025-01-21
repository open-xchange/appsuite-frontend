---
title: Build Process
source: http://oxpedia.org/wiki/index.php?title=AppSuite:GruntFAQ
---

Building the UI is pretty simple.

# Installation

On a fresh checkout, the module dependencies need to be installed.
Run `npm install` to install them.

# Build the software

The default grunt task will build project once.

```bash
grunt
```

After a while, there will be a `build/` directory containing all the files needed.

# Install the software

In order to copy all files to another directory, run `grunt install --dest=/path/to/appsuite/`.
This will copy the `build/` directory to the desired destination.

# Local development

The `dev` task can be used for local development.

```bash
grunt dev
```

This will not work, unless you generate a local configuration file:

```bash
grunt show-config:local --output=grunt/local.conf.json
```

This file needs a remote `"server"` be configured in `grunt/local.conf.json`.
After that, the local code will be served and missing files as well as API calls will be proxied to the server.

For more information on all possible grunt tasks, refer to the [README file](https://github.com/Open-Xchange-Frontend/shared-grunt-config#tasks)
of the shared grunt configuration.

# FAQ

## ui does not build properly

- delete ui/build directory
- delete ui/node_modules
- delete ui/bower_components
- runt `grunt build` again

## The ui starts but the top bar does not contain any apps/modules

Please check the manifests file returned by your (local/remote) server.

# FAQ: UI plugins

## I get a 'local grunt not found' error message when running grunt

The local dependencies are not installed, run `npm install` to install them. After that, the error message should be gone. Note: `npm install -g grunt` is not enough.

## Some of my files aren't copied. How can I extend a copy sub-task?

Especially when using external libraries managed with Bower or npm, sometimes the [shared grunt configuration](https://github.com/Open-Xchange-Frontend/shared-grunt-config) doesn't contain all cases for files to be copied during the build or dist tasks.
Due to the extensibility of our shared grunt configuration, it's quite easy to add those missing files.
You can hook up into the `build_*` or the `dist_*` copy task and add your custom configuration like this:

```JavaScript
'use strict';

module.exports = function (grunt) {
    grunt.config.extend('copy', {
        build_custom: {
            files: [{
                expand: true,
                src: ['apps/**/*.in', 'apps/**/manifest.json'],
                dest: 'build/'
            }]
        }
    });
};
```

Put this in a file inside the `grunt/tasks` directory and you are done. From now on, all files ending with .in and all manifest.json files are put into the `build/` directory using the same structure as in the `apps/` directory.
For more detailed information see [the grunt documentation on files].

# FAQ: UI plugins: development proxy server

## Which version of appserver am I using?

npm can be used to find out about the versions. `npm ls appserver` will list the version of appserver that is used.

## I get an error message 'Port 8337 already in use by another process', what can I do?

Only one instance of appserver is allowed at a time (this might be subject to change, though). You have multiple options to start developing on that plugin. Number one:

1.  Close all other running instances of appserver and run it exclusively in one project

Yes, that was the easy one. However, you might want to serve multiple projects at once. This case would need a little more configuration:

1.  Choose one base UI project
2.  Edit `grunt/local.conf.json`
3.  add all build/ directories you want to serve to “prefixes” array
4.  Run `grunt connect watch` in the base directory
5.  In all other UI projects you want to develop, only run `grunt watch` without the connect task

Appserver will in this case do all the cache busting for you (it uses the timestamp of the "newest" directory in the prefix list) and if you didn't de-activate live-reload, it will work for all projects (the watch task sends livereload events to appserver, which will trigger the reload in the browser).
