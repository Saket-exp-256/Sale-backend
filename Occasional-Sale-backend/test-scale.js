const axios = require('axios');

async function runSimulation() {
    console.log('Initializing Redis Inventory to exactly 10 units...');
    await axios.post('http://localhost:3000/init', { count: 10 });

    console.log('Sending 200 concurrent checkout requests simultaneously...');

    const requestPool = [];
    for (let i = 1; i <= 200; i++) {
        requestPool.push(
            axios.post('http://localhost:3000/checkout', { userId: `user_${i}` })
                .then(res => ({ status: res.status, data: res.data }))
                .catch(err => ({ status: err.response ? err.response.status : 500, data: err.response ? err.response.data : null }))
        );
    }

    // Fire all requests concurrently
    const results = await Promise.all(requestPool);

    let successCount = 0;
    let soldOutCount = 0;
    let failedCount = 0;

    results.forEach(res => {
        if (res.status === 200) successCount++;
        else if (res.status === 400) soldOutCount++;
        else failedCount++;
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' SIMULATION TRAFFIC REPORT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`▶ Total Requests Sent      : ${results.length}`);
    console.log(` Successful Orders (200)  : ${successCount}  (Expected: 10)`);
    console.log(` Out of Stock Slapped(400): ${soldOutCount}`);
    console.log(` Network Crashes/Errors   : ${failedCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (successCount === 10) {
        console.log('Verification Success: Zero Overselling Detected under stress!');
    } else {
        console.log('Failure: Race condition or mismatch detected.');
    }
}

runSimulation();