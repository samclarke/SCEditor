#! /bin/bash

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
cat jquery.sceditor.js jquery.sceditor.bbcode.js > minified/jquery.sceditor.min.js
yui-compressor --type js -o minified/jquery.sceditor.min.js minified/jquery.sceditor.min.js

