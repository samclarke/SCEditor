#! /bin/bash

# To use this build file type /build/build.sh in terminal from the root directory.
# You must have the closure compiler jar in the build folder and spritemapper installed for this to work.

# compress CSS
echo "Creating CSS sprites"
spritemapper jquery.sceditor.css

# Remove the minified/ prefix from the sprite urls created above
# as the css and sprite should be in the same directory
sed 's|minified/||g' minified/jquery.sceditor.min.css > minified/jquery.sceditor.sed.css

mv minified/jquery.sceditor.sed.css minified/jquery.sceditor.min.css


echo "Minimising CSS"
yui-compressor --type css -o minified/jquery.sceditor.min.css minified/jquery.sceditor.min.css
yui-compressor --type css -o minified/jquery.sceditor.default.min.css jquery.sceditor.default.css


# compres JS
echo "Minimising JavaScript"

java -jar build/compiler.jar --js=jquery.sceditor.js --js=jquery.sceditor.bbcode.js --js_output_file=minified/jquery.sceditor.min.js

