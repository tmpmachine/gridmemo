let compoWorkspace = (function() {
  
  'use strict';
  
  let $ = document.querySelector.bind(document);
  let $$ = document.querySelectorAll.bind(document);
  
  let SELF = {
    // Init,
    GetActiveGroup,
    GetActiveId: GetActiveGroupId,
    GetGroups,
    GetById,
    SetActiveById,
    DeleteWorkspaceNoteById,
    GetItemIndexById,
    Commit,
    
    // # group
    AddGroup,
    deleteById,
    UpdateNoteIndex,
    
    InitData,
    
    ResetActiveId,
  };
  
  const defaultGroupId = '';
  let data = {
    activeGroupId: defaultGroupId,
    missionGroup: [],
    counter: {
      id: 0,
    },
  };
  
  function AddGroup(title) {
    let id = generateId();
    let group = {
      id,
      title,
      noteIds: [],
    };
    data.missionGroup.push(group);
    
    return group;
  }
  
  function InitData(workspaces) {
    data = Object.assign(data, clearReference(workspaces));
    initCommandPalette(getWorkspaces());
  }
  
  function getWorkspaces() {
    return data.missionGroup;
  }
  
  function initCommandPalette(snippets) {
    
    snippets = clearReference(snippets);
    
    snippets = snippets.map(x => {
      return Object.assign({
        title: x.name,
      }, x);
    });
    
    ;(function() {
      
      let customSnippetsCounter = 0;
      let index = 0;
      for (let snippet of snippets) {
        snippet.index = index;
        if (snippet.snippet)
        	snippet.snippet = snippet.snippet.replace(/\t/g, '  ');
        index++;
      }
      
      // https://github.com/bevacqua/fuzzysearch
      function fuzzysearch (needle, haystack) {
        var tlen = haystack.length;
        var qlen = needle.length;
        var matchIndexes = [];
        if (qlen > tlen) {
          return {isMatch: false};
        }
        if (qlen === tlen) {
          return {isMatch: true, matchIndexes};
        }
        var i = 0;
        var j = 0;
        outer: for (; i < qlen; i++) {
          var nch = needle.charCodeAt(i);
          while (j < tlen) {
            if (haystack.charCodeAt(j++) === nch) {
              matchIndexes.push(j-1);
              continue outer;
            }
          }
          return {isMatch: false};
        }
        return {isMatch: true, matchIndexes};
      }
      
      $('#search-input').addEventListener('keydown', () => {
        wgSearch.selectHints()
      });
      
      $('#search-input').addEventListener('input', (evt) => {
        wgSearch.find(evt.target.value)
      });
      
      var wgSearchRes;
      var wgSearch = {
        hints: [],
        pageId: '',
        callback: (data) => {
          ui.OpenWorkspaceFromCommandPalette(data.id);
        },
        keywords: [],
        match: function(value) {
          this.find.idx = -1;
      
          if (value.trim().length < 2) return [];
          var data = [];
          var extraMatch = [];
          for (var i=0,title,matchIdx,match=1,xmatch=1,wildChar,offset,creps; i<snippets.length; i++) {
            if (match > 10) break;
            let titleOri = snippets[i].title;
            let search = fuzzysearch(value,titleOri.toLowerCase());
            if (search.isMatch) {
              if (search.matchIndexes.length === 0) {
                if (value == titleOri.toLowerCase()) {
                  data.push({index:snippets[i].index,title:'<b>'+titleOri+'</b>'});
                  match++;
                } else {
                extraMatch.push({index:snippets[i].index,title:titleOri});
                  xmatch++;
      
                }
              } else {
                titleOri = titleOri.split('');
                for (let index of search.matchIndexes) {
                  titleOri[index] = '<b>'+titleOri[index]+'</b>';
                }
                data.push({index:snippets[i].index,title:titleOri.join('')});
                match++;
              }
            }
          }
          if (match < 10) {
            for (var i=0; i<xmatch-1 && match<10; i++) {
              data.push(extraMatch[i]);
              match++;
            }
          }
          return data;
        },
        selectHints: function() {
          let hints = $$('.search-hints');
          if (hints.length === 0)
              return;
      
          switch(event.keyCode) {
            case 13:
              if (this.find.idx > -1) {
                event.preventDefault();
                hints[this.find.idx].click();
              }
            break;
            case 38:
              event.preventDefault();
              this.find.idx--;
              if (this.find.idx == -2) {
                this.find.idx = hints.length-1;
                hints[this.find.idx].classList.toggle('selected');
              } else {
                hints[this.find.idx+1].classList.toggle('selected');
                if (this.find.idx > -1 && this.find.idx < hints.length)
                  hints[this.find.idx].classList.toggle('selected');
              }
              return;
            break;
            case 40:
              this.find.idx++;
              if (this.find.idx == hints.length) {
                this.find.idx = -1;
                hints[hints.length-1].classList.toggle('selected');
              } else {
                hints[this.find.idx].classList.toggle('selected');
                if (this.find.idx > 0 && this.find.idx < hints.length)
                  hints[this.find.idx-1].classList.toggle('selected');
              }
              return;
            break;
          }
        },
        highlightHints: function() {
          let idx = Number(this.dataset.searchIndex);
          var hints = $('.search-hints');
          for (var i=0; i<hints.length; i++) {
            if (i == idx)
              hints[i].classList.toggle('selected',true);
            else
              hints[i].classList.toggle('selected',false);
          }
          wgSearch.find.idx = idx;
        },
        displayResult: function(data) {
          $('#search-result').innerHTML = '';
          let i = 0;
          for (let hint of data) {
            if (index == data.length-1) {
              let tmp = $('#tmp-hints-last').content.cloneNode(true);
              tmp.querySelectorAll('.Title')[0].innerHTML = hint.title;
              // tmp.querySelectorAll('.Container')[0].addEventListener('mouseover', wgSearch.highlightHints);
              tmp.querySelectorAll('.Container')[0].addEventListener('click', insertTemplate);
              tmp.querySelectorAll('.Container')[0].dataset.index = hint.index;
              tmp.querySelectorAll('.Container')[0].dataset.searchIndex = i;
              $('#search-result').appendChild(tmp);
            } else {
              let tmp = $('#tmp-hints').content.cloneNode(true);
              tmp.querySelectorAll('.Title')[0].innerHTML = hint.title;
              // tmp.querySelectorAll('.Container')[0].addEventListener('mouseover', wgSearch.highlightHints);
              tmp.querySelectorAll('.Container')[0].addEventListener('click', insertTemplate);
              tmp.querySelectorAll('.Container')[0].dataset.index = hint.index;
              tmp.querySelectorAll('.Container')[0].dataset.searchIndex = i;
              $('#search-result').appendChild(tmp);
            }
            i++;
          }
        },
        find: function(v) {
          clearTimeout(this.wait);
          this.v = v;
          
          if (this.v.trim().length < 2) {
            $('#search-result').innerHTML = '';
            return;
          }
          
          var data = wgSearch.match(this.v.toLowerCase());
          
          if (this.keywords.indexOf(v) < 0) {
            this.displayResult(data);
            this.keywords.push(v);
          }
          else if (data.length >= 0)
            this.displayResult(data);
          
        }
      };
      
      window.insertTemplate = function() {
        let index = this.dataset.index;
        let snipData = snippets[index];
        $('#search-result').innerHTML = '';
        ui.ToggleInsertSnippet();
        if (wgSearch.callback) {
          wgSearch.callback(snipData);
        } else {
          console.log(snipData.snippet)
        }
      }
      
    })();
    
  }
  
  function DeleteWorkspaceNoteById(workspaceId, noteId) {
    let workspace = GetById(workspaceId);
    if (!workspace) return null;
    
    let delIndex = workspace.noteIds.findIndex(item => item == noteId);
    let deletedItem = workspace.noteIds.splice(delIndex, 1);
    
    return deletedItem; 
  }
  
  function SetActiveById(id) {
    let group = GetById(id);
    if (group == null) return false;
  
    data.activeGroupId = id;
    
    return true;
  }
  
  function ResetActiveId() {
    data.activeGroupId = defaultGroupId;
  }
  
  
  function deleteById(id) {
    let delIndex = GetItemIndexById(id);
    if (delIndex < 0) return null;
    
    let group = data.missionGroup.splice(delIndex, 1);
    
    return group;
  }
  
  function GetItemIndexById(id) {
    return data.missionGroup.findIndex(item => item.id == id);
  }
  
  function generateId() {
    return __idGenerator.generate();
  }
  
  const __idGenerator = (function() {
      
      function generator() {
        // generate incremental id : #0, #1, #2 .. and so on
        return function () {
          return `#${++data.counter.id}`;
        };
      }
      
      return {
        generate: generator(),
      };
      
  })();
    
  
  function Init() {
    checkDataIntegrity();
    initData();
  }
    
  function checkDataIntegrity() {
    runDataMigration9Nov23();
  }
  
  function initData() {
    let appDataManager = app.GetDataManager();
    data = clearReference(appDataManager.data.compoMission);
    
    console.log(data)
  }
  
  function runDataMigration9Nov23() {
    let appDataManager = app.GetDataManager();
    if (Object.keys(appDataManager.data.compoMission).length > 0) return;
    
    let group = GetById(defaultGroupId);
    group.missionIds = clearReference(appDataManager.data.missionIds);
    commitData();
  }
  
  function getAppData() {
    return lsdb.data.compoMission;
  }
  
  function clearReference(data) {
    return JSON.parse(JSON.stringify(data));
  }
  
  function GetById(id) {
    let group = data.missionGroup.find(x => x.id == id);
    if (group !== undefined) return group;
    
    return null;
  }
  
  function commitData() {
    
  }
  
  function Commit() {
    appData.SetWorkspace(clearReference(data));
  }
  
  function GetGroups() {
    return data.missionGroup;
  }
  
  function GetActiveGroup() {
    return GetById(GetActiveGroupId());
  }
  
  function GetActiveGroupId() {
    return data.activeGroupId;
  }

  function UpdateNoteIndex(oldIndex, newIndex) {
    let workspace = GetActiveGroup();
    // let noteIds = 
    // console.log(workspace)
    moveItemInArray(workspace.noteIds, oldIndex, newIndex);
  }
  
  
  function moveItemInArray(array, oldIndex, newIndex) {
    if (oldIndex === newIndex || oldIndex < 0 || oldIndex >= array.length || newIndex < 0 || newIndex >= array.length) {
      // No change needed or invalid index
      return array;
    }
  
    // Remove the item from the old position
    const [movedItem] = array.splice(oldIndex, 1);
  
    // Insert the item at the new position
    array.splice(newIndex, 0, movedItem);
  
    return array;
  }
    
  return SELF;
  
})();