import Link from "next/link";

import { PricingPlans } from "@/components/billing/pricing-plans";
import { HowItWorksFaq } from "./how-it-works-faq";
import styles from "./how-it-works.module.css";

export function HowItWorksContent() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.hero}>
        <div className={styles.tag}>Platform Overview</div>
        <h1>
          Your Stone Marketplace,
          <br />
          Simplified
        </h1>
        <p>
          SmartSlab connects stone fabricators, designers, and homeowners on a
          single marketplace to buy and sell granite, quartz, quartzite, and
          marble slabs — including remnants.
        </p>
        <div className={styles.heroBtns}>
          <Link href="/browse" className={styles.btnPrimary}>
            Browse Slabs →
          </Link>
          <Link href="/dashboard/slabs/new" className={styles.btnSecondary}>
            List Your Inventory
          </Link>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.stepsSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.pill}>The Process</span>
          <h2>Four Steps to Your Perfect Slab</h2>
          <p>
            Whether you&apos;re buying or selling, getting started with SmartSlab
            is fast and straightforward.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>Step 01</span>
            <div className={styles.stepIcon} aria-hidden>
              🔍
            </div>
            <h3>Discover</h3>
            <p>
              Browse natural stone slabs and remnants filtered by material, size,
              color, and location.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>Step 02</span>
            <div className={styles.stepIcon} aria-hidden>
              📋
            </div>
            <h3>Compare</h3>
            <p>
              Save favorites, compare listings side by side, and review photos
              and dimensions before you buy.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>Step 03</span>
            <div className={styles.stepIcon} aria-hidden>
              🛒
            </div>
            <h3>Purchase</h3>
            <p>
              Complete secure Stripe checkout. Inventory is reserved while you
              pay so the slab stays yours.
            </p>
          </div>
          <div className={styles.stepCard}>
            <span className={styles.stepNum}>Step 04</span>
            <div className={styles.stepIcon} aria-hidden>
              ✅
            </div>
            <h3>Coordinate</h3>
            <p>
              After payment, seller contact and pickup details unlock so you can
              arrange pickup or delivery.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.audienceSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.pill}>Who It&apos;s For</span>
          <h2>Built for Both Sides of the Market</h2>
          <p>
            SmartSlab was designed to serve buyers and sellers equally — with
            tools that make every deal easy.
          </p>
        </div>

        <div className={styles.audienceGrid}>
          <div className={`${styles.audienceCard} ${styles.buyers}`}>
            <span className={styles.audienceLabel}>For Buyers</span>
            <h3>Find Exactly What You Need</h3>
            <p className={styles.sub}>
              Homeowners, designers, and contractors can source slabs and
              remnants at competitive prices.
            </p>
            <ul className={styles.audienceList}>
              <li>
                <span className={styles.liIcon}>✓</span>
                <span>Search by material, size, color, and region</span>
              </li>
              <li>
                <span className={styles.liIcon}>✓</span>
                <span>Full slabs and one-of-a-kind remnant pieces</span>
              </li>
              <li>
                <span className={styles.liIcon}>✓</span>
                <span>View high-resolution photos before you buy</span>
              </li>
              <li>
                <span className={styles.liIcon}>✓</span>
                <span>Secure Stripe checkout with inventory reservation</span>
              </li>
              <li>
                <span className={styles.liIcon}>✓</span>
                <span>Seller contact unlocked after payment</span>
              </li>
            </ul>
          </div>

          <div className={`${styles.audienceCard} ${styles.sellers}`}>
            <span className={styles.audienceLabel}>For Sellers</span>
            <h3>Turn Inventory Into Revenue</h3>
            <p className={styles.sub}>
              Fabricators, distributors, and stone yards can list their slabs
              and remnants in minutes.
            </p>
            <ul className={styles.audienceList}>
              <li>
                <span className={styles.liIcon}>★</span>
                <span>List individual pieces with photos and dimensions</span>
              </li>
              <li>
                <span className={styles.liIcon}>★</span>
                <span>Bulk import listings from a CSV template</span>
              </li>
              <li>
                <span className={styles.liIcon}>★</span>
                <span>Reach buyers actively searching for your material</span>
              </li>
              <li>
                <span className={styles.liIcon}>★</span>
                <span>Manage inventory, sales, and quote leads in one dashboard</span>
              </li>
              <li>
                <span className={styles.liIcon}>★</span>
                <span>Stripe Connect payouts after each completed sale</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.pill}>Platform Features</span>
          <h2>Everything in One Place</h2>
          <p>
            SmartSlab is packed with features that make buying and selling stone
            effortless.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon} aria-hidden>
              🖼️
            </span>
            <h4>High-Res Gallery</h4>
            <p>
              Every listing includes clear, detailed photos so you see exactly
              what you&apos;re getting.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon} aria-hidden>
              📦
            </span>
            <h4>Remnant Marketplace</h4>
            <p>
              A dedicated flow for leftover slab pieces — perfect for
              countertops and accent projects.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon} aria-hidden>
              📊
            </span>
            <h4>Compare &amp; Save</h4>
            <p>
              Favorite slabs and compare them side by side before committing to
              a purchase.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon} aria-hidden>
              🔒
            </span>
            <h4>Secure Payments</h4>
            <p>
              Checkout is handled through Stripe — your payment data stays
              protected.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon} aria-hidden>
              📍
            </span>
            <h4>Location Filters</h4>
            <p>
              Find slabs near you to reduce shipping costs and coordinate easy
              local pickup.
            </p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon} aria-hidden>
              📥
            </span>
            <h4>CSV Import</h4>
            <p>
              Vendors can upload many listings at once from a spreadsheet
              template.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.pricingSection}>
        <PricingPlans />
      </div>

      <HowItWorksFaq />

      <div className={styles.cta}>
        <h2>Ready to Find Your Perfect Stone?</h2>
        <p>
          Join buyers and sellers using SmartSlab to connect and transact with
          confidence.
        </p>
        <div className={styles.ctaBtns}>
          <Link href="/browse" className={styles.btnPrimary}>
            Start Browsing Now →
          </Link>
          <Link href="/sign-up" className={styles.btnSecondary}>
            Become a Seller
          </Link>
        </div>
      </div>
    </div>
  );
}
