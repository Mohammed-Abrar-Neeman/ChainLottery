// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Lottery {
    address public admin;
    uint public drawId;
    
    struct Draw {
        uint ticketPrice;
        uint jackpot;
        uint drawBlock;
        bool isFutureBlockDraw;
        bool completed;
        uint8[6] winningNumbers;
    }
    
    struct Ticket {
        uint8[5] numbers;
        uint8 lottoNumber;
        address buyer;
    }
    
    mapping(uint => Draw) public draws;
    mapping(uint => Ticket[]) public tickets;
    
    event TicketPurchased(address indexed buyer, uint drawId, uint8[5] numbers, uint8 lottoNumber);
    event DrawStarted(uint drawId, uint drawBlock, bool isFutureBlockDraw, uint ticketPrice);
    event DrawCompleted(uint drawId, uint8[6] winningNumbers);
    event PrizeClaimed(address winner, uint amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    function startNewDraw(uint _ticketPrice, bool _isFutureBlockDraw) external onlyAdmin {
        drawId++;
        draws[drawId] = Draw({
            ticketPrice: _ticketPrice,
            jackpot: 0,
            drawBlock: block.number + 5,
            isFutureBlockDraw: _isFutureBlockDraw,
            completed: false,
            winningNumbers: [0, 0, 0, 0, 0, 0]
        });
        emit DrawStarted(drawId, block.number + 5, _isFutureBlockDraw, _ticketPrice);
    }
    
    function buyTicket(uint drawId_, uint8[5] memory numbers, uint8 lottoNumber) external payable {
        require(msg.value == draws[drawId_].ticketPrice, "Incorrect ticket price");
        require(!draws[drawId_].completed, "Draw already completed");
        require(lottoNumber >= 1 && lottoNumber <= 30, "LOTTO number out of range");
        for (uint i = 0; i < 5; i++) {
            require(numbers[i] >= 1 && numbers[i] <= 70, "Number out of range");
        }
        
        tickets[drawId_].push(Ticket(numbers, lottoNumber, msg.sender));
        draws[drawId_].jackpot += (msg.value * 80) / 100;
        payable(admin).transfer((msg.value * 20) / 100);
        
        emit TicketPurchased(msg.sender, drawId_, numbers, lottoNumber);
    }
    
    function completeDrawManually(uint drawId_, uint8[6] memory _winningNumbers) external onlyAdmin {
        require(!draws[drawId_].isFutureBlockDraw, "This draw is using future block hash");
        require(!draws[drawId_].completed, "Draw already completed");
        
        draws[drawId_].winningNumbers = _winningNumbers;
        draws[drawId_].completed = true;
        
        emit DrawCompleted(drawId_, _winningNumbers);
    }
    
    function completeDrawWithBlockHash(uint drawId_) external {
        require(draws[drawId_].isFutureBlockDraw, "This draw requires manual completion");
        require(block.number >= draws[drawId_].drawBlock, "Waiting for the future block");
        require(!draws[drawId_].completed, "Draw already completed");
        
        bytes32 hash = blockhash(draws[drawId_].drawBlock);
        require(hash != 0x0, "Block hash not available");
        
        uint randomNumber = uint(hash);
        for (uint i = 0; i < 5; i++) {
            draws[drawId_].winningNumbers[i] = uint8((randomNumber / (i + 1)) % 70 + 1);
        }
        draws[drawId_].winningNumbers[5] = uint8((randomNumber / 6) % 30 + 1);
        
        draws[drawId_].completed = true;
        
        emit DrawCompleted(drawId_, draws[drawId_].winningNumbers);
    }
    
    function claimPrize(uint drawId_, uint ticketIndex) external {
        require(draws[drawId_].completed, "Draw not yet completed");
        
        Ticket storage ticket = tickets[drawId_][ticketIndex];
        require(ticket.buyer == msg.sender, "Not the ticket owner");
        
        uint prize = getPrizeAmount(drawId_, ticket);
        require(prize > 0, "No winnings");
        
        payable(msg.sender).transfer(prize);
        emit PrizeClaimed(msg.sender, prize);
    }
    
    function getPrizeAmount(uint drawId_, Ticket memory ticket) internal view returns (uint) {
        uint8[6] memory winning = draws[drawId_].winningNumbers;
        uint matchCount = 0;
        for (uint i = 0; i < 5; i++) {
            for (uint j = 0; j < 5; j++) {
                if (ticket.numbers[i] == winning[j]) {
                    matchCount++;
                }
            }
        }
        bool lottoMatch = (ticket.lottoNumber == winning[5]);
        
        if (matchCount == 5 && lottoMatch) return draws[drawId_].jackpot;
        if (matchCount == 5) return (draws[drawId_].jackpot * 1) / 100;
        if (matchCount == 4 && lottoMatch) return (draws[drawId_].jackpot * 1) / 10000;
        if (matchCount == 4) return (draws[drawId_].jackpot * 1) / 100000;
        if (matchCount == 3 && lottoMatch) return (draws[drawId_].jackpot * 1) / 1000000;
        if (matchCount == 3) return 10 ether;
        if (matchCount == 2 && lottoMatch) return 8 ether;
        if (matchCount == 1 && lottoMatch) return 3 ether;
        if (lottoMatch) return 2 ether;
        return 0;
    }


    function getTotalTicketsSold(uint drawId_) external view returns (uint) {
        return tickets[drawId_].length;
    }
}
