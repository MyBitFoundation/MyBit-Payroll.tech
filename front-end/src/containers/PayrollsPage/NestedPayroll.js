import React from 'react';
import Table from 'antd/lib/table';
import Button from '@bit/mybit.ui.showcase.button';
import styled from 'styled-components/macro';
import style from 'antd/dist/antd.css';
import Alert from 'antd/lib/alert';
import EditItemModal from './EditItemModal';

const StyledAlert = styled.div`
  font-size: 6px;
`;

export default class NestedPayroll extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editingRecord: '',
      modalVisible: false,
      alertType: null,
      alertMessage: null,
      deletingRecord: null,
    };
    this.employeeColumns = [
      {
        title: 'Address',
        dataIndex: 'address',
        width: '50%',
        colSpan: 2,
      },
      {
        title: 'Edit',
        dataIndex: 'edit',
        colSpan: 0,
        align: 'center',
        render: (text, record) => (
          <Button
            size="small"
            onClick={() => {
              this.setState({
                editingRecord: record,
                modalVisible: true,
              });
            }}
          >
            Edit
          </Button>
        ),
      },
      {
        title: 'Salary',
        dataIndex: 'salary',
        width: '15%',
      },
      {
        title: 'Remove',
        dataIndex: 'remove',
        align: 'center',
        render: (text, record) => {
          if (this.state.deletingRecord !== record) {
            return (
              <Button
                size="small"
                onClick={() => {
                  this.handleDelete(text, record);
                }}
              >
                Remove
              </Button>
            );
          }
          return (
            <StyledAlert>
              <Alert
                type={this.state.alertType}
                message={this.state.alertMessage}
                onClose={() =>
                  this.setState({
                    alertType: null,
                  })
                }
              />
            </StyledAlert>
          );
        },
      },
    ];
    this.eventColumns = [
      {
        title: 'Event',
        dataIndex: 'name',
      },
      {
        title: 'Transaction Hash',
        dataIndex: 'transactionHash',
      },
      {
        title: 'Date',
        dataIndex: 'date',
      },
    ];
  }

  handleDelete = async (text, record) => {
    this.setState({
      deletingRecord: record,
      alertType: 'info',
      alertMessage: 'Waiting on confirmation',
    });
    await this.props
      .removeEmployeeKeepOrder(record.organizationName, record.address)
      .catch(e => {
        this.setState({
          alertType: 'error',
          alertMessage: e.message,
        });
      });
    await this.props.getUserPayrolls();
    this.setState({
      deletingRecord: null,
      alertType: null,
      alertMessage: null,
    });
  };

  hideModal = () => {
    this.setState({
      modalVisible: false,
    });
  };

  render() {
    return (
      <div>
        <Table
          bordered={false}
          dataSource={this.props.userPayrolls[this.props.index].employees}
          columns={this.employeeColumns}
          size="small"
          pagination={false}
        />
        <Table
          bordered={false}
          dataSource={this.props.userPayrolls[this.props.index].events}
          columns={this.eventColumns}
          size="small"
          pagination={false}
        />
        <EditItemModal
          {...this.props}
          record={this.state.editingRecord}
          hideModal={this.hideModal}
          visible={this.state.modalVisible}
        />
      </div>
    );
  }
}
