import dotenv from "dotenv";
dotenv.config();

export default {
  apiKey: process.env.API_KEY,
  siteKey: "0x4AAAAAAA6vnrvBCtS4FAl-",
  pageUrl: "https://irys.xyz/faucet",
  claimUrl: "https://irys.xyz/faucet", // Ganti jika endpoint berbeda
  pollingInterval: 10000, // 10 detik
};
