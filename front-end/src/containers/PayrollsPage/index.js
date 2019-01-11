import React from 'react';
import styled from 'styled-components/macro';
import { Helmet } from 'react-helmet';
import Table from 'antd/lib/table';
import 'antd/lib/table/style/css';
import 'antd/lib/pagination/style/css';
import Constants from 'components/Constants';
import ConnectionStatus from 'components/ConnectionStatus';
import Button from '@bit/mybit.ui.showcase.button';
import LoadingIndicator from 'components/LoadingIndicator';
import Alert from 'components/Alert';
import NestedPayroll from './NestedPayroll';
import EditItemModal from './EditItemModal';

const StyledTable = styled.div`
  .ant-table-content {
    background-color: white;
    border-radius: 0px;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }
  .ant-table-tbody {
    border-radius: 0px;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }
  .ant-table-body {
    min-width: 650px;
    @media (max-width: 720px) {
      width: 500px;
    }
    @media (max-width: 540px) {
      width: 400px;
    }
    @media (max-width: 430px) {
      width: 340px;
    }
    @media (max-width: 390px) {
      width: 280px;
    }
  }
`;

export default class PayrollsPage extends React.Component {
  state = {
    alert: null,
    deletingRecord: null,
  };

  columns = [
    { title: 'Name', dataIndex: 'organizationName' },
    { title: '# Employees', dataIndex: 'numEmployees' },
    { title: 'Total', dataIndex: 'totalPayroll' },
    {
      title: 'Action',
      key: 'pay',
      render: (text, record) => (
        <Button
          size="small"
          onClick={() => this.payPayroll(record.organizationName)}
          theme="none"
          type="outline"
        >
          Pay
        </Button>
      ),
    },
    {
      title: 'Action',
      key: 'add',
      render: (text, record) => (
        <Button
          size="small"
          onClick={() => {
            this.setState({
              deletingRecord: { organizationName: record.organizationName },
              modalVisible: true,
            });
          }}
        >
          Add Employee
        </Button>
      ),
    },
  ];

  nestedColumns = [
    { title: 'Address', dataIndex: 'address' },
    { title: 'Salary', dataIndex: 'salary' },
  ];

  async payPayroll(organizationName) {
    this.setState({
      alert: {
        Type: 'info',
        Message: 'Waiting for transaction confirmation',
      },
    });
    const success = await this.props.payEmployees(organizationName);
    if (success) {
      await this.props.getUserPayrolls();
      this.setState({
        alert: {
          Type: 'info',
          Message: 'Transaction success.',
        },
      });
    } else {
      this.setState({
        alert: {
          Type: 'error',
          Message: 'Transaction failed.',
        },
      });
    }
  }

  hideModal = () => {
    this.setState({
      modalVisible: false,
    });
  };

  closeAlert = () => {
    this.setState({
      alert: null,
    });
  };

  render() {
    const config = {
      bordered: false,
      loading: this.props.loading,
      size: 'default',
    };
    if (this.props.loading) {
      return <LoadingIndicator />;
    }
    return (
      <div>
        <Helmet>
          <title>Payrolls - MyBit Payroll</title>
          <meta
            name="Payrolls"
            content="See and pay your payrolls on the MyBit Payroll dApp"
          />
        </Helmet>
        <ConnectionStatus
          network={this.props.network}
          constants={Constants}
          loading={this.props.loadingNetwork}
        />
        <StyledTable>
          <Table
            bordered
            {...config}
            columns={this.columns}
            expandedRowRender={(record, index) => (
              <NestedPayroll {...this.props} index={index} />
            )}
            dataSource={this.props.userPayrolls}
            pagination={false}
          />
        </StyledTable>
        {this.state.alert && (
          <Alert
            type={this.state.alert.Type}
            message={this.state.alert.Message}
            handleAlertClosed={this.closeAlert}
            showIcon
            closable
          />
        )}
        {this.state.deletingRecord != null && (
          <EditItemModal
            {...this.props}
            record={this.state.deletingRecord}
            hideModal={this.hideModal}
            visible={this.state.modalVisible}
          />
        )}
      </div>
    );
  }
}
