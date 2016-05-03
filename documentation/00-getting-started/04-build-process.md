---
title: Build Process
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
