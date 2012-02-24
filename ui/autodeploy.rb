# gem install watchr
# gem install ruby-fsevent (On Mac OS X)
# or
# gem install rev (on Linux)
# watchr autodeploy.rb

#https://github.com/mynyml/watchr

watch("\.js$") { system("./build.sh debug=true") }
watch("\.css$") { system("./build.sh debug=true") }
watch("\.less$") { system("./build.sh debug=true") }
watch("\.html$") { system("./build.sh debug=true") }
watch("^doc") {system("./build.sh debug=true doc") }
