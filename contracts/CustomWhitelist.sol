/*
Copyright 2018 Moonwhale

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract CustomWhitelist is Ownable {
  mapping(address => bool) public whitelist;
  uint public numberOfWhitelists;

  event WhitelistedAddressAdded(address addr);
  event WhitelistedAddressRemoved(address addr);

  /**
   * @dev Throws if called by any account that's not whitelisted.
   */
  modifier onlyWhitelisted() {
    require(whitelist[msg.sender] || msg.sender == owner);
    _;
  }

  constructor() public {
    whitelist[msg.sender] = true;
    numberOfWhitelists = 1;
    emit WhitelistedAddressAdded(msg.sender);
  }
  /**
   * @dev add an address to the whitelist
   * @param addr address
   */
  function addAddressToWhitelist(address addr) onlyWhitelisted  public {
    require(!whitelist[addr]);

    whitelist[addr] = true;
    numberOfWhitelists++;

    emit WhitelistedAddressAdded(addr);
  }

  /**
   * @dev remove an address from the whitelist
   * @param addr address
   */
  function removeAddressFromWhitelist(address addr) onlyWhitelisted  public {
    require(whitelist[addr]);
    //the owner can not be unwhitelisted
    require(addr != owner);

    whitelist[addr] = false;
    numberOfWhitelists--;

    emit WhitelistedAddressRemoved(addr);
  }

}
