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
    if (
      options.defaultAccount.email &&
      options.defaultAccount.password &&
      options.defaultAccount.mnemonic &&
      options.defaultAccount.secret
    ) {
      this.defaultAccount = options.defaultAccount;
      this.accounts.push(options.defaultAccount);
      this.tezosToolkit.importKey(
        options.defaultAccount.email,
        options.defaultAccount.password,
        options.defaultAccount.mnemonic.join(" "),
        options.defaultAccount.secret
      );
    }

    this.tokens = [];
    options.tokenAddress &&
      options.tokenAddress.forEach(tokenAddress => {
        this.tezosToolkit.contract.at(tokenAddress).then(token => {
          this.tokens.push(TokenClient(this.tezosToolkit, token));
        });
      });

    this.dexClient = null;
    if (options.dexAddress) {
      this.tezosToolkit.contract.at(options.dexAddress).then(dex => {
        this.dexClient = DexClient(this.tezosToolkit, dex);
      });
    }

    this.factoryClient = null;
    if (options.factoryAddress) {
      this.tezosToolkit.contract.at(options.factoryAddress).then(factory => {
        this.factory = FactoryClient(this.tezosToolkit, factory);
      });
    }
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
}
module.exports.QuipuSwapClient = QuipuSwapClient;
