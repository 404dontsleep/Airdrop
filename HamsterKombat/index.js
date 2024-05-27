const { GET, POST } = require("../Async_Request");
class HamsterKombat {
  constructor(token) {
    this.token = token;
    this.clickerUser = {};
    this.loop = null;
  }
  display() {
    console.log(
      "ID:",
      this.clickerUser.id.slice(0, -5) + "xxxxx" || 0,
      "Coin:",
      Math.floor(this.clickerUser.balanceCoins || 0),
      "Earn per Hour:",
      this.clickerUser.earnPassivePerHour || 0,
      "Level:",
      this.clickerUser.level || 0
    );
  }
  async sync() {
    const res = await POST({
      url: "https://api.hamsterkombat.io/clicker/sync",
      headers: {
        "content-type": "application/json",
        authorization: this.token,
      },
      json: true,
    });
    return res;
  }
  async tap() {
    try {
      const { body } = await this.sync();
      const { clickerUser } = body;
      if (clickerUser) {
        this.clickerUser = clickerUser;
        const { availableTaps, earnPerTap } = clickerUser;
        const timestamp = Math.floor(Date.now() / 1000);
        const count = Math.floor(availableTaps / earnPerTap);
        const _availableTaps = availableTaps - count * earnPerTap;
        const { body: res } = await POST({
          url: "https://api.hamsterkombat.io/clicker/tap",
          headers: {
            authorization: this.token,
          },
          body: {
            count,
            availableTaps: _availableTaps,
            timestamp,
          },
          json: true,
        });
        if (res && res.clickerUser) {
          console.log(
            "ID:",
            res.clickerUser.id.slice(0, -5) + "xxxxx",
            "Tap:",
            count
          );
          this.clickerUser = res.clickerUser;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  async boostsForBuy() {
    const res = await POST({
      url: "https://api.hamsterkombat.io/clicker/boosts-for-buy",
      headers: {
        authorization: this.token,
      },
      json: true,
    });
    return res;
  }
  async buyBoostFullAvailableTaps() {
    const boostId = "BoostFullAvailableTaps";
    const { body } = await this.boostsForBuy();
    const { boostsForBuy } = body;
    const boost = boostsForBuy.find((b) => b.id === boostId);
    if (boost && boost.cooldownSeconds === 0 && boost.level <= boost.maxLevel) {
      const { body: res } = await POST({
        url: "https://api.hamsterkombat.io/clicker/buy-boost",
        headers: {
          authorization: this.token,
        },
        body: {
          boostId,
          timestamp: Math.floor(Date.now() / 1000),
        },
        json: true,
      });
      if (res && res.boostsForBuy) {
        console.log(
          "ID:",
          res.clickerUser.id.slice(0, -5) + "xxxxx",
          "Hồi năng lượng thành công"
        );
      }
    }
  }
  async upgradesForBuy() {
    const res = await POST({
      url: "https://api.hamsterkombat.io/clicker/upgrades-for-buy",
      headers: {
        authorization: this.token,
      },
      json: true,
    });
    return res;
  }
  async buyBestUpgrade() {
    const { body } = await this.upgradesForBuy();
    const { upgradesForBuy } = body;
    const uFilter = upgradesForBuy.filter(
      (u) =>
        (u.cooldownSeconds == undefined || u.cooldownSeconds == 0) &&
        u.isAvailable &&
        !u.isExpired
    );
    const uSort = uFilter.sort(
      (b, a) => a.profitPerHourDelta / a.price - b.profitPerHourDelta / b.price
    );
    const upgrade = uSort[0];
    if (
      this.clickerUser.balanceCoins >= 10000 &&
      upgrade &&
      upgrade.price <= this.clickerUser.balanceCoins
    ) {
      const { body: res } = await POST({
        url: "https://api.hamsterkombat.io/clicker/buy-upgrade",
        headers: {
          authorization: this.token,
        },
        body: {
          upgradeId: upgrade.id,
          timestamp: Date.now(),
        },
        json: true,
      });
      if (res && res.clickerUser) {
        this.clickerUser = res.clickerUser;
        console.log(
          "ID:",
          res.clickerUser.id.slice(0, -5) + "xxxxx",
          "Upgrade:",
          upgrade.id,
          "Combo:",
          res.dailyCombo.upgradeIds
        );
      }
    } else {
      console.log(
        "ID:",
        this.clickerUser.id.slice(0, -5) + "xxxxx",
        "Upgrade:",
        upgrade.id,
        "Price:",
        upgrade.price
      );
    }
  }
  async list_task() {
    const res = await POST({
      url: "https://api.hamsterkombat.io/clicker/list-tasks",
      headers: {
        authorization: this.token,
      },
      json: true,
    });
    return res;
  }
  async dailyTask() {
    const { body } = await this.list_task();
    if (body?.tasks) {
      const task = body.tasks.find(
        (t) => t.id == "streak_days" && t.isCompleted == false
      );
      if (task) {
        const { body: res } = await POST({
          url: "https://api.hamsterkombat.io/clicker/check-task",
          headers: {
            authorization: this.token,
          },
          body: {
            taskId: task.id,
          },
          json: true,
        });
        if (res && res.clickerUser) {
          console.log(
            "ID:",
            res.clickerUser.id.slice(0, -5) + "xxxxx",
            "Task:",
            task.id,
            "Claim:",
            task.rewardCoins
          );
          this.clickerUser = res.clickerUser;
        }
      }
    }
    return body;
  }
  async run() {
    const MILISECOND_PER_1_MINUTES = 1000 * 60; // Thời gian loop Nếu chạy nhiều thì set cao lên tầm 5p 10p gì đó
    this.loop = setInterval(async () => {
      await this.tap();
      await this.dailyTask(); // Auto điểm danh
      await this.buyBoostFullAvailableTaps(); // Auto refill taps
      await this.buyBestUpgrade(); // Auto upgrade ... ( hên xui )
      this.display();
    }, MILISECOND_PER_1_MINUTES);
  }
  async stop() {
    clearInterval(this.loop);
  }
}

module.exports = HamsterKombat;
