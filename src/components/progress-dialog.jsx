import React from 'react';
import { Typography, Modal, Progress, List } from 'antd';
import PropTypes from 'prop-types';
import { PROGRESS_STATUS } from '../constant';

export default class ProgressDialog extends React.PureComponent {
  render() {
    const { onClose, onOk, title, visible, percent, status, errorMsg, errors } = this.props;
    return (
      <Modal
        width="50%"
        keyboard={false}
        maskClosable={false}
        onCancel={onClose}
        onOk={onOk}
        wrapClassName="progress-dialog"
        title={title}
        visible={visible}
      >
        <div className="progress-content">
          <Progress
            type="circle"
            percent={percent}
            status={status}
          />
          {errorMsg && (
            <Typography.Text>{errorMsg}</Typography.Text>
          )}
          {errors && errors.length > 0 && (
            <List
              className="progress__errors"
              header={<div>Errors</div>}
              bordered
              dataSource={errors}
              renderItem={item => (
                <List.Item>
                  <Typography.Text mark>[{item.path}]</Typography.Text>
                  <br />
                  {item.error}
                  <br />
                  {item.stack}
                </List.Item>
              )}
            />
          )}
        </div>
      </Modal>
    );
  }
}
ProgressDialog.defaultProps = {
  status: PROGRESS_STATUS.normal,
  errorMsg: '',
  errors: [],
};
ProgressDialog.propTypes = {
  onOk: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  visible: PropTypes.bool.isRequired,
  percent: PropTypes.number.isRequired,
  status: PropTypes.oneOf(Object.values(PROGRESS_STATUS)),
  errorMsg: PropTypes.string,
  errors: PropTypes.array,
};
