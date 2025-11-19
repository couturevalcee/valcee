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
    title: 'Shipping & Returns | Valcee Couture',
    description:
      'Understand how Valcee Couture fulfills, ships, and handles rare return requests.',
  });

export default function ShippingAndReturns() {
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
          Shipping & Returns
        </Heading>
        <Text className="opacity-80 leading-relaxed">
          Built for collectors and everyday wearers alike—here is how we move
          garments from the atelier to your door, plus the very limited
          circumstances in which we accept a return.
        </Text>
      </header>

      <article className="space-y-8 text-base leading-relaxed">
        <SectionBlock
          label="1"
          title="Fulfilment & timelines"
          body={
            <ul className="space-y-3 list-disc pl-5">
              <li>
                Preorders: production begins once the drop closes. Typical
                production window is 3–5 weeks before handoff to Canada Post. We
                email milestone updates so you always know which stage your
                piece is in.
              </li>
              <li>
                Ready inventory: when we have stock on hand in Vancouver, we
                pack and scan within 2 business days.
              </li>
              <li>
                Transit speed: Canada Post Expedited Parcel or Xpresspost,
                depending on value. International orders may route through a
                partner carrier once they leave Canada.
              </li>
            </ul>
          }
        />

        <SectionBlock
          label="2"
          title="Tracking & communication"
          body={
            <p>
              Every shipment receives tracking automatically. If the scan
              history stalls for more than 5 days, contact us at{' '}
              <a
                href="mailto:relations@valcee.com"
                className="border-b border-primary/40"
              >
                relations@valcee.com
              </a>{' '}
              with your order number so we can escalate with the carrier.
            </p>
          }
        />

        <SectionBlock
          label="3"
          title="Return eligibility"
          body={
            <>
              <Text>
                We craft intentionally small runs, so we do not offer size
                exchanges or change-of-mind refunds. The only accepted return
                scenario is physical, provable damage caused by our atelier or
                the shipping carrier.
              </Text>
              <ul className="space-y-3 list-disc pl-5">
                <li>
                  You must notify us within 14 days of delivery (based on
                  carrier scan).
                </li>
                <li>
                  Provide clear photos/video of the packaging, garment, and
                  damage. The evidence must show the issue occurred prior to
                  transit concluding.
                </li>
                <li>
                  Once approved, we issue a prepaid return label (or reimburse
                  shipping) and inspect the garment upon arrival. If the damage
                  renders the piece unusable, we refund the original payment
                  method in full.
                </li>
                <li>
                  Unapproved returns or wear-related issues are shipped back to
                  the customer at their expense.
                </li>
              </ul>
            </>
          }
        />

        <SectionBlock
          label="4"
          title="How to start a claim"
          body={
            <>
              <ol className="list-decimal pl-5 space-y-3">
                <li>
                  Email relations@valcee.com with subject line “Damage Claim –
                  Order #XXXX”.
                </li>
                <li>
                  Attach your order confirmation, tracking number, and
                  photographic proof of the damage.
                </li>
                <li>
                  Keep all original packaging until the claim is resolved.
                </li>
              </ol>
              <Text>
                We review claims within 2 business days. Approved refunds are
                processed immediately; bank posting timelines vary.
              </Text>
            </>
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
