import React from 'react';
const { ipcRenderer } = require('electron');
const path = require('path');
const { CHANNELS, PROGRESS_STATUS, WORKER_MSG_TYPE } = require('../constant');
import { Button, Tag, Icon, Typography } from 'antd';
import ProgressDialog from '../components/progress-dialog.jsx';

const myExtractWorker = new Worker(path.resolve(__dirname, '../core/extractZh/index.js'));
// TODO 提供中断任务的操作
// function getExtractWorker() {
//   let ww = myExtractWorker ? myExtractWorker : new Worker('./extractZh/index.js');
//   return ww
// }

const initProgressState = {
  progressDialogTitle: '提取中...',
  progressDialogVisible: false,
  progressStatus: 'normal',
  progressPercent: 0,
  progressErrorMsg: '',
  progressErrors: [],
  progressing: false,
};
export default class Home extends React.Component {
  state = {
    // srcDirs: [
    //   '/Users/julianzeng/Desktop/git/fed/sharetrend_cms/src',
    // ],
    // srcExcludeDirs: [],
    // outputDir: '/Users/julianzeng/Desktop/tmp',
    srcDirs: [],
    srcExcludeDirs: [],
    outputDir: '',
    ...initProgressState,
  };
  UNSAFE_componentWillMount() {
    ipcRenderer.on(CHANNELS.folderData, (event, key, data) => {
      if (!['srcDirs', 'srcExcludeDirs', 'outputDir'].includes(key)) return;
      console.log(event, key, data);
      if (data) {
        let update = {};
        update[key] = data;
        if (key === 'outputDir') {
          update[key] = data[0];
        }
        this.setState(update);
      }
    });

    myExtractWorker.onmessage = e => {
      let data = e.data || {};
      if (data.type === WORKER_MSG_TYPE.progressInfo) {
        const info = data.data;
        console.log(info);
        const update = {};
        if (info.status === PROGRESS_STATUS.exception) {
          update.progressStatus = info.status;
          console.error(info.stack);
        } else {
          Object.assign(update, {
            // TODO 成功后提供生成文件的路径，并可以点击直接打开
            progressPercent: info.percent,
            progressStatus: info.status,
          });
        }
        if (info.done) {
          update.progressDialogTitle = '提取结束';
        }
        update.progressErrorMsg = this.formatErrorMsg(info);
        update.progressErrors = info.errors || [];
        this.setState(update);
      }
    };
  }
  formatErrorMsg(info) {
    if (info.error) return info.error;
    return '';
  }
  componentWillUnmount() {
    // TODO 解除所有的事件监听
  }
  handleSelectDir = key => () => {
    console.log('render openFolder');
    ipcRenderer.send('openFolder', key);
  };
  validate() {
    const rules = [
      {
        value: this.state.srcDirs,
        message: '需要提取的源码目录不能为空',
        validator: value => value && value.length,
      },
      {
        value: this.state.outputDir,
        message: '输出目录不能为空',
        validator: value => !!value,
      },
    ];
    for (let rule of rules) {
      if (!rule.validator(rule.value)) {
        return rule.message;
      }
    }
  }
  startExtract = () => {
    if (this.state.progressing) {
      return alert('正在提取中');
    }
    let errorMsg = this.validate();
    if (errorMsg) {
      return alert(errorMsg);
    }
    this.setState(
      {
        progressDialogVisible: true,
      },
      () => {
        myExtractWorker.postMessage({
          type: WORKER_MSG_TYPE.extract,
          data: {
            include: this.state.srcDirs,
            exclude: this.state.srcExcludeDirs,
            outputPath: this.state.outputDir,
          },
        });
      },
    );
  };
  deleteSrcDir = (key, item) => e => {
    let dirs;
    if (key === 'outputDir') {
      dirs = '';
    } else {
      dirs = this.state.srcDirs || [];
      dirs = dirs.filter(dir => dir !== item);
    }
    this.setState({
      [key]: dirs,
    });
  };
  closeProgressDialog = () => {
    this.setState(
      {
        progressDialogVisible: initProgressState.progressDialogVisible,
      },
      () => {
        this.setState({
          ...initProgressState,
        });
      },
    );
  };

  render() {
    return (
      <div className="home__root">
        <header>
          <Typography.Title level={4} className="home__title title">
            提取中文
          </Typography.Title>
        </header>
        <section className="home__body body">
          <div className="action">
            <Button type="primary" onClick={this.handleSelectDir('srcDirs')}>
              1. 选择源码所在的目录
            </Button>
            <p>需要提取的源码目录：</p>
            <div className="selected-dirs">
              {this.state.srcDirs.map(item => (
                <Tag closable key={item} onClose={this.deleteSrcDir('srcDirs', item)}>
                  {item}
                </Tag>
              ))}
            </div>
          </div>
          <div className="action">
            <Button type="primary" onClick={this.handleSelectDir('srcExcludeDirs')}>
              2. 选择需要排除的目录（可选）
            </Button>
            <p>需要排除的目录：</p>
            <div className="selected-dirs">
              {this.state.srcExcludeDirs.map(item => (
                <Tag closable key={item} onClose={this.deleteSrcDir('srcExcludeDirs', item)}>
                  {item}
                </Tag>
              ))}
            </div>
          </div>
          <div className="action">
            <Button type="primary" onClick={this.handleSelectDir('outputDir')}>
              3. 选择输出目录
            </Button>
            <p>输出目录：</p>
            {this.state.outputDir && (
              <Tag closable onClose={this.deleteSrcDir('outputDir')}>
                {this.state.outputDir}
              </Tag>
            )}
          </div>
          <div className="action">
            <p>输出文件格式：excel</p>
          </div>
          <div className="action">
            <Button type="primary" onClick={this.startExtract}>
              4. 开始提取
            </Button>
          </div>
          <div>
            <ProgressDialog
              title={this.state.progressDialogTitle}
              visible={this.state.progressDialogVisible}
              percent={this.state.progressPercent}
              status={this.state.progressStatus}
              errorMsg={this.state.progressErrorMsg}
              errors={this.state.progressErrors}
              onClose={this.closeProgressDialog}
              onOk={this.closeProgressDialog}
            />
          </div>
        </section>
      </div>
    );
  }
}
