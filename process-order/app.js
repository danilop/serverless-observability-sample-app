const AWSXRay = require('aws-xray-sdk');
// const AWS = require('aws-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const documentClient = new AWS.DynamoDB.DocumentClient();
const { metricScope, Unit } = require("aws-embedded-metrics");

const ORDERS_TABLE = process.env.ORDERS_TABLE;

exports.lambdaHandler = metricScope(metrics => async (event, context) => {
    console.log(event);

    let response

    for (const record of event.Records) {
        const message = JSON.parse(record.body);
        switch (message.type) {
            case "createOrder":
                const order = message.data;
                response = await processOrder(order);
                metrics.putDimensions({ Service: "ProcessOrder" });
                metrics.putMetric("Items", order.items.length, Unit.Count);
                metrics.setProperty("orderId", order.id);
                metrics.setProperty("accountId", order.accoundId);
                break;
            default:
                const orderError = "wrong type " + message.type;
                console.log("error: " + orderError);
                throw new Error(orderError)  // For Lambda Destinations
        }
    }

    console.log(response);
    return response // For Lambda Destinations
});

async function processOrder(order) {
    const data = await documentClient.put({
        TableName : ORDERS_TABLE,
        Item: order
    }).promise();
    const response = "order id: " + order.id + " " + data;
    return response;
}
