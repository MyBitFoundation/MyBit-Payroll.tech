import React from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import BlockchainInfoContext from './BlockchainInfoContext';
import * as Core from '../utils/core';
import { EventNames } from '../constants';

class BlockchainInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: {
        user: true,
        userPayrolls: true,
        network: true,
      },
      user: {
        myBitBalance: 0,
        etherBalance: 0,
        userName: '',
      },
      currentBlock: 0,
      requestApproval: this.requestApproval,
      checkAddressAllowed: this.checkAddressAllowed,
      payEmployees: this.payEmployees,
      addOrganization: this.addOrganization,
      addEmployee: this.addEmployee,
      getTotalPayroll: this.getTotalPayroll,
      getNewEmployeeLog: this.getNewEmployeeLog,
      getUserPayrolls: this.getUserPayrolls,
      removeEmployee: this.removeEmployee,
      removeEmployeeKeepOrder: this.removeEmployeeKeepOrder,
      updateAddress: this.updateAddress,
      // can be ropsten or main - else unknown
      network: '',
      userPayrolls: [],
    };
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      throw new Error(
        'No web3 detected, please install metamask or use an ethereum browser',
      );
    }
  }

  async componentWillMount() {
    this.getPayrollsInterval = setInterval(this.getUserPayrolls, 30000);
    this.getUserDetailsInterval = setInterval(this.getUserDetails, 5000);

    await this.loadWeb3();
    await this.getNetwork();
    await this.loadUserDetails(this.state.network);
    await this.getUserPayrolls();
    await this.checkAddressAllowed();
    window.web3.currentProvider.publicConfigStore.on('update', data => {
      if (
        data.selectedAddress.toUpperCase() !==
        this.state.user.userName.toUpperCase()
      )
        window.location.reload();
    });
  }

  async loadUserDetails() {
    const user = await Core.loadUserDetails(this.state.network);
    this.setState({
      user,
      loading: { ...this.state.loading, user: false },
    });
  }

  async componentWillUnmount() {
    clearInterval(this.getTransactionsInterval);
    clearInterval(this.getUserDetailsInterval);
  }

  payEmployees = async organizationName => {
    const amount = await this.getTotalPayroll(organizationName);
    return Core.payEmployees(
      organizationName,
      amount,
      this.state.user.userName,
      this.state.network,
    );
  };

  async getNetwork() {
    const network = await window.web3.eth.net.getNetworkType();
    this.setState({
      network,
      loading: {
        ...this.state.loading,
        network: false,
      },
    });
  }

  addOrganization = (organizationName, employees, salaries) =>
    Core.addOrganization(
      organizationName,
      employees,
      salaries,
      this.state.user.userName,
      this.state.network,
    );

  addEmployee = (organizationName, newEmployee, salary) =>
    Core.addEmployee(
      organizationName,
      newEmployee,
      salary,
      this.state.user.userName,
      this.state.network,
    );

  removeEmployee = (organizationName, employee) =>
    Core.removeEmployee(
      organizationName,
      employee,
      this.state.user.userName,
      this.state.network,
    );

  removeEmployeeKeepOrder = (organizationName, employee) =>
    Core.removeEmployeeKeepOrder(
      organizationName,
      employee,
      this.state.user.userName,
      this.state.network,
    );

  updateAddress = (organizationName, oldAddress, newAddress) =>
    Core.updateAddress(
      organizationName,
      oldAddress,
      newAddress,
      this.state.user.userName,
      this.state.network,
    );

  getUserPayrolls = async () => {
    try {
      const newOrganizationLog = await Core.getNewOrganizationLog(
        this.state.user.userName,
        this.state.network,
      );
      const userPayrolls = await Promise.all(
        newOrganizationLog.map(async log => {
          const employees = await Core.listEmployees(
            log.returnValues._organizationName,
            this.state.network,
          );
          const salaries = await Core.listSalaries(
            log.returnValues._organizationName,
            this.state.network,
          );
          const totalPayroll = await Core.getTotalPayroll(
            log.returnValues._organizationName,
            this.state.network,
          );
          const events = await Core.getOrganizationEvents(
            log.returnValues._organizationName,
            this.state.network,
          );
          return {
            organizationName: log.returnValues._organizationName,
            totalPayroll: window.web3.utils.fromWei(totalPayroll),
            numEmployees: employees.length,
            employees: employees.map((address, i) => ({
              address,
              salary: window.web3.utils.fromWei(salaries[i]),
              organizationName: log.returnValues._organizationName,
            })),
            events: await Promise.all(
              events.map(async e => {
                e.name = EventNames[e.event];
                const block = await window.web3.eth.getBlock(e.blockNumber);
                e.date = new Date(block.timestamp * 1000).toDateString();
                return e;
              }),
            ),
          };
        }),
      );
      this.setState({
        userPayrolls,
        loading: {
          ...this.state.loading,
          userPayrolls: false,
        },
      });
    } catch (e) {
      console.log(e);
      setTimeout(this.getUserPayrolls, 1000);
    }
  };

  getTotalPayroll = async organizationName =>
    Core.getTotalPayroll(organizationName, this.state.network);

  requestApproval = () =>
    Core.requestApproval(this.state.user.userName, this.state.network);

  checkAddressAllowed = async () => {
    try {
      const allowed = await Core.getAllowanceOfAddress(
        this.state.user.userName,
        this.state.network,
      );
      this.setState({ userAllowed: allowed });
    } catch (err) {
      console.log(err);
    }
  };

  render() {
    return (
      <BlockchainInfoContext.Provider value={this.state}>
        {this.props.children}
      </BlockchainInfoContext.Provider>
    );
  }
}

export default BlockchainInfo;

BlockchainInfo.propTypes = {
  children: PropTypes.node.isRequired,
};
