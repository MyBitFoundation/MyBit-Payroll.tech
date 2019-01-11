/*
 * Create New Payroll Page
 *
 * Page to create payroll contracts
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import styled from 'styled-components/macro';
import ContainerCreate from 'components/ContainerCreate';
import Input from 'components/Input';
import Constants from 'components/Constants';
import Checkbox from 'antd/lib/checkbox';
import LoadingIndicator from 'components/LoadingIndicator';
import ConnectionStatus from 'components/ConnectionStatus';
import Button from '@bit/mybit.ui.showcase.button';
import Image from '../../images/secure.svg';

import 'antd/lib/checkbox/style/css';

const StyledTermsAndConditions = styled.s`
  font-size: 12px;
  font-family: 'Roboto';
  margin-bottom: 10px;
  text-decoration: none;

  a {
    color: #1890ff;
  }
`;

const StyledClickHere = styled.s`
  color: #1890ff;
  text-decoration: underline;
`;

const StyledTermsAndConditionsWrapper = styled.div`
  margin-bottom: 10px;
`;

const StyledButtonWrapper = styled.div`
  width: 100%;
`;

const StyledEmployeeInputWrapper = styled.div`
  display: flex;
  color: #1890ff;
  text-decoration: underline;
`;

const StyledSmallInput = styled.div`
  width: 30%;
`;

const StyledLargeInput = styled.div`
  width: 70%;
  margin-right: 4%;
`;

export default class CreateNewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      shouldConfirm: false,
      acceptedToS: false,
      employees: [],
    };
    this.details = [];
  }

  handleClose = () => {
    this.setState({
      shouldConfirm: false,
      orgName: '',
    });
  }

  handleBack = () => {
    this.setState({ shouldConfirm: false });
  };

  handleConfirm = async () => {
    const { orgName, employees } = this.state;
    let alertType;
    let alertMessage;
    this.setState({ alertType });

    for (let i = 0; i < employees.length; i++) {
      if (!window.web3.utils.isAddress(employees[i].address)) {
        alertMessage = `Please enter a valid ethereum address for employee #${i +
          1}`;
      }
    }

    if (this.props.user.myBitBalance < 250) {
      alertMessage = (
        <span>
          Your MYB balance is below 250, click
          <StyledClickHere
            onClick={() => BancorConvertWidget.showConvertPopup('buy')} // eslint-disable-line no-undef
          >
            here
          </StyledClickHere>{' '}
          to buy more.
        </span>
      );
    }
    if (alertMessage) {
      alertType = 'error';
      this.setState({
        alertType,
        alertMessage,
      });
      return;
    }

    this.setState({ shouldConfirm: true });
    this.setState({
      alertType: 'info',
      alertMessage: 'Waiting for confirmations.',
    });

    try {
      let result = true;
      if (!this.props.userAllowed) {
        result = await this.props.requestApproval();
      }

      if (result) {
        result = await this.props.addOrganization(
          orgName,
          employees.map(employee => employee.address),
          employees.map(employee => window.web3.utils.toWei(employee.salary)),
        );
      }
      if (result) {
        this.setState({
          alertType: 'success',
          alertMessage: 'Transaction confirmed.',
        });
      } else {
        this.setState({
          alertType: 'error',
          alertMessage: 'Transaction failed. Please try again with more gas.',
        });
      }
      this.props.checkAddressAllowed();
    } catch (err) {
      this.setState({ alertType: undefined });
    }
  }

  handleTermsAndConditionsClicked = e => {
    this.setState({ acceptedToS: e.target.checked });
  };

  handleAlertClosed = () => {
    this.setState({ alertType: undefined });
  };

  handleInputChange = (text, id) => {
    this.setState({
      [id]: text,
    });
  };

  handleEmployeeChange = (field, value, idx) => {
    const { employees } = this.state;
    employees[idx][field] = value;
    this.setState({ employees });
  }

  addEmployee = () => {
    this.setState(prevState => ({
      employees: [...prevState.employees, { address: '', salary: '' }],
    }));
  };

  render() {
    const toRender = [];
    if (this.props.loading) {
      return <LoadingIndicator />;
    }

    toRender.push(
      <ConnectionStatus
        network={this.props.network}
        constants={Constants}
        key="connection status"
        loading={this.props.loadingNetwork}
      />,
    );

    const content = (
      <div key="content">
        <Input
          placeholder="Organization name"
          value={this.state.orgName}
          onChange={e => this.handleInputChange(e.target.value, 'orgName')}
          tooltipTitle="What is the name of your organization or department?"
          hasTooltip
        />
        {this.state.employees.map((employee, idx) => (
          <StyledEmployeeInputWrapper>
            <StyledLargeInput>
              <Input
                placeholder={`Employee ${idx + 1} address`}
                value={this.state.employees[idx].address}
                onChange={e =>
                  this.handleEmployeeChange('address', e.target.value, idx)
                }
              />
            </StyledLargeInput>
            <StyledSmallInput>
              <Input
                placeholder="Salary"
                value={this.state.employees[idx].salary}
                onChange={e =>
                  this.handleEmployeeChange('salary', e.target.value, idx)
                }
                tooltipTitle={`What is the ethereum address and salary in ETH of employee #${idx +
                  1}?`}
                hasTooltip
              />
            </StyledSmallInput>
          </StyledEmployeeInputWrapper>
        ))}
        <StyledButtonWrapper>
          <Button
            size="small"
            onClick={this.addEmployee}
            theme="none"
            type="outline"
          >
            Add employee
          </Button>
        </StyledButtonWrapper>

        <StyledTermsAndConditionsWrapper>
          <Checkbox onChange={this.handleTermsAndConditionsClicked}>
            <StyledTermsAndConditions>
              I agree to the <a href="#">Terms and Conditions</a>
              .
            </StyledTermsAndConditions>
          </Checkbox>
        </StyledTermsAndConditionsWrapper>
      </div>
    );
    if (this.state.shouldConfirm) {
      toRender.push(
        <ContainerCreate
          key="containerConfirm"
          type="confirm"
          handleClose={this.handleClose}
          handleBack={this.handleBack}
          alertType={this.state.alertType}
          alertMessage={this.state.alertMessage}
          handleAlertClosed={this.handleAlertClosed}
          employees={this.state.employees}
          orgName={this.state.orgName}
        />,
      );
    } else {
      toRender.push(
        <ContainerCreate
          key="containerCreate"
          type="input"
          image={Image}
          alt="Placeholder image"
          content={content}
          handleConfirm={this.handleConfirm}
          alertType={this.state.alertType}
          alertMessage={this.state.alertMessage}
          handleAlertClosed={this.handleAlertClosed}
          acceptedToS={this.state.acceptedToS}
        />,
      );
    }

    return (
      <article>
        <Helmet>
          <title>Create - MyBit Payroll</title>
          <meta
            name="Create"
            content="Create a transaction on the MyBit Payroll dApp"
          />
        </Helmet>
        {toRender}
      </article>
    );
  }
}

CreateNewPage.defaultProps = {
  userAllowed: false,
  currentBlock: 0,
};

CreateNewPage.propTypes = {
  userAllowed: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    myBitBalance: PropTypes.number.isRequired,
  }).isRequired,
  loading: PropTypes.bool.isRequired,
  network: PropTypes.string.isRequired,
  loadingNetwork: PropTypes.bool.isRequired,
};
