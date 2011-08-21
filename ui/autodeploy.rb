# gem install watchr
# gem install ruby-fsevent (On Mac OS X)
# or
# gem install rev (on Linux)
# watchr autodeploy.rb

#https://github.com/mynyml/watchr


DEPLOY_DIR = "/Library/WebServer/Documents/ox7"

watch("\.js$") { system("ant -Dbuild=#{DEPLOY_DIR}") }