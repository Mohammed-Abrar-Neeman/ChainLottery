// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Lottery {
    address public admin;
    uint public drawId;
    uint256 public blockGapInSeconds = 12;

    struct series {
        string name;
        uint[] drawIds;
    }

    series[] public seriesList;
    mapping(string => uint) seriesNameToIndex;
    
    struct Draw {
        uint startTime;
        uint estimatedEndTime;
        uint ticketPrice;
        uint jackpot;
        uint jackpotPaid;
        uint drawBlock;
        bool isFutureBlockDraw;
        bool completed;

        uint8[6] winningNumbers;
    }
    
    struct Ticket {
        uint8[5] numbers;
        uint8 lottoNumber;
        address buyer;
        bool closed;
    }

    struct winner{
        address winnerAddress;
        uint amountWon;
    }

    mapping(uint => winner[]) public winners; // drawId => winner
    
    mapping(uint => Draw) public draws;
    mapping(uint => Ticket[]) public tickets;
    mapping(address => mapping(uint => uint[])) public userTickets; // user address => drawId => ticket index

    event TicketPurchased(address indexed buyer, uint drawId, uint8[5] numbers, uint8 lottoNumber);
    event DrawXStarted(uint drawId, uint drawTime, bool isFutureBlockDraw, uint ticketPrice);
    event DrawFutureBlockStarted(uint drawId, uint blockNumber, bool isFutureBlockDraw, uint ticketPrice);
    event DrawCompleted(uint drawId, uint8[6] winningNumbers);
    event PrizeClaimed(address winner, uint amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }

    function updateBlockGap(uint256 newGap) external onlyAdmin {
        require(newGap > 0, "Block gap must be greater than zero");
        blockGapInSeconds = newGap;
    }

    function newSeries(string memory name) external onlyAdmin {
        require(seriesNameToIndex[name] == 0, "Series already exists");
        seriesList.push(series(name, new uint[](0)));
        seriesNameToIndex[name] = seriesList.length;
    }

    function startNewXDraw(uint _ticketPrice,uint _initialJackpot, uint _drawTime, uint _seriesIndex) external onlyAdmin {
        require(_drawTime > block.timestamp, "Draw time must be in the future");
        require(_ticketPrice > 0, "Ticket price must be greater than zero");
        require(_seriesIndex < seriesList.length, "Invalid series index");
        require(_seriesIndex >= 0, "Invalid series index");
        drawId++;
        seriesList[_seriesIndex].drawIds.push(drawId);
        draws[drawId] = Draw({
            startTime: block.timestamp,
            estimatedEndTime: _drawTime,
            ticketPrice: _ticketPrice,
            jackpot: _initialJackpot,
            jackpotPaid: 0,
            drawBlock: 0,
            isFutureBlockDraw: false,
            completed: false,
            winningNumbers: [0, 0, 0, 0, 0, 0]
        });
        emit DrawXStarted(drawId, _drawTime, false, _ticketPrice);
    }

    function startNewFutureBlockDraw(uint _ticketPrice,uint _initialJackpot,  uint _drawBlockNumber, uint _seriesIndex) external onlyAdmin {
        require(_drawBlockNumber > block.number + 100, "Draw time must after 100 blocks ahead");
        require(_ticketPrice > 0, "Ticket price must be greater than zero");
        require(_seriesIndex < seriesList.length, "Invalid series index");
        require(_seriesIndex >= 0, "Invalid series index");
        drawId++;
        seriesList[_seriesIndex].drawIds.push(drawId);
        draws[drawId] = Draw({
            startTime: block.timestamp,
            estimatedEndTime: getBlockTime(_drawBlockNumber),
            ticketPrice: _ticketPrice,
            jackpot: _initialJackpot,
            jackpotPaid: 0,
            drawBlock: 0,
            isFutureBlockDraw: false,
            completed: false,
            winningNumbers: [0, 0, 0, 0, 0, 0]
        });
        emit DrawXStarted(drawId, _drawBlockNumber, false, _ticketPrice);
    }

    function buyTicket(uint drawId_, uint8[5] memory numbers, uint8 lottoNumber) external payable {
        require(msg.value == draws[drawId_].ticketPrice, "Incorrect ticket price");
        require(!draws[drawId_].completed, "Draw already completed");
        require(lottoNumber >= 1 && lottoNumber <= 30, "LOTTO number out of range");
        for (uint i = 0; i < 5; i++) {
            require(numbers[i] >= 1 && numbers[i] <= 70, "Number out of range");
        }
        
        tickets[drawId_].push(Ticket(numbers, lottoNumber, msg.sender, false));
        userTickets[msg.sender][drawId_].push(tickets[drawId_].length - 1);
        draws[drawId_].jackpot += (msg.value * 80) / 100;
        payable(admin).transfer((msg.value * 20) / 100);
        
        emit TicketPurchased(msg.sender, drawId_, numbers, lottoNumber);
    }


    function getBlockTime(uint256 futureBlockNumber) internal view returns (uint256) {
        require(futureBlockNumber > block.number, "Future block must be ahead of the current block");

        uint256 currentTimestamp = block.timestamp;
        uint256 currentBlockNumber = block.number;

        uint256 blocksAhead = futureBlockNumber - currentBlockNumber;
        uint256 estimatedTimestamp = currentTimestamp + (blocksAhead * blockGapInSeconds);

        return estimatedTimestamp;
    }

    function completeDrawManually(uint drawId_, uint8[6] memory _winningNumbers) external onlyAdmin {
        require(!draws[drawId_].isFutureBlockDraw, "This draw is using future block hash");
        require(!draws[drawId_].completed, "Draw already completed");
        
        draws[drawId_].winningNumbers = _winningNumbers;
        draws[drawId_].completed = true;
        
        emit DrawCompleted(drawId_, _winningNumbers);
    }
    
    function completeDrawWithBlockHash(uint drawId_, uint _blockHash) external onlyAdmin(){
        require(draws[drawId_].isFutureBlockDraw, "This draw requires manual completion");
        require(block.number >= draws[drawId_].drawBlock, "Waiting for the future block");
        require(!draws[drawId_].completed, "Draw already completed");

        require(_blockHash != 0x0, "Block hash not available");
        
        uint randomNumber = uint(_blockHash);
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
        require(!ticket.closed, "Ticket already claimed");
        require(ticketIndex < tickets[drawId_].length, "Invalid ticket index");
        require(ticket.buyer == msg.sender, "Not the ticket owner");
        
        uint prize = getPrizeAmount(drawId_, ticket);
        if(prize > 0){
            draws[drawId_].jackpotPaid += prize; 
            winners[drawId_].push(winner(msg.sender, prize));           
            payable(msg.sender).transfer(prize);
            emit PrizeClaimed(msg.sender, prize);
        }
        ticket.closed = true; // Close ticket claim

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

    //total ticket sold for particular drawId
    function getTotalTicketsSold(uint drawId_) external view returns (uint) {
        return tickets[drawId_].length;
    }

    //indexes of each ticket bought by user for particular drawId
    function getUserTickets(uint drawId_) external view returns (uint[] memory) {
        return userTickets[msg.sender][drawId_];
    }

    //get all the details of a drawId
    function getDrawDetails(uint drawId_) external view returns (Draw memory) {
        return draws[drawId_];
    } 
    //get all the details of a ticket for a particular drawId  
    function getTicketDetails(uint drawId_, uint ticketIndex) external view returns (Ticket memory) {
        return tickets[drawId_][ticketIndex];
    }
    //get winning numbers of a drawId
    function getWinningNumbers(uint drawId_) external view returns (uint8[6] memory) {
        return draws[drawId_].winningNumbers;
    }
    //get jackpot amount of a drawId
    function getJackpot(uint drawId_) external view returns (uint) {
        return draws[drawId_].jackpot;
    }
    //get ticket price of a drawId
    function getTicketPrice(uint drawId_) external view returns (uint) {
        return draws[drawId_].ticketPrice;
    }
    //get start time of a drawId
    function getDrawStartTime(uint drawId_) external view returns (uint) {
        return draws[drawId_].startTime;
    }
    //get estimated end time of a drawId
    function getEstimatedEndTime(uint drawId_) external view returns (uint) {
        return draws[drawId_].estimatedEndTime;
    }
    //get draw block of a drawId
    function getDrawBlock(uint drawId_) external view returns (uint) {
        return draws[drawId_].drawBlock;
    }
    //get if the draw is a future block draw
    function getIsFutureBlockDraw(uint drawId_) external view returns (bool) {
        return draws[drawId_].isFutureBlockDraw;
    }
    //get if the draw is completed
    function getCompleted(uint drawId_) external view returns (bool) {
        return draws[drawId_].completed;
    }
    //get the number of tickets bought by a user for a particular drawId
    function getUserTicketsCount(uint drawId_) external view returns (uint) {
        return userTickets[msg.sender][drawId_].length;
    }
    //get the details of a ticket bought by a user for a particular drawId
    function getUserTicketDetails(address _user, uint drawId_, uint ticketIndex) external view returns (Ticket memory) {
        return tickets[drawId_][userTickets[_user][drawId_][ticketIndex]];
    }
    function getSeriesIndexByName(string memory name) external view returns (uint) {
        return seriesNameToIndex[name]-1;
    }
    function getSeriesNameByIndex(uint index) external view returns (string memory) {
        require(index < seriesList.length, "Invalid series index");
        return seriesList[index].name;
    }
    function getSeriesDrawIdsByIndex(uint index) external view returns (uint[] memory) {
        require(index < seriesList.length, "Invalid series index");
        return seriesList[index].drawIds;
    }

    function getWinners(uint drawId_) external view returns (winner[] memory) {
        return winners[drawId_];
    }

    function getJackpotBalance(uint drawId_) external view returns (uint) {
        return draws[drawId_].jackpot - draws[drawId_].jackpotPaid;
    }

    function getTotalWinners(uint drawId_) external view returns (uint) {
        return winners[drawId_].length;
    }
    function getTotalSeries() external view returns (uint) {
        return seriesList.length;
    }
    function getTotalDrawsInSeries(uint seriesIndex) external view returns (uint) {
        require(seriesIndex < seriesList.length, "Invalid series index");
        return seriesList[seriesIndex].drawIds.length;
    }
    function getJackpotPaid(uint drawId_) external view returns (uint) {
        return draws[drawId_].jackpotPaid;
    }
}
