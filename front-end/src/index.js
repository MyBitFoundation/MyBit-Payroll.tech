import React from 'react';
import ReactDOM from 'react-dom';
import GlobalStyle from './global-styles';
import { BrowserRouter } from 'react-router-dom';
import App from './containers/App';
import BlockchainInfo from './context/BlockchainInfo';


ReactDOM.render(
  <React.Fragment>
    <BlockchainInfo>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </BlockchainInfo>
    <GlobalStyle/>
  </React.Fragment>, 
document.getElementById('root'));
