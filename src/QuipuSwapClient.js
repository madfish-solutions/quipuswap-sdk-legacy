import TezosToolkit from "@taquito/taquito";
import TokenClient from "./TokenClient";
import DexClient from "./DexClient";
import FactoryClient from "./FactoryClient";

class QuipuSwapClient {
  constructor(
    tezosToolkit = null,
    network = null,
    defaultAccount = {},
    tokenAddress = [],
    dexAddress = null,
    factoryAddress = null
  ) {
    this.tezosToolkit = tezosToolkit ? tezosToolkit : new TezosToolkit();
    if (network) {
      this.tezosToolkit.setProvider({
        rpc: network,
        confirmationPollingTimeoutSecond: 300
      });
    }

    this.account = [];
    this.defaultAccount = {};
    if (
      defaultAccount.email &&
      defaultAccount.password &&
      defaultAccount.mnemonic &&
      defaultAccount.secret
    ) {
      this.defaultAccount = defaultAccount;
      this.accounts.push(defaultAccount);
      this.tezosToolkit.importKey(
        defaultAccount.email,
        defaultAccount.password,
        defaultAccount.mnemonic.join(" "),
        defaultAccount.secret
      );
    }

    this.tokens = [];
    tokenAddress.forEach(tokenAddress => {
      this.tezosToolkit.contract.at(tokenAddress).then(token => {
        this.tokens.push(TokenClient(this.tezosToolkit, token));
      });
    });

    this.dexClient = null;
    if (dexAddress) {
      this.tezosToolkit.contract.at(dexAddress).then(dex => {
        this.dexClient = DexClient(this.tezosToolkit, dex);
      });
    }

    this.factoryClient = null;
    if (factoryAddress) {
      this.tezosToolkit.contract.at(factoryAddress).then(factory => {
        this.factory = FactoryClient(this.tezosToolkit, factory);
      });
    }
  }

  setTezosToolkit = tezosToolkit => {
    this.tezosToolkit = tezosToolkit;
    this.dexClient ? this.dexClient.setTezosToolkit(tezosToolkit) : null;
    this.factoryClient
      ? this.factoryClient.setTezosToolkit(tezosToolkit)
      : null;
    this.tokens.forEach(tokenClient =>
      tokenClient.setTezosToolkit(tezosToolkit)
    );
  };
}
export default QuipuSwapClient;
