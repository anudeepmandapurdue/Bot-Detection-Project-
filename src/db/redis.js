const { createClient } = require("redis");

const redisClient = createClient();
redisClient.on('error', (err) => console.error('Redis Client Error', err)); //event listener


//connect when app stats
(async () => {
    try{
        await redisClient.connect();
        console.log("Redis Cache connected");
    }
    catch(err){
        console.error("Redis Connection failed");
    }
})();


module.exports = redisClient;