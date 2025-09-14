import { pgTable, text, serial, timestamp, boolean, integer, decimal, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ========== MULTI-TENANT TABLES ==========

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nome da Empresa/Quadra
  tradeName: text("trade_name"), // Nome Fantasia
  fullName: text("full_name"), // Nome Completo do Dono/Representante
  subdomain: text("subdomain").unique().notNull(),
  customDomain: text("custom_domain"),
  email: text("email"), // Email de contato da quadra
  phone: text("phone"), // Telefone de contato da quadra
  address: jsonb("address"), // Endereço completo: {street, number, neighborhood, city, state, zipCode}
  description: text("description"), // Descrição geral da quadra/estabelecimento
  logoUrl: text("logo_url"), // URL da logo da quadra
  photosUrls: text("photos_urls").array(), // URLs de fotos do estabelecimento
  operatingHours: jsonb("operating_hours"), // Horários de funcionamento por dia da semana
  closedDays: text("closed_days").array().default([]), // Dias da semana fechados
  status: text("status", { enum: ["active", "inactive", "suspended"] }).notNull().default("active"),
  plan: text("plan", { enum: ["basic", "premium", "enterprise"] }).notNull().default("basic"),
  planLimits: jsonb("plan_limits"), // Limites do plano
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id'), // Null para super_admin
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['super_admin', 'admin', 'teacher', 'client', 'rental_player'] }).notNull(),
  phone: text('phone'),
  country: text('country').default('Brasil'),
  avatar: text('avatar'),
  bio: text('bio'),
  experience: text('experience'),
  specialties: text('specialties').array(),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  commissionPercent: decimal('commission_percent', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires'),
  emailVerified: boolean('email_verified').default(false),
  emailVerificationToken: text('email_verification_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tenantUsers = pgTable("tenant_users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role", { enum: ["admin", "teacher", "rental_player", "client"] }).notNull(),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courts = pgTable("courts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  sport: text("sport", { 
    enum: ["futevolei", "beach_tennis", "volleyball", "football", "tennis", "multiuso"] 
  }).notNull(),
  status: text("status", { enum: ["active", "inactive", "maintenance"] }).notNull().default("active"),
  location: text("location"),
  description: text("description"),
  capacity: integer("capacity").default(4),
  amenities: text("amenities").array(),
  images: text("images").array(),
  primaryImageIndex: integer("primary_image_index").default(0), // Índice da imagem principal
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }),
  floorType: text("floor_type", { 
    enum: ["areia", "saibro", "grama_sintetica", "concreto", "madeira", "borracha", "acrilico"] 
  }),
  covered: boolean("covered").default(false),
  lighting: boolean("lighting").default(false),
  weekdayHours: text("weekday_hours"),
  weekendHours: text("weekend_hours"),
  operatingDays: text("operating_days").array(),
  inactiveReason: text("inactive_reason"),
  rules: text("rules"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  courtId: integer("court_id").notNull(),
  userId: integer("user_id").notNull(),
  teacherId: integer("teacher_id"),
  professorId: integer("professor_id"),
  rentalPlayerId: integer("rental_player_id"),
  
  // Data e horário
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  
  // Tipo de reserva
  reservationType: text("reservation_type", { 
    enum: ["aluguel_avulso", "aula", "evento", "recorrente"] 
  }).notNull().default("aluguel_avulso"),
  
  // Status e pagamento
  status: text("status", { 
    enum: ["pending", "confirmed", "cancelled", "completed", "no_show"] 
  }).notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),

  advancePayment: decimal("advance_payment", { precision: 10, scale: 2 }),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }),
  paymentStatus: text("payment_status", { 
    enum: ["aguardando", "pago", "parcialmente_pago", "estornado"] 
  }).notNull().default("aguardando"),
  paymentMethod: text("payment_method", { 
    enum: ["pix", "cartao", "dinheiro", "creditos", "gympass", "totalpass"] 
  }),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }),
  
  // Informações do cliente
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  
  // Reservas recorrentes
  recurringParentId: integer("recurring_parent_id"),
  recurrentDetails: jsonb("recurrent_details"), // {frequency, endDate, occurrences}
  
  // Integração com eventos
  eventDetailsId: integer("event_details_id"),
  
  // Notas e observações
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  participants: jsonb("participants"),
  
  // Política de cancelamento
  cancellationPolicyApplied: boolean("cancellation_policy_applied").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  courtId: integer("court_id"),
  name: text("name").notNull(),
  description: text("description"),
  sport: text("sport", { 
    enum: ["futevolei", "beach_tennis", "volleyball", "football", "tennis"] 
  }).notNull(),
  level: text("level", { enum: ["beginner", "intermediate", "advanced"] }).notNull(),
  maxStudents: integer("max_students").notNull().default(8),
  currentStudents: integer("current_students").notNull().default(0),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // em minutos
  schedule: jsonb("schedule"), // Horários das aulas
  status: text("status", { enum: ["active", "inactive", "cancelled", "full"] }).notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const classEnrollments = pgTable("class_enrollments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  classId: integer("class_id").notNull(),
  studentId: integer("student_id").notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(),
  status: text("status", { enum: ["active", "cancelled", "completed"] }).notNull().default("active"),
  paymentStatus: text("payment_status", { 
    enum: ["pending", "paid", "partially_paid", "refunded"] 
  }).notNull().default("pending"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  documentType: text("document_type", { enum: ["CPF", "RG"] }),
  documentNumber: text("document_number"),
  birthDate: text("birth_date"), // YYYY-MM-DD format
  gender: text("gender", { enum: ["masculino", "feminino", "outro"] }),
  address: text("address"), // Endereço completo como texto
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rentalPlayerRequests = pgTable("rental_player_requests", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  reservationId: integer("reservation_id").notNull(),
  requesterId: integer("requester_id").notNull(),
  playerId: integer("player_id"),
  sport: text("sport", { 
    enum: ["futevolei", "beach_tennis", "volleyball", "football", "tennis"] 
  }).notNull(),
  level: text("level", { enum: ["beginner", "intermediate", "advanced"] }).notNull(),
  dateTime: timestamp("date_time").notNull(),
  duration: integer("duration").notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { 
    enum: ["pending", "accepted", "declined", "completed", "cancelled"] 
  }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  userId: integer("user_id").notNull(),
  reservationId: integer("reservation_id"),
  classEnrollmentId: integer("class_enrollment_id"),
  rentalPlayerRequestId: integer("rental_player_request_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("BRL"),
  method: text("method", { 
    enum: ["pix", "credit_card", "debit_card", "cash", "bank_transfer"] 
  }).notNull(),
  status: text("status", { 
    enum: ["pending", "processing", "completed", "failed", "cancelled", "refunded"] 
  }).notNull().default("pending"),
  gatewayTransactionId: text("gateway_transaction_id"),
  gatewayResponse: jsonb("gateway_response"),
  pixQrCode: text("pix_qr_code"),
  pixCopyPaste: text("pix_copy_paste"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== NOTIFICATION & CUSTOMIZATION TABLES ==========

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  userId: integer("user_id"),
  type: text("type", { 
    enum: ["booking", "payment", "class", "system", "marketing"] 
  }).notNull(),
  channel: text("channel", { 
    enum: ["email", "sms", "whatsapp", "push", "in_app"] 
  }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Dados adicionais da notificação
  status: text("status", { 
    enum: ["pending", "sent", "delivered", "failed", "read"] 
  }).notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const gameElements = pgTable("game_elements", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  type: text("type", { 
    enum: ["points", "badge", "achievement", "level", "reward"] 
  }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  value: integer("value"),
  condition: jsonb("condition"), // Condições para obter
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenantBranding = pgTable("tenant_branding", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().unique(),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#2563eb"),
  secondaryColor: text("secondary_color").default("#64748b"),
  accentColor: text("accent_color").default("#f59e0b"),
  fontFamily: text("font_family").default("Inter"),
  favicon: text("favicon"),
  backgroundImage: text("background_image"),
  customCss: text("custom_css"),
  theme: text("theme", { enum: ["light", "dark", "auto"] }).default("light"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== PROFESSOR MANAGEMENT TABLES ==========

export const professors = pgTable("professors", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(), // Campo name obrigatório no banco
  email: text("email").notNull(),
  phone: text("phone"),
  specialties: text("specialties").array(),
  experience: integer("experience"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  bio: text("bio"),
  certification: text("certification"),
  isActive: boolean("is_active").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  totalClasses: integer("total_classes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: integer("user_id"), // Referência ao User para credenciais de login
  fullName: text("full_name"), // Campo adicional para compatibilidade
  photoUrl: text("photo_url"),
  experienceLevel: text("experience_level", { 
    enum: ["junior", "pleno", "senior"] 
  }).default("junior"),
  methodology: text("methodology"), // Descrição da metodologia de aula
  portfolioUrl: text("portfolio_url"), // Link para vídeo/portfólio
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }), // Ex: 70.00 para 70%
});

export const professorAvailability = pgTable("professor_availability", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  professorId: integer("professor_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Domingo, 1=Segunda, etc.
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const professorCommissions = pgTable("professor_commissions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  professorId: integer("professor_id").notNull(),
  reservationId: integer("reservation_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { 
    enum: ["pending", "paid", "cancelled"] 
  }).notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const professorScheduleBlocks = pgTable("professor_schedule_blocks", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  professorId: integer("professor_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  status: text("status", { 
    enum: ["available", "blocked", "booked"] 
  }).notNull().default("available"),
  description: text("description"), // Para bloqueios ou notas
  createdBy: integer("created_by"), // Admin ou professor que criou
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== PLAYERS FOR HIRE ==========

export const playersForHire = pgTable("players_for_hire", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  userId: integer("user_id"), // Link to user if registered
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  photoUrl: text("photo_url"),
  technicalLevel: text("technical_level", { 
    enum: ["iniciante", "intermediario", "avancado", "profissional"] 
  }).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).notNull(),
  radiusOfActionKm: integer("radius_of_action_km").default(10),
  portfolioUrl: text("portfolio_url"),
  isActive: boolean("is_active").default(true),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  totalGamesPlayed: integer("total_games_played").default(0),
  totalRevenueGenerated: decimal("total_revenue_generated", { precision: 12, scale: 2 }).default("0.00"),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 12, scale: 2 }).default("0.00"),
  sports: text("sports").array().notNull(), // Array of sports
  preferredPositions: jsonb("preferred_positions").$type<{
    sport: string;
    positions: string[];
  }[]>().default([]), // Array of objects: [{ sport: 'Futevolei', positions: ['Atacante', 'Defensor'] }]
  bio: text("bio"),
  certifications: text("certifications").array().default([]),
  keywords: text("keywords").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Partners table moved to end of schema to avoid duplication

// ========== INSERT SCHEMAS ==========

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantUserSchema = createInsertSchema(tenantUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourtSchema = createInsertSchema(courts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = z.object({
  tenantId: z.number(),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string()
    .min(1, 'Telefone é obrigatório')
    .transform(val => {
      // Remove formatação mas mantém apenas números
      const cleanPhone = val.replace(/\D/g, '');
      console.log('🔍 Telefone sendo validado:', { original: val, cleaned: cleanPhone });
      return cleanPhone;
    })
    .refine(val => val.length >= 10 && val.length <= 11, {
      message: 'Telefone deve ter 10 ou 11 dígitos'
    }),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  documentType: z.enum(['CPF', 'RG']).optional(),
  documentNumber: z.string().optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  gender: z.enum(['masculino', 'feminino', 'outro']).optional(),
  address: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const insertRentalPlayerRequestSchema = createInsertSchema(rentalPlayerRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameElementSchema = createInsertSchema(gameElements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantBrandingSchema = createInsertSchema(tenantBranding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Professor schema that accepts fullName from frontend and maps to name
export const insertProfessorSchema = z.object({
  tenantId: z.number(),
  fullName: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().nullable().optional(),
  specialties: z.array(z.string()).default([]),
  experience: z.number().optional(),
  hourlyRate: z.union([z.string(), z.number()]).optional().transform(val => val ? parseFloat(val.toString()) : undefined),
  bio: z.string().optional(),
  certification: z.string().optional(),
  isActive: z.boolean().default(true),
  rating: z.number().optional(),
  totalClasses: z.number().default(0),
  userId: z.number().optional(),
  photoUrl: z.string().optional(),
  experienceLevel: z.enum(["junior", "pleno", "senior"]).default("junior"),
  methodology: z.string().optional(),
  portfolioUrl: z.string().optional(),
  commissionPercentage: z.union([z.string(), z.number()]).optional().transform(val => val ? parseFloat(val.toString()) : undefined),
}).transform(data => ({
  ...data,
  name: data.fullName, // Map fullName to name for database
}));

export const insertProfessorAvailabilitySchema = createInsertSchema(professorAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfessorCommissionSchema = createInsertSchema(professorCommissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlayerForHireSchema = createInsertSchema(playersForHire).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfessorScheduleBlockSchema = createInsertSchema(professorScheduleBlocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TenantSponsor schema will be defined with partners table

// Update schemas for partial updates
export const updateUserSchema = insertUserSchema.partial();
export const updateCourtSchema = insertCourtSchema.partial();
export const updateReservationSchema = insertReservationSchema.partial();
export const updateClassSchema = insertClassSchema.partial();
export const updatePaymentSchema = insertPaymentSchema.partial();

// ========== TYPES ==========

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type Court = typeof courts.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type RentalPlayerRequest = typeof rentalPlayerRequests.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type GameElement = typeof gameElements.$inferSelect;
export type TenantBranding = typeof tenantBranding.$inferSelect;
export type Professor = typeof professors.$inferSelect;
export type ProfessorAvailability = typeof professorAvailability.$inferSelect;
export type ProfessorCommission = typeof professorCommissions.$inferSelect;
export type PlayerForHire = typeof playersForHire.$inferSelect;
// TenantSponsor type will be defined with partners table

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTenantUser = z.infer<typeof insertTenantUserSchema>;
export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertClassEnrollment = z.infer<typeof insertClassEnrollmentSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertRentalPlayerRequest = z.infer<typeof insertRentalPlayerRequestSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertGameElement = z.infer<typeof insertGameElementSchema>;
export type InsertTenantBranding = z.infer<typeof insertTenantBrandingSchema>;
export type InsertProfessor = z.infer<typeof insertProfessorSchema>;
export type InsertProfessorAvailability = z.infer<typeof insertProfessorAvailabilitySchema>;
export type InsertProfessorCommission = z.infer<typeof insertProfessorCommissionSchema>;
export type InsertPlayerForHire = z.infer<typeof insertPlayerForHireSchema>;
// InsertTenantSponsor type will be defined with partners table

// Alias para compatibilidade
export type Booking = Reservation;
export type InsertBooking = InsertReservation;

// ========== ENUMS ==========

export const UserRole = {
  SUPER_ADMIN: 'super_admin' as const,
  ADMIN: 'admin' as const,
  TEACHER: 'teacher' as const,
  CLIENT: 'client' as const,
  RENTAL_PLAYER: 'rental_player' as const,
};

export const TenantStatus = {
  ACTIVE: 'active' as const,
  INACTIVE: 'inactive' as const,
  SUSPENDED: 'suspended' as const,
};

export const TenantPlan = {
  BASIC: 'basic' as const,
  PREMIUM: 'premium' as const,
  ENTERPRISE: 'enterprise' as const,
};

export const SportType = {
  FUTEVOLEI: 'futevolei' as const,
  BEACH_TENNIS: 'beach_tennis' as const,
  VOLLEYBALL: 'volleyball' as const,
  FOOTBALL: 'football' as const,
  TENNIS: 'tennis' as const,
};

export const ReservationStatus = {
  PENDING: 'pending' as const,
  CONFIRMED: 'confirmed' as const,
  CANCELLED: 'cancelled' as const,
  COMPLETED: 'completed' as const,
  NO_SHOW: 'no_show' as const,
};

export const PaymentStatus = {
  PENDING: 'pending' as const,
  PROCESSING: 'processing' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  CANCELLED: 'cancelled' as const,
  REFUNDED: 'refunded' as const,
};

export const PaymentMethod = {
  PIX: 'pix' as const,
  CREDIT_CARD: 'credit_card' as const,
  DEBIT_CARD: 'debit_card' as const,
  CASH: 'cash' as const,
  BANK_TRANSFER: 'bank_transfer' as const,
};

// ========== BRAND CUSTOMIZATION TABLES ==========

export const brandSettings = pgTable("brand_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  
  // Logo settings
  logoUrl: text("logo_url"),
  logoSquareUrl: text("logo_square_url"), // For favicons, social media
  logoHorizontalUrl: text("logo_horizontal_url"), // For headers
  logoVerticalUrl: text("logo_vertical_url"), // For mobile
  faviconUrl: text("favicon_url"),
  
  // Color scheme
  primaryColor: text("primary_color").default("#2563eb"), // Blue
  secondaryColor: text("secondary_color").default("#64748b"), // Gray
  accentColor: text("accent_color").default("#10b981"), // Green
  backgroundColor: text("background_color").default("#ffffff"),
  textColor: text("text_color").default("#1f2937"),
  
  // Typography
  fontFamily: text("font_family").default("Inter"),
  headingFont: text("heading_font").default("Inter"),
  
  // Background images
  heroBackgroundUrl: text("hero_background_url"),
  pageBackgroundUrl: text("page_background_url"),
  loginBackgroundUrl: text("login_background_url"),
  
  // Custom CSS
  customCss: text("custom_css"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const venueSettings = pgTable("venue_settings", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  
  // Basic information
  venueName: text("venue_name").notNull(),
  venueDescription: text("venue_description"),
  tagline: text("tagline"),
  
  // Contact information
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  whatsapp: text("whatsapp"),
  
  // Address
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  neighborhood: text("neighborhood"),
  
  // Operating hours
  operatingHours: jsonb("operating_hours"), // { monday: { open: "06:00", close: "22:00" }, ... }
  
  // Social media
  instagram: text("instagram"),
  facebook: text("facebook"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  
  // Policies
  cancellationPolicy: text("cancellation_policy"),
  termsOfService: text("terms_of_service"),
  privacyPolicy: text("privacy_policy"),
  houseRules: text("house_rules"),
  
  // SEO
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: text("keywords").array(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mediaGallery = pgTable("media_gallery", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  
  // File information
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  fileSize: integer("file_size"), // in bytes
  mimeType: text("mime_type").notNull(),
  
  // Categorization
  category: text("category", { 
    enum: ["logo", "banner", "background", "court", "facility", "event", "promotional", "other"] 
  }).default("other"),
  tags: text("tags").array(),
  
  // Metadata
  title: text("title"),
  description: text("description"),
  altText: text("alt_text"),
  
  // Display properties
  isPublic: boolean("is_public").default(true),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  
  // Usage tracking
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brandThemes = pgTable("brand_themes", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  
  // Theme information
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  
  // Theme configuration
  config: jsonb("config").notNull(), // Complete theme configuration
  
  // Preview
  previewUrl: text("preview_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== BRAND CUSTOMIZATION TYPES ==========

export type BrandSettings = typeof brandSettings.$inferSelect;
export type InsertBrandSettings = typeof brandSettings.$inferInsert;
export type VenueSettings = typeof venueSettings.$inferSelect;
export type InsertVenueSettings = typeof venueSettings.$inferInsert;
export type MediaGallery = typeof mediaGallery.$inferSelect;
export type InsertMediaGallery = typeof mediaGallery.$inferInsert;
export type BrandThemes = typeof brandThemes.$inferSelect;
export type InsertBrandThemes = typeof brandThemes.$inferInsert;

// ========== BRAND CUSTOMIZATION SCHEMAS ==========

export const insertBrandSettingsSchema = createInsertSchema(brandSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVenueSettingsSchema = createInsertSchema(venueSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMediaGallerySchema = createInsertSchema(mediaGallery).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  lastUsedAt: true,
});

export const insertBrandThemesSchema = createInsertSchema(brandThemes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ========== PRICING MANAGEMENT TABLES ==========

export const pricingRules = pgTable("pricing_rules", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  
  // Rule identification
  name: text("name").notNull(),
  description: text("description"),
  priority: integer("priority").default(0), // Higher priority overrides lower
  isActive: boolean("is_active").default(true),
  
  // Rule conditions
  courtIds: integer("court_ids").array(), // Empty array = applies to all courts
  courtTypes: text("court_types").array(), // Types of courts (futevolei, beach_tennis, etc.)
  
  // Time-based conditions
  dayOfWeek: text("day_of_week").array(), // ['monday', 'tuesday', etc.] Empty = all days
  startTime: text("start_time"), // "08:00" - time in HH:mm format
  endTime: text("end_time"), // "22:00" - time in HH:mm format
  dateFrom: timestamp("date_from"), // Specific date range start
  dateTo: timestamp("date_to"), // Specific date range end
  
  // Customer conditions
  customerTypes: text("customer_types").array(), // ['individual', 'monthly', 'quarterly', 'partner_platform']
  partnerPlatforms: text("partner_platforms").array(), // ['gympass', 'totalpass', etc.]
  
  // Pricing configuration
  priceType: text("price_type", { enum: ["fixed", "percentage", "discount"] }).notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }), // Fixed price
  percentageModifier: decimal("percentage_modifier", { precision: 5, scale: 2 }), // +50% = 150, -20% = 80
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }), // Fixed discount amount
  
  // Special conditions
  isPeakHour: boolean("is_peak_hour").default(false),
  isLastMinute: boolean("is_last_minute").default(false), // Less than 2 hours notice
  lastMinuteHours: integer("last_minute_hours").default(2),
  
  // Group discounts
  minGroupSize: integer("min_group_size"),
  maxGroupSize: integer("max_group_size"),
  groupDiscountPercentage: decimal("group_discount_percentage", { precision: 5, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dynamicPricing = pgTable("dynamic_pricing", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  
  // Pricing configuration
  isEnabled: boolean("is_enabled").default(false),
  
  // Base pricing strategy
  baseStrategy: text("base_strategy", { 
    enum: ["demand_based", "time_based", "competition_based", "hybrid"] 
  }).default("time_based"),
  
  // Demand-based pricing
  demandMultiplier: decimal("demand_multiplier", { precision: 5, scale: 2 }).default("1.0"),
  highDemandThreshold: decimal("high_demand_threshold", { precision: 3, scale: 2 }).default("0.8"), // 80% occupancy
  lowDemandThreshold: decimal("low_demand_threshold", { precision: 3, scale: 2 }).default("0.3"), // 30% occupancy
  
  // Peak hour configuration
  peakHourMultiplier: decimal("peak_hour_multiplier", { precision: 5, scale: 2 }).default("1.5"),
  weekdayPeakStart: text("weekday_peak_start").default("18:00"),
  weekdayPeakEnd: text("weekday_peak_end").default("22:00"),
  weekendPeakStart: text("weekend_peak_start").default("08:00"),
  weekendPeakEnd: text("weekend_peak_end").default("18:00"),
  
  // Seasonal adjustments
  seasonalAdjustments: jsonb("seasonal_adjustments"), // { "summer": 1.2, "winter": 0.9 }
  
  // Last minute pricing
  lastMinuteDiscountEnabled: boolean("last_minute_discount_enabled").default(true),
  lastMinuteDiscountPercentage: decimal("last_minute_discount_percentage", { precision: 5, scale: 2 }).default("20"),
  lastMinuteThresholdHours: integer("last_minute_threshold_hours").default(2),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerPricing = pgTable("customer_pricing", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  
  // Customer type configuration
  customerType: text("customer_type", { 
    enum: ["individual", "monthly", "quarterly", "yearly", "partner_platform", "corporate"] 
  }).notNull(),
  
  name: text("name").notNull(), // "Plano Mensal", "Gympass", etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
  
  // Pricing configuration
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  fixedPrice: decimal("fixed_price", { precision: 10, scale: 2 }), // For partner platforms
  
  // Subscription features (for monthly/quarterly/yearly)
  includedHours: integer("included_hours"), // Free hours per period
  discountAfterIncluded: decimal("discount_after_included", { precision: 5, scale: 2 }), // Discount after free hours
  
  // Partner platform configuration
  partnerPlatformId: text("partner_platform_id"), // External platform identifier
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }),
  
  // Booking restrictions
  advanceBookingDays: integer("advance_booking_days"), // How many days in advance they can book
  cancellationPolicy: text("cancellation_policy"),
  
  // Valid period
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  
  // Reference information
  courtId: integer("court_id"),
  reservationId: integer("reservation_id"),
  
  // Price calculation details
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
  
  // Applied rules and modifiers
  appliedRules: jsonb("applied_rules"), // Array of rule IDs and their effects
  customerType: text("customer_type"),
  discountsApplied: jsonb("discounts_applied"),
  
  // Context information
  bookingDateTime: timestamp("booking_date_time").notNull(),
  reservationDateTime: timestamp("reservation_date_time").notNull(),
  isPeakHour: boolean("is_peak_hour").default(false),
  isLastMinute: boolean("is_last_minute").default(false),
  
  // Market data
  demandLevel: text("demand_level", { enum: ["low", "medium", "high"] }),
  occupancyRate: decimal("occupancy_rate", { precision: 3, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== PRICING MANAGEMENT TYPES ==========

export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;
export type DynamicPricing = typeof dynamicPricing.$inferSelect;
export type InsertDynamicPricing = typeof dynamicPricing.$inferInsert;
export type CustomerPricing = typeof customerPricing.$inferSelect;
export type InsertCustomerPricing = typeof customerPricing.$inferInsert;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = typeof priceHistory.$inferInsert;

// ========== PRICING MANAGEMENT SCHEMAS ==========

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDynamicPricingSchema = createInsertSchema(dynamicPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerPricingSchema = createInsertSchema(customerPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertBrandSettingsType = z.infer<typeof insertBrandSettingsSchema>;
export type InsertVenueSettingsType = z.infer<typeof insertVenueSettingsSchema>;
export type InsertMediaGalleryType = z.infer<typeof insertMediaGallerySchema>;
export type InsertPricingRuleType = z.infer<typeof insertPricingRuleSchema>;
export type InsertDynamicPricingType = z.infer<typeof insertDynamicPricingSchema>;
export type InsertCustomerPricingType = z.infer<typeof insertCustomerPricingSchema>;
export type InsertPriceHistoryType = z.infer<typeof insertPriceHistorySchema>;
export type InsertBrandThemesType = z.infer<typeof insertBrandThemesSchema>;

// ========== LOYALTY PROGRAM TABLES ==========

export const loyaltyProgramConfig = pgTable("loyalty_program_config", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  
  // Points configuration
  pointsPerRealSpent: decimal("points_per_real_spent", { precision: 5, scale: 2 }).notNull().default("1.00"), // 1 point per R$1 spent
  pointsPerReservation: integer("points_per_reservation").notNull().default(10), // 10 points per completed reservation
  
  // Loyalty levels configuration
  levels: jsonb("levels").$type<{
    name: string;
    pointsThreshold: number;
    benefits: string[];
    color: string;
  }[]>().default([
    { name: "Bronze", pointsThreshold: 0, benefits: ["Acesso básico"], color: "#CD7F32" },
    { name: "Silver", pointsThreshold: 100, benefits: ["5% desconto", "Prioridade na reserva"], color: "#C0C0C0" },
    { name: "Gold", pointsThreshold: 250, benefits: ["10% desconto", "Reserva antecipada", "Suporte prioritário"], color: "#FFD700" },
    { name: "Platinum", pointsThreshold: 500, benefits: ["15% desconto", "Acesso VIP", "Eventos exclusivos"], color: "#E5E4E2" }
  ]),
  
  // Redeemable rewards configuration
  rewards: jsonb("rewards").$type<{
    id: string;
    name: string;
    pointsCost: number;
    description: string;
    active: boolean;
    category: string;
  }[]>().default([
    { id: "free-hour", name: "1 Hora Grátis", pointsCost: 200, description: "Uma hora grátis de quadra em horário comercial", active: true, category: "court" },
    { id: "discount-50", name: "Desconto R$ 50", pointsCost: 150, description: "Desconto de R$ 50 em qualquer reserva", active: true, category: "discount" },
    { id: "equipment-rental", name: "Equipamento Grátis", pointsCost: 100, description: "Aluguel gratuito de equipamentos por 1 dia", active: true, category: "equipment" }
  ]),
  
  // Program settings
  isActive: boolean("is_active").default(true),
  allowManualAdjustments: boolean("allow_manual_adjustments").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loyaltyPointsHistory = pgTable("loyalty_points_history", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  
  // Transaction details
  transactionType: text("transaction_type", { 
    enum: ["earned_reservation", "earned_spending", "redeemed_reward", "manual_adjustment", "bonus"] 
  }).notNull(),
  points: integer("points").notNull(), // Positive for earning, negative for spending
  
  // Context information
  reservationId: integer("reservation_id"), // Link to reservation if applicable
  rewardId: text("reward_id"), // Link to redeemed reward
  description: text("description").notNull(),
  adminNote: text("admin_note"), // For manual adjustments
  
  // Reference data
  relatedEntityType: text("related_entity_type"), // "reservation", "payment", "reward", "manual"
  relatedEntityId: integer("related_entity_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by"), // User who created this transaction (for manual adjustments)
});

export const loyaltyRewardRedemptions = pgTable("loyalty_reward_redemptions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  
  // Reward details
  rewardId: text("reward_id").notNull(), // Reference to reward in config
  rewardName: text("reward_name").notNull(),
  pointsDeducted: integer("points_deducted").notNull(),
  
  // Redemption status
  status: text("status", { 
    enum: ["pending", "used", "expired", "cancelled"] 
  }).notNull().default("pending"),
  
  // Usage tracking
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  redeemedBy: integer("redeemed_by").notNull(), // Admin who processed the redemption
});

// ===== EVENT RESERVATIONS =====

export const eventReservations = pgTable("event_reservations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  
  // Basic event information
  eventName: text("event_name").notNull(), // "Aniversário João", "Show Rock", "Festa Empresarial"
  eventType: text("event_type").notNull(), // "birthday", "party", "show", "corporate", "wedding", "graduation"
  description: text("description"),
  
  // Client information
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone").notNull(),
  clientEmail: text("client_email"),
  clientDocument: text("client_document"), // CPF/CNPJ
  
  // Event details
  eventDate: text("event_date").notNull(), // Using text for date format
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  expectedGuests: integer("expected_guests").notNull().default(0),
  
  // Location and resources
  courtIds: integer("court_ids").array().default([]), // Multiple courts can be reserved
  
  // Master Booking System for Multi-Slot Reservations
  isMasterBooking: boolean("is_master_booking").default(false),
  masterBookingId: integer("master_booking_id").references(() => eventReservations.id),
  slotPrice: decimal("slot_price", { precision: 10, scale: 2 }), // Individual slot price for occurrence bookings
  
  // Pricing and payment
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  additionalServices: jsonb("additional_services").$type<{
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }[]>().default([]),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),

  advancePayment: decimal("advance_payment", { precision: 10, scale: 2 }).default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).default("0"),
  
  // Services and amenities
  cateringIncluded: boolean("catering_included").default(false),
  decorationIncluded: boolean("decoration_included").default(false),
  soundSystemIncluded: boolean("sound_system_included").default(false),
  lightingIncluded: boolean("lighting_included").default(false),
  securityIncluded: boolean("security_included").default(false),
  cleaningIncluded: boolean("cleaning_included").default(false),
  
  // Equipment and setup
  equipmentNeeded: jsonb("equipment_needed").$type<{
    item: string;
    quantity: number;
    price?: number;
  }[]>().default([]),
  setupTime: text("setup_time"), // When setup begins
  teardownTime: text("teardown_time"), // When teardown ends
  
  // Special requirements
  specialRequirements: text("special_requirements"),
  accessibilityNeeds: text("accessibility_needs"),
  alcoholPermitted: boolean("alcohol_permitted").default(true),
  
  // Status and management - Enhanced for security and financial integrity
  status: text("status", { 
    enum: ["pending", "confirmed", "paid", "cancelled", "refund_pending", "refunded", "blocked", "completed"] 
  }).notNull().default("pending"),
  confirmationDate: timestamp("confirmation_date"),
  cancellationReason: text("cancellation_reason"),
  refundReason: text("refund_reason"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundDate: timestamp("refund_date"),
  
  // Contracts and documents
  contractSigned: boolean("contract_signed").default(false),
  contractPath: text("contract_path"),
  insuranceRequired: boolean("insurance_required").default(false),
  insuranceProvider: text("insurance_provider"),
  
  // Internal notes
  internalNotes: text("internal_notes"),
  publicNotes: text("public_notes"), // Visible to client
  
  // Notifications and reminders
  remindersSent: jsonb("reminders_sent").$type<{
    type: string;
    sentAt: string;
    channel: string;
  }[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventPackages = pgTable("event_packages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  
  // Package details
  name: text("name").notNull(), // "Pacote Aniversário Infantil", "Pacote Show Completo"
  description: text("description"),
  eventTypes: jsonb("event_types").$type<string[]>().default([]), // Which event types this applies to
  
  // Pricing
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  pricePerGuest: decimal("price_per_guest", { precision: 5, scale: 2 }).default("0"),
  maxGuests: integer("max_guests"),
  minGuests: integer("min_guests").default(1),
  
  // Duration and timing
  duration: integer("duration").notNull(), // Duration in hours
  setupTimeIncluded: integer("setup_time_included").default(1), // Hours
  teardownTimeIncluded: integer("teardown_time_included").default(1), // Hours
  
  // Included services
  includedServices: jsonb("included_services").$type<{
    name: string;
    description?: string;
    included: boolean;
  }[]>().default([]),
  
  // Available add-ons
  availableAddons: jsonb("available_addons").$type<{
    name: string;
    description?: string;
    price: number;
    category: string;
  }[]>().default([]),
  
  // Equipment included
  includedEquipment: jsonb("included_equipment").$type<{
    item: string;
    quantity: number;
    description?: string;
  }[]>().default([]),
  
  // Restrictions and requirements
  minimumAdvanceBooking: integer("minimum_advance_booking").default(7), // Days
  cancellationPolicy: text("cancellation_policy"),
  advancePaymentPercentage: decimal("advance_payment_percentage", { precision: 5, scale: 2 }).default("50"),
  
  // Availability
  isActive: boolean("is_active").default(true),
  availableDays: jsonb("available_days").$type<string[]>().default([]), // ["monday", "tuesday", ...]
  blackoutDates: jsonb("blackout_dates").$type<string[]>().default([]), // Dates when package is not available
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const eventPayments = pgTable("event_payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  eventReservationId: integer("event_reservation_id").notNull().references(() => eventReservations.id),
  
  // Payment details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: text("payment_type").notNull(), // "advance", "balance", "additional", "refund"
  paymentMethod: text("payment_method").notNull(), // "cash", "card", "pix", "transfer", "check"
  
  // Transaction information
  transactionId: text("transaction_id"),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  dueDate: text("due_date"),
  
  // Status
  status: text("status").notNull().default("pending"), // "pending", "completed", "failed", "refunded"
  
  // References and notes
  reference: text("reference"), // Invoice number, receipt number, etc.
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types
export type EventReservation = typeof eventReservations.$inferSelect;
export type InsertEventReservation = typeof eventReservations.$inferInsert;
export type EventPackage = typeof eventPackages.$inferSelect;
export type InsertEventPackage = typeof eventPackages.$inferInsert;
export type EventPayment = typeof eventPayments.$inferSelect;
export type InsertEventPayment = typeof eventPayments.$inferInsert;

// Insert schemas
export const insertEventReservationSchema = createInsertSchema(eventReservations);
export const insertEventPackageSchema = createInsertSchema(eventPackages);
export const insertEventPaymentSchema = createInsertSchema(eventPayments);

export type InsertEventReservationType = z.infer<typeof insertEventReservationSchema>;
export type InsertEventPackageType = z.infer<typeof insertEventPackageSchema>;
export type InsertEventPaymentType = z.infer<typeof insertEventPaymentSchema>;



// ========== PARTNERS AND SPONSORS TABLES ==========

// Partners table
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  category: text("category", { 
    enum: ["patrocinador", "apoiador", "fornecedor", "parceiro_oficial", "parceiro_tecnico"] 
  }).notNull().default("parceiro_oficial"),
  status: text("status", { enum: ["active", "inactive", "pending"] }).notNull().default("active"),
  displayOrder: integer("display_order").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contractValue: text("contract_value"), // Stored as string for flexibility
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Partner banners/advertisements table
export const partnerBanners = pgTable("partner_banners", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  partnerId: integer("partner_id").notNull().references(() => partners.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  clickUrl: text("click_url"),
  position: text("position", { 
    enum: ["banner_principal", "banner_lateral", "popup", "rodape", "header", "sidebar"] 
  }).notNull(),
  displayType: text("display_type", { 
    enum: ["image", "video", "carousel", "popup"] 
  }).notNull().default("image"),
  targetAudience: text("target_audience").array(), // ["admin", "teacher", "client", "rental_player"]
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  displayFrequency: integer("display_frequency").default(1), // Times per session
  maxDailyViews: integer("max_daily_views"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Partner metrics table for tracking views and clicks
export const partnerMetrics = pgTable("partner_metrics", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  partnerId: integer("partner_id").references(() => partners.id, { onDelete: "cascade" }),
  bannerId: integer("banner_id").references(() => partnerBanners.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  eventType: text("event_type", { enum: ["view", "click", "impression"] }).notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  sessionId: text("session_id"),
  metadata: jsonb("metadata"), // Additional tracking data
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Advertisement configuration table
export const advertisementConfig = pgTable("advertisement_config", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  adsEnabled: boolean("ads_enabled").default(true),
  showOnDashboard: boolean("show_on_dashboard").default(true),
  showOnBooking: boolean("show_on_booking").default(true),
  showPopups: boolean("show_popups").default(true),
  popupFrequency: integer("popup_frequency").default(3), // Show every X page visits
  maxAdsPerPage: integer("max_ads_per_page").default(3),
  rotationInterval: integer("rotation_interval").default(30), // Seconds for banner rotation
  adBlockDetection: boolean("ad_block_detection").default(false),
  targetingEnabled: boolean("targeting_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ========== PARTNERS AND SPONSORS TYPES ==========

export type Partner = typeof partners.$inferSelect;
export type InsertPartner = typeof partners.$inferInsert;
export type PartnerBanner = typeof partnerBanners.$inferSelect;
export type InsertPartnerBanner = typeof partnerBanners.$inferInsert;
export type PartnerMetrics = typeof partnerMetrics.$inferSelect;
export type InsertPartnerMetrics = typeof partnerMetrics.$inferInsert;
export type AdvertisementConfig = typeof advertisementConfig.$inferSelect;
export type InsertAdvertisementConfig = typeof advertisementConfig.$inferInsert;

// ========== PARTNERS AND SPONSORS SCHEMAS ==========

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerBannerSchema = createInsertSchema(partnerBanners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerMetricsSchema = createInsertSchema(partnerMetrics).omit({
  id: true,
});

export const insertAdvertisementConfigSchema = createInsertSchema(advertisementConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPartnerType = z.infer<typeof insertPartnerSchema>;
export type InsertPartnerBannerType = z.infer<typeof insertPartnerBannerSchema>;
export type InsertPartnerMetricsType = z.infer<typeof insertPartnerMetricsSchema>;
export type InsertAdvertisementConfigType = z.infer<typeof insertAdvertisementConfigSchema>;

// ========== LOYALTY PROGRAM TYPES ==========

export type LoyaltyProgramConfig = typeof loyaltyProgramConfig.$inferSelect;
export type InsertLoyaltyProgramConfig = typeof loyaltyProgramConfig.$inferInsert;
export type LoyaltyPointsHistory = typeof loyaltyPointsHistory.$inferSelect;
export type InsertLoyaltyPointsHistory = typeof loyaltyPointsHistory.$inferInsert;
export type LoyaltyRewardRedemption = typeof loyaltyRewardRedemptions.$inferSelect;
export type InsertLoyaltyRewardRedemption = typeof loyaltyRewardRedemptions.$inferInsert;

// ========== LOYALTY PROGRAM SCHEMAS ==========

export const insertLoyaltyProgramConfigSchema = createInsertSchema(loyaltyProgramConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyPointsHistorySchema = createInsertSchema(loyaltyPointsHistory).omit({
  id: true,
  createdAt: true,
});

export const insertLoyaltyRewardRedemptionSchema = createInsertSchema(loyaltyRewardRedemptions).omit({
  id: true,
  createdAt: true,
});

export type InsertLoyaltyProgramConfigType = z.infer<typeof insertLoyaltyProgramConfigSchema>;
export type InsertLoyaltyPointsHistoryType = z.infer<typeof insertLoyaltyPointsHistorySchema>;
export type InsertLoyaltyRewardRedemptionType = z.infer<typeof insertLoyaltyRewardRedemptionSchema>;