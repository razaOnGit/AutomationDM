# Setting Up ngrok for Webhook Development

## Why ngrok?
Facebook webhooks need a publicly accessible URL to send events to your local development server.

## Installation
1. Download ngrok from https://ngrok.com/
2. Sign up for free account
3. Install ngrok

## Usage
1. Start your backend server:
   ```bash
   npm run dev
   ```

2. In another terminal, start ngrok:
   ```bash
   ngrok http 5000
   ```

3. Copy the HTTPS URL (something like: https://abc123.ngrok.io)

4. Use this URL in Facebook Developer Console:
   ```
   https://abc123.ngrok.io/api/webhooks/instagram
   ```

## Important Notes
- Always use the HTTPS URL (not HTTP)
- The ngrok URL changes each time you restart it
- For production, use your actual domain