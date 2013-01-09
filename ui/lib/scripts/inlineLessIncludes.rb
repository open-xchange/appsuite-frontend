#! /usr/bin/env ruby
# Naive but hopefully good enough
# May need some manual corrections

completeFile = ""
name = ARGV.shift
dirname = File.dirname(name)

File.open(name) do
  |f|
  f.each_line do
    |line|
    if (/@import\s+"(.*?)";/ =~ line)
      includedFile = $1
      completeFile += "// " + line + "\n"
      completeFile += File.read(dirname + "/" + includedFile)
      completeFile += "// END OF #{includedFile}\n\n" 
    else
      completeFile += line + "\n";
    end
  end
end

puts completeFile