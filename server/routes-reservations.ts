import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from './db';
import { reservations, courts, users } from '../shared/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import { requireAuth } from './middleware/auth';

const router = Router();

// Validação para nova reserva
const createReservationSchema = z.object({
  courtId: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reservationType: z.enum(['aluguel_avulso', 'aula', 'evento', 'recorrente']),
  clientId: z.string().optional(),
  clientName: z.string(),
  clientPhone: z.string(),
  clientEmail: z.string().email().optional(),
  teacherId: z.number().optional(),
  basePrice: z.string(),
  totalAmount: z.string(),
  advancePayment: z.string().optional(),
  paymentMethod: z.enum(['pix', 'cartao', 'dinheiro', 'creditos', 'gympass', 'totalpass']).optional(),
  paymentAmount: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  participants: z.array(z.string()).optional(),
  eventDetailsId: z.number().optional(),
  recurrentDetails: z.object({
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
    endDate: z.string().optional(),
    occurrences: z.number().optional()
  }).optional()
});

// GET /api/reservations/calendar - Buscar reservas para calendário
router.get('/calendar', requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { 
      courtId, 
      startDate, 
      endDate, 
      reservationType, 
      paymentStatus 
    } = req.query;

    let query = db
      .select({
        id: reservations.id,
        courtId: reservations.courtId,
        date: reservations.date,
        startTime: reservations.startTime,
        endTime: reservations.endTime,
        reservationType: reservations.reservationType,
        status: reservations.status,
        paymentStatus: reservations.paymentStatus,
        clientName: reservations.clientName,
        clientPhone: reservations.clientPhone,
        totalAmount: reservations.totalAmount,
        notes: reservations.notes,
        courtName: courts.name,
        courtSport: courts.sport
      })
      .from(reservations)
      .leftJoin(courts, eq(reservations.courtId, courts.id))
      .where(eq(reservations.tenantId, tenantId));

    // Aplicar filtros
    if (courtId) {
      query = query.where(and(
        eq(reservations.tenantId, tenantId),
        eq(reservations.courtId, parseInt(courtId as string))
      ));
    }

    if (startDate) {
      query = query.where(and(
        eq(reservations.tenantId, tenantId),
        gte(reservations.date, startDate as string)
      ));
    }

    if (endDate) {
      query = query.where(and(
        eq(reservations.tenantId, tenantId),
        lte(reservations.date, endDate as string)
      ));
    }

    if (reservationType) {
      query = query.where(and(
        eq(reservations.tenantId, tenantId),
        eq(reservations.reservationType, reservationType as any)
      ));
    }

    if (paymentStatus) {
      query = query.where(and(
        eq(reservations.tenantId, tenantId),
        eq(reservations.paymentStatus, paymentStatus as any)
      ));
    }

    const reservationList = await query.orderBy(asc(reservations.date), asc(reservations.startTime));

    res.json(reservationList);
  } catch (error) {
    console.error('Erro ao buscar reservas para calendário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/reservations - Criar nova reserva
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    const data = createReservationSchema.parse(req.body);

    // Verificar se a quadra existe e pertence ao tenant
    const court = await db
      .select()
      .from(courts)
      .where(and(eq(courts.id, data.courtId), eq(courts.tenantId, tenantId)))
      .limit(1);

    if (!court.length) {
      return res.status(404).json({ message: 'Quadra não encontrada' });
    }

    // Verificar conflitos de horário
    const conflictingReservations = await db
      .select()
      .from(reservations)
      .where(and(
        eq(reservations.tenantId, tenantId),
        eq(reservations.courtId, data.courtId),
        eq(reservations.date, data.date),
        eq(reservations.startTime, data.startTime)
      ));

    if (conflictingReservations.length > 0) {
      return res.status(400).json({ message: 'Horário já está reservado' });
    }

    // Calcular valores restantes
    const totalAmount = parseFloat(data.totalAmount);
    const paymentAmount = data.paymentAmount ? parseFloat(data.paymentAmount) : 0;
    const remainingAmount = totalAmount - paymentAmount;

    // Criar reserva
    const [newReservation] = await db
      .insert(reservations)
      .values({
        tenantId,
        userId,
        courtId: data.courtId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        reservationType: data.reservationType,
        clientId: data.clientId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        teacherId: data.teacherId,
        basePrice: data.basePrice,
        totalAmount: data.totalAmount,
        advancePayment: data.advancePayment,
        remainingAmount: remainingAmount.toString(),
        paymentMethod: data.paymentMethod,
        paymentAmount: data.paymentAmount,
        paymentStatus: paymentAmount >= totalAmount ? 'pago' : 'aguardando',
        notes: data.notes,
        internalNotes: data.internalNotes,
        participants: data.participants || [],
        eventDetailsId: data.eventDetailsId,
        recurrentDetails: data.recurrentDetails as any
      })
      .returning();

    // Se for reserva recorrente, criar as ocorrências
    if (data.reservationType === 'recorrente' && data.recurrentDetails) {
      await createRecurrentReservations(
        newReservation.id, 
        tenantId, 
        data, 
        data.recurrentDetails
      );
    }

    res.status(201).json(newReservation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: error.errors 
      });
    }
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PATCH /api/reservations/:id - Atualizar reserva
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const reservationId = parseInt(req.params.id);
    const tenantId = req.user!.tenantId;
    const updateData = req.body;

    // Verificar se a reserva existe e pertence ao tenant
    const existingReservation = await db
      .select()
      .from(reservations)
      .where(and(eq(reservations.id, reservationId), eq(reservations.tenantId, tenantId)))
      .limit(1);

    if (!existingReservation.length) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }

    const [updatedReservation] = await db
      .update(reservations)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(eq(reservations.id, reservationId), eq(reservations.tenantId, tenantId)))
      .returning();

    res.json(updatedReservation);
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/reservations/:id - Cancelar reserva
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const reservationId = parseInt(req.params.id);
    const tenantId = req.user!.tenantId;

    const [cancelledReservation] = await db
      .update(reservations)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(and(eq(reservations.id, reservationId), eq(reservations.tenantId, tenantId)))
      .returning();

    if (!cancelledReservation) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }

    res.json({ message: 'Reserva cancelada com sucesso', reservation: cancelledReservation });
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/reservations/:id/rebook - Reagendar reserva
router.post('/:id/rebook', requireAuth, async (req: Request, res: Response) => {
  try {
    const reservationId = parseInt(req.params.id);
    const tenantId = req.user!.tenantId;
    const { date, startTime, endTime } = req.body;

    // Verificar se a reserva existe
    const existingReservation = await db
      .select()
      .from(reservations)
      .where(and(eq(reservations.id, reservationId), eq(reservations.tenantId, tenantId)))
      .limit(1);

    if (!existingReservation.length) {
      return res.status(404).json({ message: 'Reserva não encontrada' });
    }

    // Verificar conflitos no novo horário
    const conflictingReservations = await db
      .select()
      .from(reservations)
      .where(and(
        eq(reservations.tenantId, tenantId),
        eq(reservations.courtId, existingReservation[0].courtId),
        eq(reservations.date, date),
        eq(reservations.startTime, startTime)
      ));

    if (conflictingReservations.length > 0) {
      return res.status(400).json({ message: 'Novo horário já está reservado' });
    }

    const [rescheduledReservation] = await db
      .update(reservations)
      .set({
        date,
        startTime,
        endTime,
        updatedAt: new Date()
      })
      .where(and(eq(reservations.id, reservationId), eq(reservations.tenantId, tenantId)))
      .returning();

    res.json({ message: 'Reserva reagendada com sucesso', reservation: rescheduledReservation });
  } catch (error) {
    console.error('Erro ao reagendar reserva:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/clients/search - Buscar clientes
router.get('/clients/search', requireAuth, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.json([]);
    }

    const clients = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email
      })
      .from(users)
      .where(and(
        eq(users.tenantId, tenantId),
        eq(users.role, 'client')
      ));

    // Filtrar localmente por nome ou telefone
    const filteredClients = clients.filter(client => 
      client.name.toLowerCase().includes(query.toLowerCase()) ||
      (client.phone && client.phone.includes(query))
    );

    res.json(filteredClients);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Função auxiliar para criar reservas recorrentes
async function createRecurrentReservations(
  parentId: number,
  tenantId: number,
  originalData: any,
  recurrentDetails: any
) {
  const { frequency, endDate, occurrences } = recurrentDetails;
  const startDate = new Date(originalData.date);
  const recurrentReservations = [];

  let currentDate = new Date(startDate);
  let count = 0;
  const maxOccurrences = occurrences || 52; // Máximo 1 ano

  while (count < maxOccurrences) {
    // Incrementar data baseado na frequência
    switch (frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }

    if (endDate && currentDate > new Date(endDate)) {
      break;
    }

    const dateString = currentDate.toISOString().split('T')[0];

    recurrentReservations.push({
      tenantId,
      userId: originalData.userId,
      courtId: originalData.courtId,
      date: dateString,
      startTime: originalData.startTime,
      endTime: originalData.endTime,
      reservationType: 'recorrente',
      recurringParentId: parentId,
      clientId: originalData.clientId,
      clientName: originalData.clientName,
      clientPhone: originalData.clientPhone,
      clientEmail: originalData.clientEmail,
      basePrice: originalData.basePrice,
      totalAmount: originalData.totalAmount,
      paymentStatus: 'aguardando',
      notes: originalData.notes
    });

    count++;
  }

  if (recurrentReservations.length > 0) {
    await db.insert(reservations).values(recurrentReservations);
  }
}

export default router;