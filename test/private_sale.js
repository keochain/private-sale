let PrivateSale = artifacts.require('PrivateSale');
let Token = artifacts.require('BasicTokenMock');
import {advanceBlock} from './helpers/advanceToBlock'
import ether  from './helpers/ether';
const EVMRevert = require('./helpers/EVMRevert.js')
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import BigNumber  from 'bignumber.js'
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('PrivateSale', async function(accounts) {
  it("initialize", async function() {
    let token = await Token.new(accounts[0], 1);
    const openingTime =  latestTime() + duration.days(1);
    const closingTime =  openingTime + duration.days(10);
    const rate = 14000;
    const cap = ether(4464);
    const totalTokens = ether(100000000)
    const bonus = 60
    const bonusFor100 = 65;
    const bonusFor200 = 70;
    let sale = await PrivateSale.new(openingTime, closingTime, rate, cap, token.address);
    assert((await sale.openingTime()).toNumber() === openingTime);
    assert((await sale.closingTime()).toNumber() === closingTime);
    assert((await sale.rate()).toNumber() === rate);
    assert((await sale.cap()).toString() === cap.toString());
    assert((await sale.token()) === token.address);
    assert((await sale.VestingToken()) === token.address);
    (await sale.tokensForSale()).should.be.bignumber.equal(totalTokens);
    assert((await sale.bonus()).toNumber() === bonus);
    assert((await sale.bonus100()).toNumber() === bonusFor100);
    assert((await sale.bonus200()).toNumber() === bonusFor200);
  });
});
