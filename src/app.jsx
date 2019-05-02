import React from 'react';
import { Typography } from 'antd';
import { HashRouter as Router, Route } from 'react-router-dom';
import pkgJson from '../package.json';
import Home from './pages/home.jsx';
import WriteBack from './pages/write-back.jsx';
import Docment from './pages/doc.jsx';
import Menus from './components/menus.jsx';

const routes = [
  {
    label: '提取中文字符',
    url: '/',
    component: Home,
    exact: true,
    icon: 'file-search',
  },
  {
    label: '回写源码',
    url: '/write-back',
    component: WriteBack,
    icon: 'form',
  },
  {
    label: '说明',
    url: '/document',
    component: Docment,
    icon: 'read',
  },
];
// TODO 刷新之后menu激活状态不对，初始化需要处理defaultSelectedKeys
export default class App extends React.Component {
  render() {
    return (
      <div className="app">
        <Router className="router">
          <Menus list={routes}></Menus>
          <div className="app__content">
            <header>
              <Typography.Title level={3} className="home__title">
                {/* <Icon type="file-search" /> */}
                国际化中文提取工具 v{pkgJson.version}
              </Typography.Title>
            </header>
            {routes.map(menu => (
              <Route
                key={menu.url}
                path={menu.url}
                exact={menu.exact || false}
                component={menu.component}
              />
            ))}
          </div>
        </Router>
      </div>
    );
  }
}
