import fetch from "node-fetch";

export class NodeFetcher {
  #BASE_URL = "";
  constructor(NODE_IP) {
    this.#BASE_URL = `http://${NODE_IP}/`;
  }

  async ping() {
    const url = this.#BASE_URL + "status";
    return await fetch(url);
  }

  async checkValidators() {
    return await fetch(this.#BASE_URL, {
      method: "POST",
      body: '{"jsonrpc": "2.0", "method": "validators", "id": "dontcare", "params": [null]}',
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
