class DexClient {
  constructor(tezosToolkit = null, dex = null) {
    this.tezosToolkit = tezosToolkit;
    this.dex = dex;
  }

  async initializeExchange(tokenAmount, candidate, confirmation = true) {
    const operation = await dex.methods
      .initializeExchange(tokenAmount, candidate)
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async getFullStorage(keys = []) {
    if (!keys.length) {
      keys.push(this.tezosToolkit.signer.publicKeyHash());
    }
    const storage = await this.dex.storage();
    const extendedShares = await keys.reduce(async (prev, current) => {
      const value = await prev;

      let entry = new BigNumber(0);

      try {
        entry = storage.shares[current]; //await storage.shares.get(current);
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
      extendedShares
    };
  }

  async tezToTokenSwap(tezIn, minTokensOut = null, confirmation = true) {
    if (!minTokensOut) {
      const mutezAmount = parseFloat(tezIn) * 1000000;
      const dexStorage = await this.getFullStorage();

      const fee = parseInt(mutezAmount / dexStorage.feeRate);
      const newTezPool = parseInt(+dexStorage.tezPool + +mutezAmount);
      const newTokenPool = parseInt(
        dexStorage.invariant / parseInt(newTezPool - fee)
      );

      minTokensOut = parseInt(parseInt(dexStorage.tokenPool - newTokenPool));
    }

    const operation = await dex.methods
      .tezToTokenSwap(minTokensOut.toString())
      .send({
        amount: tezIn
      });
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async tokenToTezSwap(
    tokensIn,
    minTezOut = null,
    approve = true,
    confirmation = true
  ) {
    const dexStorage = await this.getFullStorage();
    if (!minTezOut) {
      const fee = parseInt(tokensIn / dexStorage.feeRate);
      const newTokenPool = parseInt(+dexStorage.tokenPool + +tokensIn);
      const newTezPool = parseInt(
        dexStorage.invariant / parseInt(newTokenPool - fee)
      );

      minTezOut = parseInt(parseInt(dexStorage.tezPool - newTezPool));
    }

    if (approve) {
      const token = await this.tezosToolkit.contract.at(
        dexStorage.tokenAddress
      );

      const approveOperation = await token.methods
        .approve(this.dex.address, tokensIn)
        .send();
      await approveOperation.confirmation();
    }

    const operation = await dex.methods
      .tokenToTezSwap(tokensIn, minTezOut.toString())
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async tokenToTezPayment(
    tokensIn,
    receiver,
    minTezOut = null,
    approve = true,
    confirmation = true
  ) {
    const dexStorage = await this.getFullStorage();
    if (!minTezOut) {
      const fee = parseInt(tokensIn / dexStorage.feeRate);
      const newTokenPool = parseInt(+dexStorage.tokenPool + +tokensIn);
      const newTezPool = parseInt(
        dexStorage.invariant / parseInt(newTokenPool - fee)
      );

      minTezOut = parseInt(parseInt(dexStorage.tezPool - newTezPool));
    }

    if (approve) {
      const token = await this.tezosToolkit.contract.at(
        dexStorage.tokenAddress
      );

      const approveOperation = await token.methods
        .approve(this.dex.address, tokensIn)
        .send();
      await approveOperation.confirmation();
    }

    const operation = await dex.methods
      .tokenToTezPayment(tokensIn, minTezOut.toString(), receiver)
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async tezToTokenPayment(
    tezIn,
    receiver,
    minTokensOut = null,
    confirmation = true
  ) {
    if (!minTokensOut) {
      const mutezAmount = parseFloat(tezIn) * 1000000;
      const dexStorage = await this.getFullStorage();

      const fee = parseInt(mutezAmount / dexStorage.feeRate);
      const newTezPool = parseInt(+dexStorage.tezPool + +mutezAmount);
      const newTokenPool = parseInt(
        dexStorage.invariant / parseInt(newTezPool - fee)
      );

      minTokensOut = parseInt(parseInt(dexStorage.tokenPool - newTokenPool));
    }

    const operation = await dex.methods
      .tezToTokenPayment(minTokensOut.toString(), receiver)
      .send({
        amount: tezIn
      });
    if (confirmation) {
      await operation.confirmation();
    }
  }

  // TokenToTokenSwap(sender, sender, this, n.0, n.1, n.2, s)
  // TokenToTokenPayment(sender, n.2, this, n.0, n.1, n.3, s)
  // TokenToTokenIn(n.1, this, n.0, s)
  // InvestLiquidity(n.0, n.1, s)
  // DivestLiquidity(n.0, n.1, n.2, s)

  setDex = dex => {
    this.dex = dex;
  };

  setTezosToolkit = tezosToolkit => {
    this.tezosToolkit = tezosToolkit;
  };
}
export default DexClient;
