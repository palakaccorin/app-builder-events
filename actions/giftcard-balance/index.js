const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils')
const D365Client = require('../utils/d365-client')

async function main (params) {
  const logger = Core.Logger('giftcard-balance', {
    level: params.LOG_LEVEL || 'info'
  })

  try {
    logger.info('Gift card balance request received')
    logger.debug(stringParameters(params))

    const requiredParams = ['giftCardId', 'giftCardPin']
    const requiredHeaders = []
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)

    if (errorMessage) {
      return errorResponse(400, errorMessage, logger)
    }

    const d365Client = new D365Client(params)

    logger.info(`Fetching balance for card ${params.giftCardId}`)

    const balance = await d365Client.getGiftCardBalance({
      giftCardId: params.giftCardId,
      giftCardPin: params.giftCardPin
    })

    return {
      statusCode: 200,
      body: balance
    }
  } catch (error) {
    logger.error('Gift card balance error', error)
    return errorResponse(500, 'Unable to fetch gift card balance', logger)
  }
}

exports.main = main
