const fetch = require('node-fetch')
const crypto = require('crypto')
const { Core } = require('@adobe/aio-sdk')

const SUBSCRIBER_STATUS_SUBSCRIBED = 1

async function main(params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('Newsletter event received')
    logger.debug('Params:', JSON.stringify(params, null, 2))

    // Extract event data
    const eventData = params.data?.value || params.event || params.data || {}
    
    const email  = eventData.subscriber_email
    const status = parseInt(eventData.subscriber_status)

    // Only handle new subscriptions — ignore everything else
    if (status !== SUBSCRIBER_STATUS_SUBSCRIBED) {
      logger.info(`Ignoring event with status ${status} for ${email}`)
      return { statusCode: 200, body: { success: true, message: 'Ignored - not a subscribe event' } }
    }

    if (!email) {
      logger.error('No email found in event data')
      return { statusCode: 200, body: { success: false, message: 'No email in payload' } }
    }

    logger.info(`Adding ${email} to Mailchimp...`)

    const result = await addOrUpdateMailchimpMember(email, params, logger)
    
    logger.info(`Mailchimp result for ${email}:`, JSON.stringify(result))

    return {
      statusCode: 200,
      body: {
        success: result.success,
        email: email,
        mailchimp: result
      }
    }

  } catch (error) {
    logger.error('Unexpected error:', error.message)
    return {
      statusCode: 200,
      body: { success: false, error: error.message }
    }
  }
}

async function addOrUpdateMailchimpMember(email, params, logger) {
  const apiKey  = params.MAILCHIMP_API_KEY
  const server  = params.MAILCHIMP_SERVER
  const listId  = params.MAILCHIMP_LIST_ID

  // MD5 hash of lowercase email = Mailchimp subscriber hash
  const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex')

  // Use PUT /members/{hash} — this creates OR updates (upsert)
  // So we never get "member already exists" errors
  const url = `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members`

  const payload = {
    email_address: email,
    status_if_new: 'subscribed', // Only sets status if member is NEW
    status: 'subscribed',        // Also re-subscribes if they were previously unsubscribed
    tags: ['Magento']
  }

  logger.debug('Calling Mailchimp:', url)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()

  if (response.ok) {
    return {
      success: true,
      memberId: data.id,
      emailAddress: data.email_address,
      status: data.status
    }
  } else {
    logger.error('Mailchimp API error:', JSON.stringify(data))
    return {
      success: false,
      error: data.detail || data.title || 'Unknown Mailchimp error',
      status: response.status
    }
  }
}

exports.main = main