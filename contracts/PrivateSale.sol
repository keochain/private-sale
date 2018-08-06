pragma solidity 0.4.24;
import "openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./CustomPausable.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoTokens.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";
contract PrivateSale is FinalizableCrowdsale, CappedCrowdsale, CustomPausable, HasNoTokens {

  uint public tokensForSale;
  uint public bonus;
  uint public bonus100;
  uint public bonus200;
  uint public tokensSold;
  uint public bonusTokensSold;
  constructor(uint256 _openingTime, uint256 _closingTime, uint256 _rate, uint _cap, ERC20 _token)
  TimedCrowdsale(_openingTime, _closingTime)
  CappedCrowdsale(_cap)
  Crowdsale(_rate, address(0), _token) public {
    require(_token != address(0));
    tokensForSale = 100000000  * (10 ** 18);
    bonus = 60;
    bonus100 = bonus + 5;
    bonus200 = bonus + 10;
  }

  function changeRate(uint _newRate) public whenNotPaused onlyWhitelisted {
    require(rate!=_newRate);
    rate = _newRate;
  }

  function changeBonus(uint _newBonus) public whenNotPaused onlyWhitelisted {
    require(_newBonus != bonus);
    bonus = _newBonus;
  }

  function changeBonus100(uint _newBonus100) public whenNotPaused onlyWhitelisted {
    require(_newBonus100 != bonus100);
    bonus100 = _newBonus100;
  }

  function changeBonus200(uint _newBonus200) public whenNotPaused onlyWhitelisted {
    require(_newBonus200 != bonus200);
    bonus200 = _newBonus200;
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
    uint _tokenAmount = super._getTokenAmount(_weiAmount);
    uint bonusRate = getBonusRate(_weiAmount);
    uint bonusTokens = _tokenAmount.mul(bonusRate).div(100);

    // Todo Send bonus tokens to vesting contract
    require(tokensSold.add(bonusTokens) <= tokensForSale);
    tokensSold = tokensSold.add(bonusTokens);
    bonusTokensSold = bonusTokensSold.add(bonusTokens);
    super._postValidatePurchase(_beneficiary, _weiAmount);
  }

  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) whenNotPaused internal {
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

  function getTokensForWei(uint _weiAmount) public constant returns(uint256) {
    return super._getTokenAmount(_weiAmount);
  }

  function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    tokensSold = tokensSold.add(_tokenAmount);
    super._processPurchase(_beneficiary, _tokenAmount);
  }

  function withdrawFunds(uint _weiAmount) public whenNotPaused onlyWhitelisted {
    require(address(this).balance >= _weiAmount);
    msg.sender.transfer(_weiAmount);
  }

  function _forwardFunds() internal {

  }

  function finalization() internal {
    token.transfer(msg.sender, token.balanceOf(this).sub(bonusTokensSold));
  }
}
