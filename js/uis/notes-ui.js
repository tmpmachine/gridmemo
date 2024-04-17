let uiNotes = (function() {

  let $ = document.querySelector.bind(document);
  let $$ = document.querySelectorAll.bind(document);
  
  let SELF = {
    DeleteSelectedNote,
    ListNotesAsync,
    GetActiveNoteId,
    InsertNote,
  };
  
  async function ListNotesAsync() {
    $('#wrapper').innerHTML = '';
    
    let workspace = compoWorkspace.GetActiveGroup();
    
    if (!workspace) return;
    
    for (let noteId of workspace.noteIds) {
      
      let result = await compoNotes.GetByIdAsync(noteId);
      
      if (!result.success) continue;
      
      appendNoteEl(result.data);
    }
  }
  
  
  function toggleRGB(e) {
    for (let node of $$('#wrapper textarea')) {
      node.parentNode.classList.toggle('active', false);
    }
    let node = e.target;
    node.parentNode.classList.toggle('active', true);
  }
  
  async function InsertNote() {
    
    let workspace = compoWorkspace.GetActiveGroup();
    if (workspace === null) return;
    
    let result = await compoNotes.AddAsync('');
    if (!result.success) return;
    
    let noteId = result.data;
    
    let activeNoteIndex = 0;
    let activeNoteId = uiNotes.GetActiveNoteId();

    if (activeNoteId) {
      activeNoteIndex = workspace.noteIds.indexOf(activeNoteId);
    }
    
    workspace.noteIds.splice(activeNoteIndex, 0, noteId);
    compoWorkspace.Commit();
    appData.Save();
    
    appendNoteElAtIndex({
      id: noteId,
      content: '',
    }, activeNoteIndex);
    
    setActiveNoteElById(noteId);
  }
  
  
  function appendNoteElAtIndex(data, insertIndex) {
    
    let docFrag = document.createDocumentFragment();

    let el = window.templateSlot.fill({
      data, 
      template: document.querySelector('#tmp-list-note').content.cloneNode(true), 
    });
    
    el.querySelector('[data-kind="item"]').dataset.id = data.id;
    el.querySelector('textarea').addEventListener('click', toggleRGB);
    el.querySelector('textarea').value = data.content;
    
    docFrag.append(el);
    
    let noteEls = $('#wrapper').querySelectorAll('.notes');
    
    if (noteEls.length > 0) {
      for (let i = 0; i < noteEls.length; i++) {
        if (i == insertIndex) {
          $('#wrapper').insertBefore(docFrag, noteEls[i]);
          break;
        }
      }
    } else {
      $('#wrapper').append(docFrag);
    }
    
  }
  
  function setActiveNoteElById(id) {
    let noteEl = $(`.notes[data-id="${id}"]`);
    if (!noteEl) return;
    
    for (let node of $$('#wrapper textarea')) {
      node.parentNode.classList.toggle('active', false);
    }
    
    noteEl.querySelector('.notes-inner').classList.toggle('active', true);
  }
  
  function appendNoteEl(data) {
    
    let docFrag = document.createDocumentFragment();

    let el = window.templateSlot.fill({
      data, 
      template: document.querySelector('#tmp-list-note').content.cloneNode(true), 
    });
    
    el.querySelector('[data-kind="item"]').dataset.id = data.id;
    el.querySelector('textarea').addEventListener('click', toggleRGB);
    el.querySelector('textarea').value = data.content;
    el.querySelector('textarea').tempData = {
      editorSesionCustomFoldData: data.editorSession?.foldData,
    };
    
    docFrag.append(el);
    
    $('#wrapper').append(docFrag);
  }
  
  async function DeleteSelectedNote() {
    let id = GetActiveNoteId();
    let noteEl = $(`.notes[data-id="${id}"]`);
    
    if (!noteEl) return;
    
    let noteObj = await compoNotes.GetByIdAsync(id);
    
    if (noteObj?.data?.content?.trim().length > 0) {
      let isConfirm = window.confirm('Delete this note? This process cannot be undone');
      if (!isConfirm) return;
    }
    
    let result = await compoNotes.DeleteById(id);
    
    if (!result.success) return;
    
    noteEl.remove();
    
    let workspace = compoWorkspace.GetActiveGroup();
    compoWorkspace.DeleteWorkspaceNoteById(workspace.id, id);
    compoWorkspace.Commit();
    appData.Save();
  }
  
  function GetActiveNoteId() {
    let el = $('.notes-inner.active');
    
    if (!el) return null;
    
    return el.closest('[data-kind="item"]').dataset.id;
  }
  
  return SELF;
  
})();