# Ethereum Payroll
The Payroll Dapp allows companies to send ETH to a contract which authorized employees can withdraw their income. 


### Documentation 


### Testing 
* In the terminal run `ganache-cli`  (use -a flag to specify number of accounts ie. -a 20) 
* Open another terminal window and navigate to Contracts/test 
* run `truffle test testFileName.js` 
* NOTE: Make sure bignumber.js is installed.  `npm install bignumber.js`

### Compiling 
* In the terminal run `ganache-cli`  
* In another terminal navigate to /Contracts 
* run `truffle compile` 

### Dependencies 
* bignumber.js   `npm install bignumber.js`
* solidity-docgen  `npm install solidity-docgen`
