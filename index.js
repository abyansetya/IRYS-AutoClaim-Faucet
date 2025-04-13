import axios from "axios";
import fs from "fs";
import config from "./config/config.js";
import { solveTurnstile } from "./solver/twoCaptchaSolver.js";

// async function claimFaucet(token, wallet) {
//   const response = await axios.post(
//     "https://irys.xyz/api/faucet",
//     {
//       captchaToken: token,
//       walletAddress: wallet,
//     },
//     {
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
//     }
//   );

//   return response.data;
// }

// async function Main(){
//     const wallets = fs.readFileSync('./config/pk.txt', 'utf-8')
//         .split('\n')
//         .map(w => w.trim())
//         .filter(Boolean)

//     for (const wallet in wallets) {
//         try{
//             const token = await solveTurnstile(
//                 config.apiKey,
//                 config.siteKey,
//                 config.pageUrl,
//                 config.pollingInterval
//             )

//             const result =
//         }
//     }
// }

export default async function claimFaucet() {
  // 1. Meminta code request ke 2Captcha
  try {
    console.log("Meminta code request ke 2Captcha...");
    const requestRes = await fetch(
      "https://2captcha.com/in.php?method=turnstile&key=9ff167ec4159017d0406bbc23ccc8726&sitekey=0x4AAAAAAA6vnrvBCtS4FAl-&pageurl=https://irys.xyz/faucet&json=1"
    );
    const requestData = await requestRes.json();

    console.log("Response code request:", requestData);

    if (requestData.status !== 1) {
      throw new Error("Gagal mendapatkan code request");
    }
    const requestId = requestData.request; // ambil ID request

    console.log("Mendapatkan ID request dari 2Captcha:", requestId);

    // 2. Polling untuk mendapatkan captcha token dari 2Captcha
    console.log("Menunggu 2Captcha untuk memberikan token...");
    let token = null;
    let attempts = 0;

    while (attempts < 10 && !token) {
      attempts++;
      const res = await fetch(
        `https://2captcha.com/res.php?key=9ff167ec4159017d0406bbc23ccc8726&action=get&id=${requestId}&json=1`
      );
      const resData = await res.json();

      console.log(`Polling ke- ${attempts}:`, resData);

      if (resData.status === 1) {
        token = resData.request; // Menyimpan captcha token
        console.log("Captcha token berhasil didapatkan:", token);
      } else {
        console.log("Captcha token belum siap, mencoba lagi...");
      }

      // Menunggu beberapa detik sebelum mencoba polling lagi
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Delay 5 detik
    }

    if (!token) {
      throw new Error(
        "Gagal mendapatkan captcha token setelah beberapa percobaan"
      );
    }

    // 3. Klaim faucet menggunakan captcha token yang sudah didapat
    console.log("Mengklaim faucet dengan token:", token);
    const wallet = "0x0F13858373c89DedD80e30941F1c207492cEcB4E"; // Ganti dengan wallet address yang sesuai

    // Menampilkan body yang akan dikirimkan ke API faucet
    const bodyData = {
      captchaToken: token,
      walletAddress: wallet,
    };
    console.log(
      "Request body untuk klaim faucet:",
      JSON.stringify(bodyData, null, 2)
    );

    // Melakukan request ke API faucet
    const faucetRes = await fetch("https://irys.xyz/api/faucet", {
      method: "POST",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        cookie:
          "_ga=GA1.1.1789093224.1743780906; _ga_EG4KQLLHZ6=GS1.1.1744125446.1.0.1744125446.0.0.0; _ga_N7ZGKKSTW8=GS1.1.1744554710.10.0.1744554710.0.0.0",
        origin: "https://irys.xyz",
        priority: "u=1, i",
        referer: "https://irys.xyz/faucet",
        "sec-ch-ua":
          '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(bodyData), // Mengirimkan body request
    });

    const faucetData = await faucetRes.json();
    console.log("Response klaim faucet:", faucetData);
  } catch (error) {
    console.error("Terjadi error:", error);
  }
}

claimFaucet();
