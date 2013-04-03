
How to get the UI running in Debian/Ubuntu
------------------------------------------

1.  You need Apache and Node.js 0.4 or later

        sudo apt-get install apache2 nodejs

2.  Figure out Apache's document root (usually /var/www) and put the path for
    the UI into an environment variable

        export builddir="/var/www/appsuite"

3.  Create the new directory for the UI with write rights for yourself

        sudo mkdir $builddir
        sudo chown $(whoami) $builddir

4.  Build the UI and the documentation:

        ./build.sh
        ./build.sh docs

    Note: Instead of exporting the builddir every time your want to build the ui or
    run the appserver, you can also create a file <em>local.conf</em> and set the
    directory in there. This way, every time the buildsystem or appserver runs, it
    automatically picks up the correct directory.

    local.conf:
    --- snip ---
    export builddir="/Library/WebServer/Documents/appsuite"
    --- snap ---


5.  Run the app loading server
        
        ./appserver.sh

    Don't worry: If it doesn't tell you anything it's happily running.

6.  If everything works fine, the documentation should be at
    http://localhost/appsuite/doc/apache.html. Continue reading there!


How to get the UI running on MacOS X
------------------------------------

1.  Figure out Apache's document root. If you haven't changed anything, it's:

    /Library/WebServer/Documents

2.  Create a new folder appsuite in Apache's document root

3.  You need node.js to build the UI:

    - Visit http://nodejs.org/ and install stable version.

    - Open terminal

    - Set environment variable:
        export builddir="/Library/WebServer/Documents/appsuite"

    Note: Instead of exporting the builddir every time your want to build the ui or
    run the appserver, you can also create a file <em>local.conf</em> and set the
    directory in there. This way, every time the buildsystem or appserver runs, it
    automatically picks up the correct directory.

    local.conf:
    --- snip ---
    export buildir="/Library/WebServer/Documents/appsuite"
    --- snap ---

    - Build UI:
      ./build.sh

    - Run the app loading server
      ./appserver.sh

    - Build documentation:
      ./build.sh docs

4.  If everything works fine, the documentation should be at
    http://localhost/appsuite/doc/apache.html. Continue reading there!

5.  If you want to work with eclipse, visit
    http://stackoverflow.com/questions/829749/launch-mac-eclipse-with-environment-variables-set

    Your eclipse.sh should contain:

    #!/bin/sh
    export builddir="/Library/WebServer/Documents/appsuite"
    exec "`dirname \"$0\"`/eclipse" $@

    This is a nice trick to get automatic builds without changing project files.
