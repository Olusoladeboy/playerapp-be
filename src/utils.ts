export const convertScanResponse = (dynamoDbResponse) => {
  // Helper function to convert DynamoDB attribute values to plain JS
  const convertAttributeValue = (value) => {
    if (value.S !== undefined) return value.S;
    if (value.N !== undefined) return Number(value.N);
    if (value.BOOL !== undefined) return value.BOOL;
    if (value.M !== undefined) return convertMap(value.M);
    if (value.L !== undefined) return value.L.map(convertAttributeValue);
    return value; // Fallback for unhandled cases
  };

  const convertMap = (map) => {
    const plainObject = {};
    for (const key in map) {
      plainObject[key] = convertAttributeValue(map[key]);
    }
    return plainObject;
  };

  // Process feeds
  if (Array.isArray(dynamoDbResponse)) {
    dynamoDbResponse = dynamoDbResponse.map((data) => convertMap(data));
  }

  return dynamoDbResponse;
};
