$.sceditor.plugins.undoOverrider = function() {
	var me = this;
	var editor;
	
	var redo = [];
	var undo = [];

		me.init = function() {
			// The this variable will be set to the instance of the editor calling it,
			// hence why the plugins "this" is saved to the base variable.
			editor = this;
			// addShortcut is the easiest way to add handlers to specific shortcuts
			this.addShortcut('ctrl+z', me.undo);
			this.addShortcut('ctrl+shift+z', me.redo);
			this.addShortcut('ctrl+y', me.redo);
		};
		
		var readjustEditor = function (caret, sourceMode, value){
			editor.sourceMode(sourceMode);
			editor.val(value, false);
			editor.sourceEditorCaret({
				'start': caret.start,
				'end': caret.end
			});
			
		}
		
		me.undo = function(e) {
				e.preventDefault();
				var value = undo.pop();
				if(value){
					redo.push(value);
					readjustEditor(value.caret, value.sourceMode, value.value);
					if(console){
						console.log("undo: " + value.value + " <-at-> " + value.caret);
					}
				}
		};
			 
		me.redo = function(e) {
				e.preventDefault();
				var value = redo.pop();
				if(value){
					undo.push(value);
					readjustEditor(value.caret, value.sourceMode, value.value);
					if(console){
						console.log("redo: " + value.value + " <-at-> " + value.caret);
					}
				}
		};
		// me.undo = function(e) {
				// e.preventDefault();
				// var value = undo.pop();
				// if(value){
					// redo.push(value);
					// txtarea.value = value.value;
					// setCaretPosition(txtarea, value.caret);
					// if(console){
						// console.log("undo: " + value.value + " <-at-> " + value.caret);
					// }
				// }
		// };
			 
		// me.redo = function(e) {
				// e.preventDefault();
				// var value = redo.pop();
				// if(value){
					// undo.push(value);
					// txtarea.value = value;
					// setCaretPosition(txtarea, value.caret);
					// if(console){
						// console.log("redo: " + value.value + " <-at-> " + value.caret);
					// }
				// }
		// };
	
	/**
	 * Handle the valueChanged signal.
	 *
	 * e.rawValue will either be the raw HTML from the WYSIWYG editor with the
	 * rangeHelper range markers inserted, or it will be the raw value of the
	 * source editor (BBCode or HTML depening on plugins).
	 * @return {void}
	 */
	// me.signalValueChangedEvent = function(e) {console.log("valueChanged2");}
	me.signalValuechangedEvent = function(e) {
		
		console.log("valueChanged");
		redo.length = 0;
		
		var value = {
			'caret': this.sourceEditorCaret(),
			'sourceMode': this.sourceMode(),
			'value': e.rawValue
			}
		// if(console){
			console.log("log: " + e.rawValue);
		// }
		
		undo.push(value);
		
	}
};