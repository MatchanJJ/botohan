//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Botohan
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const botohanAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [
      { name: 'pollId', internalType: 'uint256', type: 'uint256' },
      { name: 'voters', internalType: 'address[]', type: 'address[]' },
    ],
    name: 'addVoters',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'pollId', internalType: 'uint256', type: 'uint256' }],
    name: 'closePoll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'title', internalType: 'string', type: 'string' },
      { name: 'options', internalType: 'string[]', type: 'string[]' },
      { name: 'startsAt', internalType: 'uint64', type: 'uint64' },
      { name: 'endsAt', internalType: 'uint64', type: 'uint64' },
      { name: 'restricted', internalType: 'bool', type: 'bool' },
    ],
    name: 'createPoll',
    outputs: [{ name: 'pollId', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'pollId', internalType: 'uint256', type: 'uint256' }],
    name: 'getPoll',
    outputs: [
      {
        name: '',
        internalType: 'struct Botohan.Poll',
        type: 'tuple',
        components: [
          { name: 'title', internalType: 'string', type: 'string' },
          { name: 'options', internalType: 'string[]', type: 'string[]' },
          { name: 'startsAt', internalType: 'uint64', type: 'uint64' },
          { name: 'endsAt', internalType: 'uint64', type: 'uint64' },
          { name: 'restricted', internalType: 'bool', type: 'bool' },
          { name: 'totalVotes', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'pollId', internalType: 'uint256', type: 'uint256' }],
    name: 'getResults',
    outputs: [
      { name: 'results', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pollId', internalType: 'uint256', type: 'uint256' },
      { name: 'voter', internalType: 'address', type: 'address' },
    ],
    name: 'hasVoted',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pollId', internalType: 'uint256', type: 'uint256' },
      { name: 'voter', internalType: 'address', type: 'address' },
    ],
    name: 'isAllowed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pollCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'pollId', internalType: 'uint256', type: 'uint256' }],
    name: 'status',
    outputs: [{ name: '', internalType: 'enum Botohan.Status', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pollId', internalType: 'uint256', type: 'uint256' },
      { name: 'option', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pollId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'closedAt',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'PollClosed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pollId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'title', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'optionCount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'startsAt',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
      {
        name: 'endsAt',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
      {
        name: 'restricted',
        internalType: 'bool',
        type: 'bool',
        indexed: false,
      },
    ],
    name: 'PollCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pollId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'voter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'option',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'VoteCast',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'pollId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'count',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'VotersAdded',
  },
  {
    type: 'error',
    inputs: [{ name: 'voter', internalType: 'address', type: 'address' }],
    name: 'AlreadyVoted',
  },
  {
    type: 'error',
    inputs: [{ name: 'option', internalType: 'uint256', type: 'uint256' }],
    name: 'InvalidOption',
  },
  { type: 'error', inputs: [], name: 'InvalidOptions' },
  { type: 'error', inputs: [], name: 'InvalidSchedule' },
  { type: 'error', inputs: [], name: 'InvalidTitle' },
  {
    type: 'error',
    inputs: [{ name: 'voter', internalType: 'address', type: 'address' }],
    name: 'NotAllowed',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [{ name: 'pollId', internalType: 'uint256', type: 'uint256' }],
    name: 'PollNotFound',
  },
  {
    type: 'error',
    inputs: [{ name: 'pollId', internalType: 'uint256', type: 'uint256' }],
    name: 'PollNotOpen',
  },
  { type: 'error', inputs: [], name: 'TooManyVoters' },
] as const
