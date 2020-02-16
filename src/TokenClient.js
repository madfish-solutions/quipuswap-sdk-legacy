const fs = require("fs");

class TokenClient {
  constructor(tezosToolkit = null, token = null) {
    this.tezosToolkit = tezosToolkit;
    this.token = token;
  }

  async getFullStorage(keys = []) {
    if (!keys.length) {
      keys.push(this.tezosToolkit.signer.publicKeyHash());
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
    const operation = await token.methods
      .transfer(accountFrom, destination, value)
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }
  async approve(spender, value, confirmation = true) {
    const operation = await token.methods.approve(spender, value).send();
    if (confirmation) {
      await operation.confirmation();
    }
  }
  async getAllowance(owner, spender, receiver, confirmation = true) {
    const operation = await token.methods
      .getAllowance(owner, spender, receiver)
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async getBalance(owner, receiver, confirmation = true) {
    const operation = await token.methods.getBalance(owner, receiver).send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async getTotalSupply(receiver, confirmation = true) {
    const operation = await token.methods.getTotalSupply(receiver).send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async mint(amount, confirmation = true) {
    const operation = await token.methods.mint(amount).send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async burn(amount, confirmation = true) {
    const operation = await token.methods.burn(amount).send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async deploy(
    owner,
    totalSupply,
    ledger = null,
    balance = 0,
    confirmation = false,
    writePath = null
  ) {
    const operation = await this.tezosToolkit.contract.originate({
      code: JSON.parse(fs.readFileSync("./code/Token.json").toString()),
      storage: {
        owner,
        totalSupply,
        ledger: ledger
          ? landger
          : {
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
    this.token = operation.contract();
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
