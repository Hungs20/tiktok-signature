const { webkit, devices } = require("playwright-webkit");
const iPhone11 = devices["iPhone 11 Pro"];

class Signer {
  userAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36"
  args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-infobars",
    "--window-position=0,0",
    "--ignore-certifcate-errors",
    "--ignore-certifcate-errors-spki-list",
  ];

  constructor(userAgent, tac, browser) {
    if (userAgent) {
      this.userAgent = userAgent;
    }

    if (tac) {
      this.tac = tac;
    }

    if (browser) {
      this.browser = browser;
      this.isExternalBrowser = true;
    }

    this.args.push(`--user-agent="${this.userAgent}"`);

    this.options = {
      args: [],
      ignoreDefaultArgs: ["--mute-audio", "--hide-scrollbars"],
      headless: true,
      ignoreHTTPSErrors: true,
      chromiumSandbox: false
    };
  }

  async init() {
    if (!this.browser) {
      this.browser = await webkit.launch(this.options);
    } else {
      this.browser = await this.browser.launch(this.options);
    }

    let emulateTemplate = { ...iPhone11 };
    emulateTemplate.viewport.width = getRandomInt(320, 1920);
    emulateTemplate.viewport.height = getRandomInt(320, 1920);

    this.context = await this.browser.newContext({
      userAgent: this.userAgent,
    });

    // const cookies = fs.readFileSync('./config/cookies.json', 'utf8')

    // const deserializedCookies = JSON.parse(cookies)
    // await this.context.addCookies(deserializedCookies)
  
    this.page = await this.context.newPage();
    await this.page.goto("https://www.tiktok.com/@rihanna?lang=en", {
      waitUntil: "load",
    });
    // Uncomment the following line for unwanted audio
    // await this.page.click(".swiper-wrapper");

    if (this.tac) {
      await this.page.evaluate((x) => {
        window.tac = x;
      }, this.tac);
    }

    await this.page.evaluate(() => {

      if (typeof window.byted_acrawler.sign !== "function") {
        throw "No function found";
      }

      window.generateSignature = function generateSignature(
        url,
        verifyFp = null
      ) {
        let newUrl = url;
        if (verifyFp) {
          newUrl = newUrl + "&verifyFp=" + verifyFp;
        }
        return window.byted_acrawler.sign({ url: newUrl });
      };
    }, this.tac);

    return this;
  }

  async sign(str) {
    let verifyFp = await this.getVerifyFp();
    let res = await this.page.evaluate(
      `generateSignature("${str}", "${verifyFp}")`
    );
    return res;
  }

  async getVerifyFp() {
    var content = await this.context.cookies();
    for (let cookie of content) {
      if (cookie.name == "s_v_web_id") {
        return cookie.value;
      }
    }
    return null;
  }

  async getCookies() {
    return this.page.evaluate('document.cookie;');
  }

  async close() {
    if (this.browser && !this.isExternalBrowser) {
      await this.browser.close();
      this.browser = null;
    } else if(this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    if (this.page) {
      this.page = null;
    }
  }
}

function getRandomInt(a, b) {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  const diff = max - min + 1;
  return min + Math.floor(Math.random() * Math.floor(diff));
}

module.exports = Signer;
