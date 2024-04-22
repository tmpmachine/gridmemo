let compoCodeEditor = (function() {
  
  let SELF = {
    CreateAceRange,
    InitPiPEditor,
    GetWrapMode: () => local.isWrapMode,
    GetEditor: () => editor,
  };
  
  let editor;
  let local = {
    isWrapMode: true,
  };
  
  function CreateAceRange(positions) {
    let Range = ace.Range;
  
    if (!positions || !positions.start || !positions.end) {
        throw new Error('Invalid positions object. Requires start and end properties.');
    }
  
    let start = positions.start;
    let end = positions.end;
  
    return new Range(start.row, start.column, end.row, end.column);
  }
  
  function InitPiPEditor() {
    
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/markdown");
    editor.session.setUseWrapMode(local.isWrapMode);
    editor.setOption("scrollPastEnd", 1);
      
    if (localStorage.getItem('MjA3MzcwNjI-pipnote-default')) {
      var sessionText = ace.createEditSession(localStorage.getItem('MjA3MzcwNjI-pipnote-default'));
      editor.setSession(sessionText);
    } 
    
    // pip window
    editor.commands.addCommand({
      name: "custom-cmd-open-pip-window",
      bindKey: {win:"Alt-P"},
      exec: function() {
        openApp();
      }
    });
    
    // save editor data
    editor.commands.addCommand({
      name: "save",
      bindKey: {win:"Ctrl-S"},
      exec: function() {
        event.preventDefault();
        app.save();
        compoNotif.Pop('Saved');
      }
    });
    
    // save editor data
    editor.commands.addCommand({
      name: "custom-cmd-toggle-wrap",
      bindKey: {win:"Alt-Z"},
      exec: function() {
        local.isWrapMode = !editor.session.getUseWrapMode();
        editor.session.setUseWrapMode(local.isWrapMode);
      }
    });
      
      
    editor.commands.addCommand({
      name: "movelinesup",
      bindKey: {win:"Ctrl-Shift-Up"},
      exec: function(editor) {
        editor.moveLinesUp();
      }
    });
    editor.commands.addCommand({
      name: "movelinesdown",
      bindKey: {win:"Ctrl-Shift-Down"},
      exec: function(editor) {
        editor.moveLinesDown();
      }
    });
    editor.commands.addCommand({
      name: "select-or-more-after",
      bindKey: {win:"Ctrl-D"},
      exec: function(editor) {
        if (editor.selection.isEmpty()) {
          editor.selection.selectWord();
        } else {
          editor.execCommand("selectMoreAfter");
        }
      }
    });
    editor.commands.addCommand({
      name: "removeline",
      bindKey: {win: "Ctrl-Shift-K"},
      exec: function(editor) {
        editor.removeLines();
      }
    });
    
    editor.commands.addCommand({
      name: "custom-copy",
      bindKey: {win: "Ctrl-C"},
      exec: function(editor) {
        let selection = editor.getSelectionRange();
        if (selection.start.row == selection.end.row && selection.start.column == selection.end.column) {
          let row = selection.start.row;
          let col = selection.start.column;
          editor.selection.setSelectionRange({start:{row,column:0},end:{row:row+1,column:0}});
          if (pipWindow) {
            pipWindow.document.execCommand('copy');
          } else {
            document.execCommand('copy');
          }
          editor.clearSelection();
          editor.moveCursorTo(row, col);
        } else {
          if (pipWindow) {
            pipWindow.document.execCommand('copy');
          } else {
            document.execCommand('copy');
          }
        }
      }
    });
    
    editor.commands.addCommand({
      name: "custom-cut",
      bindKey: {win: "Ctrl-X"},
      exec: function(editor) {
        let selection = editor.getSelectionRange();
        if (selection.start.row == selection.end.row && selection.start.column == selection.end.column) {
          let row = selection.start.row;
          editor.selection.setSelectionRange({start:{row,column:0},end:{row:row+1,column:0}});
          if (pipWindow) {
            pipWindow.document.execCommand('cut');
          } else {
            document.execCommand('cut');
          }
        } else {
          if (pipWindow) {
            pipWindow.document.execCommand('cut');
          } else {
            document.execCommand('cut');
          }
        }
      }
    });
    
  }
  
  return SELF;
  
})();