import React from 'react';
// import { FormattedMessage } from 'react-intl';
import { Menu, Icon } from 'antd';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import A from './A';
import Img from './Img';
// import NavBar from './NavBar';
// import HeaderLink from './HeaderLink';
// import messages from './messages';

import MyBitLogo from './MyBit-logo.svg';
import 'antd/lib/button/style/css';
import 'antd/lib/menu/style/css';

export const UsageMenu = styled(Menu)`
  color: white;
`

/* eslint-disable react/prefer-stateless-function */
class Header extends React.Component {
  state = {
    current: 'how',
  }

  render() {
    return (
      <div>
        <A href="#">
          <Img src={MyBitLogo} alt="mybit.io" />
        </A>
        <UsageMenu mode="horizontal">
          <Menu.Item key="how">
            <Link to="/" className="nav-text"><Icon type="compass" /> How it Works</Link>
          </Menu.Item>
          <Menu.Item key="transactions">
          <Link to="/features" className="nav-text"><Icon type="credit-card" /> Transactions</Link>
            
          </Menu.Item>
          <Menu.Item key="redeem">
            <Icon type="clock-circle-o" /> Redeem
          </Menu.Item>
          <Menu.Item key="create-new">
            <Icon type="plus" /> Create New
          </Menu.Item>
        </UsageMenu>
      </div>
    );
  }
}

export default Header;
