import {json} from '@shopify/remix-oxygen';

export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const {KLAVIYO_PRIVATE_API_KEY, KLAVIYO_LIST_ID} = context.env;
  if (!KLAVIYO_PRIVATE_API_KEY || !KLAVIYO_LIST_ID) {
    console.warn('Klaviyo not configured: missing KLAVIYO_PRIVATE_API_KEY or KLAVIYO_LIST_ID');
    return json({error: 'Email marketing not configured'}, {status: 503});
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({error: 'Invalid request body'}, {status: 400});
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({error: 'Valid email required'}, {status: 400});
  }

  // Step 1: Create or update the profile
  const profilePayload = {
    data: {
      type: 'profile',
      attributes: {
        email,
        ...(body.firstName && {first_name: body.firstName}),
        ...(body.lastName && {last_name: body.lastName}),
        ...(body.shopifyCustomerId && {
          properties: {shopify_customer_id: body.shopifyCustomerId},
        }),
      },
    },
  };

  const profileRes = await fetch('https://a.klaviyo.com/api/profile-import/', {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
      'Content-Type': 'application/json',
      revision: '2024-10-15',
    },
    body: JSON.stringify(profilePayload),
  });

  if (!profileRes.ok) {
    const err = await profileRes.json().catch(() => ({}));
    console.error('Klaviyo profile create/update failed', err);
    return json({error: 'Subscription failed'}, {status: 500});
  }

  const profileData = await profileRes.json();
  const profileId = profileData?.data?.id;

  if (!profileId) {
    console.error('Klaviyo: no profile ID returned');
    return json({error: 'Subscription failed'}, {status: 500});
  }

  // Step 2: Subscribe profile to list
  const subscribeRes = await fetch(
    `https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`,
    {
      method: 'POST',
      headers: {
        Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
        'Content-Type': 'application/json',
        revision: '2024-10-15',
      },
      body: JSON.stringify({
        data: [{type: 'profile', id: profileId}],
      }),
    },
  );

  if (!subscribeRes.ok && subscribeRes.status !== 204) {
    const err = await subscribeRes.json().catch(() => ({}));
    console.error('Klaviyo list subscribe failed', err);
    return json({error: 'Subscription failed'}, {status: 500});
  }

  return json({success: true});
}
