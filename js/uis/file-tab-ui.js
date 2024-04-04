let uiFileTab = (function() {
  
  let $ = document.querySelector.bind(document);
  
  let SELF = {
    HandleDblClickTab,
    HandleClickContainerTab,
    HandleMouseDownTab,
    openWorkspaceInTab,
    refreshListTab,
    openPrevTab,
    closeOpenTab,
    openNextTab,
  };
  
  function handleClickActions(evt, data) {
    switch (evt.button) {
      case 1: handleMiddleClick(data); break;
    }
  }

  function handleMiddleClick(data) {
    closeFileTab(data.id);
  }

  function HandleMouseDownTab(evt) {
    let targetEl = evt.target;
    let itemEl = targetEl?.closest('[data-kind="itemFileTab"]');

    if (!itemEl) return;

    let data = {
        id: itemEl.dataset.id,
    };

    handleClickActions(evt, data);
  }

  function openPrevTab() {
    let item = compoTabManager.GetPrevious();
    if (!item) return;
    
    openFileTabById(item.id);
  }
  
  function closeOpenTab() {
    let item = compoTabManager.GetActive();
    if (!item) return;
    
    closeFileTab(item.id);
  }
  
  function openNextTab() {
    let item = compoTabManager.GetNext();
    if (!item) return;
    
    openFileTabById(item.id);
  }
  
  function openWorkspaceInTab(id) {
    let item = compoWorkspace.GetById(id);
    let tabItem = compoTabManager.GetById(id);
    
    if (tabItem) {
      if (tabItem.isTemp) {
        tabItem.isTemp = false;
      }
    } else {
      compoTabManager.Add(item.id, item.title);
    }
    compoTabManager.SetActiveById(item.id);
    
    compoTabManager.Commit();
    appData.Save();
    
    refreshListTab();
  }
  
  function HandleDblClickTab(evt) {
    let targetEl = evt.target;
    let itemEl = targetEl.closest('[data-kind="itemFileTab"]');
    if (!itemEl) return;
    
    let id = itemEl.dataset.id;
    
    let item = compoTabManager.GetById(id);
    if (!item.isTemp) return;
    
    item.isTemp = false;
    compoTabManager.Commit();
    appData.Save();
    refreshListTab();
  }
  
  
  function HandleClickContainerTab(evt) {
    let targetEl = evt.target;
    if (!targetEl.closest('[data-kind="itemFileTab"]')) return;
    if (!targetEl.closest('[data-action]')) return;
    
    let itemEl = targetEl.closest('[data-kind="itemFileTab"]');
    if (!itemEl) return;
    
    let actionEl = targetEl.closest('[data-action]');
    if (!actionEl) return;
    
    let id = itemEl.dataset.id;
    let action = actionEl.dataset.action;
    
    switch (action) {
      case 'open': openFileTabById(id); break;
      case 'close': closeFileTab(id); break;
    }
  }
  
  function refreshListTab() {
    let items = compoTabManager.GetAll();
    let activeId = compoTabManager.GetActiveId();
    
    $('#container-tab').innerHTML = '';
    let docFrag = document.createDocumentFragment();
    
    for (let item of items) {
      
      let el = window.templateSlot.fill({
        data: item, 
        template: document.querySelector('#tmp-list-tab').content.cloneNode(true), 
      });
      
      let itemEl = el.querySelector('[data-kind="itemFileTab"]');
      
      itemEl.dataset.id = item.id;
      itemEl.classList.toggle('is-active', (item.id == activeId));
      itemEl.classList.toggle('is-temp', (item.isTemp === true));
      
      docFrag.append(el);
    }
    
    $('#container-tab').append(docFrag);
  }
  
  function openFileTabById(id) {
    
    let activeId = compoTabManager.GetActiveId();
    
    if (id == activeId) return;
    
    uiWorkspace.OpenWorkspaceById(id);
    compoTabManager.SetActiveById(id);
    
    compoTabManager.Commit();
    appData.Save();
    
    refreshListTab();
  }
  
  
  function setActiveTabBeforeDeletionOnId(id) {
    if (compoTabManager.CountAll() < 2) return null;
    
    let item = null;
    let lastItemIndex = compoTabManager.CountAll() - 1;
    let itemIndex = compoTabManager.GetIndexById(id);
    
    if (itemIndex == lastItemIndex) {
      item = compoTabManager.GetPrevious();
    } else {
      item = compoTabManager.GetNext();
    }
    compoTabManager.SetActiveById(item.id);
    
    return item;
  }
  
  function closeFileTab(id) {
    let newActiveTab = setActiveTabBeforeDeletionOnId(id);
    
    if (!newActiveTab) {
      compoWorkspace.ResetActiveId();
      compoWorkspace.Commit();
    }
    
    compoTabManager.DeleteById(id);
    compoTabManager.Commit();
    
    appData.Save();
    
    refreshListTab();
    
    if (newActiveTab) {
      uiWorkspace.OpenWorkspaceById(newActiveTab.id);
    }
  }
  
  
  return SELF;
  
})();