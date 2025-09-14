import { 
  users, 
  courts, 
  reservations, 
  payments,
  clients,
  professors,
  professorAvailability,
  professorCommissions,
  type User, 
  type InsertUser,
  type Court,
  type InsertCourt,
  type Reservation,
  type InsertReservation,
  type Payment,
  type InsertPayment,
  type Client,
  type InsertClient,
  type Professor,
  type InsertProfessor,
  type ProfessorAvailability,
  type InsertProfessorAvailability,
  type ProfessorCommission,
  type InsertProfessorCommission,
  // Mantém compatibilidade
  type Booking,
  type InsertBooking
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;

  // Court operations
  getCourt(id: number): Promise<Court | undefined>;
  getAllCourts(): Promise<Court[]>;
  getCourtsBySport(sport: string): Promise<Court[]>;
  createCourt(court: InsertCourt): Promise<Court>;
  updateCourt(id: number, court: Partial<InsertCourt>): Promise<Court | undefined>;
  deleteCourt(id: number): Promise<boolean>;

  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  getBookingsByUser(userId: number): Promise<Booking[]>;
  getBookingsByCourt(courtId: number): Promise<Booking[]>;
  getBookingsByDate(date: string): Promise<Booking[]>;
  getTodayBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;

  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  getClientsByTenant(tenantId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Payment operations
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByBooking(bookingId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Dashboard operations
  getDashboardStats(): Promise<{
    todayBookings: number;
    activeCourts: number;
    monthlyRevenue: string;
    activeUsers: number;
  }>;

  // Professor operations
  getProfessorsByTenant(tenantId: number): Promise<Professor[]>;
  getProfessorById(id: number, tenantId: number): Promise<Professor | undefined>;
  getProfessorByEmail(email: string, tenantId: number): Promise<Professor | undefined>;
  createProfessor(professor: InsertProfessor): Promise<Professor>;
  updateProfessor(id: number, professor: Partial<InsertProfessor>, tenantId: number): Promise<Professor | undefined>;

  // Professor Availability operations
  getProfessorAvailability(professorId: number, tenantId: number): Promise<ProfessorAvailability[]>;
  createProfessorAvailability(availability: InsertProfessorAvailability): Promise<ProfessorAvailability>;
  approveProfessorAvailability(id: number, professorId: number, tenantId: number, approvedBy: number): Promise<boolean>;

  // Professor Performance operations
  getProfessorPerformanceSummary(professorId: number, tenantId: number): Promise<{
    totalLessons: number;
    completedLessons: number;
    totalRevenue: string;
    totalCommissions: string;
    averageRating: number;
  }>;
  getProfessorCommissions(professorId: number, tenantId: number, filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ProfessorCommission[]>;
  markCommissionAsPaid(commissionId: number, professorId: number, tenantId: number): Promise<boolean>;

  // Professor Search operations
  searchAvailableProfessors(tenantId: number, criteria: {
    specialty?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<Professor[]>;

  // Tenant operations (needed for multi-tenant support)
  getUserTenants(userId: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private courts: Map<number, Court> = new Map();
  private bookings: Map<number, Booking> = new Map();
  private payments: Map<number, Payment> = new Map();
  
  private currentUserId = 1;
  private currentCourtId = 1;
  private currentBookingId = 1;
  private currentPaymentId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create default admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      email: "admin@matchplay.com",
      password: "admin123", // In production, this should be hashed
      name: "João Silva",
      role: "admin",
      phone: "+55 11 99999-9999",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face",
      isActive: true,
      createdAt: new Date(),
      specialties: null,
      commissionPercent: null,
      bio: null,
      skillLevel: null,
      preferredSports: null,
      experience: null,
      certifications: null,
      hourlyRate: null,
      rating: null,
      totalClasses: null,
      completedClasses: null,
      lastLogin: null,
      loyaltyPoints: null,
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create default teacher user
    const teacherUser: User = {
      id: this.currentUserId++,
      username: "professor",
      email: "professor@matchplay.com",
      password: "professor123",
      name: "Maria Santos",
      role: "teacher",
      phone: "+55 11 98888-8888",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face",
      isActive: true,
      createdAt: new Date(),
      specialties: ["futevolei", "beach_tennis"],
      commissionPercent: 30,
      bio: "Professora especializada em esportes de praia com 8 anos de experiência.",
      skillLevel: "professional",
      preferredSports: ["futevolei", "beach_tennis"],
      experience: "8 anos",
      certifications: ["CBV", "Confederação Brasileira de Tennis"],
      hourlyRate: "120.00",
      rating: 4.8,
      totalClasses: 250,
      completedClasses: 235,
      lastLogin: null,
      loyaltyPoints: null,
      updatedAt: new Date(),
    };
    this.users.set(teacherUser.id, teacherUser);

    // Create sample courts
    const court1: Court = {
      id: this.currentCourtId++,
      name: "Quadra 1 - Futevôlei",
      sport: "futevolei",
      description: "Quadra principal com vista para o mar",
      image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&w=400&h=200&fit=crop",
      pricePerHour: "80.00",
      status: "available",
      isActive: true,
      createdAt: new Date(),
    };

    const court2: Court = {
      id: this.currentCourtId++,
      name: "Quadra 2 - Beach Tennis",
      sport: "beach_tennis",
      description: "Quadra coberta com iluminação LED",
      image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?ixlib=rb-4.0.3&w=400&h=200&fit=crop",
      pricePerHour: "100.00",
      status: "occupied",
      isActive: true,
      createdAt: new Date(),
    };

    const court3: Court = {
      id: this.currentCourtId++,
      name: "Quadra 3 - Vôlei",
      sport: "volleyball",
      description: "Quadra oficial com arquibancada",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&w=400&h=200&fit=crop",
      pricePerHour: "70.00",
      status: "maintenance",
      isActive: true,
      createdAt: new Date(),
    };

    this.courts.set(court1.id, court1);
    this.courts.set(court2.id, court2);
    this.courts.set(court3.id, court3);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // Court operations
  async getCourt(id: number): Promise<Court | undefined> {
    return this.courts.get(id);
  }

  async getAllCourts(): Promise<Court[]> {
    return Array.from(this.courts.values()).filter(court => court.isActive);
  }

  async getCourtsBySport(sport: string): Promise<Court[]> {
    return Array.from(this.courts.values()).filter(court => court.sport === sport && court.isActive);
  }

  async createCourt(insertCourt: InsertCourt): Promise<Court> {
    const court: Court = {
      ...insertCourt,
      id: this.currentCourtId++,
      createdAt: new Date(),
    };
    this.courts.set(court.id, court);
    return court;
  }

  async updateCourt(id: number, updates: Partial<InsertCourt>): Promise<Court | undefined> {
    const court = this.courts.get(id);
    if (!court) return undefined;
    
    const updatedCourt = { ...court, ...updates };
    this.courts.set(id, updatedCourt);
    return updatedCourt;
  }

  async deleteCourt(id: number): Promise<boolean> {
    const court = this.courts.get(id);
    if (!court) return false;
    
    const updatedCourt = { ...court, isActive: false };
    this.courts.set(id, updatedCourt);
    return true;
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
  }

  async getBookingsByCourt(courtId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.courtId === courtId);
  }

  async getBookingsByDate(date: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.date === date);
  }

  async getTodayBookings(): Promise<Booking[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getBookingsByDate(today);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      ...insertBooking,
      id: this.currentBookingId++,
      createdAt: new Date(),
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async updateBooking(id: number, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...updates };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    return this.bookings.delete(id);
  }

  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByBooking(bookingId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.bookingId === bookingId);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const payment: Payment = {
      ...insertPayment,
      id: this.currentPaymentId++,
      createdAt: new Date(),
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  async updatePayment(id: number, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...updates };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Dashboard operations
  async getDashboardStats(): Promise<{
    todayBookings: number;
    activeCourts: number;
    monthlyRevenue: string;
    activeUsers: number;
  }> {
    const todayBookings = (await this.getTodayBookings()).length;
    const activeCourts = (await this.getAllCourts()).filter(court => court.status === 'available').length;
    const activeUsers = Array.from(this.users.values()).filter(user => user.isActive).length;
    
    // Calculate monthly revenue (mock calculation)
    const monthlyRevenue = "R$ 15.420";

    return {
      todayBookings,
      activeCourts,
      monthlyRevenue,
      activeUsers,
    };
  }
}

export const storage = new MemStorage();
