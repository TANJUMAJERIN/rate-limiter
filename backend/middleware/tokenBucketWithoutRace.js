const { createClient } = require('@redis/client');

const redis = createClient({
    url: 'redis://localhost:6379'
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('Redis client connected');
});

redis.connect().catch((err) => {
    console.error('Error connecting to Redis:', err);
});


async function tokenBucketWithoutRace(req, res, next) {
    try {
        if (!redis.isOpen) {
            console.log('Redis client is not connected');
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        const clientIP = req.ip || 'default_ip';
        const key = `${clientIP}:tokens`;
        const rateLimitConfig = {
            limit: 10,
            refillTime: 60000,
        };

      
        await new Promise(resolve => setTimeout(resolve, 100));

       
        let currentTokens = 0;
        const existingTokens = await redis.get(key);
        
        if (existingTokens) {
            currentTokens = parseInt(existingTokens, 10);
          
            if (currentTokens >= rateLimitConfig.limit) {
                return res.status(429).json({
                    message: 'Rate limit exceeded',
                    limit: rateLimitConfig.limit,
                    remaining: 0
                });
            }
        }

      
        await new Promise(resolve => setTimeout(resolve, 50));

     
        const newTokenCount = currentTokens + 1;
        await redis.set(key, newTokenCount.toString());
        
       
        await redis.expire(key, Math.ceil(rateLimitConfig.refillTime / 1000));

     
        res.setHeader('X-RateLimit-Limit', rateLimitConfig.limit.toString());
        res.setHeader('X-RateLimit-Remaining', (rateLimitConfig.limit - newTokenCount).toString());

        next();
    } catch (error) {
        console.error('Error in failingTokenBucket:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = tokenBucketWithoutRace;

