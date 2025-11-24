import {Form, useNavigation} from '@remix-run/react';
import {json, redirect} from '@shopify/remix-oxygen';
import {PageHeader, Text} from '~/components/Text';
import {Button} from '~/components/Button';
import {Link} from '~/components/Link';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({params, context}) {
  if (await context.customerAccount.isLoggedIn()) {
    const localePrefix = params.locale ? `/${params.locale}` : '';
    throw redirect(`${localePrefix}/account`);
  }

  return json({
    supportEmail: context.env?.SUPPORT_EMAIL ?? null,
  });
}

/**
 * @param {ActionFunctionArgs}
 */
export async function action({context}) {
  return context.customerAccount.login();
}

export default function AccountLogin() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== 'idle';

  return (
    <div className="px-4 py-12">
      <PageHeader heading="Account access">
        <Text>Sign in to view orders, saved measurements, and tailored recommendations.</Text>
      </PageHeader>
      <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-primary/10 bg-contrast/90 backdrop-blur-sm px-8 py-10 shadow-lg">
        <Form method="post" className="space-y-4">
          <Text>We use Shopify&apos;s secure customer portal for authentication.</Text>
          <Button
            type="submit"
            className="w-full"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Redirecting…' : 'Continue to secure login'}
          </Button>
          <Text size="fine" color="subtle">
            This window will redirect you to Shopify where you can log in or create a new account. Once finished you will return here automatically.
          </Text>
        </Form>
        <div className="mt-6 text-center">
          <Text size="fine" color="subtle">
            Need help?{' '}
            <Link to="/contact" className="underline">
              Contact us
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
}

/** @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
