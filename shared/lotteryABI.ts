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
        "indexed": false,
        "internalType": "uint256",
        "name": "drawId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "drawBlockNumber",
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
    "name": "DrawFutureBlockStarted",
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
        "internalType": "uint256",
        "name": "drawTime",
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
    "name": "DrawXStarted",
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
    "inputs": [],
    "name": "blockGapInSeconds",
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
      },
      {
        "internalType": "uint256",
        "name": "_blockHash",
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
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "estimatedEndTime",
        "type": "uint256"
      },
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
        "name": "jackpotPaid",
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
    "name": "getCompleted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
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
    "name": "getDrawBlock",
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
        "name": "drawId_",
        "type": "uint256"
      }
    ],
    "name": "getDrawDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "startTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "estimatedEndTime",
            "type": "uint256"
          },
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
            "name": "jackpotPaid",
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
          },
          {
            "internalType": "uint8[6]",
            "name": "winningNumbers",
            "type": "uint8[6]"
          }
        ],
        "internalType": "struct Lottery.Draw",
        "name": "",
        "type": "tuple"
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
    "name": "getDrawStartTime",
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
        "name": "drawId_",
        "type": "uint256"
      }
    ],
    "name": "getEstimatedEndTime",
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
        "name": "drawId_",
        "type": "uint256"
      }
    ],
    "name": "getIsFutureBlockDraw",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
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
    "name": "getJackpot",
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
        "name": "drawId_",
        "type": "uint256"
      }
    ],
    "name": "getJackpotBalance",
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
        "name": "drawId_",
        "type": "uint256"
      }
    ],
    "name": "getJackpotPaid",
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
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getSeriesDrawIdsByIndex",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "getSeriesIndexByName",
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
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getSeriesNameByIndex",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
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
        "internalType": "uint256",
        "name": "ticketIndex",
        "type": "uint256"
      }
    ],
    "name": "getTicketDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8[5]",
            "name": "numbers",
            "type": "uint8[5]"
          },
          {
            "internalType": "uint8",
            "name": "lottoNumber",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "closed",
            "type": "bool"
          }
        ],
        "internalType": "struct Lottery.Ticket",
        "name": "",
        "type": "tuple"
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
    "name": "getTicketPrice",
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
    "inputs": [],
    "name": "getTotalSeries",
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
        "name": "drawId_",
        "type": "uint256"
      }
    ],
    "name": "getTotalWinners",
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
        "name": "seriesIndex",
        "type": "uint256"
      }
    ],
    "name": "getTotalDrawsInSeries",
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
        "internalType": "address",
        "name": "_user",
        "type": "address"
      },
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
    "name": "getUserTicketDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint8[5]",
            "name": "numbers",
            "type": "uint8[5]"
          },
          {
            "internalType": "uint8",
            "name": "lottoNumber",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "closed",
            "type": "bool"
          }
        ],
        "internalType": "struct Lottery.Ticket",
        "name": "",
        "type": "tuple"
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
    "name": "getUserTickets",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
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
    "name": "getUserTicketsCount",
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
        "name": "drawId_",
        "type": "uint256"
      }
    ],
    "name": "getWinningNumbers",
    "outputs": [
      {
        "internalType": "uint8[6]",
        "name": "",
        "type": "uint8[6]"
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
    "name": "getWinners",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "winnerAddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amountWon",
            "type": "uint256"
          }
        ],
        "internalType": "struct Lottery.winner[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "newSeries",
    "outputs": [],
    "stateMutability": "nonpayable",
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
        "internalType": "uint256",
        "name": "_initialJackpot",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_drawBlockNumber",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_seriesIndex",
        "type": "uint256"
      }
    ],
    "name": "startNewFutureBlockDraw",
    "outputs": [],
    "stateMutability": "nonpayable",
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
        "internalType": "uint256",
        "name": "_initialJackpot",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_drawTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_seriesIndex",
        "type": "uint256"
      }
    ],
    "name": "startNewXDraw",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "seriesList",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "seriesCount",
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
        "name": "seriesIndex",
        "type": "uint256"
      }
    ],
    "name": "getSeriesDrawCount",
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
        "name": "seriesIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "drawIndex",
        "type": "uint256"
      }
    ],
    "name": "getDrawId",
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
        "name": "drawId",
        "type": "uint256"
      }
    ],
    "name": "getDrawSeries",
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
        "name": "newGap",
        "type": "uint256"
      }
    ],
    "name": "updateBlockGap",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "winners",
    "outputs": [
      {
        "internalType": "address",
        "name": "winnerAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amountWon",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
