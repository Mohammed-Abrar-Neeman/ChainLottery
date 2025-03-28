export const lotteryABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "drawId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "drawBlock",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isFutureBlockDraw",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ticketPrice",
        "type": "uint256"
      }
    ],
    "name": "DrawStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "drawId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8[6]",
        "name": "winningNumbers",
        "type": "uint8[6]"
      }
    ],
    "name": "DrawCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "PrizeClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "drawId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8[5]",
        "name": "numbers",
        "type": "uint8[5]"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "lottoNumber",
        "type": "uint8"
      }
    ],
    "name": "TicketPurchased",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "drawId_",
        "type": "uint256"
      },
      {
        "internalType": "uint8[5]",
        "name": "numbers",
        "type": "uint8[5]"
      },
      {
        "internalType": "uint8",
        "name": "lottoNumber",
        "type": "uint8"
      }
    ],
    "name": "buyTicket",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "drawId_",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ticketIndex",
        "type": "uint256"
      }
    ],
    "name": "claimPrize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "drawId_",
        "type": "uint256"
      }
    ],
    "name": "completeDrawWithBlockHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "drawId_",
        "type": "uint256"
      },
      {
        "internalType": "uint8[6]",
        "name": "_winningNumbers",
        "type": "uint8[6]"
      }
    ],
    "name": "completeDrawManually",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "drawId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "draws",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "ticketPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "jackpot",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "drawBlock",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isFutureBlockDraw",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "completed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "drawId_",
        "type": "uint256"
      }
    ],
    "name": "getTotalTicketsSold",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_ticketPrice",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isFutureBlockDraw",
        "type": "bool"
      }
    ],
    "name": "startNewDraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
