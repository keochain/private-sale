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
  describe('Contract Initialization', async () => {
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
      assert((await sale.vestingInitialized()) == false);
    });
  })

  describe('bonus Percentage', () => {
    const bonus = 60
    const bonusFor100 = 65;
    const bonusFor200 = 70;
    let sale;
    beforeEach(async () => {
      let token = await Token.new(accounts[0], 1);
      const openingTime =  latestTime() + duration.days(1);
      const closingTime =  openingTime + duration.days(10);
      const rate = 14000;
      const cap = ether(4464);
      const totalTokens = ether(100000000)
      sale = await PrivateSale.new(openingTime, closingTime, rate, cap, token.address);
    })
    it('should return 60 for any amount less than 100 eth', async () => {
      let b = await sale.getBonusRate(1);
      assert(b.toNumber() === bonus);
      b = await sale.getBonusRate(ether(99));
      assert(b.toNumber() === bonus);
    })
    it('should return 65 for any amount between than 100 eth and 200', async () => {
      let b = await sale.getBonusRate(ether(100));
      assert(b.toNumber() === bonusFor100);
      b = await sale.getBonusRate(ether(150));
      assert(b.toNumber() === bonusFor100);
      b = await sale.getBonusRate(ether(199));
      assert(b.toNumber() === bonusFor100);
    })

    it('should return 70 for any amount greater than 200', async () => {
      let b = await sale.getBonusRate(ether(200));
      assert(b.toNumber() === bonusFor200);
      b = await sale.getBonusRate(ether(201));
      assert(b.toNumber() === bonusFor200);
      b = await sale.getBonusRate(ether(1990));
      assert(b.toNumber() === bonusFor200);
    })
  })

  describe('token rate', () => {
    const bonus = 60
    const bonusFor100 = 65;
    const bonusFor200 = 70;
    let sale;
    const rate = 14000;
    beforeEach(async () => {
      let token = await Token.new(accounts[0], 1);
      const openingTime =  latestTime() + duration.days(1);
      const closingTime =  openingTime + duration.days(10);
      const cap = ether(4464);
      sale = await PrivateSale.new(openingTime, closingTime, rate, cap, token.address);
    })
    it('should return 14000 for 1 ether', async () => {
      let tokens = await sale.getTokensForWei(ether(1));
      tokens.should.be.bignumber.equal(ether(rate));
    })
    it('should return 140000 for 10 ether', async () => {
      let tokens = await sale.getTokensForWei(ether(10));
      tokens.should.be.bignumber.equal(ether(rate*10));
    });

    it('should return 21500 for 1.5 ether', async () => {
      let tokens = await sale.getTokensForWei(ether(1.5));
      tokens.should.be.bignumber.equal(ether(rate*1.5));
    });

    it('should return 7500 for 0.5 ether', async () => {
      let tokens = await sale.getTokensForWei(ether(0.5));
      tokens.should.be.bignumber.equal(ether(rate*0.5));
    });
  })
});
