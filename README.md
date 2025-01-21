# Rate Limiter

A simple **Rate Limiter** implementation using the **Token Bucket Algorithm**. This project controls the number of requests a user can make within a specified time period, preventing server overload and ensuring fair usage.

## Features
- Implements the **Token Bucket Algorithm**.
- Configurable request limit and refill rate.
- In-memory request tracking.
- Handles rate-limited requests with appropriate error responses.

## Installation

Clone the repository:
git clone https://github.com/TANJUMAJERIN/rate-limiter.git
  
Install dependencies:
npm install  
Start the server:
npm start  
Send requests to the server:
curl http://localhost:3000/api/endpoint  
Requests exceeding the rate limit will receive a throttling message.

## Configuration
Adjust the rate limiter settings in config.js:

Limit: Max requests allowed.  
Refill Rate: Speed at which tokens are refilled.  
Time Window: Duration of the request limit.
