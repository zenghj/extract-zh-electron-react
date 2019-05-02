const path = require('path');
import React from 'react';
import { Typography, Button, Tag, Input} from 'antd';
const {ipcRenderer} = require('electron');
const {CHANNELS, PROGRESS_STATUS, WORKER_MSG_TYPE} = require('../constant');
import ProgressDialog from '../components/progress-dialog.jsx';

const writeWebworker = new Worker(path.resolve(__dirname, '../core/writeBack/index.js')); 

const STATUS_TEXTS = {
  [PROGRESS_STATUS.success]: 'success!',
  [PROGRESS_STATUS.exception]: 'fail!',
  [PROGRESS_STATUS.copying]: 'coping...',
  [PROGRESS_STATUS.normal]: 'writing...',
}
const initProgressState = {
  progressDialogTitle: 'starting...',
  progressDialogVisible: false,
  progressStatus: 'normal',
  progressPercent: 0,
  progressErrorMsg: '',
  progressErrors: [],
  progressing: false,
};
export default class WriteBack extends React.Component {
  state = {
    ...initProgressState,

    // wbSrcDirs: ['/Users/julianzeng/Desktop/git/fed/sharetrend_cms/src'],
    // wbProjectRootDir: '/Users/julianzeng/Desktop/git/fed/sharetrend_cms',
    // wbOutputDir: '/Users/julianzeng/Desktop/tmp',
    // wbTranslateXlsx: '/Users/julianzeng/Desktop/tmp/output.xlsx',
    // globalI18nFnName: 'i18n',
    // wbSrcExcludeDirs: [],

    wbSrcDirs: [],
    wbProjectRootDir: '',
    wbOutputDir: '',
    wbTranslateXlsx: '',
    globalI18nFnName: '',
    wbSrcExcludeDirs: [],

  }
  UNSAFE_componentWillMount() {
    ipcRenderer.on(CHANNELS.folderData, (event, key, data) => {
      if (!['wbSrcDirs', 'wbSrcExcludeDirs', 'wbOutputDir', 'wbTranslateXlsx', 'wbProjectRootDir'].includes(key)) return;
      console.log(event, key, data);
      if (data) {
        let update = {};
        update[key] = data;
        if (typeof this.state[key] === 'string') {
          update[key] = data[0];
        }
        this.setState(update);
      }
    });
   
    writeWebworker.onmessage = e => {
      let data = e.data || {};
      if (data.type === WORKER_MSG_TYPE.progressInfo) {
        const info = data.data;
        console.log(info);
        const update = {};
        if (info.status === PROGRESS_STATUS.exception) {
          update.progressStatus = info.status;
          console.error(info.stack);
        } else if (info.status !== PROGRESS_STATUS.copying) {
          Object.assign(update, { // TODO 成功后提供生成文件的路径，并可以点击直接打开
            progressPercent: info.percent,
            progressStatus: info.status,
          });
        }
        update.progressDialogTitle = STATUS_TEXTS[info.status] || 'writing'
        if (info.done) {
          update.progressDialogTitle = 'done';
        }
        update.progressErrorMsg = this.formatErrorMsg(info);
        update.progressErrors = info.errors || [];
        this.setState(update);
      }
    }
  }
  formatErrorMsg = (info) => {
    if (info.error) return info.error;
    return '';
  }
  handleSelectDir = key => () => {
    const opts = { // TODO 对文件夹、文件的类型做一些处理
      wbTranslateXlsx: {
        filters: [{
          name: 'xlsx',
          extensions: '.xlsx',
        }]
      }
    }
    ipcRenderer.send('openFolder', key, opts[key] || {});
  }
  deleteSrcDir = (key, item) => e => {
    let dirs;
    if (typeof this.state[key] === 'string') {
      dirs = '';
    } else {
      dirs = this.state.srcDirs || [];
      dirs = dirs.filter(dir => dir !== item);
    }
    this.setState({
      [key]: dirs
    })
  }
  closeProgressDialog = () => {
    this.setState({
      progressDialogVisible: initProgressState.progressDialogVisible
    }, () => {
      this.setState({
        ...initProgressState
      })
    });
  }
  validate() {
    const rules = [{
      value: this.state.wbProjectRootDir,
      message: '输出目录不能为空',
      validator: value => !!value,
    }, {
      value: this.state.wbSrcDirs,
      message: '需要回写的源码目录不能为空',
      validator: value => value && value.length,
    }, {
      value: this.state.wbOutputDir,
      message: '输出目录不能为空',
      validator: value => !!value,
    }, {
      value: this.state.wbTranslateXlsx,
      message: '翻译好的xlsx文件路径不能为空',
      validator: value => !!value,
    }]
    for(let rule of rules) {
      if (!rule.validator(rule.value)) {
        return rule.message
      }
    }
  }
  startWriteBack = () => {
    if (this.state.progressing) {
      return alert('正在回写中')
    }
    let errorMsg = this.validate()
    if (errorMsg) {
      return alert(errorMsg)
    }
    this.setState({
      progressDialogVisible: true
    }, () => {
      writeWebworker.postMessage({
        type: WORKER_MSG_TYPE.writeBack,
        data: {
          xlsxFilePath: this.state.wbTranslateXlsx,
          include: this.state.wbSrcDirs,
          exclude: this.state.wbSrcExcludeDirs,
          outputPath: this.state.wbOutputDir,
          globalI18nFnName: this.state.globalI18nFnName,
          projectRootDir: this.state.wbProjectRootDir,
        }
      })
    })
  }
  handleChange = key => e => {
    this.setState({
      [key]: e.target.value,
    })
  }
  render() {
    const { progressDialogTitle, progressDialogVisible, progressStatus, progressPercent, progressErrorMsg, progressErrors } = this.state;
    return (
      <div className="wb">
        <header>
          <Typography.Title level={4} className="wb__title title">
            回写源码
          </Typography.Title>
        </header>
        <section className="wb__body body">
          <div className="action">
              <Button type="primary" onClick={this.handleSelectDir('wbProjectRootDir')}>
                1. 选择项目根目录
              </Button>
              <p>项目根目录：</p>
              {this.state.wbProjectRootDir && (
                <Tag closable onClose={this.deleteSrcDir('wbProjectRootDir')}>
                  {this.state.wbProjectRootDir}
                </Tag>
              )}
            </div>
          <div className="action">
            <Button type="primary" onClick={this.handleSelectDir('wbSrcDirs')}>
              2. 选择源码所在的目录
            </Button>
            <p>需要回写的源码目录：</p>
            <div className="selected-dirs">
              {this.state.wbSrcDirs.map(item => (
                <Tag closable key={item} onClose={this.deleteSrcDir('wbSrcDirs', item)}>
                  {item}
                </Tag>
              ))}
            </div>
          </div>
          <div className="action">
            <Button type="primary" onClick={this.handleSelectDir('wbSrcExcludeDirs')}>
              3. 选择需要排除的目录（可选）
            </Button>
            <p>需要排除的目录：</p>
            <div className="selected-dirs">
              {this.state.wbSrcExcludeDirs.map(item => (
                <Tag closable key={item} onClose={this.deleteSrcDir('wbSrcExcludeDirs', item)}>
                  {item}
                </Tag>
              ))}
            </div>
          </div>
          <div className="action">
            <Button type="primary" onClick={this.handleSelectDir('wbTranslateXlsx')}>
              4. 选择翻译好的xlsx文件
            </Button>
            <p>翻译好的xlsx文件目录：</p>
            {this.state.wbTranslateXlsx && (
              <Tag closable onClose={this.deleteSrcDir('wbTranslateXlsx')}>
                {this.state.wbTranslateXlsx}
              </Tag>
            )}
          </div>
          <div className="action">
            <Button type="primary" onClick={this.handleSelectDir('wbOutputDir')}>
              5. 选择输出目录
            </Button>
            <p>输出目录：</p>
            {this.state.wbOutputDir && (
              <Tag closable onClose={this.deleteSrcDir('wbOutputDir')}>
                {this.state.wbOutputDir}
              </Tag>
            )}
          </div>
          <div className="action">
              <label htmlFor="">6. 回写的国际化函数名称</label>
              <Input style={{width: '200px', marginLeft: '1em'}} value={this.state.globalI18nFnName} onChange={this.handleChange('globalI18nFnName')}></Input>
            <p>回写结果将会是形如 fn('key')</p>
            
          </div>
          <div className="action">
            <Button type="primary" onClick={this.startWriteBack}>
              7. 开始回写
            </Button>
          </div>
          <ProgressDialog
            title={progressDialogTitle}
            visible={progressDialogVisible}
            percent={progressPercent}
            status={progressStatus}
            errorMsg={progressErrorMsg}
            errors={progressErrors}
            onClose={this.closeProgressDialog}
            onOk={this.closeProgressDialog}
            ></ProgressDialog>
        </section>
      </div>
    );
  }
}
