import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Kompleet application data + Convex Auth tables.
 * Public API still uses Postgres-style UUID `externalId` as `id`.
 * Auth identities are Convex Auth users, remapped to this `users` row by email.
 */

const json = v.any();

export default defineSchema({
  ...authTables,
  users: defineTable({
    // Convex Auth fields (authTables.users)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.string(),
    emailVerificationTime: v.optional(v.number()),
    phone: v.string(),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // App profile
    externalId: v.string(),
    tokenIdentifier: v.optional(v.string()),
    supabaseUserId: v.optional(v.string()),
    fullName: v.optional(v.string()),
    entityType: v.union(v.literal("individual"), v.literal("company")),
    tin: v.optional(v.string()),
    companyName: v.optional(v.string()),
    rcNumber: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    subscriptionTier: v.optional(v.string()),
    subscriptionExpiresAt: v.optional(v.number()),
    defaultCurrency: v.string(),
    fiscalYearStart: v.number(),
    onboardingCompleted: v.boolean(),
    avatarStorageId: v.optional(v.id("_storage")),
    deletedAt: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_externalId", ["externalId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_supabaseUserId", ["supabaseUserId"]),

  firms: defineTable({
    externalId: v.string(),
    name: v.string(),
    ownerUserId: v.id("users"),
    ownerExternalId: v.string(),
    subscriptionTier: v.string(),
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_ownerUserId", ["ownerUserId"]),

  firmMembers: defineTable({
    firmId: v.id("firms"),
    userId: v.id("users"),
    userExternalId: v.string(),
    role: v.union(v.literal("owner"), v.literal("staff")),
  })
    .index("by_firm", ["firmId"])
    .index("by_user", ["userId"])
    .index("by_firm_and_user", ["firmId", "userId"]),

  clients: defineTable({
    externalId: v.string(),
    firmId: v.id("firms"),
    legalName: v.string(),
    tin: v.optional(v.string()),
    rcNumber: v.optional(v.string()),
    entityType: v.optional(
      v.union(v.literal("individual"), v.literal("company")),
    ),
    fiscalYearStart: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.string(),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_firm", ["firmId"]),

  categories: defineTable({
    externalId: v.string(),
    name: v.string(),
    categoryType: v.string(),
    taxTreatment: v.string(),
    keywords: v.array(v.string()),
    description: v.optional(v.string()),
    isSystem: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_name", ["name"]),

  transactions: defineTable({
    externalId: v.string(),
    userId: v.id("users"),
    userExternalId: v.string(),
    transactionDate: v.string(),
    description: v.string(),
    amount: v.number(),
    transactionType: v.union(v.literal("debit"), v.literal("credit")),
    balance: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    categoryExternalId: v.optional(v.string()),
    confidenceScore: v.optional(v.number()),
    source: v.optional(v.string()),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    isReconciled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "transactionDate"])
    .index("by_userExternalId", ["userExternalId"]),

  importSessions: defineTable({
    externalId: v.string(),
    userId: v.id("users"),
    userExternalId: v.string(),
    fileName: v.string(),
    fileSize: v.optional(v.number()),
    bankCode: v.optional(v.string()),
    status: v.string(),
    transactionsImported: v.number(),
    errorsCount: v.number(),
    totalAmount: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"]),

  importErrors: defineTable({
    externalId: v.string(),
    sessionId: v.id("importSessions"),
    sessionExternalId: v.string(),
    rowNumber: v.optional(v.number()),
    errorType: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    rawData: v.optional(json),
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_session", ["sessionId"]),

  duplicateCandidates: defineTable({
    externalId: v.string(),
    sessionId: v.id("importSessions"),
    sessionExternalId: v.string(),
    userId: v.id("users"),
    payload: json,
    status: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),

  exportHistory: defineTable({
    externalId: v.string(),
    userId: v.id("users"),
    userExternalId: v.string(),
    exportType: v.string(),
    format: v.optional(v.string()),
    taxYear: v.optional(v.number()),
    status: v.string(),
    fileSize: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
    expiresAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"]),

  expenseCategories: defineTable({
    externalId: v.string(),
    userId: v.optional(v.id("users")),
    userExternalId: v.optional(v.string()),
    name: v.string(),
    isCustom: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"])
    .index("by_name", ["name"]),

  expenses: defineTable({
    externalId: v.string(),
    userId: v.id("users"),
    userExternalId: v.string(),
    date: v.string(),
    amount: v.number(),
    currency: v.string(),
    categoryId: v.optional(v.id("expenseCategories")),
    categoryExternalId: v.optional(v.string()),
    vendor: v.optional(v.string()),
    vatAmount: v.optional(v.number()),
    receiptUrl: v.optional(v.string()),
    receiptStorageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
    syncedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  invoices: defineTable({
    externalId: v.string(),
    userId: v.id("users"),
    userExternalId: v.string(),
    clientId: v.optional(v.id("clients")),
    clientExternalId: v.optional(v.string()),
    invoiceNumber: v.string(),
    invoiceDate: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    taxYear: v.optional(v.number()),
    customerInfo: v.optional(json),
    lineItems: v.optional(json),
    subtotal: v.optional(v.number()),
    vatAmount: v.optional(v.number()),
    discountAmount: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    amountDue: v.optional(v.number()),
    status: v.string(),
    paymentTerms: v.optional(v.string()),
    notes: v.optional(v.string()),
    isImmutable: v.boolean(),
    issuedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"])
    .index("by_client", ["clientId"])
    .index("by_user_and_status", ["userId", "status"]),

  invoiceSequences: defineTable({
    clientId: v.optional(v.id("clients")),
    clientExternalId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    taxYear: v.number(),
    nextNumber: v.number(),
  }).index("by_client_and_year", ["clientExternalId", "taxYear"]),

  invoiceArchives: defineTable({
    externalId: v.string(),
    invoiceId: v.id("invoices"),
    clientId: v.optional(v.id("clients")),
    snapshot: json,
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_invoice", ["invoiceId"]),

  invoiceAuditLogs: defineTable({
    invoiceId: v.id("invoices"),
    clientId: v.optional(v.id("clients")),
    userId: v.id("users"),
    action: v.string(),
    details: v.optional(json),
    createdAt: v.number(),
  }).index("by_invoice", ["invoiceId"]),

  clientKeys: defineTable({
    clientId: v.id("clients"),
    clientExternalId: v.string(),
    publicKey: v.string(),
    privateKeyEncrypted: v.string(),
    keyType: v.string(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"]),

  taxCalculations: defineTable({
    externalId: v.string(),
    userId: v.id("users"),
    userExternalId: v.string(),
    clientId: v.optional(v.id("clients")),
    taxType: v.string(),
    taxYear: v.number(),
    calculationDate: v.string(),
    inputData: json,
    grossAmount: v.number(),
    deductions: v.number(),
    taxableAmount: v.number(),
    taxDue: v.number(),
    effectiveRate: v.optional(v.number()),
    breakdown: json,
    isFinal: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"])
    .index("by_user_and_year", ["userId", "taxYear"]),

  sources: defineTable({
    externalId: v.string(),
    name: v.string(),
    url: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_externalId", ["externalId"]),

  ruleVersions: defineTable({
    externalId: v.string(),
    version: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_active", ["isActive"]),

  taxRules: defineTable({
    externalId: v.string(),
    ruleVersionId: v.id("ruleVersions"),
    ruleVersionExternalId: v.string(),
    sourceId: v.optional(v.id("sources")),
    sourceExternalId: v.optional(v.string()),
    ruleType: v.string(),
    ruleKey: v.string(),
    ruleValue: json,
    confidenceLevel: v.string(),
    lastReviewedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_externalId", ["externalId"])
    .index("by_version", ["ruleVersionId"])
    .index("by_version_and_key", ["ruleVersionId", "ruleKey"]),

  documents: defineTable({
    externalId: v.string(),
    userId: v.id("users"),
    userExternalId: v.string(),
    clientId: v.optional(v.id("clients")),
    idempotencyKey: v.optional(v.string()),
    status: v.string(),
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    storageId: v.optional(v.id("_storage")),
    processingStartedAt: v.optional(v.number()),
    processingAttemptCount: v.number(),
    payload: v.optional(json),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"])
    .index("by_user_and_idempotencyKey", ["userId", "idempotencyKey"])
    .index("by_status", ["status"]),

  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    userExternalId: v.optional(v.string()),
    action: v.string(),
    resourceType: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(json),
    createdAt: v.number(),
  }).index("by_userExternalId", ["userExternalId"]),

  nrsForms: defineTable({
    externalId: v.string(),
    userId: v.id("users"),
    userExternalId: v.string(),
    clientId: v.optional(v.id("clients")),
    formType: v.string(),
    taxYear: v.optional(v.number()),
    payload: json,
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"]),

  formFilingStatuses: defineTable({
    formId: v.id("nrsForms"),
    userId: v.id("users"),
    status: v.string(),
    filedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_form", ["formId"]),

  filingAuditLogs: defineTable({
    formId: v.optional(v.id("nrsForms")),
    userId: v.id("users"),
    action: v.string(),
    details: v.optional(json),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  userTaxYears: defineTable({
    userId: v.id("users"),
    userExternalId: v.string(),
    clientId: v.optional(v.id("clients")),
    taxYear: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_year", ["userId", "taxYear"]),

  financialStatements: defineTable({
    externalId: v.string(),
    userId: v.id("users"),
    userExternalId: v.string(),
    statementType: v.string(),
    taxYear: v.optional(v.number()),
    data: json,
    createdAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"]),

  taxReports: defineTable({
    externalId: v.string(),
    userId: v.id("users"),
    userExternalId: v.string(),
    reportType: v.optional(v.string()),
    taxYear: v.optional(v.number()),
    computationData: json,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_user", ["userId"]),
});
