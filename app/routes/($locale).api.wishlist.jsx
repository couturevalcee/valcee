import {json} from '@shopify/remix-oxygen';
import {CUSTOMER_WISHLIST_UPDATE_MUTATION} from '~/graphql/customer-account/CustomerWishlistMutation';

export async function action({request, context}) {
  if (!(await context.customerAccount.isLoggedIn())) {
    return json({error: 'Unauthorized'}, {status: 401});
  }

  const formData = await request.formData();
  const productId = formData.get('productId');
  const intent = formData.get('intent'); // 'add' or 'remove'

  if (!productId || !intent) {
    return json({error: 'Missing data'}, {status: 400});
  }

  // 1. Get current wishlist and customer ID
  const {data} = await context.customerAccount.query(`#graphql
    query getCustomerWishlist {
      customer {
        id
        metafield(namespace: "custom", key: "wishlist") {
          value
        }
      }
    }
  `);

  let currentList = [];
  try {
    currentList = JSON.parse(data?.customer?.metafield?.value || '[]');
  } catch (e) {
    currentList = [];
  }

  // 2. Modify
  let newList = [...currentList];
  if (intent === 'add') {
    if (!newList.includes(productId)) {
      newList.push(productId);
    }
  } else if (intent === 'remove') {
    newList = newList.filter((id) => id !== productId);
  }

  // 3. Save
  const customerId = data?.customer?.id;
  if (!customerId) {
    return json({error: 'Customer not found'}, {status: 400});
  }

  const {data: mutationData, errors} = await context.customerAccount.mutate(
    CUSTOMER_WISHLIST_UPDATE_MUTATION,
    {
      variables: {
        metafields: [
          {
            ownerId: customerId,
            namespace: 'custom',
            key: 'wishlist',
            type: 'list.product_reference',
            value: JSON.stringify(newList),
          },
        ],
      },
    },
  );

  if (errors || mutationData?.metafieldsSet?.userErrors?.length) {
    return json(
      {
        error: 'Failed to update',
        details: mutationData?.metafieldsSet?.userErrors,
      },
      {status: 500},
    );
  }

  return json({success: true, wishlist: newList});
}
