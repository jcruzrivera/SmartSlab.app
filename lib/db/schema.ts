import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import type {
  SfCutout,
  SfPieceSnapshot,
  SfPolygon,
  SfVirtualSlab,
} from "@/lib/db/sfTypes";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "vendor",
  "buyer",
  "both",
]);

export const locationTypeEnum = pgEnum("location_type", [
  "factory",
  "workshop",
  "showroom",
  "warehouse",
]);

export const slabTypeEnum = pgEnum("slab_type", ["full_slab", "remnant"]);

export const slabStatusEnum = pgEnum("slab_status", [
  "available",
  "reserved",
  "sold",
  "hidden",
]);

export const finishTypeEnum = pgEnum("finish_type", [
  "polished",
  "honed",
  "leathered",
  "brushed",
  "sandblasted",
  "other",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "disputed",
  "refunded",
  "cancelled",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "new",
  "contacted",
  "quoted",
  "closed",
  "cancelled",
]);

export const userPlanEnum = pgEnum("user_plan", ["free", "pro", "premium"]);

export const planStatusEnum = pgEnum("plan_status", [
  "active",
  "past_due",
  "canceled",
  "none",
]);

export const inventoryEventTypeEnum = pgEnum("inventory_event_type", [
  "used",
  "sold_offline",
  "adjusted",
  "remnant_created",
  "marked_missing",
  "restored",
]);

export const reconciliationStatusEnum = pgEnum("reconciliation_status", [
  "open",
  "completed",
  "abandoned",
]);

export const sfProjectStatusEnum = pgEnum("sf_project_status", [
  "draft",
  "placed",
  "quoted",
  "ordered",
]);

export const sfPieceKindEnum = pgEnum("sf_piece_kind", [
  "countertop",
  "backsplash",
  "island",
  "other",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  role: userRoleEnum("role").notNull().default("buyer"),
  companyName: text("company_name"),
  contactName: text("contact_name"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  stripeAccountId: text("stripe_account_id"),
  plan: userPlanEnum("plan").notNull().default("free"),
  planStatus: planStatusEnum("plan_status").notNull().default("none"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  planRenewsAt: timestamp("plan_renews_at", { withTimezone: true }),
  smartfinderSearchesUsed: integer("smartfinder_searches_used")
    .notNull()
    .default(0),
  smartfinderResetAt: timestamp("smartfinder_reset_at", { withTimezone: true }),
  isVerified: boolean("is_verified").notNull().default(false),
  /** Public WordPress storefront slug at smartslab.app/tienda/{slug}. */
  storeSlug: text("store_slug").unique(),
  /** Vendor can opt out of the public storefront directory. */
  storePublic: boolean("store_public").notNull().default(true),
  /** After the vendor customizes the slug once, further edits are blocked. */
  storeSlugLocked: boolean("store_slug_locked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: locationTypeEnum("type").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  isActive: boolean("is_active").notNull().default(true),
});

export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const slabs = pgTable("slabs", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  locationId: uuid("location_id").references(() => locations.id, {
    onDelete: "set null",
  }),
  materialId: uuid("material_id").references(() => materials.id, {
    onDelete: "set null",
  }),
  type: slabTypeEnum("type").notNull(),
  status: slabStatusEnum("status").notNull().default("available"),
  sku: text("sku"),
  /** 8-char human-readable code printed on the QR label (QR payload). */
  shortCode: text("short_code").unique(),
  /** Set when this slab is a remnant spawned from a parent slab. */
  parentSlabId: uuid("parent_slab_id").references(
    (): AnyPgColumn => slabs.id,
    { onDelete: "set null" },
  ),
  name: text("name").notNull(),
  /** Slab face width in inches (industry standard). */
  widthIn: numeric("width_in", { precision: 10, scale: 2 }),
  /** Slab face height/length in inches (industry standard). */
  heightIn: numeric("height_in", { precision: 10, scale: 2 }),
  /** Slab thickness in centimeters (industry standard). */
  thicknessCm: numeric("thickness_cm", { precision: 10, scale: 2 }),
  weightKg: numeric("weight_kg", { precision: 10, scale: 2 }),
  finish: finishTypeEnum("finish").notNull().default("other"),
  colorFamily: text("color_family"),
  brandSupplier: text("brand_supplier"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  roomUse: text("room_use").array(),
  aestheticTags: text("aesthetic_tags").array(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  pricePerSqft: numeric("price_per_sqft", { precision: 12, scale: 2 }),
  quantity: integer("quantity").notNull().default(1),
  quantitySold: integer("quantity_sold").notNull().default(0),
  reservedUntil: timestamp("reserved_until", { withTimezone: true }),
  reservedBy: uuid("reserved_by").references(() => users.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  isNegotiable: boolean("is_negotiable").notNull().default(false),
  isSmallSample: boolean("is_small_sample").notNull().default(false),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  aiExtracted: boolean("ai_extracted").notNull().default(false),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const slabImages = pgTable("slab_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  slabId: uuid("slab_id")
    .notNull()
    .references(() => slabs.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  aiAnalyzed: boolean("ai_analyzed").notNull().default(false),
  aiRawResponse: jsonb("ai_raw_response"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Full audit trail of every inventory movement (used, sold offline, adjusted,
// remnant spawned, reconciliation missing/restored). vendor_id/slab_id are uuid
// FKs here to match the rest of the schema (the feature prompt used `text`).
export const inventoryEvents = pgTable(
  "inventory_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slabId: uuid("slab_id")
      .notNull()
      .references(() => slabs.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: inventoryEventTypeEnum("event_type").notNull(),
    quantityDelta: integer("quantity_delta").notNull(),
    note: text("note"),
    sessionId: uuid("session_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    vendorCreatedIdx: index("inventory_events_vendor_created_idx").on(
      table.vendorId,
      table.createdAt,
    ),
    slabIdx: index("inventory_events_slab_idx").on(table.slabId),
  }),
);

// Physical count sessions (reconciliation). Created now; wired up in Release 2.
export const reconciliationSessions = pgTable("reconciliation_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: reconciliationStatusEnum("status").notNull().default("open"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  summary: jsonb("summary"),
});

export const reconciliationScans = pgTable("reconciliation_scans", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => reconciliationSessions.id, { onDelete: "cascade" }),
  slabId: uuid("slab_id")
    .notNull()
    .references(() => slabs.id, { onDelete: "cascade" }),
  scannedAt: timestamp("scanned_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => users.id),
  slabId: uuid("slab_id")
    .notNull()
    .references(() => slabs.id),
  status: transactionStatusEnum("status").notNull().default("pending"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  platformFee: numeric("platform_fee", { precision: 12, scale: 2 }).notNull(),
  vendorPayout: numeric("vendor_payout", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeTransferId: text("stripe_transfer_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const quoteRequests = pgTable("quote_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerId: uuid("buyer_id").references(() => users.id, {
    onDelete: "set null",
  }),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slabId: uuid("slab_id")
    .notNull()
    .references(() => slabs.id, { onDelete: "cascade" }),
  status: quoteStatusEnum("status").notNull().default("new"),
  buyerName: text("buyer_name"),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slabId: uuid("slab_id")
      .notNull()
      .references(() => slabs.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueFavorite: uniqueIndex("favorites_user_slab_unique").on(
      table.userId,
      table.slabId,
    ),
  }),
);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slabId: uuid("slab_id").references(() => slabs.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  reviewerId: uuid("reviewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reviewedUserId: uuid("reviewed_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("notifications_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  locations: many(locations),
  slabs: many(slabs),
  notifications: many(notifications),
  sfProjects: many(sfProjects),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
  slabs: many(slabs),
}));

export const materialsRelations = relations(materials, ({ many }) => ({
  slabs: many(slabs),
}));

export const slabsRelations = relations(slabs, ({ one, many }) => ({
  vendor: one(users, {
    fields: [slabs.vendorId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [slabs.locationId],
    references: [locations.id],
  }),
  material: one(materials, {
    fields: [slabs.materialId],
    references: [materials.id],
  }),
  images: many(slabImages),
  quoteRequests: many(quoteRequests),
  favorites: many(favorites),
  listingFlags: many(listingFlags),
  inventoryEvents: many(inventoryEvents),
  sfPlacements: many(sfPlacements),
}));

export const inventoryEventsRelations = relations(
  inventoryEvents,
  ({ one }) => ({
    slab: one(slabs, {
      fields: [inventoryEvents.slabId],
      references: [slabs.id],
    }),
    vendor: one(users, {
      fields: [inventoryEvents.vendorId],
      references: [users.id],
    }),
  }),
);

export const reconciliationSessionsRelations = relations(
  reconciliationSessions,
  ({ one, many }) => ({
    vendor: one(users, {
      fields: [reconciliationSessions.vendorId],
      references: [users.id],
    }),
    scans: many(reconciliationScans),
  }),
);

export const reconciliationScansRelations = relations(
  reconciliationScans,
  ({ one }) => ({
    session: one(reconciliationSessions, {
      fields: [reconciliationScans.sessionId],
      references: [reconciliationSessions.id],
    }),
    slab: one(slabs, {
      fields: [reconciliationScans.slabId],
      references: [slabs.id],
    }),
  }),
);

export const slabImagesRelations = relations(slabImages, ({ one }) => ({
  slab: one(slabs, {
    fields: [slabImages.slabId],
    references: [slabs.id],
  }),
}));

export const quoteRequestsRelations = relations(quoteRequests, ({ one }) => ({
  buyer: one(users, {
    fields: [quoteRequests.buyerId],
    references: [users.id],
  }),
  vendor: one(users, {
    fields: [quoteRequests.vendorId],
    references: [users.id],
  }),
  slab: one(slabs, {
    fields: [quoteRequests.slabId],
    references: [slabs.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  slab: one(slabs, {
    fields: [favorites.slabId],
    references: [slabs.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
  }),
  slab: one(slabs, {
    fields: [messages.slabId],
    references: [slabs.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
  }),
  reviewedUser: one(users, {
    fields: [reviews.reviewedUserId],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [reviews.transactionId],
    references: [transactions.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  buyer: one(users, {
    fields: [transactions.buyerId],
    references: [users.id],
  }),
  vendor: one(users, {
    fields: [transactions.vendorId],
    references: [users.id],
  }),
  slab: one(slabs, {
    fields: [transactions.slabId],
    references: [slabs.id],
  }),
}));

export const listingFlags = pgTable("listing_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slabId: uuid("slab_id").references(() => slabs.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  confidence: numeric("confidence", { precision: 3, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const listingFlagsRelations = relations(listingFlags, ({ one }) => ({
  user: one(users, {
    fields: [listingFlags.userId],
    references: [users.id],
  }),
  slab: one(slabs, {
    fields: [listingFlags.slabId],
    references: [slabs.id],
  }),
}));

export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  targetId: uuid("target_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  admin: one(users, {
    fields: [adminAuditLog.adminId],
    references: [users.id],
  }),
}));

/* ------------------------------------------------------------------ */
/*  Layout Studio (sf_*) — countertop project nesting                 */
/* ------------------------------------------------------------------ */

export const sfProjects = pgTable("sf_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: sfProjectStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const sfPieces = pgTable(
  "sf_pieces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => sfProjects.id, { onDelete: "cascade" }),
    kind: sfPieceKindEnum("kind").notNull().default("countertop"),
    /** Rectilinear polygon, inches, {x,y}[] — same convention as
     * lib/smartfinder's PieceVertex. */
    polygon: jsonb("polygon").$type<SfPolygon>().notNull(),
    /** Sink/cooktop/faucet/custom cutouts — geometry only, no fabrication
     * logic reads this yet. */
    cutouts: jsonb("cutouts").$type<SfCutout[]>().notNull().default([]),
    /** true = piece may only be placed at 0°/180° (grain direction locked). */
    veinLocked: boolean("vein_locked").notNull().default(true),
    /** One flag per polygon edge (index i = edge from vertex i to i+1 mod
     * length) — generalizes to L-shapes, unlike a fixed
     * top/right/bottom/left object. Stored, not yet acted on (future
     * fabrication upsell). */
    edgeFinished: jsonb("edge_finished").$type<boolean[]>(),
    label: text("label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    projectSortIdx: index("sf_pieces_project_sort_idx").on(
      table.projectId,
      table.sortOrder,
    ),
  }),
);

export const sfLayouts = pgTable(
  "sf_layouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => sfProjects.id, { onDelete: "cascade" }),
    /** e.g. "rect-raster-v1" (see NESTING_ENGINE_VERSION in lib/nesting).
     * Plain text, not an enum, so bumping the algorithm never needs a
     * migration. */
    engineVersion: text("engine_version").notNull(),
    /** Stored for display only ("1.5" includes kerf + handling space") —
     * the nesting engine's marginIn already accounts for kerf; this is not
     * an additional geometric buffer. */
    kerfIn: numeric("kerf_in", { precision: 6, scale: 3 })
      .notNull()
      .default("0.125"),
    /** Margin from the slab edge AND between pieces, inches. */
    marginIn: numeric("margin_in", { precision: 6, scale: 3 })
      .notNull()
      .default("1.5"),
    slabsUsed: integer("slabs_used").notNull().default(1),
    totalPieceSqft: numeric("total_piece_sqft", { precision: 12, scale: 2 }),
    totalSlabSqft: numeric("total_slab_sqft", { precision: 12, scale: 2 }),
    wastePct: numeric("waste_pct", { precision: 5, scale: 2 }),
    estCost: numeric("est_cost", { precision: 12, scale: 2 }),
    // Immutable engine-run snapshot — no updatedAt; a re-nest creates a new row.
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdx: index("sf_layouts_project_idx").on(table.projectId),
  }),
);

export const sfPlacements = pgTable(
  "sf_placements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    layoutId: uuid("layout_id")
      .notNull()
      .references(() => sfLayouts.id, { onDelete: "cascade" }),
    pieceId: uuid("piece_id")
      .notNull()
      .references(() => sfPieces.id, { onDelete: "cascade" }),
    /** Set when nested against real marketplace/inventory stock. */
    slabId: uuid("slab_id").references(() => slabs.id, {
      onDelete: "set null",
    }),
    /** Set when nested against a virtual/generic slab. Exactly one of
     * slabId/virtualSlab must be set — enforced by slabSourceCheck below. */
    virtualSlab: jsonb("virtual_slab").$type<SfVirtualSlab>(),
    /** Which slab within this layout run (1, 2, 3…). */
    slabIndex: integer("slab_index").notNull().default(1),
    /** Exact as long as the raster grid cell stays a multiple of 0.25in
     * (lib/nesting's fixed v1 resolution) — widen precision/scale together
     * if a future resolution increase (e.g. 1/16") is ever needed. */
    xIn: numeric("x_in", { precision: 10, scale: 2 }).notNull(),
    yIn: numeric("y_in", { precision: 10, scale: 2 }).notNull(),
    rotation: integer("rotation").notNull().default(0),
    /** Exact geometry nested at creation time — see SfPieceSnapshot doc. */
    pieceSnapshot: jsonb("piece_snapshot").$type<SfPieceSnapshot>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    layoutIdx: index("sf_placements_layout_idx").on(table.layoutId),
    uniquePiecePerLayout: uniqueIndex(
      "sf_placements_layout_piece_unique",
    ).on(table.layoutId, table.pieceId),
    slabSourceCheck: check(
      "sf_placements_slab_xor_virtual",
      sql`(("slab_id" IS NULL) <> ("virtual_slab" IS NULL))`,
    ),
    rotationCheck: check(
      "sf_placements_rotation_valid",
      sql`"rotation" IN (0, 90, 180, 270)`,
    ),
  }),
);

export const sfProjectsRelations = relations(sfProjects, ({ one, many }) => ({
  user: one(users, { fields: [sfProjects.userId], references: [users.id] }),
  pieces: many(sfPieces),
  layouts: many(sfLayouts),
}));

export const sfPiecesRelations = relations(sfPieces, ({ one, many }) => ({
  project: one(sfProjects, {
    fields: [sfPieces.projectId],
    references: [sfProjects.id],
  }),
  placements: many(sfPlacements),
}));

export const sfLayoutsRelations = relations(sfLayouts, ({ one, many }) => ({
  project: one(sfProjects, {
    fields: [sfLayouts.projectId],
    references: [sfProjects.id],
  }),
  placements: many(sfPlacements),
}));

export const sfPlacementsRelations = relations(sfPlacements, ({ one }) => ({
  layout: one(sfLayouts, {
    fields: [sfPlacements.layoutId],
    references: [sfLayouts.id],
  }),
  piece: one(sfPieces, {
    fields: [sfPlacements.pieceId],
    references: [sfPieces.id],
  }),
  slab: one(slabs, { fields: [sfPlacements.slabId], references: [slabs.id] }),
}));
