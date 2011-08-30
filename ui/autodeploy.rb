# gem install watchr
# gem install ruby-fsevent (On Mac OS X)
# or
# gem install rev (on Linux)
# watchr autodeploy.rb

#https://github.com/mynyml/watchr


DEPLOY_DIR = "/Library/WebServer/Documents/ox7"

watch("\.js$") { system("builddir=\"#{DEPLOY_DIR}\" ./build.sh") }
watch("\.css$") { system("builddir=\"#{DEPLOY_DIR}\" ./build.sh") }
watch("^doc") {system("builddir=\"#{DEPLOY_DIR}\" ./build.sh doc") }
