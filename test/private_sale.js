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
      let token = await Token.new(accounts[0], ether(100*rate));
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

  describe('token transfer', () => {
    const bonus = 60
    const bonusFor100 = 65;
    const bonusFor200 = 70;
    let sale;
    let token;
    const rate = 14000;
    beforeEach(async () => {
      token = await Token.new(accounts[0], ether(100*rate));
      const openingTime =  latestTime() + duration.days(1);
      const closingTime =  openingTime + duration.days(10);
      const cap = ether(4464);
      sale = await PrivateSale.new(openingTime, closingTime, rate, cap, token.address);
      await increaseTimeTo(openingTime + 10);
      await token.transfer(sale.address, ether(100*rate));
    })
    it('should return 14000 for 1 ether', async () => {
      await sale.sendTransaction({ value: ether(1), from: accounts[1] });
      const TokenBalance = await token.balanceOf(accounts[1]);
      TokenBalance.should.be.bignumber.equal(ether(14000));
      const grant = await sale.grants(accounts[1]);
      assert(grant[0]);
      assert(!grant[1]);
      grant[2].should.be.bignumber.equal(ether(0.60*rate));
    });

    it('check bonus allocation', async () => {
      await sale.sendTransaction({ value: ether(1), from: accounts[1] });
      await sale.sendTransaction({ value: ether(1), from: accounts[1] });
      const grant = await sale.grants(accounts[1]);
      assert(grant[0]);
      assert(!grant[1]);
      grant[2].should.be.bignumber.equal(ether(2*0.60*rate));
      const bonusTokensSold = await sale.bonusTokensSold();
      bonusTokensSold.should.be.bignumber.equal(ether(2*0.60*rate));
      (await sale.tokensSold()).should.be.bignumber.equal(ether(2*0.60*rate + 2*rate));
    });
  })

  describe('End of sale', () => {
    const bonus = 60
    const bonusFor100 = 65;
    const bonusFor200 = 70;
    let sale;
    let token;
    const rate = 14000;
    let openingTime;
    let closingTime;
    let cap;
    beforeEach(async () => {
      token = await Token.new(accounts[0], ether(100*rate));
      openingTime =  latestTime() + duration.days(1);
      closingTime =  openingTime + duration.days(10);
      cap = ether(1);
      sale = await PrivateSale.new(openingTime, closingTime, rate, cap, token.address);
      await increaseTimeTo(openingTime + 10);
      await token.transfer(sale.address, ether(100*rate));
    })
    it('it should revert if 1.2 ether is sent', async () => {
      await sale.sendTransaction({ value: ether(1.2), from: accounts[1] })
      .should.be.rejectedWith(EVMRevert);
    });
    it('should revert if it has passed the closing time', async () => {
      await increaseTimeTo(closingTime + 10);
      await sale.sendTransaction({ value: ether(0.5), from: accounts[1] })
      .should.be.rejectedWith(EVMRevert);
    })

    it('finalize should return the correct number of tokens', async () => {
      const bonus = 0.60 * rate;
      await sale.sendTransaction({ value: ether(1), from: accounts[1] });
      const bonusTokensSold = await sale.bonusTokensSold();
      bonusTokensSold.should.be.bignumber.equal(ether(bonus));
      await sale.finalize();
      (await token.balanceOf(sale.address)).should.be.bignumber.equal(bonusTokensSold)
      assert(await sale.isFinalized())
    })

    it('finalize can be called when the crowdsale is over', async () => {
      await sale.sendTransaction({ value: ether(0.5), from: accounts[1] });
      await increaseTimeTo(closingTime + 100)
      await sale.finalize();
      assert(await sale.isFinalized())
    })
  })

  describe('Vesting', () => {
    const bonus = 60
    const bonusFor100 = 65;
    const bonusFor200 = 70;
    let sale;
    let token;
    const rate = 14000;
    let openingTime;
    let closingTime;
    let cap;
    beforeEach(async () => {
      token = await Token.new(accounts[0], ether(100*rate));
      openingTime =  latestTime() + duration.days(1);
      closingTime =  openingTime + duration.days(10);
      cap = ether(10);
      sale = await PrivateSale.new(openingTime, closingTime, rate, cap, token.address);
      await increaseTimeTo(openingTime + 10);
      await token.transfer(sale.address, ether(100*rate));
    })

    it('claim tokens should revert if vesting start time has not been set', async () => {
      await sale.sendTransaction({ value: ether(1), from: accounts[1] });
      assert(await sale.vestingInitialized() == false);
      await sale.claimTokens(accounts[1]).should.be.rejectedWith(EVMRevert);
    })

    it('set vesting start time', async () => {
      await sale.setVestingStartTime(closingTime + 10);
      assert((await sale.vestingStartTime()).toNumber() == closingTime + 10);
      assert((await sale.vestingEndTime()).toNumber() == closingTime + 10 + duration.years(1));
    });

    it('user cannot claim before vesting start time', async () => {
      await sale.sendTransaction({ value: ether(1), from: accounts[1] });
      await sale.setVestingStartTime(closingTime + 10);
      const grant = await sale.grants(accounts[1]);
      assert(grant[0] == true);
      let vestedTokens = await sale.calculateVestedTokens(accounts[1], latestTime());
      vestedTokens.should.be.bignumber.equal(ether(0));
    });

    it('should return the correct vested tokens during the vesting period', async () => {
      await sale.sendTransaction({ value: ether(1), from: accounts[1] });
      await sale.setVestingStartTime(closingTime + 10);
      const months5 = closingTime + 10 + duration.months(5);
      let vestedTokens;
      vestedTokens = await sale.calculateVestedTokens(accounts[1], months5);
      vestedTokens.should.be.bignumber.equal(ether(0.60*0.20*rate));

      const months6 = closingTime + 10 + duration.months(6);
      vestedTokens = await sale.calculateVestedTokens(accounts[1], months6);
      vestedTokens.should.be.bignumber.equal(ether(0.60*0.60*rate));
      const months8 = closingTime + 10 + duration.months(8);
      vestedTokens = await sale.calculateVestedTokens(accounts[1], months8);
      vestedTokens.should.be.bignumber.equal(ether(0.60*0.60*rate));

      const months14 = closingTime + 10 + duration.years(1);
      vestedTokens = await sale.calculateVestedTokens(accounts[1], months14);
      vestedTokens.should.be.bignumber.equal(ether(0.60*rate));
    });

    it('claim should set the claimed tokens', async () => {
      await sale.sendTransaction({ value: ether(1), from: accounts[1] });
      await sale.setVestingStartTime(closingTime + 10);
      const months5 = closingTime + 10 + duration.months(5);
      await increaseTimeTo(months5);
      await sale.claimTokens({from: accounts[1]});
      const grant = await sale.grants(accounts[1]);
      grant[3].should.be.bignumber.equal(ether(rate*0.60*0.20));
    });

    it('revoke should set the grant to be revoked and should transfer vested tokens to the holder, unvested tokens must be sent back to whitelist', async () => {
      await sale.sendTransaction({ value: ether(1), from: accounts[1] });
      await sale.setVestingStartTime(closingTime + 10);
      const months5 = closingTime + 10 + duration.months(5);
      await increaseTimeTo(months5);
      const oldBalance = await token.balanceOf(accounts[0]);
      await sale.revoke(accounts[1]);

      const grant = await sale.grants(accounts[1]);
      assert(grant[1] == true);
      const newBalance = await token.balanceOf(accounts[0]);
      newBalance.should.be.bignumber.equal(oldBalance.add(grant[2].sub(grant[3])));
    });
  })
});
