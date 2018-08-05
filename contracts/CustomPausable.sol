pragma solidity 0.4.24;


import "./CustomWhitelist.sol";

/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract CustomPausable is CustomWhitelist {
  event Pause();
  event Unpause();

  bool public paused = false;

  modifier canTransfer(address _sender) {
    if(paused) {
      if(!whitelist[_sender]) {
        revert();
      }
    }
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused() {
    require(!paused);
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    require(paused);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyWhitelisted whenNotPaused public {
    paused = true;
    emit Pause();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() onlyWhitelisted whenPaused public {
    paused = false;
    emit Unpause();
  }
}
