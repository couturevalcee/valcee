export const CUSTOMER_WISHLIST_UPDATE_MUTATION = `#graphql
  mutation updateWishlist($metafields: [MetafieldInput!]!) {
    customerUpdate(input: {metafields: $metafields}) {
      customer {
        id
        metafield(namespace: "custom", key: "wishlist") {
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
