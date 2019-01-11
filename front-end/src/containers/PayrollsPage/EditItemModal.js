import Modal from 'antd/lib/modal';
import Button from '@bit/mybit.ui.showcase.button';
import Input from 'components/Input';
import React from 'react';
import style from 'antd/dist/antd.css';
import styled from 'styled-components/macro';
import Alert from 'antd/lib/alert';

const StyledInput = styled.div`
  width: 90%;
  margin-right: 10%;
`;

export default class EditItemModal extends React.Component {
  state = {
    transactionProcessing: false,
    address: '',
    salary: '',
    alertType: null,
    alertMessage: null,
  };

  handleOk = async () => {
    const { address, organizationName } = this.props.record;
    if (this.state.address !== address) {
      if (window.web3.utils.isAddress(this.state.address)) {
        this.setState({
          alertType: 'info',
          alertMessage: 'Waiting on transaction confirmation',
          transactionProcessing: true,
        });
        try {
          if (address) {
            await this.props.updateAddress(
              organizationName,
              address,
              this.state.address,
            );
          } else {
            await this.props.addEmployee(
              this.props.record.organizationName,
              this.state.address,
              window.web3.utils.toWei(this.state.salary),
            );
          }
        } catch (e) {
          this.setState({
            alertType: 'error',
            alertMessage: e.message,
            transactionProcessing: false,
          });
        }
        await this.props.getUserPayrolls();
        this.setState({
          transactionProcessing: false,
          alertType: null,
        });
        this.props.hideModal();
      } else {
        this.setState({
          alertType: 'error',
          alertMessage: 'Please enter a valid ethereum address',
        });
      }
    }
  };

  handleInputChange(text, id) {
    this.setState({
      [id]: text,
    });
  }

  handleCancel = () => {
    this.props.hideModal();
  };

  render() {
    return (
      <div>
        <Modal
          title={
            this.props.record.address ? 'New Employee address' : 'New Employee'
          }
          visible={this.props.visible}
          onOk={this.handleOk}
          confirmLoading={this.state.transactionProcessing}
          onCancel={this.handleCancel}
        >
          <StyledInput>
            <Input
              placeholder={this.props.record.address || 'Address'}
              value={this.state.address}
              onChange={e => this.handleInputChange(e.target.value, 'address')}
              tooltipTitle="What is the address for this employee?"
              hasTooltip
            />
            {!this.props.record.address && (
              <Input
                placeholder={this.props.record.salary || 'Salary'}
                value={this.state.salary}
                onChange={e => this.handleInputChange(e.target.value, 'salary')}
                tooltipTitle="What is the salary for this employee?"
                hasTooltip
              />
            )}
            {this.state.alertType !== null && (
              <Alert
                type={this.state.alertType}
                message={this.state.alertMessage}
                showIcon
                closable={false}
              />
            )}
          </StyledInput>
        </Modal>
      </div>
    );
  }
}
