import axios from "axios";
import fs from "fs";
import config from "./config/config.js";
import { solveTurnstileCaptchaManually } from './solver/twoCaptchaSolver.js'; 
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { logger } from "./solver/logger.js";

// Load proxies from file
function loadProxies() {
  try {
    const content = fs.readFileSync("./config/proxies.txt", "utf8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch (error) {
    console.error("Error loading proxies:", error.message);
    return [];
  }
}

// Ambil proxy acak
function getRandomProxy(proxies) {
  if (!proxies.length) return null;
  return proxies[Math.floor(Math.random() * proxies.length)];
}

// Buat proxy agent
function createProxyAgent(proxy) {
  if (!proxy) return null;

  if (proxy.startsWith("socks4://") || proxy.startsWith("socks5://")) {
    const proxyType = proxy.startsWith("socks5") ? "SOCKS5" : "SOCKS4";
    console.log(`Proxy ${proxyType} dari proxies.txt digunakan: ${proxy}`);
    return new SocksProxyAgent(proxy);
  }

  const url =
    proxy.startsWith("http://") || proxy.startsWith("https://")
      ? proxy
      : `http://${proxy}`;
  console.log(`Proxy HTTP dari proxies.txt digunakan: ${url}`);
  return new HttpsProxyAgent(url);
}

// Klaim faucet
async function claimFaucet(token, wallet) {
  const proxies = loadProxies();
  const proxy = getRandomProxy(proxies);
  const agent = proxy ? createProxyAgent(proxy) : null;

  try {
    const response = await axios.post(
      "https://irys.xyz/api/faucet",
      {
        captchaToken: token,
        walletAddress: wallet,
      },
      {
        httpsAgent: agent,
        proxy: false,
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
          origin: "https://irys.xyz",
          referer: "https://irys.xyz/faucet",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        },
      }
    );
    return response.data;
  } catch (error) {
    logger.error(`Gagal klaim untuk wallet ${wallet}: ${error.message}`);
    if (error.response) {
      logger.warning(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// Main function
async function Main() {
  const wallets = fs.readFileSync('./config/wallets.txt', 'utf-8')
    .split('\n')
    .map(w => w.trim())
    .filter(Boolean);

  for (const wallet of wallets) {
    try {
      logger.wallet(`\nMemproses wallet: ${wallet}`);
      logger.processing("Mendapatkan token captcha...");

      const token = await solveTurnstileCaptchaManually(
        config.apiKey,
        config.siteKey,
        config.pageUrl
      );

      logger.success("Token captcha berhasil diambil.");
      logger.processing("Mengirim request klaim faucet...");

      const result = await claimFaucet(token, wallet);

      if (result) {
        logger.success(`Berhasil klaim untuk wallet ${wallet}`);
        logger.result("Status", result.message || "Tidak ada pesan");
      } else {
        logger.error(`Gagal klaim untuk wallet ${wallet}`);
      }

      logger.divider();

    } catch (error) {
      logger.error(`Terjadi error saat memproses wallet ${wallet}: ${error.message}`);
      logger.divider();
    }
  }
}

Main();


// export default async function claimFaucet() {
//   // 1. Meminta code request ke 2Captcha
//   try {
//     console.log("Meminta code request ke 2Captcha...");
//     const requestRes = await fetch(
//       "https://2captcha.com/in.php?method=turnstile&key=9ff167ec4159017d0406bbc23ccc8726&sitekey=0x4AAAAAAA6vnrvBCtS4FAl-&pageurl=https://irys.xyz/faucet&json=1"
//     );
//     const requestData = await requestRes.json();

//     console.log("Response code request:", requestData);

//     if (requestData.status !== 1) {
//       throw new Error("Gagal mendapatkan code request");
//     }
//     const requestId = requestData.request; // ambil ID request

//     console.log("Mendapatkan ID request dari 2Captcha:", requestId);

//     // 2. Polling untuk mendapatkan captcha token dari 2Captcha
//     console.log("Menunggu 2Captcha untuk memberikan token...");
//     let token = null;
//     let attempts = 0;

//     while (attempts < 10 && !token) {
//       attempts++;
//       const res = await fetch(
//         `https://2captcha.com/res.php?key=9ff167ec4159017d0406bbc23ccc8726&action=get&id=${requestId}&json=1`
//       );
//       const resData = await res.json();

//       console.log(`Polling ke- ${attempts}:`, resData);

//       if (resData.status === 1) {
//         token = resData.request; // Menyimpan captcha token
//         console.log("Captcha token berhasil didapatkan:", token);
//       } else {
//         console.log("Captcha token belum siap, mencoba lagi...");
//       }

//       // Menunggu beberapa detik sebelum mencoba polling lagi
//       await new Promise((resolve) => setTimeout(resolve, 5000)); // Delay 5 detik
//     }

//     if (!token) {
//       throw new Error(
//         "Gagal mendapatkan captcha token setelah beberapa percobaan"
//       );
//     }

//     // 3. Klaim faucet menggunakan captcha token yang sudah didapat
//     console.log("Mengklaim faucet dengan token:", token);
//     const wallet = "0x0F13858373c89DedD80e30941F1c207492cEcB4E"; // Ganti dengan wallet address yang sesuai

//     // Menampilkan body yang akan dikirimkan ke API faucet
//     const bodyData = {
//       captchaToken: token,
//       walletAddress: wallet,
//     };
//     console.log(
//       "Request body untuk klaim faucet:",
//       JSON.stringify(bodyData, null, 2)
//     );

//     // Melakukan request ke API faucet
//     const faucetRes = await fetch("https://irys.xyz/api/faucet", {
//       method: "POST",
//       headers: {
//         accept: "*/*",
//         "accept-language": "en-US,en;q=0.9",
//         "content-type": "application/json",
//         cookie:
//           "_ga=GA1.1.1789093224.1743780906; _ga_EG4KQLLHZ6=GS1.1.1744125446.1.0.1744125446.0.0.0; _ga_N7ZGKKSTW8=GS1.1.1744554710.10.0.1744554710.0.0.0",
//         origin: "https://irys.xyz",
//         priority: "u=1, i",
//         referer: "https://irys.xyz/faucet",
//         "sec-ch-ua":
//           '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
//         "sec-ch-ua-mobile": "?0",
//         "sec-ch-ua-platform": '"Windows"',
//         "sec-fetch-dest": "empty",
//         "sec-fetch-mode": "cors",
//         "sec-fetch-site": "same-origin",
//         "user-agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
//       },
//       body: JSON.stringify(bodyData), // Mengirimkan body request
//     });

//     const faucetData = await faucetRes.json();
//     console.log("Response klaim faucet:", faucetData);
//   } catch (error) {
//     console.error("Terjadi error:", error);
//   }
// }

// claimFaucet();
