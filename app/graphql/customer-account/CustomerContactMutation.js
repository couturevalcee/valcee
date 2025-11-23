export const CUSTOMER_CONTACT_UPDATE_MUTATION = `#graphql
  mutation updateHistory($metafields: [MetafieldInput!]!) {
    customerUpdate(input: {metafields: $metafields}) {
      customer {
        id
        metafield(namespace: "custom", key: "message_history") {
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
