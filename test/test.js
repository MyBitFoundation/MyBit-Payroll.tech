var BigNumber = require('bignumber.js');

const Payroll = artifacts.require('./Payroll.sol');
const Token = artifacts.require('./ERC20.sol');
const MyBitBurner = artifacts.require('./MyBitBurner.sol');
const Database = artifacts.require('./Database.sol');
const ContractManager = artifacts.require('./ContractManager.sol');

const WEI = 1000000000000000000;

const tokenSupply = 100000;
const tokenPerAccount = 1000;

let burnFee = 250;

contract('Payroll', async (accounts) => {
  const employer = web3.eth.accounts[0];
  const employer2 = web3.eth.accounts[1];
  const employee = web3.eth.accounts[2];
  const employee2 = web3.eth.accounts[3];
  const employee3 = web3.eth.accounts[4];
  const employee4 = web3.eth.accounts[5];
  const newAddress = web3.eth.accounts[6];
  const organization = 'MyBit';

  const a = web3.eth.accounts[9];
  //300 addresses
  const tooManyAddresses = [a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a,a]
  let employees = [employee, employee2, employee3];
  let employeesFail = [employee, employee2, ''];
  let salaries = [100, 150, 200];
  let salariesFail = [100, 150, 0];

  let database;
  let contractManager;
  let token;
  let burner;
  let payroll;
  let total;

  // Deploy token contract
  it ('Deploy MyBit Token contract', async() => {
    token = await Token.new(tokenSupply, "MyBit Token", 8, "MyB");
    tokenAddress = await token.address;
    console.log(tokenAddress);

    assert.equal(await token.totalSupply(), tokenSupply);
    assert.equal(await token.balanceOf(employer), tokenSupply);
  });

  // Give every user tokenPerAccount amount of tokens
  it("Spread tokens to users", async () => {
    for (var i = 1; i < web3.eth.accounts.length; i++) {
      //console.log(web3.eth.accounts[i]);
      await token.transfer(web3.eth.accounts[i], tokenPerAccount);
      let userBalance = await token.balanceOf(web3.eth.accounts[i]);
      assert.equal(userBalance, tokenPerAccount);
    }
    // Check token ledger is correct
    const totalTokensCirculating = (web3.eth.accounts.length - 1) * (tokenPerAccount);
    const remainingTokens = tokenSupply - totalTokensCirculating;
    assert.equal(await token.balanceOf(employer), remainingTokens);
  });

  it('Deploy Database', async() => {
    database = await Database.new(employer);
    contractManager = await ContractManager.new(database.address);
    await database.setContractManager(contractManager.address);
  });

  it ('Deploy MyBitBurner contract', async() => {
    burner = await MyBitBurner.new(tokenAddress);
  });

  it('Deploy Payroll contract', async() => {
    payroll = await Payroll.new(database.address, burner.address);
    await contractManager.addContract('Payroll', payroll.address);
    await burner.authorizeBurner(payroll.address);
    let authTrue = await burner.authorizedBurner(payroll.address);
    assert.equal(true, authTrue);
  });

  it('Fail to change MyB Fee', async() => {
    try{
      await payroll.changeMYBFee(200, {from: employer2});
    }catch(e){
      console.log('Only owner can change MyB fee');
    }
  });

  it('Change MyB Fee', async() => {
    burnFee = 200;
    await payroll.changeMYBFee(burnFee);
  });

  it('Add Organization - Employee Fail', async() => {
    try{
      await token.approve(burner.address, burnFee);
      await payroll.addOrganization(organization, employeesFail, salaries);
    } catch(e){
      console.log('Incorrect employee addresses');
    }
  });

  it('Add Organization - Salary Fail', async() => {
    try{
      await token.approve(burner.address, burnFee);
      await payroll.addOrganization(organization, employees, salariesFail);
    } catch(e){
      console.log('Salaries cannot equal zero');
    }
  });

  it('Add Organization', async() => {
    await token.approve(burner.address, burnFee);
    await payroll.addOrganization(organization, employees, salaries);
  });

  it('Add Employee', async() => {
    tx = await payroll.addEmployee(organization, employee4, 50);
    console.log(Number(tx.logs[0].args._index));
    employees.push(employee4);
    salaries.push(50);
  });

  it('List Employees', async() => {
    let employeeList = await payroll.listEmployees(organization);
    console.log(employeeList);

    assert.equal(employees.length, employeeList.length);
    for(var i=0; i<employeeList.length; i++){
      assert.equal(employees[i],employeeList[i]);
    }
  });

  it('Get Total Payroll', async() => {
    total = Number(await payroll.getTotalPayroll(organization));
    console.log(total);
    let salarySum = 0;
    for(var i=0; i<salaries.length; i++){
      salarySum = salarySum + salaries[i];
    }
    assert.equal(total, salarySum);
  });

  it('Fail to change non-existant employees address', async() => {
    try{
      await payroll.updateAddress(organization, employees[0], employees[1]);
    } catch(e) {
      console.log('Cannot change employee that doesnt exist');
    }
  });

  it('Fail to change employees address to that address of another employee', async() => {
    try{
      await payroll.updateAddress(organization, web3.eth.accounts[7], web3.eth.accounts[8]);
    } catch(e) {
      console.log('Cannot change to another employee address');
    }
  });

  it('Change Employee Address', async() => {
    let index = 1;
    console.log(employees[index]);
    await payroll.updateAddress(organization, employees[index], newAddress);
    employees[index] = newAddress;
    console.log(employees[index]);


    let employeeList = await payroll.listEmployees(organization);
    console.log(employeeList);

    assert.equal(employees.length, employeeList.length);
    for(var i=0; i<employeeList.length; i++){
      assert.equal(employees[i],employeeList[i]);
    }
  });

  it('Remove Employee', async() => {
    let index = 1;
    await payroll.removeEmployeeKeepOrder(organization, employees[index]);
    employees = employees.filter(function(e) { return e !== employees[index] });
    console.log('Old Salaries: ' + salaries);
    salaries.splice(index,1);
    console.log('New Salaries: ' + salaries);

    let employeeList = await payroll.listEmployees(organization);
    console.log(employeeList);

    assert.equal(employees.length, employeeList.length);
    for(var i=0; i<employeeList.length; i++){
      assert.equal(employees[i],employeeList[i]);
    }
  });

  it('Get Total Payroll', async() => {
    total = Number(await payroll.getTotalPayroll(organization));
    console.log(total);
    let salarySum = 0;
    for(var i=0; i<salaries.length; i++){
      salarySum = salarySum + salaries[i];
    }
    assert.equal(total, salarySum);
  });

  it('Get Total Payroll', async() => {
    total = Number(await payroll.getTotalPayroll(organization));
    console.log(total);
    let salarySum = 0;
    for(var i=0; i<salaries.length; i++){
      salarySum = salarySum + salaries[i];
    }
    assert.equal(total, salarySum);
  });

  it('Payroll fail', async() => {
    try{
      await payroll.payEmployees(organization, {value: total-100});
    } catch(e){
      console.log('Insufficient funds sent');
    }
  });

  it('Payroll fail', async() => {
    try{
      await payroll.payEmployees(organization, {from: employer2, value: total});
    } catch(e){
      console.log('Cannot do payroll for a organization you do not own');
    }
  });

  it('Do payroll', async() => {
    let employee1Before = new BigNumber(await web3.eth.getBalance(employee));
    //let employee2Before = new BigNumber(await web3.eth.getBalance(employee2));
    let employee3Before = new BigNumber(await web3.eth.getBalance(employee3));
    let employee4Before = new BigNumber(await web3.eth.getBalance(employee4));
    console.log('Employee 1 Before: ' + employee1Before);
    //console.log('Employee 2 Before: ' + employee2Before);
    console.log('Employee 3 Before: ' + employee3Before);
    console.log('Employee 4 Before: ' + employee4Before);

    //List employees
    //employees = await payroll.listEmployees();
    //console.log(employees);

    await payroll.payEmployees(organization, {value: total});

    let employee1After = new BigNumber(await web3.eth.getBalance(employee));
    //let employee2After = new BigNumber(await web3.eth.getBalance(employee2));
    let employee3After = new BigNumber(await web3.eth.getBalance(employee3));
    let employee4After = new BigNumber(await web3.eth.getBalance(employee4));
    console.log('Employee 1 After: ' + employee1After);
    //console.log('Employee 2 After: ' + employee2After);
    console.log('Employee 3 After: ' + employee3After);
    console.log('Employee 4 After: ' + employee4After);

    assert.equal(Number(employee1After.minus(employee1Before)), 100);
    //assert.equal(Number(employee2After.minus(employee2Before)), 150);
    assert.equal(Number(employee3After.minus(employee3Before)), 200);
    assert.equal(Number(employee4After.minus(employee4Before)), 50);
  });

  it('Fail to change other employees address', async() => {
    try{
      //Employee 0 tries to change Employee 1's address
      await payroll.updateAddress(organization, employees[1], web3.eth.accounts[7], {from: employees[0]});
    } catch(e) {
      console.log('Cannot change another employees addres');
    }
  });

  it('Remove employee fail', async() => {
    try{
      await payroll.removeEmployee(organization, employees[2], {from: employer2});
    } catch(e){
      console.log('Remove failed');
    }
  });
  it('Remove employee fail', async() => {
    try{
      await payroll.removeEmployeeKeepOrder(organization, employees[2], {from: employer2});
    } catch(e){
      console.log('Remove failed');
    }
  });
  it('Remove non-existant employee', async() => {
    try{
      await payroll.removeEmployeeKeepOrder(organization, a);
    } catch(e){
      console.log('Remove failed');
    }
  });

  it('Remove employee without maintaining the order', async() => {
    let index = 2;
    await payroll.removeEmployee(organization, employees[index]);
    employees = employees.filter(function(e) { return e !== employees[index] });
    let employeeList = await payroll.listEmployees(organization);

    assert.equal(employees.length, employeeList.length);
    employees.sort();
    employeeList.sort();
    for(var i=0; i<employeeList.length; i++){
      assert.equal(employees[i],employeeList[i]);
    }
  });

  it('Add empty employee address', async() => {
    try{
      await payroll.addEmployee(organization, 0, 50);
    } catch(e){
      console.log('Add failed');
    }
  });

  it('Add empty employee salary', async() => {
    try{
      await payroll.addEmployee(organization, web3.eth.accounts[8], 0);
    } catch(e){
      console.log('Add failed');
    }
  });

  it('Add employee, not owner', async() => {
    try{
      await payroll.addEmployee(organization, web3.eth.accounts[8], 50, {from: employer2});
    } catch(e){
      console.log('Add failed');
    }
  });

  it('Create organization, too many employees', async() => {
    try{
      await token.approve(burner.address, burnFee);
      await payroll.addOrganization('FailCorp', tooManyAddresses, [10,10,10], {from: employer2});
    } catch(e){
      console.log('Create failed');
    }
  });

  it('Create organization, name taken', async() => {
    try{
      await token.approve(burner.address, burnFee);
      await payroll.addOrganization(organization, [employee, employee2], [10,10], {from: employer2});
    } catch(e){
      console.log('Create failed');
    }
  });

  it('Create organization, salary is 0', async() => {
    try{
      await token.approve(burner.address, burnFee);
      await payroll.addOrganization('FailCorp', [employee, employee2], [10,0], {from: employer2});
    } catch(e){
      console.log('Create failed');
    }
  });

  it('Create organization, salary address mismatch', async() => {
    try{
      await token.approve(burner.address, burnFee);
      await payroll.addOrganization('FailCorp', [employee, employee2], [10,10,10], {from: employer2});
    } catch(e){
      console.log('Create failed');
    }
  });

  it('Fail to close contract', async() => {
    try {
      await payroll.closeContract({from: employer2});
    }catch(e) {
      console.log('Only owner may close contract')
    }
  });

  it('Close contract', async() => {
    await payroll.closeContract();
  });

  it('Fail to close contract', async() => {
    try {
      await payroll.closeContract();
    }catch(e) {
      console.log('Contract is already closed');
    }
  });

  it('Fail to create organization', async() => {
    try{
      await token.approve(burner.address, burnFee);
      await payroll.addOrganization('NewOrg', employees, salaries);
    }catch(e){
      console.log('Contract is closed');
    }
  });
});
