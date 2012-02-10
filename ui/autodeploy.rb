# gem install watchr
# gem install ruby-fsevent (On Mac OS X)
# or
# gem install rev (on Linux)
# watchr autodeploy.rb

#https://github.com/mynyml/watchr

watch("\.js$") { system("./build.sh") }
watch("\.css$") { system("./build.sh") }
watch("\.html$") { system("./build.sh") }
watch("^doc") {system("./build.sh doc") }
