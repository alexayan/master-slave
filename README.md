# master-slave

![Build Status](https://img.shields.io/travis/alexayan/master-slave.svg)
![Coverage](https://img.shields.io/coveralls/alexayan/master-slave.svg)
![Downloads](https://img.shields.io/npm/dm/master-slave.svg)
![Downloads](https://img.shields.io/npm/dt/master-slave.svg)
![npm version](https://img.shields.io/npm/v/master-slave.svg)
![dependencies](https://img.shields.io/david/alexayan/master-slave.svg)
![dev dependencies](https://img.shields.io/david/dev/alexayan/master-slave.svg)
![License](https://img.shields.io/npm/l/master-slave.svg)

Master-slave solution for single-point service based on redis

## Getting Started

Install it via npm:

```shell
npm install node-master-slave
```

And include in your project:

```javascript
import MasterSlaveClient from 'node-master-slave';
const client = new MasterSlaveClient(redis); // ioredis client

client.on("change", function(c) {
  console.log('isMaster: ', c.isMaster());
  console.log('isAlive: ', c.isAlive());
  if (c.isMaster()) {
    setTimeout(function() {
      c.broadcastMessage('test message');
      c.changeToSlave();
    }, Math.random() * 3000 + 2000)
  }
});

client.on("message", function(message) {
  console.log(message);
})

client.connect();
```

## Api

### new Client(redisConnection, {beatInterval = 250, expire = 4, channel = '__REDIS_MASTER_SLAVE__'}): client

构造函数

redisConnection: redis 连接, 推荐使用 `ioredis`

beatInterval: 心跳检测最大频率 (单位 ms)

expire: 心跳过期时间 (单位 s)

channel: master slave 集合标识

### client.isMaster(): boolean

是否是 master

### client.isSlave(): boolean

是否是 slave

### client.connect()

创建客户端连接

### client.disconnect()

断开客户端连接

### client.changeToSlave()

master 切换为 slave

### client.clientId(): string

客户端 id

### client.isAlive(): boolean

客户端是否已连接

### client.broadcastMessage(message)

master slave 集合广播消息

### client.on("change", () => {})

监听 `change` 事件, 当 master 和 slave 状态切换时触发回调

### client.on("message", () => {})

监听 `message` 事件, 收到 `broadcastMessage` 广播的消息后触发

## License

MIT
