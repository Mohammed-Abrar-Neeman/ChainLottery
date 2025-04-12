/**
 *Submitted for verification at opbnb-testnet.bscscan.com on 2025-04-05
*/

/// SPDX-License-Identifier: MIT
// File: @openzeppelin/contracts/utils/math/SafeMath.sol

// OpenZeppelin Contracts (last updated v4.9.0) (utils/math/SafeMath.sol)

pragma solidity ^0.8.0;

// CAUTION
// This version of SafeMath should only be used with Solidity 0.8 or later,
// because it relies on the compiler's built in overflow checks.

/**
 * @dev Wrappers over Solidity's arithmetic operations.
 *
 * NOTE: `SafeMath` is generally not needed starting with Solidity 0.8, since the compiler
 * now has built in overflow checking.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) return (true, 0);
            uint256 c = a * b;
            if (c / a != b) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator.
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}

// File: @openzeppelin/contracts/token/ERC20/IERC20.sol

// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

// File: @openzeppelin/contracts/utils/Context.sol

// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

// File: @openzeppelin/contracts/access/Ownable.sol

// OpenZeppelin Contracts (last updated v4.7.0) (access/Ownable.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// File: Rabito.sol

pragma solidity ^0.8 .0;

// package purchase fee
// admin wallet reawrd transfer
contract Cheetha_Test_A5April is Ownable {

    // IERC20 token = IERC20(0xc2132D05D31c914a87C6611C10748AEb04B58e8F); //mainnet
    // IERC20 rewardToken = IERC20(0xFe777Dc834BE3C4B77Bba89A2A13518a92c6770b); //mainnet

    IERC20 token = IERC20(0xc2132D05D31c914a87C6611C10748AEb04B58e8F); //mainnet
    IERC20 rewardToken = IERC20(0xFe777Dc834BE3C4B77Bba89A2A13518a92c6770b); //mainnet

    // uint256 private constant TOKENS_PER_INTERVAL = 5 * 10**16; // 1 token per interval, adjust for your token's decimals
    // uint256 private constant DISTRIBUTION_INTERVAL = 5 minutes;
    // uint256 private constant DISTRIBUTION_DURATION = 20 minutes;
    // uint256 private constant DISTRIBUTION_END = 4;
    uint[] public packages = [10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120];
    uint[] public ADAmount = [
        10,
        20,
        40,
        80,
        160,
        320,
        640,
        1280,
        2560,
        5120
    ];
    struct UserRoi {
        uint256 registrationDateInitial;
        uint256 registrationDate;
        uint256 tokensClaimed;
    }
    uint256 tokenprice = 1 ether;
    mapping(address => UserRoi) public UserRois;
    mapping(address => uint) public totalCHT;
    uint public dir_number = 30;
    struct User {
        uint userId;
        address userAddress;
        uint parent;
        uint[] direct;
        uint nonWorkingIncome;
        uint nonWorkingContainerIncome;
        uint[] package;
        uint[10] Ptimestamp;
        uint timestamp;
    }
    struct UserIncome {
        address userAddress;
        uint userPackage;
        uint income;
        uint timeStamp;
    }
    struct UserSpot {
        address userAddress;
        uint userPackage;
        uint income;
        uint spot;
        uint timeStamp;
    }
    struct DrainBonus {
        uint userPackage;
        uint incomeType;
        uint income;
        uint timeStamp;
    }
    struct Withdrawal {
        uint amount;
        uint timeStamp;
    }

    mapping(address => uint) public userId;
    mapping(uint => address) public userIdtoAddress;
    mapping(address => address) public referal;
    mapping(address => uint256) public whitelist;

    uint ids = 1;
    uint idsReg = 1;
    uint idsPack = 2;
    uint idsDirect = 2;

    mapping(address => uint) public maxReward;
    mapping(address => uint) public maxRewardActivation;
    mapping(address => uint) public maxReward5;
    mapping(address => uint) public maxRewardActivationS5;
    struct IncomeData {
        uint direct;
        uint missDirect;
        UserIncome[] directData;
        UserIncome[] missDirectData;
        // mapping(uint => UserIncome) directData;
        // mapping(uint => UserIncome) missDirectData;
        uint[10] spots;
        UserSpot[] spotData;
        UserSpot[] missSpotData;
        uint[10] missSpots;
        uint[][] reward;
        uint drainBonus;
        uint missDrainBonus;
        DrainBonus[] drainIncome;
        DrainBonus[] missDrainIncome;
        uint totalWithdrawal;
        Withdrawal[] withdrawals;
    }
    mapping(uint => uint[10][10]) public spots;
    mapping(address => bool) public isRegistered;
    mapping(uint => IncomeData) public incomes;
    address public sysWallet;
    // Declare a mapping to store users
    mapping(uint => User) public users;
    uint public minLimit = 2000000;

    event globalEv(address userscount,uint amounttodistributed);
    event Registered(address user, uint user_id, address  referrer);
    event buy_dtl(address user,uint pkg_id, uint256 amount);
    event drainIncomeEv(address user,uint useridi, uint income);
    event missDrainIncomeEv(address user,uint useridi, uint income);
    event directIncomeEv(address user,uint useridi, uint income);
    event missDirectIncomeEv(address user,uint useridi, uint income);
    event spotIncomeEv(address user,uint useridi, uint income);
    event missSpotIncomeEv(address user,uint useridi, uint income);

    function getuserReward(uint i) public view returns (uint[][] memory) {
        return (incomes[i].reward);
    }
    function changeLimit(uint _setLimit) public onlyOwner {
        minLimit = _setLimit;
    }
    function getDataDirect(uint i) public view returns (uint) {
        return (incomes[i].direct);
    }

    function getuserPackages(uint i) public view returns (uint[] memory) {
        return (users[i].package);
    }

    function getuserPackagesTime(uint i) public view returns (uint[10] memory) {
        return (users[i].Ptimestamp);
    }

    function Allpackages() public view returns (uint[] memory) {
        return packages;
    }

    function getDataMissed(uint i) public view returns (uint) {
        return (incomes[i].missDirect);
    }

    function getDrainIncome(uint i) public view returns (uint) {
        return (incomes[i].drainBonus);
    }

    function getMissedDrainIncome(uint i) public view returns (uint) {
        return (incomes[i].missDrainBonus);
    }

    function getDrainData(uint i) public view returns (DrainBonus[] memory) {
        return (incomes[i].drainIncome);
    }

    function getMissedDrainData(
        uint i
    ) public view returns (DrainBonus[] memory) {
        return (incomes[i].missDrainIncome);
    }

    function getDataDirectData(
        uint i
    ) public view returns (UserIncome[] memory) {
        return (incomes[i].directData);
    }

    function getDataMissedDirectData(
        uint i
    ) public view returns (UserIncome[] memory) {
        return (incomes[i].missDirectData);
    }

    function getSpots(uint j) public view returns (uint[10][10] memory) {
        return (spots[j]);
    }

    function getSpotsIncome(uint i, uint j) public view returns (uint) {
        return (incomes[i].spots[j]);
    }

    function getSpotsData(uint i) public view returns (UserSpot[] memory) {
        return (incomes[i].spotData);
    }

    function getMissedSpotsIncome(uint i, uint j) public view returns (uint) {
        return (incomes[i].missSpots[j]);
    }

    function getMissedSpotsIncomeData(
        uint i
    ) public view returns (UserSpot[] memory) {
        return (incomes[i].missSpotData);
    }
    constructor() {
        // Initialize a user for the contract deployer (you can call this function as needed)

        User memory newUser;
        sysWallet = msg.sender;
        newUser.userId = ids;
        newUser.userAddress = sysWallet;
        newUser.parent = 0;
        // newUser.direct = 0;
        newUser.package = new uint[](10); // Initialize a dynamic-size array
        referal[sysWallet] = sysWallet;
        userIdtoAddress[1] = sysWallet;
        userId[sysWallet] = ids;
        isRegistered[sysWallet] = true;
        // Set the values individually
        newUser.package[0] = 5;
        newUser.package[1] = 10;
        newUser.package[2] = 20;
        newUser.package[3] = 40;
        newUser.package[4] = 80;
        newUser.package[5] = 160;
        newUser.package[6] = 320;
        newUser.package[7] = 640;
        newUser.package[8] = 1280;
        newUser.package[9] = 2560;
        // UserIncome [] memory empty;
        newUser.timestamp = block.timestamp;

        users[ids] = newUser;
        incomes[ids].direct = 0;
        incomes[ids].missDirect = 0;
        uint[] memory empty;
        for (uint i = 0; i < 10; i++) {
            incomes[ids].reward.push(empty);
        }
        uint[10][10] memory empty2;
        spots[ids] = empty2;
        maxReward[address(this)] = 100000000;
        maxRewardActivation[address(this)] = 100000000;
        maxReward5[address(this)] = 100000000;
        maxRewardActivationS5[address(this)] = 100000000;
    }

    function setTokenAddress(address _tokenAddress) public onlyOwner {
        token = IERC20(_tokenAddress);
    }

    function setRewardTokenAddress(
        address _rewardTokenAddress
    ) public onlyOwner {
        rewardToken = IERC20(_rewardTokenAddress);
    }

    function userDirectFetch(uint id) public view returns (uint[] memory) {
        return users[id].direct;
    }
    // function updateUserLevel(address userAddress) internal {
    //     address parent = referal[userAddress];
    //     while (parent != address(0)) {
    //         users[userId[parent]].teams += 1;
    //         parent = referal[parent];
    //     }
    // }
    function addresswhitellist(
        address user,
        uint packageIndex
    ) public onlyOwner {
        //whitelist
        whitelist[user] = packageIndex;
    }
    // function calculateWithdrawableTokens(address user) public view returns (uint256) {
    //     UserRoi memory userInfo = UserRois[user];

    //     // Ensure user is registered and the registrationDate has started.
    //     if (userInfo.registrationDateInitial == 0 || userInfo.registrationDate == 0) {
    //         return 0;
    //     }

    //     // Calculate the time elapsed since the user's registrationDate up to a maximum of 20 minutes.
    //     uint256 timeSinceRegistrationStart = userInfo.registrationDate > userInfo.registrationDateInitial
    //         ? userInfo.registrationDate - userInfo.registrationDateInitial
    //         : 0;
    //     uint256 effectiveStartTime = block.timestamp > userInfo.registrationDate
    //         ? block.timestamp - userInfo.registrationDate
    //         : 0;
    //     uint256 timeElapsedSinceEffectiveStart = effectiveStartTime > timeSinceRegistrationStart
    //         ? effectiveStartTime - timeSinceRegistrationStart
    //         : 0;

    //     // Adjust for the total accumulation period ending at 20 minutes from registrationDateInitial.
    //     uint256 totalAccumulationTime = block.timestamp - userInfo.registrationDateInitial;
    //     if (totalAccumulationTime > 365 days) {
    //         totalAccumulationTime = 365 days;
    //     }

    //     // Calculate intervals passed since registrationDate, considering the 20-minute cap.
    //     uint256 intervalsPassed = (totalAccumulationTime > timeSinceRegistrationStart
    //         ? totalAccumulationTime - timeSinceRegistrationStart
    //         : 0) / DISTRIBUTION_INTERVAL;
    //      uint256 userIndex = userId[user]; // Get user index from their address
    //         uint[] memory packagess = getuserPackages(userIndex); // Get user packages using their index
    //         if (packagess.length == 0) {
    //             return 0; // Return 0 if user has no packages
    //         }
    //     // Calculate total accumulated tokens.
    //         uint256 totalAccumulatedTokens =intervalsPassed * packagess[packagess.length - 1] * 10 ** 16; // Calculate total tokens
    //     // Calculate withdrawable tokens.
    //     uint256 withdrawableTokens = totalAccumulatedTokens - userInfo.tokensClaimed;

    //     return withdrawableTokens;
    // }

    function random(
        uint maxNumber,
        uint minNumber,
        uint newInt
    ) public view returns (uint amount) {
        amount =
            uint(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        msg.sender,
                        (block.number + newInt)
                    )
                )
            ) %
            (maxNumber - minNumber);
        amount = amount + minNumber;
        return amount;
    }

    function distributeDrainIncome(
        uint package,
        uint minAmt,
        uint maxAmt,
        uint fromId,
        uint toId
    ) external onlyOwner {
        require((toId - fromId) <= 100, "Invalid Id Range");
        for (uint i = fromId; i <= toId; i++) {
            uint sendIncome = random(maxAmt, minAmt, i);
            if (users[i].package.length >= package) {
                incomes[i].drainBonus += sendIncome;
                DrainBonus memory dbIncome;

                dbIncome.income = sendIncome;
                dbIncome.incomeType = 4;
                dbIncome.userPackage = package;
                dbIncome.timeStamp = block.timestamp;
                incomes[i].drainIncome.push(dbIncome);
                users[i].nonWorkingIncome += sendIncome;
                emit drainIncomeEv(userIdtoAddress[i],i,sendIncome);
            } else if (users[i].userId != 0) {
                incomes[i].missDrainBonus += sendIncome;

                DrainBonus memory dbIncome;

                dbIncome.income = sendIncome;
                dbIncome.incomeType = 4;
                dbIncome.userPackage = package;
                dbIncome.timeStamp = block.timestamp;
                incomes[i].missDrainIncome.push(dbIncome);
                emit missDrainIncomeEv(userIdtoAddress[i],i,sendIncome);
            }
        }
    }

    function changeDirect_number(uint _numberOfDirect) public onlyOwner {
        dir_number = _numberOfDirect;
    }
    function register(address _referal) public {
        // condition for user exists
        // condition for parent exist
        // isRegister condition pending
        require(
            isRegistered[msg.sender] == false,
            "You are already registered !"
        );
        require(
            users[userId[_referal]].package.length > 0,
            "Referal is not valid !"
        );
        require(referal[_referal] != address(0), "Referal is not valid !");
        ids++;
        userId[msg.sender] = ids;
        userIdtoAddress[ids] = msg.sender;
        /// Reward token transfer to user
        if (token.balanceOf(address(this)) >= 100 * 10 ** 18) {
            uint ada = ADAmount[0];
            if (ids <= 5000 && maxReward[address(this)] <= 100000000) {
                maxReward[address(this)] -= ada;
                totalCHT[msg.sender] += ada * 10 ** 18;
            } else if (maxReward[address(this)] >= 100 && ids >= 5000) {
                maxReward[address(this)] -= ada / 2;
                totalCHT[msg.sender] += ada / 2 * 10 ** 18;
            }
        }

        isRegistered[msg.sender] = true;

        referal[msg.sender] = _referal;
        User memory newUser;
        uint[] memory empty;
        newUser.userId = ids;
        newUser.userAddress = msg.sender;
        newUser.parent = userId[_referal];
        // newUser.direct = 0;
        newUser.package = empty; // Initialize a dynamic-size array
        newUser.timestamp = block.timestamp;
        // Set the values individually

        users[ids] = newUser;
        incomes[ids].direct = 0;
        incomes[ids].missDirect = 0;

        for (uint i = 0; i < 10; i++) {
            incomes[ids].reward.push(empty);
        }
        uint[10][10] memory empty2;
        spots[ids] = empty2;

        emit Registered(msg.sender, ids, _referal);
    }

    function parents(
        uint userId,
        uint level
    ) public view returns (User memory) {
        if (userId == 1) {
            return users[userId];
        }
        uint p = users[users[userId].parent].userId;
        if (p == 1 || level <= 1) {
            return users[users[userId].parent];
        } else {
            return parents(p, --level);
        }
    }

    function approvalAmount(uint package) public view returns (uint) {
        uint amountofPackage;
        uint usersPackage = users[userId[msg.sender]].package.length;
        for (uint i = usersPackage; i < package; i++) {
            amountofPackage += packages[i];
        }
        return amountofPackage;
    }

    function buyPackage(uint package) public returns (bool) {
        require(isRegistered[msg.sender] == true, "user not exist !");
        require(package >= 1, "Enter correct package !");
        require(package <= packages.length, "Enter correct package !");
        if (package < 1 || package > packages.length) {
            return false;
        }
        uint usersPackage = users[userId[msg.sender]].package.length;
        require(package > usersPackage, "you already have this package !");
        if (package <= usersPackage) {
            return false;
        }

        uint amountofPackage;
        uint extraAddOn;
        for (uint i = usersPackage; i < package; i++) {
            amountofPackage += packages[i];
            extraAddOn += (2 ** i);
        }
        uint amountP = amountofPackage * 10 ** 6;
        amountofPackage = extraAddOn * 10 ** 6;
        amountofPackage = amountP + amountofPackage;
        if (whitelist[msg.sender] < package) {
            require(
                token.transferFrom(msg.sender, address(this), amountofPackage),
                "Token transfer failed"
            );
            for (uint i = usersPackage; i < package; i++) {
                uint ada = ADAmount[0];
                if (i == 0) {
                    require(
                        token.transfer(msg.sender, (2 ** i) * 10 ** 6),
                        "Token transfer failed"
                    );
                    maxReward[address(this)] -= ada;
                    totalCHT[msg.sender] += ada * 10 ** 18;
                } else {
                    require(
                        token.transfer(sysWallet, (2 ** i) * 10 ** 6),
                        "Token transfer failed"
                    );
                    maxReward[address(this)] -= ada;
                    totalCHT[msg.sender] += ada * 10 ** 18;
                }
            }
        }
        if (getuserPackages(userId[msg.sender]).length <= 0) {
            idsReg += 1;
            UserRois[msg.sender].registrationDateInitial = block.timestamp;
        }

        if (usersPackage <= 0) {
            users[userId[referal[msg.sender]]].direct.push(userId[msg.sender]);
            // updateUserLevel(msg.sender);
        }
        for (uint i = usersPackage; i < package; i++) {
            uint uPackage = packages[i];
            users[userId[msg.sender]].package.push(uPackage);
            users[userId[msg.sender]].Ptimestamp[i] = block.timestamp;

            if (whitelist[msg.sender] < package) {
                uint randomNumber = (uint(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            block.difficulty,
                            msg.sender
                        )
                    )
                ) % 5) + 5;

                uint packagebonus = randomNumber * uPackage * 10 ** 4;

                incomes[userId[msg.sender]].drainBonus += packagebonus;

                DrainBonus memory dbIncome;

                dbIncome.income = packagebonus;
                dbIncome.incomeType = 3;
                dbIncome.userPackage = packages[i];
                dbIncome.timeStamp = block.timestamp;
                incomes[userId[msg.sender]].drainIncome.push(dbIncome);

                users[userId[msg.sender]].nonWorkingIncome += packagebonus;
            }

            uint income = (25 * uPackage * 10 ** 6) / 100;
            address parrent = msg.sender;

            for (uint s = 1; s <= 5; s++) {
                User memory parent = users[users[userId[parrent]].parent];
                if (parent.userId == 1) {
                    break;
                }

                if (
                    parent.package.length == 0 || parent.package.length - 1 < i
                ) {
                    incomes[parent.userId].missDirect += income; // admin laps income here
                    UserIncome memory newIncome;
                    newIncome.userAddress = msg.sender;
                    newIncome.userPackage = uPackage;
                    newIncome.income = income;
                    newIncome.timeStamp = block.timestamp;
                    incomes[parent.userId].missDirectData.push(newIncome);
                    emit missDirectIncomeEv(userIdtoAddress[parent.userId],parent.userId,income);
                    parrent = parent.userAddress;
                } else {
                    incomes[parent.userId].direct += income; // direct income here to user
                    UserIncome memory newIncome;
                    newIncome.userAddress = msg.sender;
                    newIncome.userPackage = uPackage;
                    newIncome.income = income;
                    newIncome.timeStamp = block.timestamp;
                    incomes[parent.userId].directData.push(newIncome);
                    emit directIncomeEv(userIdtoAddress[parent.userId],parent.userId,income);
                    if (whitelist[msg.sender] < package) {
                        token.transfer(parent.userAddress, ((8 * income) / 10)); // here  distribute direct income
                    }

                    DrainIncome(income, i, parent.userAddress, 1);
                    break;
                }
            }

            spotsIncome(i);

            emit buy_dtl(msg.sender, package ,amountofPackage);
        }
    }

    function spotsIncome(uint package) internal {
        uint u = userId[msg.sender];
        uint count = 0;
        uint spot = 0;
        for (uint i = 0; i < 10; i++) {
            User memory parent = parents(u, 1);
            if (spot + (count * 2) < 10) {
                spot += 2;
            }
            if (parent.userId == 1) break;

            uint c = spotBooking(spot, msg.sender, parent, package);
            if (c == 1) {
                count += spot / 2;
                spot = 0;
            }

            if (count >= 5) {
                break;
            }
            u = parent.userId;
        }
    }

    function spotBooking(
        uint spotss,
        address useradd,
        User memory parent,
        uint package
    ) internal returns (uint) {
        if (parent.userId == 1) {
            return 0;
        }
        uint income = (75 * packages[package] * 10 ** 6) / 100;
        if (parent.package.length == 0 || parent.package.length - 1 < package) {
            incomes[parent.userId].missSpots[package] += income / 10; // admin laps income here
            UserSpot memory missSpot;
            missSpot.userAddress = useradd;
            missSpot.userPackage = packages[package];
            missSpot.income = income / 10; // change for 10 %
            missSpot.spot = package + 1;
            missSpot.timeStamp = block.timestamp;
            incomes[parent.userId].missSpotData.push(missSpot);
            emit missSpotIncomeEv(userIdtoAddress[parent.userId], parent.userId, income/10);
            return 0;
        } else {
            for (uint i = 0; i < spotss; i++) {
                uint[10] memory spot = spots[parent.userId][package];
                for (uint s = 0; s < 10; s++) {
                    uint l = spot[spot.length - 1];
                    if (spot[s] > l) continue;
                    if (s % 2 == 0) {
                        spots[parent.userId][package][s] += 1;
                        incomes[parent.userId].spots[package] += income / 10; // user spots income here
                        UserSpot memory SpotI;
                        SpotI.userAddress = useradd;
                        SpotI.userPackage = packages[package];
                        SpotI.income = income / 10;
                        SpotI.spot = package + 1;
                        SpotI.timeStamp = block.timestamp;
                        incomes[parent.userId].spotData.push(SpotI);
                        emit spotIncomeEv(userIdtoAddress[parent.userId], parent.userId, income/10);
                        DrainIncome(
                            income / 10,
                            package,
                            parent.userAddress,
                            2
                        );
                        if (whitelist[msg.sender] < (package + 1)) {
                            users[parent.userId]
                                .nonWorkingContainerIncome += (8 *
                                (income / 10 ** 2));
                            // token.transfer(parent.userAddress ,(8*(income /  10 ** 14)));// distribute income spot
                        }
                    } else {
                        spots[parent.userId][package][s] += 1;
                        User memory p = parents(parent.userId, (s + 1) / 2);
                        spotBooking(1, parent.userAddress, p, package);
                    }
                    break;
                }
            }
            return 1;
        }
    }

    function DrainIncome(
        uint income,
        uint package,
        address uaddr,
        uint incometype
    ) internal returns (bool) {
        User memory p = users[userId[uaddr]];

        if (p.direct.length == 0) return false;
        uint dincome = (2 * income) / 10;
        uint directL = p.direct.length > dir_number
            ? dir_number
            : p.direct.length;

        dincome = dincome / directL;

        for (
            uint i = p.direct.length > dir_number
                ? p.direct.length - dir_number
                : 0;
            i < p.direct.length;
            i++
        ) {
            User memory duser = users[p.direct[i]];

            if (
                duser.package.length == 0 || duser.package.length - 1 < package
            ) {
                incomes[duser.userId].missDrainBonus += dincome;
                DrainBonus memory dbIncome;

                dbIncome.income = dincome;
                dbIncome.incomeType = incometype;
                dbIncome.userPackage = packages[package];
                dbIncome.timeStamp = block.timestamp;
                incomes[duser.userId].missDrainIncome.push(dbIncome);
            } else {
                incomes[duser.userId].drainBonus += dincome;

                DrainBonus memory dbIncome;

                dbIncome.income = dincome;
                dbIncome.incomeType = incometype;
                dbIncome.userPackage = packages[package];
                dbIncome.timeStamp = block.timestamp;
                incomes[duser.userId].drainIncome.push(dbIncome);

                if (whitelist[msg.sender] < (package + 1)) {
                    users[duser.userId].nonWorkingIncome += dincome;
                } // Non-working income stored
                // here    token.transfer(duser.userAddress ,dincome / 10 ** 12);
            }
        }

        return true;
    }
    function ChangeTokenPrice(uint256 _newPrice) public onlyOwner {
        tokenprice = _newPrice;
    }

    function userWithdraw() public {
        require(isRegistered[msg.sender] == true, "Invalid User!");

        uint income = users[userId[msg.sender]].nonWorkingIncome;

        uint containerInome = users[userId[msg.sender]]
            .nonWorkingContainerIncome;
        uint totalAmt = income + containerInome;
        require(totalAmt >= minLimit, "Insufficient Balance");
        uint percentTotalAmt = ((15 * totalAmt) / 100); // 10^6

        uint useridss = userId[msg.sender];
        address userscount = userIdtoAddress[useridss];

        uint amounttodistributed = percentTotalAmt / 10;
        if (token.balanceOf(address(this)) >= 2 * (percentTotalAmt / 1e6)) {
            require(
                token.transfer(msg.sender, percentTotalAmt / 1e6),
                "Token transfer failed"
            );

            for (uint i = 0; i < 20; i++) {
                useridss--;
                userscount = userIdtoAddress[useridss];
                if (userscount == sysWallet) {
                    break;
                }

                if (getuserPackages(useridss).length > 0) {
                    require(
                        token.transfer(
                            userscount,
                            amounttodistributed / 1e6
                        ),
                        "Token transfer failed"
                    );
                    emit globalEv(userscount, amounttodistributed / 1e6);
                }
            }
        }

        users[userId[msg.sender]].nonWorkingIncome = 0;

        incomes[userId[msg.sender]].totalWithdrawal += income;
        Withdrawal memory with;
        with.amount = income;
        with.timeStamp = block.timestamp;
        incomes[userId[msg.sender]].withdrawals.push(with);

        users[userId[msg.sender]].nonWorkingContainerIncome = 0;

        incomes[userId[msg.sender]].totalWithdrawal += containerInome;
        Withdrawal memory withNew;
        withNew.amount = containerInome;
        withNew.timeStamp = block.timestamp;
        incomes[userId[msg.sender]].withdrawals.push(withNew);

        require(
            token.transfer(msg.sender, totalAmt - percentTotalAmt),
            "Token transfer failed"
        );
    }

    function withdrawTokens(
        address _tokenAddress,
        uint amount
    ) public onlyOwner {
        address adminAddress = owner();

        require(
            IERC20(_tokenAddress).transfer(adminAddress, amount),
            "Token transfer failed"
        );
    }

    event TokensWithdrawn(address indexed user, uint256 amount);


    function withdrawCHT() external {
        uint256 withdrawableTokens = totalCHT[msg.sender];
        require(withdrawableTokens > 0, "No tokens available for withdrawal.");

        // Checks-Effects-Interactions pattern
        // Effects
        totalCHT[msg.sender] = 0;
        // Interactions
        require(
            rewardToken.transfer(msg.sender, withdrawableTokens),
            "Token transfer failed"
        );

        emit TokensWithdrawn(msg.sender, withdrawableTokens);
    }



    receive() external payable {}
    fallback() external payable {}
}