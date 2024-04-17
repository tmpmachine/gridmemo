let uiWorkspace = (function() {
  
  let $ = document.querySelector.bind(document);
  let $$ = document.querySelectorAll.bind(document);
  
  let SELF = {
    HandleClickWorkspaces,
    OpenWorkspaceById,
    ListWorkspace,
    CreateWorkspace,
    RefreshWorkspaceState,
    OpenRecentWorkspace,
  };
  
  function HandleClickWorkspaces(evt) {
    
    let targetEl = evt.target;
    let itemEl = targetEl?.closest('[data-kind="itemWorkspace"]');
    let actionEl = targetEl?.closest('[data-action]');
    let action = actionEl?.dataset.action;
    
    // data
    let id = itemEl?.dataset.id;
    
    if (!itemEl) return;
    
    
    // todo
    switch (action) {
      case 'open': OpenWorkspaceById(id); break;
      case 'rename': renameWorkspaceById(id); break;
      case 'delete': deleteWorkspaceById(id); break;
      default: OpenWorkspaceById(id); break;
    }
    
  }
  
   async function OpenRecentWorkspace() {
    let workspace = compoWorkspace.GetActiveGroup();
    if (!workspace) return;
    
    let noteObjs = await compoNotes.GetAllByIdsAsync(workspace.noteIds);
    await uiNotes.ListNotesAsync(noteObjs);
    await compoTempWorkspace.StashAsync(workspace);
  }
  
  async function OpenWorkspaceById(id) {
    let activeWorkspaceId = compoWorkspace.GetActiveId(id);
    
    viewStateUtil.Remove('workspace', ['no-open-workspace']);

    if (id == activeWorkspaceId) return;
    
    let itemTab = compoTabManager.GetById(id);
    let gridNotesObj = uiNotes.GetAllGridContent();

    await compoTempWorkspace.StoreTempAsync(activeWorkspaceId, gridNotesObj);
    compoWorkspace.SetActiveById(id);

    if (!itemTab) {
      let workspace = compoWorkspace.GetById(id);
      let isTemp = true;
      
      if (compoTabManager.HasTemp()) {
        await compoTempWorkspace.DeleteById(activeWorkspaceId);
        compoTabManager.ReplaceTemp(workspace.id, workspace.title);
      } else {
        compoTabManager.Add(workspace.id, workspace.title, isTemp);
      }
      // compoTabManager.UnsetActive();
    }
    
    compoTabManager.SetActiveById(id);
    
    compoTabManager.Commit();
    compoWorkspace.Commit();
    appData.Save();
    
    // get from temp or from storage
    let notes = await compoTempWorkspace.GetNotesByWorkspaceId(id);
    if (!notes) {
      notes = await compoWorkspace.GetNotesByWorkspaceIdAsync(id);
    }
    uiNotes.ListNotesAsync(notes);
    highlightActiveWorkspace();
    uiFileTab.refreshListTab();
    RefreshWorkspaceState();
  }
  
  function renameWorkspaceById(id) {
    let workspace = compoWorkspace.GetById(id);
    let userVal = window.prompt('Workspace name', workspace.title);
    if (!userVal) return;
    
    workspace.title = userVal;
    syncFileTitleOnTab(id, workspace.title);
    
    compoWorkspace.Commit();
    compoTabManager.Commit();
    appData.Save();
    
    ListWorkspace();
    uiFileTab.refreshListTab();
  }
  
  async function deleteWorkspaceById(id) {
    let isConfirm = window.confirm('Are you sure?');
    if (!isConfirm) return;
    
    compoTempWorkspace.DeleteById(id);
    let activeWorkspaceId = compoWorkspace.GetActiveId();
    let workspaces = compoWorkspace.GetById(id);
    
    for (let id of workspaces.noteIds) {
      await compoNotes.DeleteById(id);
    }
    
    compoWorkspace.deleteById(id);
    compoTabManager.DeleteById(id);
    
    compoWorkspace.Commit();
    compoTabManager.Commit();
    appData.Save();
    
    ListWorkspace();
    uiFileTab.refreshListTab();
    if (workspaces.id == activeWorkspaceId) {
      uiNotes.ListNotesAsync();
    }
  }
  
  function CreateWorkspace() {
    let userVal = window.prompt('New workspace name');
    if (!userVal) return;
    
    let workspace = compoWorkspace.AddGroup(userVal);
    compoWorkspace.SetActiveById(workspace.id);
    compoWorkspace.Commit();
    appData.Save();
    
    uiFileTab.openWorkspaceInTab(workspace.id);
    uiWorkspace.ListWorkspace();
    uiNotes.ListNotesAsync();
    
    uiNotes.InsertNote();
  }
  
  function RefreshWorkspaceState() {
    let workspaces = compoWorkspace.GetGroups();
    let tabsCount = compoTabManager.CountAll();
    
    if (workspaces.length == 0) {
      viewStateUtil.Add('workspace', ['no-workspace']);
      viewStateUtil.Remove('workspace', ['has-workspace']);
    } else {
      viewStateUtil.Remove('workspace', ['no-workspace']);
      if (tabsCount > 0) {
        viewStateUtil.Remove('workspace', ['no-open-workspace']);
        viewStateUtil.Add('workspace', ['has-workspace']);
      } else {
        viewStateUtil.Remove('workspace', ['has-workspace']);
        viewStateUtil.Add('workspace', ['no-open-workspace']);
      }
    }
  }
  
  function ListWorkspace() {
    let workspaces = compoWorkspace.GetGroups();
    let docFrag = document.createDocumentFragment();
  
    for (let item of workspaces) {
      let el = window.templateSlot.fill({
        data: item, 
        template: document.querySelector('#tmp-list-workspace').content.cloneNode(true), 
      });
      
      el.querySelector('[data-kind="itemWorkspace"]').dataset.id = item.id;
      docFrag.append(el);
    }

    $('#container-workspace')?.replaceChildren('');
    $('#container-workspace')?.append(docFrag);
    
    highlightActiveWorkspace();
    RefreshWorkspaceState();
  }
  
  function highlightActiveWorkspace() {
    let activeWorkspaceId = compoWorkspace.GetActiveId();
    for (let el of $$('#container-workspace [data-kind="itemWorkspace"]')) {
      let isActive = (el.dataset.id == activeWorkspaceId);
      el.classList.toggle('is-active', isActive);
    }
  }
  
  return SELF;
  
})();