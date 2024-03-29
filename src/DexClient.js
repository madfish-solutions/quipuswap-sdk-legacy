const fs = require("fs");
const path = require("path");
const BigNumber = require("bignumber.js");

class DexClient {
  constructor(options = {}) {
    this.tezosToolkit = options.tezosToolkit || null;
    this.dex = options.dex || null;
  }

  async approveTokens(tokenAddress, dexAddress, amount) {
    const token = await this.tezosToolkit.contract.at(tokenAddress);

    const approveOperation = await token.methods
      .approve(dexAddress, amount)
      .send();
    await approveOperation.confirmation();
  }

  async initializeExchange(tokenAmount, tezAmount, candidate, options = {}) {
    const approve = options.approve || true;
    const confirmation = options.confirmation || true;

    const dexStorage = await this.getFullStorage();
    if (approve) {
      this.approveTokens(
        dexStorage.tokenAddress,
        this.dex.address,
        tokenAmount
      );
    }
    const operation = await this.dex.methods
      .initializeExchange(tokenAmount, candidate)
      .send({ amount: tezAmount });
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async getFullStorage(keys = []) {
    if (!keys.length) {
      keys.push(await this.tezosToolkit.signer.publicKeyHash());
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

  async tezToTokenSwap(tezIn, options = {}) {
    let minTokensOut = options.minTokensOut || null;
    const confirmation = options.confirmation || true;
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

    const operation = await this.dex.methods
      .tezToTokenSwap(minTokensOut.toString())
      .send({
        amount: tezIn
      });
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async tokenToTezSwap(tokensIn, options = {}) {
    let minTezOut = options.minTezOut || null;
    const approve = options.approve || true;
    const confirmation = options.confirmation || true;
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
      this.approveTokens(dexStorage.tokenAddress, this.dex.address, tokensIn);
    }

    const operation = await this.dex.methods
      .tokenToTezSwap(tokensIn, minTezOut.toString())
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async tokenToTokenSwap(
    tokensIn,
    minTokensOut,
    tokenOutAddress,
    options = {}
  ) {
    const approve = options.approve || true;
    const confirmation = options.confirmation || true;
    const dexStorage = await this.getFullStorage();
    if (approve) {
      this.approveTokens(dexStorage.tokenAddress, this.dex.address, tokensIn);
    }

    const operation = await this.dex.methods
      .tokenToTokenSwap(tokensIn, minTokensOut, tokenOutAddress)
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async tokenToTokenPayment(
    tokensIn,
    minTokensOut,
    recipient,
    tokenOutAddress,
    options = {}
  ) {
    const approve = options.approve || true;
    const confirmation = options.confirmation || true;
    const dexStorage = await this.getFullStorage();
    if (approve) {
      this.approveTokens(dexStorage.tokenAddress, this.dex.address, tokensIn);
    }

    const operation = await this.dex.methods
      .tokenToTokenPayment(tokensIn, minTokensOut, recipient, tokenOutAddress)
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async tokenToTezPayment(tokensIn, receiver, options = {}) {
    let minTezOut = options.minTezOut || null;
    const approve = options.approve || true;
    const confirmation = options.confirmation || true;

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
      this.approveTokens(dexStorage.tokenAddress, this.dex.address, tokensIn);
    }

    const operation = await this.dex.methods
      .tokenToTezPayment(tokensIn, minTezOut.toString(), receiver)
      .send();
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async tezToTokenPayment(tezIn, receiver, options) {
    let minTokensOut = options.minTokensOut || null;
    const confirmation = options.confirmation || true;

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

    const operation = await this.dex.methods
      .tezToTokenPayment(minTokensOut.toString(), receiver)
      .send({
        amount: tezIn
      });
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async investLiquidity(tezAmount, candidate, options = {}) {
    let minShares = options.minShares || null;
    let tokenAmount = options.tokenAmount || null;
    const approve = options.approve || true;
    const confirmation = options.confirmation || true;
    const dexStorage = await this.getFullStorage();
    if (!minShares) {
      const mutezAmount = parseFloat(tezAmount) * 1000000;

      minShares = parseInt(
        (mutezAmount / dexStorage.tezPool) * dexStorage.totalShares
      );
    }
    if (approve) {
      tokenAmount = tokenAmount
        ? tokenAmount
        : parseInt((minShares * dexStorage.tokenPool) / dexStorage.totalShares);
      this.approveTokens(
        dexStorage.tokenAddress,
        this.dex.address,
        tokenAmount
      );
    }

    const operation = await this.dex.methods
      .investLiquidity(minShares, candidate)
      .send({
        amount: tezAmount
      });
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async divestLiquidity(sharesBurned, options = {}) {
    let minTez = options.minTez || null;
    let minTokens = options.minTokens || null;
    const confirmation = options.confirmation || true;

    const dexStorage = await this.getFullStorage();

    const tezPerShare = parseInt(dexStorage.tezPool / dexStorage.totalShares);
    const tokensPerShare = parseInt(
      dexStorage.tokenPool / dexStorage.totalShares
    );
    if (!minTez) {
      minTez = tezPerShare * sharesBurned;
    }
    if (!minTokens) {
      minTokens = tokensPerShare * sharesBurned;
    }

    const operation = await this.dex.methods
      .divestLiquidity(
        sharesBurned.toString(),
        minTez.toString(),
        minTokens.toString()
      )
      .send({
        amount: tezAmount
      });
    if (confirmation) {
      await operation.confirmation();
    }
  }

  async deploy(feeRate, tokenAddress, factoryAddress, delegated, options = {}) {
    const balance = options.balance || 0;
    const confirmation = options.confirmation || false;
    const writePath = options.writePath || null;

    const operation = await this.tezosToolkit.contract.originate({
      code: JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "./code/Dex.json")).toString()
      ),
      storage: {
        feeRate,
        tezPool: "0",
        tokenPool: "0",
        invariant: "0",
        totalShares: "0",
        tokenAddress,
        factoryAddress,
        shares: {},
        candidates: {},
        votes: {},
        delegated
      },
      balance
    });
    if (confirmation) {
      await operation.confirmation();
    }
    this.dex = await operation.contract();
    if (writePath) {
      const detail = {
        address: this.dex.address
      };
      fs.writeFileSync(writePath, JSON.stringify(detail));
    }
  }

  setDex(dex) {
    this.dex = dex;
  }

  setTezosToolkit(tezosToolkit) {
    this.tezosToolkit = tezosToolkit;
  }
}
module.exports.DexClient = DexClient;
