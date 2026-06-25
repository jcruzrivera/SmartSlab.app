import { relations } from "drizzle-orm";
import {
  boolean,
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
  isVerified: boolean("is_verified").notNull().default(false),
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
  name: text("name").notNull(),
  widthCm: numeric("width_cm", { precision: 10, scale: 2 }),
  heightCm: numeric("height_cm", { precision: 10, scale: 2 }),
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

export const usersRelations = relations(users, ({ many }) => ({
  locations: many(locations),
  slabs: many(slabs),
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
}));

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
