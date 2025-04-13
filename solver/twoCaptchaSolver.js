import TwoCaptcha from "@2captcha/captcha-solver";

let solver = null;
let lastCaptchaId = null;
let pollingInterval = 10;

function initializeSolver(apiKey, options = {}) {
  if (!apiKey) {
    throw new Error("2Captcha API key is required");
  }

  solver = new TwoCaptcha.Solver(apiKey);
  pollingInterval = options.pollingInterval || 10;
}

/**
 * Solves Cloudflare Turnstile CAPTCHA
 * @param {string} siteKey - The Turnstile sitekey (data-sitekey).
 * @param {string} pageUrl - The full URL of the page where the CAPTCHA is found.
 * @returns {Promise<string>} - The token to submit to Cloudflare.
 */
async function solveTurnstile(siteKey, pageUrl) {
  if (!solver) {
    throw new Error("Solver is not initialized. Call initializeSolver first.");
  }

  try {
    console.log("Solving Turnstile captcha with 2Captcha...");

    const result = await solver.turnstile({
      sitekey: siteKey,
      url: pageUrl,
    });

    if (!result || !result.data) {
      throw new Error("Failed to solve Turnstile captcha with 2Captcha");
    }

    lastCaptchaId = result.id;

    console.log(`2Captcha solved Turnstile token: ${result.data}`);
    return result.data;
  } catch (error) {
    console.log(`Turnstile solving error: ${error.message}`);
    throw error;
  }
}

async function reportGoodCaptcha() {
  if (!solver) return;
  try {
    if (!lastCaptchaId) {
      console.log("No captcha ID available for reporting");
      return;
    }

    await solver.goodReport(lastCaptchaId);
    console.log(`Reported correct solution for captcha ${lastCaptchaId}`);
    lastCaptchaId = null;
  } catch (error) {
    console.log(`Error reporting correct solution: ${error.message}`);
  }
}

async function reportBadCaptcha() {
  if (!solver) return;
  try {
    if (!lastCaptchaId) {
      console.log("No captcha ID available for reporting");
      return;
    }

    await solver.badReport(lastCaptchaId);
    console.log(`Reported incorrect solution for captcha ${lastCaptchaId}`);
    lastCaptchaId = null;
  } catch (error) {
    console.log(`Error reporting incorrect solution: ${error.message}`);
  }
}

export {
  initializeSolver,
  solveTurnstile,
  reportGoodCaptcha,
  reportBadCaptcha,
};
