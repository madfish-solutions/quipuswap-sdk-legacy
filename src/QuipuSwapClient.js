import TezosToolkit from "@taquito/taquito";
import TokenClient from "./TokenClient";

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
        this.tokens.push(TokenClient(token));
      });
    });

    this.dex = null;
    if (dexAddress) {
      this.tezosToolkit.contract.at(dexAddress).then(dex => {
        this.dex = dex;
      });
    }

    this.factory = null;
    if (factoryAddress) {
      this.tezosToolkit.contract.at(factoryAddress).then(factory => {
        this.factory = factory;
      });
    }
  }

  setTezosToolkit = tezosToolkit => {
    this.tezosToolkit = tezosToolkit;
  };
}
export default QuipuSwapClient;
