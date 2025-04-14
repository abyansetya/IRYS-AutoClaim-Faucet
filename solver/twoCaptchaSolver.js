import axios from "axios";
import { logger } from "./logger.js"; // Assuming logger.js is in the same directory

let lastCaptchaId = null;

/**
 * Memproses Turnstile CAPTCHA secara manual via 2Captcha.
 * @param {string} apiKey - API key dari 2Captcha.
 * @param {string} siteKey - Turnstile sitekey (data-sitekey).
 * @param {string} pageUrl - URL halaman tempat captcha berada.
 * @returns {Promise<string>} - Token captcha yang berhasil diselesaikan.
 */
export async function solveTurnstileCaptchaManually(apiKey, siteKey, pageUrl) {
  try {
    logger.processing("Mengirim permintaan solving captcha ke 2Captcha...");
    const { data: json } = await axios.get(
      `https://2captcha.com/in.php?method=turnstile&key=${apiKey}&sitekey=${siteKey}&pageurl=${pageUrl}&json=1`
    );

    if (json.status !== 1) {
      throw new Error("Gagal mengirim captcha ke 2Captcha: " + json.request);
    }

    const requestId = json.request;
    lastCaptchaId = requestId;
    logger.success("ID captcha berhasil diperoleh: " + requestId);

    let token = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts && !token) {
      await new Promise((res) => setTimeout(res, 8000)); // tunggu 5 detik
      attempts++;

      const { data: pollJson } = await axios.get(
        `https://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`
      );

      logger.processing(`Polling #${attempts}: ${JSON.stringify(pollJson)}`);

      if (pollJson.status === 1) {
        token = pollJson.request;
        logger.success("✅ Token captcha berhasil");
      } else {
        logger.processing("⏳ Token belum siap, mencoba lagi...");
      }
    }

    if (!token) {
      throw new Error(
        "❌ Gagal memperoleh token captcha setelah beberapa kali percobaan."
      );
    }

    return token;
  } catch (error) {
    logger.error("⚠️ Error saat solve captcha: " + error.message);
    throw error;
  }
}

/**
 * Menandai token captcha terakhir sebagai benar.
 */
export async function reportGoodCaptcha(apiKey) {
  if (!lastCaptchaId) return;
  try {
    await axios.get(
      `https://2captcha.com/res.php?key=${apiKey}&action=reportgood&id=${lastCaptchaId}`
    );
    logger.success("👍 Berhasil melaporkan captcha sebagai benar.");
    lastCaptchaId = null;
  } catch (error) {
    logger.error("❌ Gagal report good: " + error.message);
  }
}

/**
 * Menandai token captcha terakhir sebagai salah.
 */
export async function reportBadCaptcha(apiKey) {
  if (!lastCaptchaId) return;
  try {
    await axios.get(
      `https://2captcha.com/res.php?key=${apiKey}&action=reportbad&id=${lastCaptchaId}`
    );
    logger.success("👎 Berhasil melaporkan captcha sebagai salah.");
    lastCaptchaId = null;
  } catch (error) {
    logger.error("❌ Gagal report bad: " + error.message);
  }
}

export default {
  solveTurnstileCaptchaManually,
  reportGoodCaptcha,
  reportBadCaptcha,
};
