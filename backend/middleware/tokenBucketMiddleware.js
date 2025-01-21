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


async function tokenBucketMiddleware(req, res, next) {
    try {
        
        if (!redis.isOpen) {
            console.log('Redis client is not connected');
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        
        const clientIP = req.ip || 'default_ip';
        const key = `${clientIP}:tokens`;
        const currentTime = Date.now();
        const rateLimitConfig = {
            limit: 10, 
            refillTime: 60000, //in milisecond,60s        
            };

     
        const windowStart = currentTime - rateLimitConfig.refillTime;
        await redis.zRemRangeByScore(key, 0, windowStart);

    
        const tokenCount = await redis.zCard(key);//curent # token

      
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', 
            'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After'
        );

     
        res.setHeader('X-RateLimit-Limit', rateLimitConfig.limit.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimitConfig.limit - tokenCount).toString());

        if (tokenCount >= rateLimitConfig.limit) {
         
            const oldestTokenResult = await redis.zRange(key, 0, 0, { withScores: true });

            let oldestTokenScore;
            if (oldestTokenResult && oldestTokenResult.length > 1) {
               
                oldestTokenScore = parseInt(oldestTokenResult[1], 10);
            } else {
                
                console.warn('No tokens found when calculating retry time');
                oldestTokenScore = currentTime;
            }

            
            const resetTime = Math.ceil((oldestTokenScore + rateLimitConfig.refillTime) / 1000);
            const retryAfter = Math.max(1, resetTime - Math.ceil(currentTime / 1000));

            console.log('Debug retry calculation:', {
                oldestTokenScore,
                currentTime,
                resetTime,
                retryAfter
            });

            res.setHeader('X-RateLimit-Reset', resetTime.toString());
            res.setHeader('Retry-After', retryAfter.toString());

           
            return res.status(429).json({ 
                message: 'Rate limit exceeded',
                retryAfter: retryAfter,
                limit: rateLimitConfig.limit,
                remaining: 0,
                reset: resetTime
            });
        }

        
        await redis.zAdd(key, { score: currentTime, value: currentTime.toString() });

        
        await redis.expire(key, Math.ceil(rateLimitConfig.refillTime / 1000));

       
        const resetTime = Math.ceil((currentTime + rateLimitConfig.refillTime) / 1000);
        res.setHeader('X-RateLimit-Reset', resetTime.toString());

       
        next();
    } catch (error) {
        console.error('Error in tokenBucketMiddleware:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = tokenBucketMiddleware;
