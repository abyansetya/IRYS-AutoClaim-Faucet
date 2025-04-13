const { ethers } = require("ethers");

function createWallet(privateKey, provider) {
  return new ethers.Wallet(privateKey, provider);
}

function getAddress(privateKey, provider) {
  const wallet = createWallet(privateKey, provider);
  return wallet.address;
}

function generateNewWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privatekey: wallet.privateKey,
  };
}

module.exports = { createWallet, getAddress, generateNewWallet };
