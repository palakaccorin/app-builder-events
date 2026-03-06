const { Core } = require('@adobe/aio-sdk')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    logger.info('=== Catalog Product Save Event Received ===')

    // Log all incoming parameters for debugging
    logger.debug('Full params:', JSON.stringify(params, null, 2))

    // Handle Adobe I/O Events challenge (verification)
    if (params.challenge) {
      logger.info('Responding to Adobe I/O challenge')
      return {
        statusCode: 200,
        body: {
          challenge: params.challenge
        }
      }
    }

    // Extract event data from the payload
    // Adobe I/O Events sends data in params.event or params.data
    const eventData = params.event || params.data || {}
    
    logger.info('Event data received:', eventData)

    // Access specific fields from your Magento event
    const productId = eventData.product_id
    const sku = eventData.sku
    const productName = eventData.name
    const status = eventData.status

    logger.info(`Product saved - ID: ${productId}, SKU: ${sku}, Name: ${productName}`)

    // YOUR BUSINESS LOGIC HERE
    // Examples:
    // - Send to external CRM
    // - Update search index
    // - Trigger notifications
    // - Sync to other systems

    const response = {
      statusCode: 200,
      body: {
        success: true,
        message: 'Product save event processed successfully',
        productId: productId,
        sku: sku,
        timestamp: new Date().toISOString()
      }
    }

    logger.info('Event processed successfully')
    return response

  } catch (error) {
    logger.error('Error processing event:', error)
    // Return 200 anyway to prevent retries for permanent errors
    return {
      statusCode: 200,
      body: {
        success: false,
        error: error.message
      }
    }
  }
}

exports.main = main