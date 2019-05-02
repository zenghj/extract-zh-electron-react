import React from 'react';
import { Typography } from 'antd';

export default class WriteBack extends React.Component {
  render() {
    return (
      <section className="document">
        <header>
          <Typography.Title level={4} className="home__title title">
            说明
          </Typography.Title>
          <div className="body">
            <ul>
              <li>目前仅支持处理`*.js`, `*.jsx`类型的文件;</li>
              <li>默认不处理`*.test.js`;</li>
            </ul>
          </div>
        </header>
      </section>
    );
  }
}
