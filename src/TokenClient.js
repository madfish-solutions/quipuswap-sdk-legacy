class TokenClient {
  constructor(token = null) {
    this.token = token;
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

  setToken = token => {
    this.token = token;
  };
}
export default TokenClient;
