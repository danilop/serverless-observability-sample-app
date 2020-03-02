const AWSXRay = require('aws-xray-sdk');
// const AWS = require('aws-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const sqs = new AWS.SQS();
const { metricScope, Unit } = require("aws-embedded-metrics");
const uuidv4 = require('uuid/v4');

const ORDERS_QUEUE_URL = process.env.ORDERS_QUEUE_URL;

exports.lambdaHandler = metricScope(metrics => async (event, context) => {
    console.log(event)

    let order;
    let orderError = null;
    try {
        order = JSON.parse(event.body);
    } catch (err) {
        orderError = err;
    }

    if (orderError == null) {
        order.id = uuidv4();
        metrics.putDimensions({ Service: "CreateOrder" });
        metrics.putMetric("Items", order.items.length, Unit.Count);
        metrics.setProperty("orderId", order.id);
        metrics.setProperty("accountId", order.accoundId);
        await createOrder(order);
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'order id: ' + order.id,
            })
        };
    } else {
        response = {
            'statusCode': 400,
            'body': JSON.stringify({
                message: 'error: ' + orderError,
            })
        };
    }

    return response;
});

async function createOrder(order) {

    const message = JSON.stringify({
        "type": "createOrder",
        "data": order
    })

    const data = await sqs.sendMessage({
        MessageBody: message,
        QueueUrl: ORDERS_QUEUE_URL
    }).promise();

    console.log(data);
}