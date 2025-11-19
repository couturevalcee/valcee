import {json} from '@shopify/remix-oxygen';
import {getSeoMeta} from '@shopify/hydrogen';

import {Section, Heading, Text} from '~/components/Text';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;
export async function loader() {
  return json({});
}
export const meta = () =>
  getSeoMeta({
    title: 'Terms of Service | Valcee Couture',
    description:
      'Legal terms for purchasing couture pieces from Valcee Couture.',
  });

export default function TermsOfService() {
  return (
    <Section
      padding="none"
      className="px-4 md:px-8 max-w-3xl mx-auto py-10 sm:py-14 space-y-8"
    >
      <header className="space-y-3 text-center sm:text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-primary/60">
          Policy update
        </p>
        <Heading
          as="h1"
          size="display"
          className="text-4xl sm:text-5xl tracking-tight uppercase"
        >
          Terms of Service
        </Heading>
        <Text className="opacity-80 leading-relaxed">
          Updated November 19, 2025. These terms govern your relationship with
          Valcee Couture when purchasing apparel and accessories crafted through
          our atelier or manufacturing partners.
        </Text>
      </header>

      <article className="space-y-8 text-base leading-relaxed">
        <SectionBlock
          label="1"
          title="Orders & production"
          body={
            <ul className="space-y-3 list-disc pl-5">
              <li>
                Valcee Couture designs may be produced in-house or via vetted
                manufacturing partners, including Alibaba-based ateliers, to
                honor scale without compromising standards.
              </li>
              <li>
                Orders may be collected as preorders. When stated as a preorder,
                your card is charged immediately and garments enter production;
                fulfillment timelines are communicated on the product page.
              </li>
              <li>
                For ready inventory, we may bulk-produce and hold pieces in
                Vancouver, BC before shipping directly to you.
              </li>
            </ul>
          }
        />

        <SectionBlock
          label="2"
          title="Pricing & payments"
          body={
            <p>
              Prices are listed in Canadian dollars unless noted otherwise.
              Duties, taxes, or import fees charged by your local customs
              authority are your responsibility. By submitting an order you
              authorize Valcee Couture to charge the provided payment method for
              the total shown at checkout.
            </p>
          }
        />

        <SectionBlock
          label="3"
          title="Shipping"
          body={
            <p>
              Parcels are handed off via Canada Post or equivalent carriers.
              Tracking is shared once the shipment is scanned. Risk of loss
              transfers to you when the carrier marks the parcel as delivered.
            </p>
          }
        />

        <SectionBlock
          label="4"
          title="Damage & returns"
          body={
            <p>
              Returns are only accepted for orders with provable manufacturing
              or shipping damage as described in our Shipping & Returns policy.
              Cosmetic variations inherent to handmade garments are not
              considered damage.
            </p>
          }
        />

        <SectionBlock
          label="5"
          title="Intellectual property"
          body={
            <p>
              All graphics, copy, and garment designs are the intellectual
              property of Valcee Couture. You may not reproduce, resell, or
              modify our designs without written permission.
            </p>
          }
        />

        <SectionBlock
          label="6"
          title="Limitation of liability"
          body={
            <p>
              To the fullest extent permitted under Canadian law, Valcee Couture
              is not liable for indirect or consequential damages. Our aggregate
              liability for any claim is limited to the amount you paid for the
              item in dispute.
            </p>
          }
        />

        <SectionBlock
          label="7"
          title="Contact"
          body={
            <p>
              Questions about these terms? Email{' '}
              <a
                href="mailto:relations@valcee.com"
                className="border-b border-primary/40"
              >
                relations@valcee.com
              </a>{' '}
              or reach us via the contact page before placing your order.
            </p>
          }
        />
      </article>
    </Section>
  );
}

function SectionBlock({label, title, body}) {
  return (
    <section className="space-y-3">
      <p className="text-xs uppercase tracking-[0.3em] text-primary/60">
        Section {label}
      </p>
      <Heading as="h2" size="lead" className="text-2xl tracking-tight">
        {title}
      </Heading>
      <div className="space-y-3 text-primary/90">{body}</div>
    </section>
  );
}
