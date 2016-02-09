---
---

<h1>Build System</h1>

<p>
This document describes the build system of OX App Suite. It is intended for app
developers who use the build system to create apps as well as for OX App Suite
developers who not only use the build system but also may wish to extend it.
</p><p>
The build system is used to create source archives from source files. These
source archives can be used to compile installable packages for various Linux
distributions. The build system can generate archives for the core UI as well as
for independently installed apps.
</p><p>
The OX App Suite build system uses
<a href="https://github.com/mde/jake" target="_blank">Jake</a>, a port of Rake
from Ruby to <a href="http://nodejs.org" target="_blank">Node.js</a>. Both Rake
and Jake are dependency-based build systems like Make, which allows quick
incremental builds. But unlike Make, Jake doesn't have its own syntax. Instead,
it provides an API in JavaScript. The API is used not only to specify
dependencies between files using a full programming language, but also to
implement the generation of files in the same language. This allows easy
implementation of complex build systems, of which the OX App Suite build system
is an example. Using the same language for the developed project and for its
build system also allows any core developer to quickly extend the build system
without having to switch to another language.
</p>

<h2>Using the Build System</h2>

<p>
While easily extensible, most of the time the build system will be used as-is.
This chapter describes how to set up and use the build system to develop apps
and the OX App Suite core.
</p><p>
All command examples are given for the Debian operating system. The instructions
should work similarly on other POSIX systems. The first character of each
command indicates whether it should be executed as root (#) or as a normal user
($).
</p>

<h3>Installing</h3>

<p>
The build system comes in two variants: as part of the OX App Suite source, and
as a Software Development Kit (SDK). The SDK contains only the build system and
can be installed as a package. Its only external dependency is Node.js, which
should be installed automatically by your package manager. While the core of
OX App Suite is supposed to be built using the included version of the build
system, both the source and the SDK can be used to build external (i.e.
independently installable) apps.
</p><p>
The actual installation depends on the chosen variant:
</p>

<h4>SDK</h4>
<p>
First, if not already done, add the Open-Xchange repository to the list of Apt
sources.
</p>
<pre class="nocode prettyprint">
<code class="typ"># </code><code class="pln">echo deb http://software.open-xchange.com/products/appsuite/\
stable/appsuiteui/DebianSqueeze/ / &gt;&gt; /etc/apt/sources.list.d/ox.list</code>
<code class="typ"># </code><code class="pln">aptitude update</code>
</pre>
<p>
Then, the actual installation is a single command.
</p>
<pre class="nocode prettyprint">
<code class="typ"># </code><code class="pln">aptitude install open-xchange-appsuite-dev</code>
</pre>
<p>
Finally, the main executable of the build system should be put in the executable
path for easier calling. This is typically done by either extending
the <code>$PATH</code> environment variable
</p>
<pre class="nocode prettyprint">
<code class="typ">$ </code><code class="pln">export PATH=$PATH:/opt/open-xchange-appsuite-dev/bin</code>
</pre>
<p>
or copying or symlinking the binary to a directory already in the path.
</p>
<pre class="nocode prettyprint">
<code class="typ"># </code><code class="pln">ln -s /opt/open-xchange-appsuite-dev/bin/build-appsuite /usr/local/bin</code>
</pre>

<h4>Source</h4>
<p>
Using the source variant can avoid the requirement for root permissions. But,
when building external apps and the build system executable is not invoked
using its full path, the environment variable <code>$OX_APPSUITE_DEV</code>
needs to be set to specify the path to the build system.
</p>
<pre class="nocode prettyprint">
<code class="typ">$ </code><code class="pln">git clone https://git.open-xchange.com/git/wd/frontend/web</code>
<code class="typ">$ </code><code class="pln">export OX_APPSUITE_DEV=$(pwd)/web/ui</code>
</pre>
<p>
Just like with the SDK variant, the executable should be put in the executable
path either by extending the <code>$PATH</code> variable
</p>
<pre class="nocode prettyprint">
<code class="typ">$ </code><code class="pln">export PATH=$PATH:$OX_APPSUITE_DEV/bin</code>
</pre>
<p>
or by copying or symlinking the executable.
</p>
<pre class="nocode prettyprint">
<code class="typ"># </code><code class="pln">ln -s $OX_APPSUITE_DEV/bin/build-appsuite /usr/local/bin</code>
</pre>

<h3>Running</h3>

<p>
The build system is executed by invoking the command
<code>build-appsuite</code>. Similar to most build systems, the build system can
perform multiple tasks, which are specified as parameters on the command line.
Each task can require any number of parameters. These parameters can be
specified either on the command line, using the syntax <code>name=value</code>,
or as environment variables.
</p><p>
If present, the file <code>local.conf</code> is sourced by a shell script before
the build process starts. This file can export environment variables which are
specific to the local system, without checking them into a version control
system. Typically, it defines values for <code>builddir</code> and
<code>debug</code>.
</p><p>
Since the build system is based on Jake, it also accepts all other
<a href="https://github.com/mde/jake#options" target="_blank">Jake options</a>.
In addition, the environment variable <code>$nodeopts</code> can be used to pass
command line parameters to Node.js. One of the most useful parameters is
<code>--debug-brk</code>, which can be used to debug the build system.
</p><p>
When developing external apps, the build system must be run from the top
directory of the app's source. As a safety precaution, execution is aborted if
the subdirectory <code>apps</code>, which usually contains JavaScript source
code, is not found.
</p>

<h3>Workflow</h3>

<p>
The build system is used not only to create source archives for packaging. It
can also directly install and update the built UI in a directory during
development, help with the setup of the source of a new external app and more.
While all of these tasks are described in the <a href="#Reference">reference</a>
section, daily work involves just a few of them.
</p>

<h4>init-packaging</h4>
<p>
The first task which should be executed when creating a new external app is
<code>init-packaging</code>. It creates packaging metadata in the current
directory. It requires the parameter <code>package</code> to specify the package
name in the generated files. All subsequent tasks will automatically extract
the package name from the files generated by <code>init-packaging</code>.
</p><p>Before execution, the <code>apps</code> subdirectory must be created.
It indicates that the current directory is actually a valid source directory.
</p>
<pre class="nocode prettyprint">
<code class="typ">$ </code><code class="pln">mkdir apps</code>
<code class="typ">$ </code><code class="pln">build-appsuite init-packaging package=example-app
Build path: build
Build version: 7.0.0-1.20130111.105125

Version [7.0.0]: 0.0.1

Maintainer (Name &lt;e-mail&gt;): Maintainer &lt;maintainer@example.com&gt;

Copyright line [2013 Open-Xchange, Inc]: 

License name [CC-BY-NC-SA-3.0]: 

Short description: Hello World app to demonstrate usage of the build system</code>
</pre>
<p>
The task presents a number of interactive prompts to get the necessary
information about the generated packages. The entered values should follow
the <a href="http://www.debian.org/doc/manuals/maint-guide/" target="_blank">
Debian Maintainer's Guide</a>. Some or even all prompts can be skipped by
explicitly specifying the information as a build variable. The list of variable
names is available in the reference of <code>init-packaging</code>.
</p><p>
After the task is finished, the generated files can be customized manually to
account for any additional packaging requirements.
</p>

<h4 id="app">app</h4>
<p>
The main workhorse task is <code>app</code>. It is used to process all source
files to an optimized deployable app. During development, it is usually called
automatically by an IDE or a directory monitoring tool. Since the builds are
incremental, the task can be called after every source modification.
</p><p>
For quickest roundtrip times, the directory with the generated files of the app
should be made available through the OX App Suite back end by overlaying
an existing OX App Suite installation, for example, by symlinking it.
</p>
<pre class="nocode prettyprint">
<code class="typ"># </code><code class="pln">ln -s $(readlink -m build/apps/com.example) \
/opt/open-xchange/appsuite/apps/com.example</code>
</pre>
<p>
To make the manifest accessible to the backend, it should be symlinked into the
directory specified by the <code>com.openexchange.apps.manifestPath</code>
setting (from <code>manifests.properties</code>) of a locally installed
OX App Suite backend.
</p>
<pre class="nocode prettyprint">
<code class="typ"># </code><code class="pln">ln -s $(readlink -m build/manifests/example-app.json) \
/opt/open-xchange/appsuite/manifests/example-app.json</code>
</pre>
<p>Now, any changes can be tested by reloading OX App Suite in the browser, and any
changes in the app manifest can be applied by restarting the backend.
</p><p>
WARNING: Do not use build variables <code>builddir</code> or
<code>manifestDir</code> when developing an external app to generate the files
directly in their final destination! The <code>clean</code> task will delete
these directories and all their contents! In general, don't point
<code>builddir</code> or any other <code>*Dir</code> variables at existing
directories.
</p><p>
As an example, let's create a small app and build it. It requires only two
files: <code>apps/com.example/main.js</code> for the source code of the app
</p>
<script type="text/example">
define('com.example/main', function () {
    'use strict';
    var app = ox.ui.createApp({ name: 'com.example' });
    app.setLauncher(function () {
        var win = ox.ui.createWindow({
            name: 'com.example',
            title: 'Hello World App'
        });
        app.setWindow(win);
        win.nodes.main.append($('<h1>').text('Hello, World!'));
        win.show();
    });
    return { getApp: app.getInstance };
});
</script>
<p>and <code>apps/com.example/manifest.json</code> for the manifest.</p>
<script type="text/example">{ title: 'Hello World App' }</script>
<p>Building the app is as easy as calling</p>
<pre class="nocode prettyprint">
<code class="typ">$ </code><code class="pln">build-appsuite app</code>
</pre>

<h4>default</h4>
<p>
The <code>default</code> task is used instead of the <code>app</code> task when
building the core OX App Suite. Since it is the default Jake task, it is not
necessary to specify it on the command line when it's the only task.
</p><p>
The top directory of OX App Suite source code includes the script
<code>build.sh</code>, which should be used instead of calling a potentially
unrelated version of <code>build-appsuite</code>. The script changes the current
directory to its own, so that it can be called from any directory. Furthermore,
it sets <code>BASEDIR</code>, so that <code>$OX_APPSUITE_DIR</code> is neither
used nor necessary.
</p>
<pre class="nocode prettyprint">
<code class="typ">$ </code><code class="pln">./build.sh</code>
</pre>

<h4>clean</h4>
<p>
The build system uses dependencies and file timestamps to decide which files to
rebuild. This assumes that any change to a file increases its timestamp to a
value which is greater than the timestamp of any existing file. When this
assumption is violated (e.g. after switching to a different source control
branch with older files) it may become necessary to rebuild everything to
restore the assumption about timestamps. The simplest way to achieve this is
the <code>clean</code> task, which simply deletes all generated files.
</p><p>
WARNING: This can be potentially dangerous, since the <code>clean</code> task
simply deletes the directories specified by the variables <code>builddir</code>,
<code>destDir</code>, <code>l10nDir</code>, <code>manifestDir</code>, and
<code>helpDir</code>.
</p>

<h4>dist</h4>
<p>
When the app is ready to be shipped, or rather all the time on a continuous
build system, the app needs to be packaged in a format suitable for installation
on a production system. Since there already exist tools to create packages from
suitably arranged source code archives, the OX App Suite build system merely
prepares such source archives.
</p><p>
The <code>dist</code> task creates an archive with the source (the one ending in
<code>.orig.tar.bz2</code>) and a few additional files necessary for Debian
packaging. RPM packages can be generated using the same source archive and
the <code>.spec</code> file created by <code>init-packaging</code>. The version
of the package is extracted from the newest entry in the file
<code>debian/changelog</code>.
</p>
<p>
Debian packages can also be generated manually either from the temporary
directory left behind by <code>dist</code>, or even directly from the source
tree. The second option pollutes the source tree with generated files, so it is
not recommended, although the <code>.gitignore</code> file created by
<code>init-packaging</code> can handle these generated files.
</p>
<pre class="nocode prettyprint">
<code class="typ">$ </code><code class="pln">build-appsuite dist</code>
<code class="typ">$ </code><code class="pln">ls tmp/packaging/
example-app-0.0.1                   example-app_0.0.1-1.dsc
example-app_0.0.1-1.debian.tar.bz2  example-app_0.0.1.orig.tar.bz2</code>
<code class="typ">$ </code><code class="pln">cd tmp/packaging/example-app-0.0.1/</code>
<code class="typ">$ </code><code class="pln">dpkg-buildpackage -b</code>
</pre>

<h2>Reference</h2>

<h3>Variables</h3>
<dl>
    <dt>BASEDIR</dt>
    <dd>
        <p>The top directory of the build system.</p>
        <p><b>Used by:</b> all tasks.</p>
        <p><b>Default:</b> installation directory of the build system</p>
        <p>
            Required to build external apps, since in this case, the build
            system is not installed in the current directory. This variable is
            automatically set as an environment variable by the build system
            executable based on <code>$OX_APPSUITE_DEV</code>.
        </p>
    </dd>
</dl>
<dl>
    <dt>branch</dt>
    <dd>
        <p>The Subversion branch of the CLDR to checkout.</p>
        <p><b>Used by:</b> <code>update-i18n</code>.</p>
    </dd>
</dl>
<dl>
    <dt>builddir</dt>
    <dd>
        <p>The target directory for generated files.</p>
        <p>
            <b>Used by:</b> <code>app</code>, <code>clean</code>,
            <code>default</code>, <code>dist</code>, <code>docs</code>,
            <code>jakedeps</code>.
        </p>
        <p>Default: <code>build</code></p>
    </dd>
</dl>
<dl>
    <dt>copyright</dt>
    <dd>
        <p>The copyright line to be included in packaging metadata.</p>
        <p><b>Used by:</b> <code>init-packaging</code>.</p>
        <p><b>Example:</b> <code>2012 Open-Xchange, Inc</code></p>
    </dd>
</dl>
<dl>
    <dt>debug</dt>
    <dd>
        <p>Enables a debug build.</p>
        <p><b>Used by:</b> <code>app</code>, <code>default</code>.</p>
        <p><b>Default:</b> <code>false</code></p>
        <p>
            To simplify debugging of OX App Suite, compression of source code
            can be disabled by specifying <code>on</code>, <code>yes</code>,
            <code>true</code> or <code>1</code>.
        </p>
    </dd>
</dl>
<dl>
    <dt>description</dt>
    <dd>
        <p></p>
        <p><b>Used by:</b> <code>init-packaging</code>.</p>
        <p>The description of the app to be included in packaging metadata.</p>
    </dd>
</dl>
<dl>
    <dt>destDir</dt>
    <dd>
        <p>
            Output directory for source archives created by
            the <code>dist</code> task.
        </p>
        <p><b>Used by:</b> <code>clean</code>, <code>dist</code>.</p>
        <p><b>Default:</b> <code>tmp/packaging</code></p>
    </dd>
</dl>
<dl>
    <dt>disableStrictMode</dt>
    <dd>
        <p>
            Removes all <code>"use strict"</code> directives from processed
            JavaScript code.
        </p>
        <p><b>Used by:</b> <code>app</code>, <code>default</code>.</p>
        <p><b>Default:</b> <code>false</code></p>
        <p>
            Some debugging tools which use code instrumentation have problems
            when the debugged code uses strict mode. This setting enables code
            processing even whe using <code>debug</code> mode, so line numbers
            will not match the original source code.
        </p>
    </dd>
</dl>
<dl>
    <dt>from</dt>
    <dd>
        <p>The root of the printed dependency tree between Jake tasks.</p>
        <p><b>Used by:</b> <code>jakedeps</code>.</p>
    </dd>
</dl>
<dl>
    <dt>helpDir</dt>
    <dd>
        <p>The location of online help files.</p>
        <p>
            <b>Used by:</b> <code>clean</code>, <code>default</code>,
            <code>dist</code>.
        </p>
        <p><b>Default:</b> same as <code>builddir</code></p>
        <p>
            If the value contains the string <code>@lang@</code>, it will be
            replaced by the lowercase language code (e.g. <code>en-us</code>) to
            allow per-language directories.
        </p>
    </dd>
</dl>
<dl>
    <dt>l10nDir</dt>
    <dd>
        <p>The location of compiled l10n files.</p>
        <p>
            <b>Used by:</b> <code>app</code>, <code>clean</code>,
            <code>default</code>, <code>dist</code>.
        </p>
        <p><b>Default:</b> same as <code>builddir</code></p>
        <p>
            If the value contains the string <code>@lang@</code>, it will be
            replaced by the lowercase language code (e.g. <code>en-us</code>) to
            allow per-language directories.
        </p>
    </dd>
</dl>
<dl>
    <dt>license</dt>
    <dd>
        <p>File name of the full text of the distribution license.</p>
        <p><b>Used by:</b> <code>init-packaging</code>.</p>
        <p><b>Default:</b> based on <code>licenseName</code>.</p>
    </dd>
</dl>
<dl>
    <dt>licenseName</dt>
    <dd>
        <p>
            Name of the distribution license to be included in packaging
            metadata.
        </p>
        <p><b>Used by:</b> <code>init-packaging</code>.</p>
        <p><b>Default:</b> <code>CC-BY-NC-SA-3.0</code></p>
    </dd>
</dl>
<dl>
    <dt>manifestDir</dt>
    <dd>
        <p>The location of the combined manifest file.</p>
        <p>
            <b>Used by:</b> <code>app</code>, <code>clean</code>,
            <code>default</code>, <code>dist</code>.
        </p>
        <p><b>Default:</b> same as <code>builddir</code></p>
    </dd>
</dl>
<dl>
    <dt>maintainer</dt>
    <dd>
        <p>Name and email address of the package maintainer.</p>
        <p><b>Used by:</b> <code>init-packaging</code>.</p>
        <p>
            <b>Format:</b> <code><var>Name</var> &lt;<var>email</var>&gt;</code>
        </p>
    </dd>
</dl>
<dl>
    <dt>package</dt>
    <dd>
        <p>The name of the package for the built app.</p>
        <p><b>Used by:</b> all tasks.</p>
        <p>
            <b>Default:</b> the package name in the first line of
            <code>debian/changelog</code>
        </p>
        <p>
            Since the name of the manifest file contains the package name and it
            is required to determine build dependencies, the package name must
            be always known. This means either <code>debian/changelog</code>
            must exist and contain at least one entry, or the parameter must be
            explicitly specified.
        </p>
    </dd>
</dl>
<dl>
    <dt>reverse</dt>
    <dd>
        <p>Reverses the direction of printed dependencies.</p>
        <p><b>Used by:</b> <code>deps</code>.</p>
        <p>
            When specified, the <code>deps</code> task prints modules which
            depend on the specified modules, instead of modules on which
            the specified module depends.
        </p>
    </dd>
</dl>
<dl>
    <dt>revision</dt>
    <dd>
        <p>Revision number of the package for the app.</p>
        <p>
            <b>Used by:</b> <code>app</code>, <code>default</code>,
            <code>dist</code>.
        </p>
        <p><b>Default:</b> <code>1</code></p>
        <p>
            The revision number must increase with each rebuild of the same
            version to enable the creation of unique version strings. These are
            required in package names and to control content caching in clients.
        </p>
    </dd>
</dl>
<dl>
    <dt>root</dt>
    <dd>
        <p>Specifies for which module to print the dependencies.</p>
        <p><b>Used by:</b> <code>deps</code>.</p>
        <p><b>Default:</b> print all roots</p>
        <p>
            If specified, only the dependencies of the specified module are
            printed. Otherwise, the dependencies of all modules are printed.
        </p>
    </dd>
</dl>
<dl>
    <dt>skipDeb</dt>
    <dd>
        <p>Whether to skip the generation of Debian source packages.</p>
        <p><b>Used by:</b> <code>dist</code>.</p>
        <p><b>Default:</b> <code>false</code></p>
        <p>
            This is useful when Debian packages are not required and/or
            <code>dpkg-source</code> is not available, e.g. on RPM based
            systems.
        </p>
        <p>
            Even when using this flag, at least the file
            <code>debian/changelog</code> is still required, because it is used
            to store the package name and version. 
        </p>
    </dd>
</dl>
<dl>
    <dt>skipLess</dt>
    <dd>
        <p>Whether to skip the preprocessing of LessCSS files.</p>
        <p><b>Used by:</b> <code>app</code>, <code>default</code>.</p>
        <p><b>Default:</b> <code>false</code></p>
        <p>
            This flag skips the generation of CSS files in
            the <code>apps/themes/*/less</code> directories of all themes.
            It is used by the packaging system, where the LessCSS files are
            precompiled after installation on the target system instead of
            while building the package.
        </p>
    </dd>
</dl>
<dl>
    <dt>tag</dt>
    <dd>
        <p>The Subversion tag of the CLDR to checkout.</p>
        <p><b>Used by:</b> <code>update-i18n</code>.</p>
    </dd>
</dl>
<dl>
    <dt>to</dt>
    <dd>
        <p>The leaf task in the printed dependency path between Jake tasks.</p>
        <p><b>Used by:</b> <code>jakedeps</code>.</p>
        <p>
            When specified, only a single path from the root to the leaf task is
            printed (in reverse order).
        </p>
    </dd>
</dl>
<dl>
    <dt>version</dt>
    <dd>
        <p>Version number of the app.</p>
        <p>
            <b>Used by:</b> <code>app</code>, <code>default</code>,
            <code>dist</code>, <code>init-packaging</code>.
        </p>
        <p><b>Default:</b> <code>0.0.1</code></p>
        <p>
            The version should consist of a major, minor and patch version
            separated by dots.
        </p>
    </dd>
</dl>
<h3>Tasks</h3>
<p>
An up-to-date list of tasks can be printed using the -T command line option.
</p>
<dl>
    <dt>app</dt>
    <dd>
        <p>Builds an external app.</p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>builddir</code>,
                <code>debug</code>, <code>disableStrictMode</code>,
                <code>l10nDir</code>, <code>manifestDir</code>,
                <code>package</code>, <code>revision</code>,
                <code>version</code>.
            </li>
        </ul>
        <p>This is the main task used to build external apps.</p>
        <p>
            It works without explicitly specifying any variables, but during
            development, <code>builddir</code> is usually pointed to
            the directory of a locally installed OX App Suite UI to avoid
            additional copying steps. For debugging, <code>debug</code> is also
            often used. Note that <code>clean</code> must be called when
            changing any of the variables.
        </p>
    </dd>
</dl>
<dl>
    <dt>clean</dt>
    <dd>
        <p>Removes all generated files.</p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>builddir</code>,
                <code>destDir</code>, <code>l10nDir</code>,
                <code>manifestDir</code>, <code>package</code>.
            </li>
        </ul>
        <p>
            This task should be executed before a normal build using
            <code>app</code> or <code>default</code> after changing any build
            variables and after a switch between Git branches. Normal
            incremental builds can miss changed files if a branch switch
            replaces files by older versions.
        </p>
    </dd>
</dl>
<dl>
    <dt>default</dt>
    <dd>
        <p>Builds OX App Suite.</p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>builddir</code>,
                <code>debug</code>, <code>disableStrictMode</code>,
                <code>l10nDir</code>, <code>manifestDir</code>,
                <code>package</code>, <code>revision</code>,
                <code>version</code>.
            </li>
        </ul>
        <p>
            This is the main task to build OX App Suite. Since it is the default
            Jake task, it does not need to be specified explicitly on
            the command line when it is the only task.
        </p>
        <p>
            It works without explicitly specifying any variables, but during
            development, <code>builddir</code> is usually pointed to
            a directory which is accessible to a local web server. For
            debugging, <code>debug</code> is also often used. Note that
            <code>clean</code> must be called when changing any of
            the variables.
        </p>
    </dd>
</dl>  
<dl>
    <dt>deps</dt>
    <dd>
        <p>Prints module dependencies.</p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>package</code>,
                <code>reverse</code>, <code>root</code>.
            </li>
        </ul>
        <p>
            This task visualizes dependencies of RequireJS modules. It prints
            a tree of dependencies to <code>stdout</code>.
        </p>
        <p>
            If <code>root</code> is specified, then only the dependencies of
            that module are printed. Otherwise, the dependencies of all modules,
            on which no other module depends are printed in sequence. 
        </p>
        <p>
            If <code>reverse</code> is specified, then this task prints
            dependants instead of dependencies, i.e. modules which depend on
            the specified module instead of modules on which the specified
            module depends.
        </p>
    </dd>
</dl>
<dl>
    <dt>dist</dt>
    <dd>
        <p>Creates source packages.</p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>builddir</code>,
                <code>destDir</code>, <code>l10nDir</code>,
                <code>manifestDir</code>, <code>package</code>,
                <code>revision</code>, <code>skipDeb</code>,
                <code>version</code>.
            </li>
        </ul>
        <p>
            This task cleans the source tree by calling <code>clean</code> and
            packs the source into an archive which can be used to create Debian
            and RPM packages. The necessary Debian metadata is created alongside
            the source archive. All files necessary for Debian packaging are
            placed in the directory specified by <code>destDir</code>.
            The generated <code>.orig.tar.bz2</code> archive can also be used
            together with the <code>.spec</code> file to generate RPM packages.
        </p>
        <p>
            Unless the variable <code>skipDeb</code> is set to
            <code>true</code>, the program <code>dpkg-source</code> is required
            by this task. It is used to generate Debian-specific packaging
            metadata.
        </p>
        <p>
            The variables <code>version</code> and <code>revision</code> specify
            the version of the package which will be built from the created
            files, and should therefore be specified explicitly.
        </p>
    </dd>
</dl>
<dl>
    <dt>docs</dt>
    <dd>
        <p>Generates developer documentation.</p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>builddir</code>,
                <code>package</code>.
            </li>
        </ul>
        <p>
            This task generates developer documentation for OX App Suite.
            The generated HTML files are put into
            <code>builddir</code><code>/doc</code>. 
        </p>
    </dd>
</dl>
<dl>
    <dt>init-packaging</dt>
    <dd>
        <p>Initializes packaging information for a new app.</p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>copyright</code>,
                <code>description</code>, <code>license</code>,
                <code>licenseName</code>, <code>maintainer</code>,
                <code>package</code>, <code>version</code>.
            </li>
        </ul>
        <p>
            This task is the first task called when starting with
            the development of a new external app. The directory from which it
            is called must already contain at least the <code>apps</code>
            subdirectory. This is also the only task where
            the <code>package</code> variable must be specified explicitly.
            Afterwards, the package name is looked up automatically in the file
            <code>debian/changelog</code>, which is created by this task.
        </p>
        <p>
            The variables <code>version</code>, <code>maintainer</code>,
            <code>copyright</code>, <code>licenseName</code>,
            <code>license</code>, and <code>description</code> are required to
            fill out all necessary packaging metadata. Any of these variables
            which are not specified explicitly will cause an interactive prompt.
            This avoids the need to remember the list of variables before one
            can start developing an app.
        </p>
    </dd>
</dl>
<dl>
    <dt>jakedeps</dt>
    <dd>
        <p>Shows the dependency chain between two Jake tasks.</p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>from</code>,
                <code>package</code>, <code>to</code>.
            </li>
        </ul>
        <p>
            This task visualized dependencies between Jake tasks. The variable
            <code>from</code> specifies the root of a dependency tree, with all
            dependencies of <code>from</code> as inner and leaf nodes. If
            <code>to</code> is not specified, then that entire tree is printed.
        </p>
        <p>
            If <code>to</code> is also specified, then only the first found
            dependency path from <code>from</code> to <code>to</code> is
            .printed with <code>to</code> at the top and <code>from</code> at
            the bottom.
        </p>
    </dd>
</dl>
<dl>
    <dt>merge</dt>
    <dd>
        <p>
            Updates all <code>.po</code> files with the generated
            <code>ox.pot</code>.
        </p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>builddir</code>,
                <code>debug</code>, <code>package</code>, <code>revision</code>,
                <code>version</code>.
            </li>
        </ul>
        <p>
            This task updates the list of extracted i18n strings in
            <code>ox.pot</code> and calls the GNU Gettext tool
            <code>msgmerge</code> for every language in <code>i18n/*.po</code>. 
        </p>
    </dd>
</dl>
<dl>
    <dt>update-i18n</dt>
    <dd>
        <p>Updates CLDR data in the source tree.</p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>branch</code>,
                <code>package</code>, <code>tag</code>.
            </li>
        </ul>
        <p>
            This task downloads data from the Unicode CLDR and updates date
            translations for all languages in <code>i18n/*.po</code>.
        </p>
        <p>
            The exact version of CLDR data is specified as Suubversion tag or
            branch by the variables <code>tag</code> and <code>branch</code>,
            respectively. If neither is specified, then the Subversion trunk is
            checked out. If both are specified, <code>tag</code> is used.
        </p>
    </dd>
</dl>
<dl>
    <dt>verify-doc</dt>
    <dd>
        <p>Generates a documentation skeleton for extension points.</p>
        <ul class="params">
            <li>
                <b>Variables:</b> <code>BASEDIR</code>, <code>package</code>.
            </li>
        </ul>
        <p>
            This task is still under development. Currently, it creates a list
            of all extension points, which have a constant name in the source
            code. In the future it is supposed to update an existing list
            instead of overwriting it, and to handle non-constant extension
            point names.
        </p>
        <p>
            The list of extension points is stored as an HTML snippet in
            <code>doc/extensionpoints.html</code>.
        </p>
    </dd>
</dl>
