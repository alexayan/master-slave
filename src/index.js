import { EventEmitter } from "events";
import logger from "./utils/logger";
import getHost from "./utils/host";

const HOST = getHost();

export default class Client extends EventEmitter {
  constructor(redis, {
    beatInterval = 250,
    expire = 4,
    channel = "__REDIS_MASTER_SLAVE__"
  } = {}) {
    super();
    this.id = null;
    this.type = "offline";
    this.state = 0;
    this.timer = null;
    this.redis = redis;
    this.redischannel = redis.duplicate();
    this.beatInterval = beatInterval;
    this.expire = expire;
    this.channel = channel;
  }

  info(message) {
    logger.info(`[${this.channel}] [${this.clientId()}] [${this.type}]: ${message}`)
  }

  error(e) {
    logger.error(e);
  }

  clientId() {
    if (this.id) {
      return this.id;
    }
    const key = Math.random()
      .toString(36)
      .substr(2);
    this.id = `${HOST}_${key}`;
    return this.id;
  }

  isMaster() {
    return this.type === "master";
  }

  isSlave() {
    return this.type === "slave";
  }

  isAlive() {
    return this.state === 1;
  }

  connect() {
    if (!this.isAlive()) {
      this.info(`connected`);
      this.heartbeat();
      this.redischannel.subscribe(this.channel, (err, count) => {
        this.info(`join channel`);
        this.broadcastMessage({
          type: 'join'
        })
      });
      this.redischannel.on("message", (channel, message) => {
        if (channel === this.channel) {
          const data = JSON.parse(message);
          if (data.client === this.clientId()) {
            return;
          }
          this.info(
            `receive message \n\n\t${message}\n`
          );
          this.emit("message", data);
        }
      });
    }
  }

  broadcastMessage(message) {
    const data = {
      client: this.clientId(),
      type: this.type,
      message: message
    };
    this.redis.publish(this.channel, JSON.stringify(data));
  }

  changeToSlave() {
    if (this.isMaster()) {
      this.disconnect();
      setTimeout(() => {
        this.connect();
      }, this.expire * 1000 + 250);
    }
  }

  disconnect() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.redis.del(this.channel);
    this.redischannel.removeAllListeners();
    this.redischannel.unsubscribe(this.channel, (err, count) => {
      this.info(`leave channel`);
      this.broadcastMessage({
        type: 'leave'
      })
    });
    this.state = 0;
    this.info(`disconnected`);
    this.type = "offline";
    this.id = null;
    this.emit("change", this);
  }

  heartbeat() {
    this.state = 1;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(async () => {
      try {
        let isMaster =
          (await this.redis.setnx(this.channel, this.clientId())) === 1;
        if (!isMaster) {
          isMaster = (await this.redis.get(this.channel)) === this.clientId();
        }
        let newType = isMaster ? "master" : "slave";
        if (!this.isAlive()) {
          return;
        }
        if (newType !== this.type) {
          this.type = newType;
          this.info(`change type to ${newType}`);
          this.emit("change", this);
        }
        if (this.isMaster()) {
          await this.redis.expire(this.channel, this.expire);
        }
      } catch (e) {
        this.error(e);
      } finally {
        this.timer = setTimeout(() => {
          this.heartbeat();
        }, this.beatInterval);
      }
    }, this.beatInterval);
  }
}
