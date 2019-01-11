import * as PayrollRopsten from '../constants/contracts/ropsten/Payroll';
import * as MyBitBurnerRopsten from '../constants/contracts/ropsten/MyBitBurner';
import * as MyBitTokenRopsten from '../constants/contracts/ropsten/MyBitToken';

import * as PayrollMainnet from '../constants/contracts/mainnet/Payroll';
import * as MyBitBurnerMainnet from '../constants/contracts/mainnet/MyBitBurner';
import * as MyBitTokenMainnet from '../constants/contracts/mainnet/MyBitToken';

import { ETHERSCAN_TX } from '../constants';

const burnValueWei = '250000000000000000000';

const getContract = (name, network, address) => {
  let contract;
  if (network === 'ropsten') {
    switch (name) {
      case 'Payroll':
        contract = PayrollRopsten;
        break;
      case 'MyBitBurner':
        contract = MyBitBurnerRopsten;
        break;
      case 'MyBitToken':
        contract = MyBitTokenRopsten;
        break;
      default:
        throw new Error('getContract: contract not found');
    }
  } else {
    switch (name) {
      case 'Payroll':
        contract = PayrollMainnet;
        break;
      case 'MyBitBurner':
        contract = MyBitBurnerMainnet;
        break;
      case 'MyBitToken':
        contract = MyBitTokenMainnet;
        break;
      default:
        throw new Error('getContract: contract not found');
    }
  }

  return new window.web3.eth.Contract(
    contract.ABI,
    address || contract.ADDRESS,
  );
};

export const loadUserDetails = async network => {
  const accounts = await window.web3.eth.getAccounts();
  const balance = await window.web3.eth.getBalance(accounts[0]);

  const myBitTokenContract = getContract('MyBitToken', network);

  let myBitBalance = await myBitTokenContract.methods
    .balanceOf(accounts[0])
    .call();

  if (myBitBalance > 0) {
    myBitBalance /= 10 ** 18;
  }
  return {
    userName: accounts[0],
    ethBalance: window.web3.utils.fromWei(balance, 'ether'),
    myBitBalance,
  };
};

export const getApprovalLogs = async network =>
  new Promise(async (resolve, reject) => {
    try {
      const mybitTokenContract = getContract('MyBitToken', network);

      const logApprovals = await mybitTokenContract.getPastEvents('Approval', {
        fromBlock: 0,
        toBlock: 'latest',
      });

      resolve(logApprovals);
    } catch (error) {
      reject(error);
    }
  });

export const requestApproval = async (address, network) => {
  const burnerAddress =
    network === 'ropsten'
      ? MyBitBurnerRopsten.ADDRESS
      : MyBitBurnerMainnet.ADDRESS;
  const mybitTokenContract = getContract('MyBitToken', network);

  const estimatedGas = await mybitTokenContract.methods
    .approve(burnerAddress, burnValueWei)
    .estimateGas({ from: address });
  const gasPrice = await window.web3.eth.getGasPrice();

  const { transactionHash } = await mybitTokenContract.methods
    .approve(burnerAddress, burnValueWei)
    .send({
      from: address,
      gas: estimatedGas,
      gasPrice,
    });
  return new Promise((resolve, reject) => {
    checkTransactionStatus(transactionHash, resolve, reject, network);
  });
};

export const getAllowanceOfAddress = async (address, network) => {
  const mybitTokenContract = getContract('MyBitToken', network);
  const allowance = await mybitTokenContract.methods
    .allowance(
      address,
      network === 'ropsten'
        ? MyBitBurnerRopsten.ADDRESS
        : MyBitBurnerMainnet.ADDRESS,
    )
    .call();
  return allowance >= burnValueWei;
};

// Events
export const getNewEmployeeLog = async network => {
  const payrollContract = getContract('Payroll', network);
  return payrollContract.getPastEvents('LogNewEmployee', {
    fromBlock: 0,
    toBlock: 'latest',
  });
};

export const getNewOrganizationLog = async (creator, network) => {
  const payrollContract = getContract('Payroll', network);
  return payrollContract.getPastEvents('LogNewOrganization', {
    fromBlock: 0,
    toBlock: 'latest',
    filter: { _creator: creator },
  });
};

export const getOrganizationEvents = async (organizationName, network) => {
  const payrollContract = getContract('Payroll', network);
  const allEvents = await payrollContract.getPastEvents('allEvents', {
    fromBlock: 0,
    toBlock: 'latest',
  });
  console.log('allevents', allEvents);
  return allEvents.filter(
    e => e.returnValues._organizationName === organizationName,
  );
};

// Getters
export const listEmployees = async (organizationName, network) => {
  const payrollContract = getContract('Payroll', network);
  return payrollContract.methods.listEmployees(organizationName).call();
};

export const listSalaries = async (organizationName, network) => {
  const payrollContract = getContract('Payroll', network);
  return payrollContract.methods.listSalaries(organizationName).call();
};

export const getTotalPayroll = async (organizationName, network) => {
  const payrollContract = getContract('Payroll', network);
  return payrollContract.methods.getTotalPayroll(organizationName).call();
};

// Payable
export const payEmployees = async (organizationName, amount, from, network) => {
  const payrollContract = getContract('Payroll', network);
  const gasPrice = await window.web3.eth.getGasPrice();
  const estimatedGas = await payrollContract.methods
    .payEmployees(organizationName)
    .estimateGas({ from, value: amount });

  const { transactionHash } = await payrollContract.methods
    .payEmployees(organizationName)
    .send({
      value: amount,
      from,
      gas: estimatedGas,
      gasPrice,
    });
  return new Promise((resolve, reject) => {
    checkTransactionStatus(transactionHash, resolve, reject, network);
  });
};

// External
export const addOrganization = async (
  organizationName,
  employees,
  salaries,
  from,
  network,
) => {
  const payrollContract = getContract('Payroll', network);
  const gasPrice = await window.web3.eth.getGasPrice();
  const estimatedGas = await payrollContract.methods
    .addOrganization(organizationName, employees, salaries)
    .estimateGas({ from });

  const { transactionHash } = await payrollContract.methods
    .addOrganization(organizationName, employees, salaries)
    .send({
      from,
      gas: estimatedGas,
      gasPrice,
    });
  return new Promise((resolve, reject) => {
    checkTransactionStatus(transactionHash, resolve, reject, network);
  });
};

export const addEmployee = async (
  organizationName,
  newEmployee,
  salary,
  from,
  network,
) => {
  const payrollContract = getContract('Payroll', network);
  const gasPrice = await window.web3.eth.getGasPrice();
  const estimatedGas = await payrollContract.methods
    .addEmployee(organizationName, newEmployee, salary)
    .estimateGas({ from });

  const { transactionHash } = await payrollContract.methods
    .addEmployee(organizationName, newEmployee, salary)
    .send({
      from,
      gas: estimatedGas,
      gasPrice,
    });
  return new Promise((resolve, reject) => {
    checkTransactionStatus(transactionHash, resolve, reject, network);
  });
};

export const removeEmployee = async (
  organizationName,
  employee,
  from,
  network,
) => {
  const payrollContract = getContract('Payroll', network);
  const gasPrice = await window.web3.eth.getGasPrice();
  const estimatedGas = await payrollContract.methods
    .removeEmployee(organizationName, employee)
    .estimateGas({ from });

  const { transactionHash } = await payrollContract.methods
    .removeEmployee(organizationName, employee)
    .send({
      from,
      gas: estimatedGas,
      gasPrice,
    });
  return new Promise((resolve, reject) => {
    checkTransactionStatus(transactionHash, resolve, reject, network);
  });
};

export const removeEmployeeKeepOrder = async (
  organizationName,
  employee,
  from,
  network,
) => {
  const payrollContract = getContract('Payroll', network);
  const gasPrice = await window.web3.eth.getGasPrice();
  const estimatedGas = await payrollContract.methods
    .removeEmployeeKeepOrder(organizationName, employee)
    .estimateGas({ from });

  const {
    transactionHash,
  } = await payrollContract.methods
    .removeEmployeeKeepOrder(organizationName, employee)
    .send({
      from,
      gas: estimatedGas,
      gasPrice,
    });
  return new Promise((resolve, reject) => {
    checkTransactionStatus(transactionHash, resolve, reject, network);
  });
};

export const updateAddress = async (
  organizationName,
  oldAddress,
  newAddress,
  from,
  network,
) => {
  const payrollContract = getContract('Payroll', network);
  const gasPrice = await window.web3.eth.getGasPrice();
  const estimatedGas = await payrollContract.methods
    .updateAddress(organizationName, oldAddress, newAddress)
    .estimateGas({ from });

  const { transactionHash } = await payrollContract.methods
    .updateAddress(organizationName, oldAddress, newAddress)
    .send({
      from,
      gas: estimatedGas,
      gasPrice,
    });
  return new Promise((resolve, reject) => {
    checkTransactionStatus(transactionHash, resolve, reject, network);
  });
};

const checkTransactionStatus = async (
  transactionHash,
  resolve,
  reject,
  network,
) => {
  try {
    const endpoint = ETHERSCAN_TX(transactionHash, network);
    const result = await fetch(endpoint);
    const jsronResult = await result.json();
    if (jsronResult.status === '1') {
      resolve(true);
    } else if (jsronResult.status === '0') {
      resolve(false);
    } else {
      setTimeout(
        () => checkTransactionStatus(transactionHash, resolve, reject, network),
        1000,
      );
    }
  } catch (err) {
    reject(err);
  }
};
