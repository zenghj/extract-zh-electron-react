const CHANNELS = {
  openFolder: 'openFolder',
  extractZh: 'extractZh',
  folderData: 'folderData',
  extractComplete: 'extractComplete',
  extractFail: 'extractFail',
  progressInfo: 'progressInfo',
};
const PROGRESS_STATUS = {
  normal: 'normal',
  active: 'active',
  exception: 'exception',
  success: 'success',
};

const WORKER_MSG_TYPE = {
  extract: 'extract',
  progressInfo: 'progressInfo',
};

module.exports = {
  CHANNELS,
  PROGRESS_STATUS,
  WORKER_MSG_TYPE,
};
