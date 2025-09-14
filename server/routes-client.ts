import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage-db';

// Middleware para autenticação via JWT
const requireAuth = (req: any, res: any, next: any) => {
  const userId = req.jwtUserId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  req.userId = userId;
  req.tenantId = req.jwtTenantId;
  next();
};

const router = Router();

// Schema for reservation creation
const createReservationSchema = z.object({
  courtId: z.number(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalAmount: z.number(),
  notes: z.string().optional(),
  participants: z.number().min(1).default(1)
});



// Get court availability for a specific date
router.get('/court-availability', requireAuth, async (req: any, res: any) => {
  try {
    const { courtId, date } = req.query;
    
    if (!courtId || !date) {
      return res.status(400).json({ message: 'Court ID and date are required' });
    }

    // Get court information
    const court = await storage.getCourt(parseInt(courtId));
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Check if user has access to this court
    const tenantId = req.tenantId;
    if (court.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied to this court' });
    }

    // Get ALL reservations for the specific court and date (from ALL users - Admin and clients)
    // This ensures complete consistency across the system
    const courtReservations = [];
    let bookingId = 1;
    while (true) {
      try {
        const booking = await storage.getBooking(bookingId);
        if (!booking) break;
        // Include ALL active reservations regardless of who created them (Admin or Client)
        if (booking.courtId === parseInt(courtId) && 
            booking.date === date &&
            ['pending', 'confirmed', 'paid', 'blocked'].includes(booking.status)) {
          courtReservations.push(booking);
        }
        bookingId++;
      } catch {
        break;
      }
    }
    
    // Generate time slots based on court operating hours (simplified)
    const timeSlots = [];
    const startHour = 6; // 6 AM
    const endHour = 22; // 10 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${String(hour).padStart(2, '0')}:00`;
      
      // Check if this time slot is occupied
      const isOccupied = courtReservations.some(reservation => {
        const reservationStart = reservation.startTime;
        const reservationEnd = reservation.endTime;
        return timeString >= reservationStart && timeString < reservationEnd;
      });
      
      timeSlots.push({
        time: timeString,
        status: isOccupied ? 'occupied' : 'available',
        price: 50 // Default price since court doesn't have hourlyRate
      });
    }

    res.json(timeSlots);
  } catch (error) {
    console.error('Error fetching court availability:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new reservation
router.post('/reservations', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const tenantId = req.tenantId;
    const validatedData = createReservationSchema.parse(req.body);

    // Get court information
    const court = await storage.getCourt(validatedData.courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Check if user has access to this court
    if (court.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Access denied to this court' });
    }

    // CENTRALIZED CONFLICT VALIDATION: Check for conflicts with ALL existing reservations
    // This includes reservations made by Admin and ALL other clients to ensure system consistency
    const existingReservations = [];
    let bookingId = 1;
    while (true) {
      try {
        const booking = await storage.getBooking(bookingId);
        if (!booking) break;
        // Include ALL active reservations regardless of who created them
        if (booking.courtId === validatedData.courtId && 
            booking.date === validatedData.date &&
            ['pending', 'confirmed', 'paid', 'blocked'].includes(booking.status)) {
          existingReservations.push(booking);
        }
        bookingId++;
      } catch {
        break;
      }
    }

    const hasConflict = existingReservations.some(reservation => {
      const newStart = validatedData.startTime;
      const newEnd = validatedData.endTime;
      const existingStart = reservation.startTime;
      const existingEnd = reservation.endTime;
      
      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });

    if (hasConflict) {
      return res.status(409).json({ 
        message: 'Horário já ocupado por outra reserva',
        error: 'SLOT_OCCUPIED',
        details: 'Este horário não está mais disponível. Por favor, escolha outro horário.'
      });
    }

    // Create the reservation using existing booking structure
    const reservationData = {
      courtId: validatedData.courtId,
      date: validatedData.date,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      status: 'confirmed' as const,
      clientName: 'Client User',
      clientPhone: '',
      clientEmail: '',
      totalAmount: validatedData.totalAmount.toString(),
      tenantId: tenantId,
      userId: userId, // Add the required userId field
      type: 'rental' as const,
      notes: validatedData.notes || '',
      participants: validatedData.participants || 1
    };

    const reservation = await storage.createBooking(reservationData);

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid data', 
        errors: error.errors 
      });
    }
    
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get client's reservations (all reservations from their arena/tenant)
router.get('/reservations', requireAuth, async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId;
    
    // Get ALL reservations from the client's arena/tenant
    const allReservations = await storage.getReservationsByTenant(tenantId);
    
    // Group reservations by client, court, date and consecutive time slots
    const groupedReservations = new Map();
    
    // Sort reservations by date, court, and start time
    const sortedReservations = allReservations.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.courtId !== b.courtId) return a.courtId - b.courtId;
      return a.startTime.localeCompare(b.startTime);
    });
    
    for (const reservation of sortedReservations) {
      const court = await storage.getCourt(reservation.courtId);
      
      // Only process reservations that have valid courts
      if (court) {
        const key = `${reservation.clientName}-${reservation.courtId}-${reservation.date}`;
        
        if (!groupedReservations.has(key)) {
          // Calculate duration in hours for proper pricing
          const startTime = new Date(`1970-01-01T${reservation.startTime}`);
          const endTime = new Date(`1970-01-01T${reservation.endTime}`);
          const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          const correctAmount = parseFloat(court.pricePerHour || '100') * durationHours;
          
          // First reservation for this client/court/date
          groupedReservations.set(key, {
            id: reservation.id,
            courtName: court.name,
            tenantName: 'Premium Beach',
            date: reservation.date,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            status: reservation.status || 'confirmed',
            totalAmount: correctAmount,
            sport: court.sport,
            notes: reservation.notes,
            participants: reservation.participants || 1,
            createdAt: reservation.createdAt,
            reservationIds: [reservation.id]
          });
        } else {
          // Check if this reservation is consecutive to the existing group
          const existing = groupedReservations.get(key);
          const existingEndTime = existing.endTime;
          const currentStartTime = reservation.startTime;
          
          // Parse times for comparison
          const existingEndTimeParsed = new Date(`1970-01-01T${existingEndTime}`);
          const currentStartTimeParsed = new Date(`1970-01-01T${currentStartTime}`);
          
          // If times are exactly consecutive (no gap, no overlap)
          if (currentStartTimeParsed.getTime() === existingEndTimeParsed.getTime()) {
            // Calculate duration for this slot
            const currentEndTime = new Date(`1970-01-01T${reservation.endTime}`);
            const slotDurationHours = (currentEndTime.getTime() - currentStartTimeParsed.getTime()) / (1000 * 60 * 60);
            const slotAmount = parseFloat(court.pricePerHour || '100') * slotDurationHours;
            
            existing.endTime = reservation.endTime;
            existing.totalAmount += slotAmount;
            existing.reservationIds.push(reservation.id);
            // Use the latest reservation ID as the main ID
            existing.id = reservation.id;
          } else {
            // Non-consecutive reservation, create a new entry with a different key
            const newKey = `${key}-${reservation.startTime}`;
            
            // Calculate correct amount for this separate reservation
            const startTime = new Date(`1970-01-01T${reservation.startTime}`);
            const endTime = new Date(`1970-01-01T${reservation.endTime}`);
            const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            const correctAmount = parseFloat(court.pricePerHour || '100') * durationHours;
            
            groupedReservations.set(newKey, {
              id: reservation.id,
              courtName: court.name,
              tenantName: 'Premium Beach',
              date: reservation.date,
              startTime: reservation.startTime,
              endTime: reservation.endTime,
              status: reservation.status || 'confirmed',
              totalAmount: correctAmount,
              sport: court.sport,
              notes: reservation.notes,
              participants: reservation.participants || 1,
              createdAt: reservation.createdAt,
              reservationIds: [reservation.id]
            });
          }
        }
      }
    }
    
    const reservationsWithDetails = Array.from(groupedReservations.values());

    res.json(reservationsWithDetails);
  } catch (error) {
    console.error('Error fetching client reservations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available tenants for switching establishments
router.get('/available-tenants', async (req: any, res: any) => {
  try {
    // Get tenantId from JWT token
    const currentTenantId = req.jwtTenantId;
    
    if (!currentTenantId) {
      return res.status(400).json({ message: 'Tenant ID not found' });
    }
    
    const allTenants = await storage.getAllTenants();
    
    // Filter out current tenant and return others
    const availableTenants = allTenants
      .filter(tenant => tenant.id !== currentTenantId && tenant.status === 'active')
      .map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        tradeName: tenant.tradeName
      }));
    
    res.json({ tenants: availableTenants });
  } catch (error) {
    console.error('Error fetching available tenants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get client's classes (simplified)
router.get('/classes', requireAuth, async (req: any, res: any) => {
  try {
    // Return empty array for now - can be expanded later
    res.json([]);
  } catch (error) {
    console.error('Error fetching client classes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get rental players available to the client
router.get('/rental-players', requireAuth, async (req: any, res: any) => {
  try {
    const tenantId = req.tenantId;
    
    // Extract filters from query parameters
    const filters = {
      sport: req.query.sport as string,
      technicalLevel: req.query.level as string,
      search: req.query.search as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined
    };
    
    // Get all players from the same arena/tenant with filters
    const players = await storage.getPlayersForHire(tenantId, filters);
    
    // Transform data to match frontend interface using players_for_hire table fields
    const formattedPlayers = players.map((player: any) => {
      const name = player.full_name || 'Nome não disponível';
      const experienceLevel = player.technical_level || 'junior';
      const hourlyRate = parseFloat(String(player.hourly_rate || 0));
      const rating = parseFloat(String(player.average_rating || 0));
      const photoUrl = player.photo_url || null;
      const specialties = Array.isArray(player.sports) ? player.sports : [];
      
      return {
        id: player.id,
        name: name,
        specialties: specialties,
        experience_level: experienceLevel,
        hourlyRate: hourlyRate,
        rating: rating,
        photo_url: photoUrl,
        phone: player.phone || '',
        email: player.email || '',
        bio: player.bio || '',
        experience: 0,
        certification: Array.isArray(player.certifications) ? player.certifications.join(', ') : ''
      };
    });
    
    res.json(formattedPlayers);
  } catch (error) {
    console.error('Error fetching rental players:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get client's loyalty points (simplified)
router.get('/loyalty-points', requireAuth, async (req: any, res: any) => {
  try {
    res.json({
      currentPoints: 0,
      totalEarned: 0,
      nextRewardAt: 100,
      availableRewards: []
    });
  } catch (error) {
    console.error('Error fetching loyalty points:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get active tenant/court information for client
router.get('/active-court', async (req: any, res: any) => {
  try {
    // Get tenantId from JWT token
    const tenantId = req.jwtTenantId;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID not found' });
    }
    
    // Get actual tenant data from database
    const tenant = await storage.getTenant(tenantId);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Return tenant info with correct name priority
    const activeCourt = {
      id: tenant.id,
      name: tenant.name || tenant.tradeName, // Use name first, then tradeName
      tradeName: tenant.tradeName,
      description: tenant.description || `Centro esportivo ${tenant.name}`,
      address: {
        street: 'Rua das Canoas',
        city: 'São Paulo', 
        state: 'SP'
      },
      phone: '11988776668',
      email: 'klaus@beach.com'
    };

    res.json(activeCourt);
  } catch (error) {
    console.error('Error fetching active court:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get available courts for client to switch between
router.get('/available-courts', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const tenantId = req.tenantId;
    
    console.log('🔍 Getting available courts for userId:', userId, 'tenantId:', tenantId);

    // Get courts that belong to the user's tenant
    const courts = await storage.getCourtsByTenant(tenantId);
    const activeCourts = courts.filter((court: any) => court.status === 'active');
    
    // Format courts data from real database
    const availableCourts = activeCourts.map((court: any) => ({
      id: court.id,
      name: court.name,
      sport: court.sport || 'Beach Tennis',
      description: court.description || `Quadra ${court.name}`,
      hourlyRate: parseFloat(court.hourlyRate) || 100.00,
      tenantId: court.tenantId,
      images: court.photosUrls || []
    }));

    console.log('📤 Returning courts:', availableCourts);

    res.json({
      courts: availableCourts
    });
  } catch (error) {
    console.error('❌ Error getting available courts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Switch court endpoint - allows client to link to a different court
router.post('/switch-court', requireAuth, async (req: any, res: any) => {
  try {
    const { courtId } = req.body;
    const userId = req.userId;
    
    if (!courtId) {
      return res.status(400).json({ message: 'Court ID is required' });
    }

    // For now, this is a simple endpoint that just confirms the switch
    // In a real implementation, you would update the user's tenant association in the database
    console.log(`🔄 User ${userId} switching to court ${courtId}`);
    
    // Return success response
    res.json({
      message: 'Court switched successfully',
      courtId: courtId,
      userId: userId
    });
  } catch (error) {
    console.error('❌ Error switching court:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get courts in the user's current tenant (Arena X)
router.get('/quadras-associadas', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const userTenantId = req.tenantId; // Current tenant (Arena X)
    
    console.log(`🔍 Getting courts for tenant: ${userTenantId}`);
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all courts in the current tenant (Arena X)
    const allCourts = await storage.getAllCourts();
    const courts = allCourts.filter((court: any) => court.tenantId === userTenantId);
    console.log(`📤 Found ${courts.length} courts in tenant ${userTenantId}:`, courts.map((c: any) => c.name));

    // Get current tenant information
    const currentTenant = await storage.getTenant(userTenantId);
    
    if (!currentTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Format address properly - handle object or string address
    let formattedAddress = 'Endereço não informado';
    try {
      if (currentTenant.address) {
        if (typeof currentTenant.address === 'string') {
          formattedAddress = currentTenant.address;
        } else if (typeof currentTenant.address === 'object') {
          // Handle address object format
          const addr = currentTenant.address as any;
          const parts = [
            addr.street,
            addr.number,
            addr.neighborhood,
            addr.city,
            addr.state
          ].filter(Boolean);
          formattedAddress = parts.length > 0 ? parts.join(', ') : 'Endereço não informado';
        }
      }
    } catch (error) {
      console.log('Address formatting error:', error);
      formattedAddress = 'Endereço não informado';
    }

    // Format response with court information from current tenant
    const quadrasAssociadas = [{
      id: currentTenant.id,
      companyName: currentTenant.name,
      tradeName: currentTenant.tradeName || currentTenant.name,
      address: formattedAddress,
      phone: currentTenant.phone || '',
      email: currentTenant.email || '',
      description: currentTenant.description || 'Estabelecimento esportivo completo',
      logoUrl: currentTenant.logoUrl,
      photosUrls: currentTenant.photosUrls || [],
      operatingHours: currentTenant.operatingHours,
      status: currentTenant.status || 'active',
      totalCourts: courts.length,
      courts: courts.map((court: any) => ({
        id: court.id,
        name: court.name,
        sport: court.sport,
        description: court.description,
        hourlyRate: parseFloat(court.pricePerHour || court.hourlyRate || '0'),
        images: court.images || [],
        amenities: court.amenities || [],
        status: court.status || 'active',
        capacity: court.capacity || 4,
        floorType: court.floorType,
        covered: court.covered || false,
        lighting: court.lighting || false
      }))
    }];

    res.json({ quadras: quadrasAssociadas });
  } catch (error) {
    console.error('Error fetching courts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get detailed court profile (public but requires auth)
router.get('/quadra-perfil/:tenantId', requireAuth, async (req: any, res: any) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const userId = req.userId;
    
    // Verify user has access to this tenant
    const userTenants = await storage.getUserTenants(userId);
    const hasAccess = userTenants.some(tenant => tenant.id === tenantId);
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied to this court' });
    }

    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Return complete tenant profile
    const courtProfile = {
      id: tenant.id,
      companyName: tenant.name,
      tradeName: tenant.tradeName || tenant.name,
      address: tenant.address || '',
      phone: tenant.phone,
      email: tenant.email,
      description: tenant.description,
      logoUrl: tenant.logoUrl,
      photosUrls: tenant.photosUrls || [],
      operatingHours: tenant.operatingHours,
      status: tenant.status || 'active',
      socialMedia: {},
      amenities: ['wifi', 'parking', 'lighting'],
      policies: 'Políticas padrão da quadra'
    };

    res.json(courtProfile);
  } catch (error) {
    console.error('Error fetching court profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel reservation route
router.post('/reservations/:id/cancel', requireAuth, async (req: any, res: any) => {
  try {
    const reservationId = parseInt(req.params.id);
    const tenantId = req.tenantId;
    
    if (isNaN(reservationId)) {
      return res.status(400).json({ message: 'ID de reserva inválido' });
    }

    // Get the reservation to verify ownership and tenant
    const reservation = await storage.getBooking(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }

    if (reservation.tenantId !== tenantId) {
      return res.status(403).json({ message: 'Acesso negado a esta reserva' });
    }

    // Cancel the reservation by updating status directly
    const updatedData = {
      courtId: reservation.courtId,
      date: reservation.date,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      totalAmount: reservation.totalAmount,
      tenantId: reservation.tenantId,
      userId: reservation.userId,
      status: 'cancelled' as const
    };

    const updatedReservation = await storage.updateBooking(reservationId, updatedData);

    res.json({
      message: 'Reserva cancelada com sucesso',
      reservation: updatedReservation
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Schema for player hiring request
const createPlayerHireSchema = z.object({
  courtId: z.number(),
  playerId: z.number().optional(),
  sport: z.enum(["futevolei", "beach_tennis", "volleyball", "football", "tennis"]),
  level: z.enum(["iniciante", "intermediario", "avancado", "profissional"]),
  gameDate: z.string(),
  gameTime: z.string(),
  duration: z.number().min(1).max(8),
  offeredRate: z.number().min(0).optional(),
  notes: z.string().optional()
});

// Create player hiring request
router.post('/hire-player', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const tenantId = req.tenantId;
    
    const validatedData = createPlayerHireSchema.parse(req.body);
    
    // Calculate date and time
    const gameDateTime = new Date(`${validatedData.gameDate}T${validatedData.gameTime}`);
    
    // Get court details for pricing
    const court = await storage.getCourt(validatedData.courtId);
    if (!court) {
      return res.status(404).json({ message: 'Quadra não encontrada' });
    }
    
    // Calculate total amount based on duration and offered rate or default rate
    const hourlyRate = validatedData.offeredRate || parseFloat(court.pricePerHour || '100');
    const totalAmount = hourlyRate * validatedData.duration;
    
    // Create player hire request
    const hireRequest = await storage.createPlayerHireRequest({
      tenantId,
      requesterId: userId,
      playerId: validatedData.playerId || null,
      sport: validatedData.sport,
      level: validatedData.level,
      gameDateTime,
      duration: validatedData.duration,
      hourlyRate,
      totalAmount,
      notes: validatedData.notes,
      status: 'pending'
    });
    
    res.status(201).json({
      message: 'Solicitação de jogador criada com sucesso',
      request: hireRequest
    });
  } catch (error) {
    console.error('Error creating player hire request:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Get player hiring requests for client
router.get('/hire-requests', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId;
    const tenantId = req.tenantId;
    
    const requests = await storage.getPlayerHireRequestsByClient(userId, tenantId);
    
    // Format requests with court and player information
    const formattedRequests = await Promise.all(requests.map(async (request: any) => {
      const court = await storage.getCourt(request.courtId);
      let player = null;
      if (request.playerId) {
        player = await storage.getUser(request.playerId);
      }
      
      return {
        id: request.id,
        sport: request.sport,
        level: request.level,
        gameDateTime: request.gameDateTime,
        duration: request.duration,
        hourlyRate: request.hourlyRate,
        totalAmount: request.totalAmount,
        status: request.status,
        notes: request.notes,
        court: court ? {
          id: court.id,
          name: court.name,
          sport: court.sport
        } : null,
        player: player ? {
          id: player.id,
          name: player.name,
          avatar: player.avatar
        } : null,
        createdAt: request.createdAt
      };
    }));
    
    res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching hire requests:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Accept/Decline player hiring request (for rental players)
router.post('/hire-requests/:id/respond', requireAuth, async (req: any, res: any) => {
  try {
    const requestId = parseInt(req.params.id);
    const userId = req.userId;
    const { action } = req.body; // 'accept' or 'decline'
    
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ message: 'Ação inválida' });
    }
    
    const request = await storage.getPlayerHireRequest(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Solicitação não encontrada' });
    }
    
    // Update request status
    const updatedRequest = await storage.updatePlayerHireRequest(requestId, {
      status: action === 'accept' ? 'accepted' : 'declined',
      playerId: action === 'accept' ? userId : request.playerId
    });
    
    res.json({
      message: `Solicitação ${action === 'accept' ? 'aceita' : 'recusada'} com sucesso`,
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error responding to hire request:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;