const fs = require("fs");
const path = require("path");
const BigNumber = require("bignumber.js");

class TokenClient {
  constructor(options = {}) {
    this.tezosToolkit = options.tezosToolkit || null;
    this.token = options.token || null;
  }

  async getFullStorage(keys = []) {
    if (!keys.length) {
      keys.push(await this.tezosToolkit.signer.publicKeyHash());
    }
    const storage = await this.token.storage();
    const accounts = await keys.reduce(async (prev, current) => {
      const value = await prev;

      let entry = {
        balance: new BigNumber(0),
        allowances: {}
      };

      try {
        entry = storage.ledger[current]; // await storage.ledger.get(current);
      } catch (ex) {
        console.error(ex);
      }

      return {
        ...value,
        [current]: entry
      };
    }, Promise.resolve({}));
    return {
      ...storage,
      accounts
    };
  }

  async transfer(accountFrom, destination, value, confirmation = true) {
    const operation = await this.token.methods
      .transfer(accountFrom, destination, value)
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }
  async approve(spender, value, confirmation = true) {
    const operation = await this.token.methods.approve(spender, value).send();
    if (confirmation) {
      await operation.confirmation();
    }
  }
  async getAllowance(owner, spender, receiver, confirmation = true) {
    const operation = await this.token.methods
      .getAllowance(owner, spender, receiver)
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async getBalance(owner, receiver, confirmation = true) {
    const operation = await this.token.methods
      .getBalance(owner, receiver)
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async getTotalSupply(receiver, confirmation = true) {
    const operation = await this.token.methods.getTotalSupply(receiver).send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async mint(amount, confirmation = true) {
    const operation = await this.token.methods.mint(amount).send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async burn(amount, confirmation = true) {
    const operation = await this.token.methods.burn(amount).send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async deploy(owner, totalSupply, options = {}) {
    const ledger = options.ledger || null;
    const balance = options.balance || 0;
    const confirmation = options.confirmation || false;
    const writePath = options.writePath || null;

    const operation = await this.tezosToolkit.contract.originate({
      code: JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "./code/Token.json")).toString()
      ),
      storage: {
        owner,
        totalSupply,
        ledger: ledger || {
          [owner]: {
            balance: totalSupply,
            allowances: {}
          }
        }
      },
      balance
    });
    if (confirmation) {
      await operation.confirmation();
    }
    this.token = await operation.contract();
    if (writePath) {
      const detail = {
        address: this.token.address
      };
      fs.writeFileSync(writePath, JSON.stringify(detail));
    }
  }

  setToken(token) {
    this.token = token;
  }

  setTezosToolkit(tezosToolkit) {
    this.tezosToolkit = tezosToolkit;
  }
}
module.exports.TokenClient = TokenClient;
