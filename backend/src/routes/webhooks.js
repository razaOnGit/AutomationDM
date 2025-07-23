const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Webhook verification (GET request from Facebook)
router.get('/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      logger.info('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      logger.error('Webhook verification failed - invalid token');
      res.sendStatus(403);
    }
  } else {
    logger.error('Webhook verification failed - missing parameters');
    res.sendStatus(400);
  }
});

// Webhook event handler (POST request from Facebook)
router.post('/instagram', (req, res) => {
  const body = req.body;

  // Check if this is a page subscription
  if (body.object === 'instagram') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach((entry) => {
      // Get the webhook event
      const webhookEvent = entry.changes[0];
      
      logger.info('Received webhook event:', {
        field: webhookEvent.field,
        value: webhookEvent.value
      });

      // Handle different types of webhook events
      if (webhookEvent.field === 'comments') {
        handleCommentEvent(webhookEvent.value);
      } else if (webhookEvent.field === 'mentions') {
        handleMentionEvent(webhookEvent.value);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Handle comment events
function handleCommentEvent(commentData) {
  logger.info('Processing comment event:', commentData);
  
  // TODO: Process comment for workflow triggers
  // This will integrate with the comment monitoring system
}

// Handle mention events
function handleMentionEvent(mentionData) {
  logger.info('Processing mention event:', mentionData);
  
  // TODO: Process mention for workflow triggers
}

module.exports = router;