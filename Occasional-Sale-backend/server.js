const express = require('express');
const Redis = require('ioredis');
const { Queue } = require('bullmq');

const app = express();
app.use(express.json());

// Redis
const redis = new Redis({ host: '127.0.0.1', port: 6379 });
// BullMQ Queue
const orderQueue = new Queue('orderQueue', { connection: { host: '127.0.0.1', port: 6379 } });

// Atomic Lua Script
const luaDecreaseInventory = `
  local currentInventory = tonumber(redis.call('get', KEYS[1]))
  if currentInventory and currentInventory > 0 then
    redis.call('decr', KEYS[1])
    return 1
  else
    return 0
  end
`;

// Endpoint to bootstrap initial inventory for testing
app.post('/init', async (req, res) => {
    const { count } = req.body;
    await redis.set('item:iphone15:inventory', count);
    return res.status(200).json({ message: `Inventory initialized to ${count}` });
});

// The High-Concurrency Checkout Route
app.post('/checkout', async (req, res) => {
    const { userId } = req.body;
    const itemKey = 'item:iphone15:inventory';

    try {
        const result = await redis.eval(luaDecreaseInventory, 1, itemKey);

        if (result === 1) {
            await orderQueue.add('processOrder', {
                userId,
                item: 'iphone15',
                timestamp: new Date()
            });

            return res.status(200).json({ success: true, message: "Order placed in queue!" });
        } else {
            return res.status(400).json({ success: false, message: "Sold out!" });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(3000, () => console.log(' Express Gateway running on port 3000'));