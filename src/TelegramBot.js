import fetch from "node-fetch";

export class TelegramBot {
  #TG_CHAT_ID = "";
  #BASE__URL = "";

  constructor(API_KEY, TG_CHAT_ID) {
    this.#TG_CHAT_ID = TG_CHAT_ID;
    this.#BASE__URL = `https://api.telegram.org/bot${API_KEY}/`;
  }

  async sendMessage(message) {
    const fullHttpLink = this.#getFullLink(message, "sendMessage");
    await fetch(fullHttpLink);
  }

  #getFullLink(message, path) {
    const params = new URLSearchParams();
    params.set("chat_id", this.#TG_CHAT_ID);
    params.set("text", message);
    params.set("parse_mode", "MARKDOWN");
    return this.#BASE__URL + path + "?" + params.toString();
  }
}
