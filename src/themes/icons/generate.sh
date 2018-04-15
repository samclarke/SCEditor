#!/bin/bash
FILES=src/famfamfam/*.png
OUT=famfamfam.less
IMAGE=famfamfam.png

rm $OUT
rm $IMAGE

echo -e '// Where to find the famfamfam icon images' >> $OUT
echo -e '@famfamfam-image-location: "famfamfam.png";' >> $OUT
echo -e '' >> $OUT
echo -e 'div.sceditor-grip, .sceditor-button div {' >> $OUT
echo -e '	background-image: url("@{famfamfam-image-location}");' >> $OUT
echo -e '	background-repeat: no-repeat;' >> $OUT
echo -e '	width: 16px;' >> $OUT
echo -e '	height: 16px;' >> $OUT
echo -e '}' >> $OUT

Y=0
$INIMAGES

for f in $FILES
do
	FILENAME=`basename -s .png $f`

	# skip grip images, those are not 16x16 icond and will be added at the end
	if [ $FILENAME == "grip" ] || [ $FILENAME == "grip-rtl" ]
	then
		continue
	fi

	echo -e ".sceditor-button-$FILENAME div { background-position: 0px $Y""px; }" >> $OUT

	INIMAGES="$INIMAGES $f"
	let "Y-=16"
done

montage -mode concatenate -background none -tile 1x $INIMAGES $IMAGE
montage -mode concatenate -background none -tile 1x $IMAGE src/famfamfam/grip.png src/famfamfam/grip-rtl.png $IMAGE

echo -e '' >> $OUT
echo -e 'div.sceditor-grip {' >> $OUT
echo -e '	background-position: 0px -640px;' >> $OUT
echo -e '	width: 10px;' >> $OUT
echo -e '	height: 10px;' >> $OUT
echo -e '}' >> $OUT
echo -e '.rtl div.sceditor-grip { background-position: 0px -650px; }' >> $OUT

