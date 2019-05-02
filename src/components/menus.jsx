import React from 'react';
import { Menu, Icon } from 'antd';
import PropTypes from 'prop-types';
import { Link, withRouter } from 'react-router-dom';

class Menus extends React.PureComponent {
  render() {
    const { list, location } = this.props;
    // console.log(this.props);
    return (
      <Menu className="app__menu" defaultSelectedKeys={[location.pathname]} mode="inline" theme="dark">
        {list.map(menu => (
          <Menu.Item key={menu.url}>
            <Link to={menu.url}>
              {menu.icon && (<Icon type={menu.icon} />)}
              {menu.label}
            </Link>
          </Menu.Item>
        ))}
      </Menu>
    );
  }
}
Menus.propTypes = {
  list: PropTypes.array.isRequired,
}
export default withRouter(Menus);
