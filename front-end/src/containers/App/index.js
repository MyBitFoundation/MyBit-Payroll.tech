/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import { Switch, Route } from 'react-router-dom';

import HomePage from 'containers/HomePage/Loadable';
import CreateNewPage from 'containers/CreateNewPage/Loadable';
import PayrollsPage from 'containers/PayrollsPage/Loadable';
import Header from 'components/Header';
import Footer from 'components/Footer';
import AppWrapper from 'components/AppWrapper';
import MyBitPayrollLogo from 'components/MyBitPayrollLogo';
import PageWrapper from 'components/PageWrapper';
import BlockchainInfoContext from 'context/BlockchainInfoContext';
import { Links } from '../../constants';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { mobileMenuOpen: false };
    this.handleClickMobileMenu = this.handleClickMobileMenu.bind(this);
  }

  handleClickMobileMenu(mobileMenuOpen) {
    this.setState({ mobileMenuOpen });
  }

  render() {
    const { mobileMenuOpen } = this.state;
    return (
      <AppWrapper mobileMenuOpen={mobileMenuOpen}>
        <Helmet defaultTitle="MyBit Payroll">
          <meta
            name="description"
            content="Schedule a transaction in the ethereum network"
          />
        </Helmet>
        <Header
          logo={MyBitPayrollLogo}
          links={Links}
          optionalButton
          mobileMenuOpen={mobileMenuOpen}
          handleClickMobileMenu={this.handleClickMobileMenu}
        />
        <PageWrapper>
          <Switch>
            <Route exact path="/" component={HomePage} />
            <Route
              path="/payrolls"
              component={() => (
                <BlockchainInfoContext.Consumer>
                  {({
                    getUserPayrolls,
                    addEmployee,
                    userPayrolls,
                    removeEmployeeKeepOrder,
                    updateAddress,
                    payEmployees,
                    loading,
                    network,
                  }) => (
                    <PayrollsPage
                      removeEmployeeKeepOrder={removeEmployeeKeepOrder}
                      updateAddress={updateAddress}
                      addEmployee={addEmployee}
                      payEmployees={payEmployees}
                      userPayrolls={userPayrolls}
                      getUserPayrolls={getUserPayrolls}
                      loading={loading.userPayrolls}
                      network={network}
                      loadingNetwork={loading.network}
                    />
                  )}
                </BlockchainInfoContext.Consumer>
              )}
            />
            <Route
              path="/create-new"
              component={() => (
                <BlockchainInfoContext.Consumer>
                  {({
                    currentBlock,
                    getTransactions,
                    userAllowed,
                    requestApproval,
                    addOrganization,
                    checkAddressAllowed,
                    user,
                    loading,
                    network,
                  }) => (
                    <CreateNewPage
                      currentBlock={currentBlock}
                      getTransactions={getTransactions}
                      userAllowed={userAllowed}
                      requestApproval={requestApproval}
                      addOrganization={addOrganization}
                      checkAddressAllowed={checkAddressAllowed}
                      user={user}
                      loading={loading.user}
                      network={network}
                      loadingNetwork={loading.network}
                    />
                  )}
                </BlockchainInfoContext.Consumer>
              )}
            />
          </Switch>
        </PageWrapper>
        <Footer />
      </AppWrapper>
    );
  }
}

export default App;
