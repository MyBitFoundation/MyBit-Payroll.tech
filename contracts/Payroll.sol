pragma solidity ^0.4.24;

/// @title Payroll smart contract for simple payroll distribution
/// @author Kyle Dewhurst, MyBit Foundation
/// @notice Allows owner of organization set the addresses and how much to distribute to employees

import './SafeMath.sol';
import './Database.sol';
import './MyBitBurner.sol';

contract Payroll {
  using SafeMath for uint;

  Database public database;
  MyBitBurner public mybBurner;
  address public owner;

  uint public mybFee = 250;
  bool public expired = false;

  constructor(address _database, address _mybTokenBurner) public{
    owner = msg.sender;
    database = Database(_database);
    mybBurner = MyBitBurner(_mybTokenBurner);
  }

  /// @dev counter to allow mutex lock with only one SSTORE operation
  uint256 private guardCounter = 1;

  // @notice
  // @dev _totalSupply == total salaries of all employees (1 token == 1 LocalAreaUnit (CHF, USD, EUR..))
  function addOrganization(string _organizationName, address[] _employees, uint[] _salaries)
  external {
    require(!expired);
    require(mybBurner.burn(msg.sender, mybFee));
    require(_employees.length < uint8(100));    // uint8 overflows at 256. Dont loop through more than
    require(_employees.length == _salaries.length);
    require( !database.boolStorage(keccak256(abi.encodePacked("payrollIsOrganization", _organizationName))) );   // Impossible for owner to be set true without organization being registered

    database.setBool(keccak256(abi.encodePacked("payrollIsOrganization", _organizationName)), true);
    database.setBool(keccak256(abi.encodePacked("payrollIsOwner", _organizationName, msg.sender)), true);
    database.setUint(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName)), _employees.length);

    for (uint i = 0; i < _employees.length; i++) {
      assert(_employees[i] != address(0));
      assert(_salaries[i] > 0);
      database.setAddress(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i)), _employees[i]);
      database.setUint(keccak256(abi.encodePacked("payrollEmployeeSalaries", _organizationName, _employees[i])), _salaries[i]);
      database.setBool(keccak256(abi.encodePacked("payrollIsEmployee", _organizationName, _employees[i])), true);

      emit LogNewEmployee(_employees[i], _salaries[i], i);
    }
  }

  function addEmployee(string _organizationName, address _newEmployee, uint _salary)
  external {
    require(_newEmployee != address(0));
    require(_salary > 0);
    require( database.boolStorage(keccak256(abi.encodePacked("payrollIsOwner", _organizationName, msg.sender))) );

    uint totalEmployees = database.uintStorage(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName))); //Get total employees
    database.setUint(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName)), totalEmployees+1); //Increase number of total employees
    database.setAddress(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, totalEmployees)), _newEmployee); //Add employee address
    database.setUint(keccak256(abi.encodePacked("payrollEmployeeSalaries", _organizationName, _newEmployee)), _salary); //Add employee salary
    database.setBool(keccak256(abi.encodePacked("payrollIsEmployee", _organizationName, _newEmployee)), true); //Set employee status to true

    emit LogNewEmployee(_newEmployee, _salary, totalEmployees+1);
  }

  function listEmployees(string _organizationName)
  view
  external
  returns(address[]) {
    uint totalEmployees = database.uintStorage(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName))); //Get total employees
    address[] memory employeeList = new address[](totalEmployees);
    for(uint i=0; i<totalEmployees; i++){
      employeeList[i] = database.addressStorage(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i)));
    }
    return employeeList;
  }

  function removeEmployee(string _organizationName, address _employee)
  external {
    require( database.boolStorage(keccak256(abi.encodePacked("payrollIsOwner", _organizationName, msg.sender))) );

    uint totalEmployees = database.uintStorage(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName))); //Get total employees
    for(uint i=0; i<totalEmployees; i++){
      if(database.addressStorage(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i))) == _employee){
        database.setAddress(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i)), database.addressStorage(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, totalEmployees-1))) ); //Put last employee in position of removed employee
        database.deleteAddress(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, totalEmployees-1)));
        database.setUint(keccak256(abi.encodePacked("payrollEmployeeSalaries", _organizationName, _employee)), 0);
        database.setBool(keccak256(abi.encodePacked("payrollIsEmployee", _organizationName, _employee)), false);
        database.setUint(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName)), totalEmployees-1);
        return;
      }
    }
  }

  function removeEmployeeKeepOrder(string _organizationName, address _employee)
  external {
    require( database.boolStorage(keccak256(abi.encodePacked("payrollIsOwner", _organizationName, msg.sender))) );
    bool found = false;

    uint totalEmployees = database.uintStorage(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName))); //Get total employees
    for(uint i=0; i<totalEmployees; i++){
      if(database.addressStorage(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i))) == _employee){
        found = true;

        database.setUint(keccak256(abi.encodePacked("payrollEmployeeSalaries", _organizationName, _employee)), 0);
        database.setBool(keccak256(abi.encodePacked("payrollIsEmployee", _organizationName, _employee)), false);
      }
      if(found && i < totalEmployees-1){
        database.setAddress(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i)), database.addressStorage(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i+1))) ); //Put next employee in position of removed employee
      }
    }
    assert(found);
    database.setUint(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName)), totalEmployees-1);
  }

  // @notice employer can send funds here to be distributed to all his employees
  // @notice must send the equivalent of everyones salary
  // @param (string) _organizationName = The name of the organization
  function payEmployees(string _organizationName)
  external
  nonReentrant
  payable {
    require(getTotalPayroll(_organizationName) == msg.value);
    require( database.boolStorage(keccak256(abi.encodePacked("payrollIsOwner", _organizationName, msg.sender))) );

    uint totalEmployees = database.uintStorage(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName))); //Get total employees
    for(uint i=0; i<totalEmployees; i++){
      address thisEmployee = database.addressStorage(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i)));
      thisEmployee.transfer( database.uintStorage(keccak256(abi.encodePacked("payrollEmployeeSalaries", _organizationName, thisEmployee))) );
    }
  }

  // @dev Should this function be accessible to anyone but the organization owner?
  function getTotalPayroll(string _organizationName)
  public
  view
  returns (uint totalPayroll){
    uint totalEmployees = database.uintStorage(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName))); //Get total employees
    for(uint i=0; i<totalEmployees; i++){
      address thisEmployee = database.addressStorage(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i)));
      totalPayroll = totalPayroll.add( database.uintStorage(keccak256(abi.encodePacked("payrollEmployeeSalaries", _organizationName, thisEmployee))) );
    }
    return totalPayroll;
  }

  function updateAddress(string _organizationName, address _oldAddress, address _newAddress)
  external {
    require( database.boolStorage(keccak256(abi.encodePacked("payrollIsEmployee", _organizationName, _oldAddress))) );
    require( !database.boolStorage(keccak256(abi.encodePacked("payrollIsEmployee", _organizationName, _newAddress))) );
    if(database.boolStorage(keccak256(abi.encodePacked("payrollIsOwner", _organizationName, msg.sender))) || msg.sender == _oldAddress ){

      uint totalEmployees = database.uintStorage(keccak256(abi.encodePacked("payrollTotalEmployees", _organizationName))); //Get total employees
      for(uint i=0; i<totalEmployees; i++){
        if(database.addressStorage(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i))) == _oldAddress){
          //Add employee address
          database.setAddress(keccak256(abi.encodePacked("payrollEmployeeAddresses", _organizationName, i)), _newAddress);
          //Give new address salary of old address
          database.setUint(keccak256(abi.encodePacked("payrollEmployeeSalaries", _organizationName, _newAddress)), database.uintStorage(keccak256(abi.encodePacked("payrollEmployeeSalaries", _organizationName, _oldAddress))) );
          //Give old address salary of 0
          database.setUint(keccak256(abi.encodePacked("payrollEmployeeSalaries", _organizationName, _oldAddress)), 0);
          database.setBool(keccak256(abi.encodePacked("payrollIsEmployee", _organizationName, _oldAddress)), false);
          database.setBool(keccak256(abi.encodePacked("payrollIsEmployee", _organizationName, _newAddress)), true);
          return;
        }
      }
    } else {
      revert();
    }
  }

  // @notice If called by owner, this function prevents more Trust contracts from being made once
  // @notice Old contracts will continue to function
  function closeContract()
  external {
    require(msg.sender == owner);
    require (!expired);
    expired = true;
  }

  function changeMYBFee(uint _newFee)
  external {
    require(msg.sender == owner);
    mybFee = _newFee;
  }

  /**
   * @dev Prevents a contract from calling itself, directly or indirectly.
   * If you mark a function `nonReentrant`, you should also
   * mark it `external`. Calling one `nonReentrant` function from
   * another is not supported. Instead, you can implement a
   * `private` function doing the actual work, and an `external`
   * wrapper marked as `nonReentrant`.
   */
  modifier nonReentrant() {
    guardCounter += 1;
    uint256 localCounter = guardCounter;
    _;
    require(localCounter == guardCounter);
  }


  event LogNewEmployee(address indexed _employee, uint _salary, uint _index);
  event LogNewOrganization(bytes32 indexed _id, address indexed _creator);

}
