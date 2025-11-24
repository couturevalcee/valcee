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
    <div className="flex items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-primary/20 bg-primary/5 backdrop-blur-sm px-8 py-12 space-y-6">
        <h1 className="text-center text-sm uppercase tracking-[0.3em] text-primary/60 font-light">
          Account
        </h1>
        
        <Form method="post" className="space-y-6">
          <Button
            type="submit"
            className="w-full rounded-full"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Redirecting…' : 'Sign In'}
          </Button>
        </Form>
        
        <div className="text-center">
          <Link to="/contact" className="text-xs text-primary/50 uppercase tracking-wider hover:text-primary/70 transition-colors">
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}

/** @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
