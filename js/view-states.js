let viewStates = (function() {
  
  let viewStatesMap = [
    // workspace
    {
      group: 'workspace',
      states: [
        'sidebar',
        'has-workspace',
        'no-workspace',
        'no-open-workspace',
      ],
      inverseStates: [
        'sidebar'
      ]
    },
    // file tab item
    {
      group: 'itemFileTab',
      states: ['dirty'],
      inverseStates: ['dirty']
    },
    // features cloud
    {
      group: 'features-cloud',
      states: ['authorized'],
      inverseStates: ['authorized']
    },
    // view screen
    {
      group: 'view-editor',
      states: [
        'notes', 
        'settings',
      ],
    },
    // features settings
    {
      group: 'features-settings',
      states: [
        'debug-log-on', 
        'debug-log-off',
      ],
    }
  ];
  
  function Init() {
    viewStateUtil.Init(viewStatesMap); 
  }
  
  return {
    Init,
  };
  
})();