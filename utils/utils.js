const { BigNumber } = require("@ethersproject/bignumber");

function timeout() {
  return new Promise((resolve) => setTimeout(resolve, 1000));
}

function tokens(val) {
  return BigNumber.from(val).mul(BigNumber.from("10").pow(18)).toString();
}

module.exports = {
  timeout,
  tokens,
};
