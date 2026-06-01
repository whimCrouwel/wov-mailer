export const IPC = {
  CONFIG_GET: 'config:get',
  CONFIG_SAVE: 'config:save',
  AIRTABLE_LIST_BASES: 'airtable:list-bases',
  AIRTABLE_LIST_TABLES: 'airtable:list-tables',
  AIRTABLE_PREVIEW_RECIPIENTS: 'airtable:preview-recipients',
  AIRTABLE_FETCH_RECIPIENTS: 'airtable:fetch-recipients',
  TEMPLATES_LIST: 'templates:list',
  TEMPLATES_GET: 'templates:get',
  SEND_BROADCAST: 'send:broadcast',
  HISTORY_LIST: 'history:list',
  HISTORY_APPEND: 'history:append',
  MCP_STATE_UPDATE: 'mcp:state-update',
} as const
