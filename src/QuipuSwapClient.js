const TezosToolkit = require("@taquito/taquito").TezosToolkit;
const TokenClient = require("./TokenClient").TokenClient;
const DexClient = require("./DexClient").DexClient;
const FactoryClient = require("./FactoryClient").FactoryClient;

class QuipuSwapClient {
  constructor(
    options = {
      tezosToolkit: null,
      network: null,
      defaultAccount: {},
      tokenAddress: [],
      dexAddress: null,
      factoryAddress: null
    }
  ) {
    this.tezosToolkit = options.tezosToolkit || new TezosToolkit();
    if (options.network) {
      this.tezosToolkit.setProvider({
        rpc: options.network,
        confirmationPollingTimeoutSecond: 300
      });
    }

    this.accounts = [];
    this.defaultAccount = {};
    this.tokens = [];
    options.tokenAddress &&
      options.tokenAddress.forEach(tokenAddress => {
        this.tezosToolkit.contract.at(tokenAddress).then(token => {
          this.tokens.push(
            new TokenClient({ tezosToolkit: this.tezosToolkit, token })
          );
        });
      });

    this.dexClient = null;
    if (options.dexAddress) {
      this.tezosToolkit.contract.at(options.dexAddress).then(dex => {
        this.dexClient = new DexClient({
          tezosToolkit: this.tezosToolkit,
          dex
        });
      });
    }

    this.factoryClient = null;
    if (options.factoryAddress) {
      this.tezosToolkit.contract.at(options.factoryAddress).then(factory => {
        this.factory = new FactoryClient({
          tezosToolkit: this.tezosToolkit,
          factory
        });
      });
    }
  }

  async addAccount(email, password, mnemonic, secret, setDefault = true) {
    if (setDefault) {
      this.defaultAccount = { email, password, mnemonic, secret };
    }
    this.accounts.push({ email, password, mnemonic, secret });
    await this.tezosToolkit.importKey(
      email,
      password,
      mnemonic.join(" "),
      secret
    );
  }

  setTezosToolkit(tezosToolkit) {
    this.tezosToolkit = tezosToolkit;
    this.dexClient ? this.dexClient.setTezosToolkit(tezosToolkit) : null;
    this.factoryClient
      ? this.factoryClient.setTezosToolkit(tezosToolkit)
      : null;
    this.tokens.forEach(tokenClient =>
      tokenClient.setTezosToolkit(tezosToolkit)
    );
  }

  async deployToken(owner, totalSupply, options = {}) {
    const tokenClient = new TokenClient({
      tezosToolkit: this.tezosToolkit,
      token: null
    });
    await tokenClient.deploy(owner, totalSupply, options);
    this.tokens.push(tokenClient);
  }

  async deployFactory(options = {}) {
    const factoryClient = new FactoryClient({
      tezosToolkit: this.tezosToolkit,
      factory: null
    });
    await factoryClient.deploy(options);
    this.factoryClient = factoryClient;
  }

  async deployDex(
    feeRate,
    tokenAddress,
    factoryAddress,
    delegated,
    options = {}
  ) {
    const dexClient = new DexClient({
      tezosToolkit: this.tezosToolkit,
      dex: null
    });
    await dexClient.deploy(
      feeRate,
      tokenAddress,
      factoryAddress,
      delegated,
      options
    );
    this.dexClient = dexClient;
  }
}
module.exports.QuipuSwapClient = QuipuSwapClient;
