export const ABI = [
  {
    constant: false,
    inputs: [
      {
        name: '_organizationName',
        type: 'string',
      },
    ],
    name: 'payEmployees',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_organizationName',
        type: 'string',
      },
      {
        name: '_employee',
        type: 'address',
      },
    ],
    name: 'removeEmployee',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_organizationName',
        type: 'string',
      },
    ],
    name: 'listEmployees',
    outputs: [
      {
        name: '',
        type: 'address[]',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'expired',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [],
    name: 'closeContract',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_organizationName',
        type: 'string',
      },
      {
        name: '_newEmployee',
        type: 'address',
      },
      {
        name: '_salary',
        type: 'uint256',
      },
    ],
    name: 'addEmployee',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'mybFee',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_newFee',
        type: 'uint256',
      },
    ],
    name: 'changeMYBFee',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_organizationName',
        type: 'string',
      },
    ],
    name: 'getTotalPayroll',
    outputs: [
      {
        name: 'totalPayroll',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_organizationName',
        type: 'string',
      },
      {
        name: '_employees',
        type: 'address[]',
      },
      {
        name: '_salaries',
        type: 'uint256[]',
      },
    ],
    name: 'addOrganization',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_organizationName',
        type: 'string',
      },
      {
        name: '_employee',
        type: 'address',
      },
    ],
    name: 'removeEmployeeKeepOrder',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_organizationName',
        type: 'string',
      },
      {
        name: '_oldAddress',
        type: 'address',
      },
      {
        name: '_newAddress',
        type: 'address',
      },
    ],
    name: 'updateAddress',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        name: '_database',
        type: 'address',
      },
      {
        name: '_mybTokenBurner',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: '_employee',
        type: 'address',
      },
      {
        indexed: false,
        name: '_salary',
        type: 'uint256',
      },
      {
        indexed: false,
        name: '_index',
        type: 'uint256',
      },
    ],
    name: 'LogNewEmployee',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: '_id',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: '_creator',
        type: 'address',
      },
    ],
    name: 'LogNewOrganization',
    type: 'event',
  },
];
