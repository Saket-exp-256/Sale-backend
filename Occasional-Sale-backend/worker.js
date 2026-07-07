const { Worker } = require('bullmq');
const mongoose = require('mongoose');

// MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/flash_sale')
  .then(() => console.log('Connected safely to MongoDB'))
  .catch(err => console.error(err));

// Order Schema Definition
const Order = mongoose.model('Order', new mongoose.Schema({
    userId: String,
    item: String,
    timestamp: Date
}));

// Initialize Worker to consume jobs from 'orderQueue'
const worker = new Worker('orderQueue', async (job) => {
    console.log(`Background Worker: Processing booked item for User ${job.data.userId}`);
    
    // Perform data persistency operation
    const newOrder = new Order({
        userId: job.data.userId,
        item: job.data.item,
        timestamp: job.data.timestamp
    });
    
    await newOrder.save();
}, { connection: { host: '127.0.0.1', port: 6379 } });

console.log('Workers ready and listening for queue items...');