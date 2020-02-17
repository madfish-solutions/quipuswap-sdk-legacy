const fs = require("fs");
const path = require("path");

class FactoryClient {
  constructor(options = {}) {
    this.tezosToolkit = options.tezosToolkit || null;
    this.factory = options.factory || null;
  }

  async getFullStorage(options = {}) {
    const tokenToExchangeKeys = options.tokenToExchangeKeys || [];
    const exchangeToTokenKeys = options.exchangeToTokenKeys || [];
    if (!keys.length) {
      keys.push(this.tezosToolkit.signer.publicKeyHash());
    }
    const storage = await this.factory.storage();
    const extendedTokenToExchange = await tokenToExchangeKeys.reduce(
      async (prev, current) => {
        const value = await prev;

        let entry = null;

        try {
          entry = storage.tokenToExchange[current]; // await storage.tokenToExchange.get(current);
        } catch (ex) {
          console.error(ex);
        }

        return {
          ...value,
          [current]: entry
        };
      },
      Promise.resolve({})
    );
    const extendedExchangeToToken = await exchangeToTokenKeys.reduce(
      async (prev, current) => {
        const value = await prev;

        let entry = null;

        try {
          entry = storage.exchangeToToken[current]; // await storage.exchangeToTokenKeys.get(current);
        } catch (ex) {
          console.error(ex);
        }

        return {
          ...value,
          [current]: entry
        };
      },
      Promise.resolve({})
    );
    return {
      ...storage,
      extendedTokenToExchange,
      extendedExchangeToToken
    };
  }

  async launchExchange(token, exchange, confirmation = true) {
    const operation = await dex.methods.launchExchange(token, exchange).send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async deploy(options) {
    const tokenToExchange = options.tokenToExchange || {};
    const exchangeToToken = options.exchangeToToken || {};
    const tokenList = options.tokenList || [];
    const balance = options.balance || 0;
    const confirmation = options.confirmation || false;
    const writePath = options.writePath || null;

    const operation = await this.tezosToolkit.contract.originate({
      code: JSON.parse(
        fs
          .readFileSync(path.resolve(__dirname, "./code/Factory.json"))
          .toString()
      ),
      storage: {
        tokenList,
        tokenToExchange,
        exchangeToToken
      },
      balance
    });
    if (confirmation) {
      await operation.confirmation();
    }
    this.factory = operation.contract();
    if (writePath) {
      const detail = {
        address: this.factory.address
      };
      fs.writeFileSync(writePath, JSON.stringify(detail));
    }
  }

  setFactory(factory) {
    this.factory = factory;
  }

  setTezosToolkit(tezosToolkit) {
    this.tezosToolkit = tezosToolkit;
  }
}
module.exports.FactoryClient = FactoryClient;
