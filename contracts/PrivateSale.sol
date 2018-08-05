pragma solidity 0.4.24;
import "openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
contract PrivateSale is FinalizableCrowdsale {

  uint public tokensForSale;
  uint public bonus;
  uint public bonus100;
  uint public bonus200;
  uint public tokensSold;
  constructor(uint256 _openingTime, uint256 _closingTime, uint256 _rate, address _wallet, ERC20 _token)
  TimedCrowdsale(_openingTime, _closingTime)
  Crowdsale(_rate, _wallet, _token) {
    require(_token != address(0));
    tokensForSale = 100000000  * (10 ** 18);
    bonus = 60;
    bonus100 = bonus + 5;
    bonus200 = bonus + 10;
  }


  function getBonusRate(uint _weiAmount) public constant returns(uint256) {
    if(_weiAmount < 100 ether) {
      return bonus;
    } else if(_weiAmount >= 100 ether && _weiAmount < 200 ether) {
      return bonus100;
    } else {
      return bonus200;
    }
  }

  function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    uint _tokenAmount = _getTokenAmount(_weiAmount);
    uint bonusRate = getBonusRate(_weiAmount);
    uint bonusTokens = _tokenAmount.mul(bonusRate).div(100);

    // Todo Send bonus tokens to vesting contract
    require(tokensSold.add(bonusTokens) <= tokensForSale);
    tokensSold = tokensSold.add(bonusTokens);
  }

  function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    tokensSold = tokensSold.add(_tokenAmount);
    super._processPurchase(_beneficiary, _tokenAmount);
  }

  function _forwardFunds() internal {

  }

}
