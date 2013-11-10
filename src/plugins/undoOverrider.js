$.sceditor.plugins.undoOverrider = function() {
	var me = this;
	var editor;
	var charChangedCount = 0;
	var previousValue;
	
	var redo = [];
	var undo = [];
	var ignoreNextValueChanged = false;

	
	var readjustEditor = function (caret, sourceMode, value){
		editor.sourceMode(sourceMode);
		editor.val(value, false);
		if(sourceMode){ // if text mode
			editor.sourceEditorCaret({
				'start': caret.start,
				'end': caret.end
			});
		}
		
	}
	
	
	/**
	 * Caluclates the number of characters that have changed
	 * between two strings.
	 * @param {String} strA
	 * @param {String} strB
	 * @return {String}
	 */
	var simpleDiff = function (strA, strB) {
		var start, end, aLenDiff, bLenDiff,
			aLength = strA.length,
			bLength = strB.length,
			length = Math.max(aLength, bLength);

		// Calculate the start
		for (start = 0; start < length; start++) {
			if (strA[start] !== strB[start])
				break;
		}

		// Calculate the end
		aLenDiff = aLength < bLength ? bLength - aLength : 0;
		bLenDiff = bLength < aLength ? aLength - bLength : 0;

		for (end = length - 1; end >= 0; end--) {
			if (strA[end - aLenDiff] !== strB[end - bLenDiff])
				break;
		}

		return (end - start) + 1;
	};

	me.init = function() {
		// The this variable will be set to the instance of the editor calling it,
		// hence why the plugins "this" is saved to the base variable.
		editor = this;
		// addShortcut is the easiest way to add handlers to specific shortcuts
		this.addShortcut('ctrl+z', me.undo);
		this.addShortcut('ctrl+shift+z', me.redo);
		this.addShortcut('ctrl+y', me.redo);
	};
	
	
	me.undo = function(e) {
			// e.preventDefault();
			var value = undo.pop();
			if(value &&
				editor.rawValue() == value.value ||
				value.value == editor.val()
			){
				value = undo.pop();
			}
			if(value){
				console.log(editor.rawValue() + " \n\n " + value.value);
				var currentValue = {
					'caret': editor.sourceEditorCaret(),
					'sourceMode': editor.sourceMode(),
					'value': editor.rawValue()
					}
				redo.push(currentValue);
				if(currentValue.value != value.value){
					redo.push(value);
				}
				readjustEditor(value.caret, value.sourceMode, value.value);
				ignoreNextValueChanged = true;
				if(console){
					console.log("undo: " + value.value + " <-at-> " + value.caret);
				}
			}
			return false;
	};
		 
	me.redo = function(e) {
		// e.preventDefault();
		var value = redo.pop();
		if(value && editor.rawValue() == value.value){
			value = undo.pop();
		}
		if(value){
			undo.push(value);
			readjustEditor(value.caret, value.sourceMode, value.value);
			ignoreNextValueChanged = true;
			if(console){
				console.log("redo: " + value.value + " <-at-> " + value.caret);
			}
		}
		return false;
	};

	
	me.signalReady = function () {
		// Store the initial value as the last value
		previousValue = editor.val();
		
		
		var value = {
			'caret': this.sourceEditorCaret(),
			'sourceMode': this.sourceMode(),
			'value': editor.rawValue()
			}
			
		undo.push(value);
	};
	
	/**
	 * Handle the valueChanged signal.
	 *
	 * e.rawValue will either be the raw HTML from the WYSIWYG editor with the
	 * rangeHelper range markers inserted, or it will be the raw value of the
	 * source editor (BBCode or HTML depening on plugins).
	 * @return {void}
	 */
	me.signalValuechangedEvent = function (e) {
		var currentText = editor.val();
		charChangedCount += simpleDiff(previousValue, currentText);

		if(ignoreNextValueChanged){
			ignoreNextValueChanged = false;
			previousValue = currentText;
			return;
		}else if (charChangedCount < 20) {
			return;
		}else if(charChangedCount < 50 && !e.rawValue[e.rawValue.length - 1].match(/\s/g)){
			return
		}
		redo.length = 0;
		
		var value = {
			'caret': this.sourceEditorCaret(),
			'sourceMode': this.sourceMode(),
			'value': e.rawValue
			}
			
		undo.push(value);
		charChangedCount = 0;
		previousValue = currentText;
	
	};
	
};