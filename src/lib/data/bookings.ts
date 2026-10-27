import type { PoolClient } from "pg";
import { query, queryOne } from "@/lib/db";
import type {
  Booking,
  BookingActivity,
  BookingService,
  Customer,
  DashboardStats,
  Payment,
} from "@/types";

const BOOKING_FIELDS = `
  b.id, b.code, b.customer_id as "customerId", b.glamping_id as "glampingId",
  g.name as "glampingName", g.slug as "glampingSlug", g.main_image as "glampingImage",
  b.guest_name as "guestName", b.guest_email as "guestEmail", b.guest_phone as "guestPhone",
  b.guest_document as "guestDocument", b.guest_city as "guestCity",
  b.check_in as "checkIn", b.check_out as "checkOut", b.guests, b.nights,
  b.nightly_rate as "nightlyRate", b.subtotal, b.activities_total as "activitiesTotal",
  b.services_total as "servicesTotal", b.total, b.deposit_required as "depositRequired",
  b.paid_amount as "paidAmount", b.balance, b.status, b.payment_status as "paymentStatus",
  b.source, b.notes, b.admin_notes as "adminNotes",
  b.created_at as "createdAt", b.updated_at as "updatedAt"
`;

export interface BookingFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  glampingId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

function buildFilters(filters: BookingFilters, startIndex = 1) {
  const where: string[] = [];
  const params: unknown[] = [];
  let index = startIndex;

  if (filters.search?.trim()) {
    where.push(`(
      b.code ilike $${index} or b.guest_name ilike $${index} or b.guest_email ilike $${index}
      or b.guest_phone ilike $${index}
    )`);
    params.push(`%${filters.search.trim()}%`);
    index += 1;
  }
  if (filters.status) {
    where.push(`b.status = $${index}`);
    params.push(filters.status);
    index += 1;
  }
  if (filters.paymentStatus) {
    where.push(`b.payment_status = $${index}`);
    params.push(filters.paymentStatus);
    index += 1;
  }
  if (filters.glampingId) {
    where.push(`b.glamping_id = $${index}`);
    params.push(filters.glampingId);
    index += 1;
  }
  if (filters.from) {
    where.push(`b.check_in >= $${index}::date`);
    params.push(filters.from);
    index += 1;
  }
  if (filters.to) {
    where.push(`b.check_in <= $${index}::date`);
    params.push(filters.to);
    index += 1;
  }
  return { clause: where.length ? `where ${where.join(" and ")}` : "", params, nextIndex: index };
}

export async function listBookings(filters: BookingFilters = {}): Promise<{ bookings: Booking[]; total: number }> {  const { clause, params, nextIndex } = buildFilters(filters);
  const limit = Math.min(filters.limit ?? 25, 100);
  const offset = filters.offset ?? 0;
  const [bookings, count] = await Promise.all([
    query<Booking>(
      `select ${BOOKING_FIELDS}
       from bookings b join glampings g on g.id = b.glamping_id
       ${clause}
       order by b.created_at desc
       limit $${nextIndex} offset $${nextIndex + 1}`,
      [...params, limit, offset],
    ),
    queryOne<{ n: number }>(`select count(*)::int as n from bookings b ${clause}`, params),
  ]);
  return { bookings, total: count?.n ?? 0 };
}

export async function getBookingsSummary(filters: BookingFilters = {}): Promise<{
  count: number;
  total: number;
  paid: number;
  balance: number;
}> {
  const { clause, params } = buildFilters(filters);
  const row = await queryOne<{ count: number; total: number; paid: number; balance: number }>(
    `select count(*)::int as count,
            coalesce(sum(b.total), 0) as total,
            coalesce(sum(b.paid_amount), 0) as paid,
            coalesce(sum(b.balance), 0) as balance
     from bookings b ${clause}`,
    params,
  );
  return row ?? { count: 0, total: 0, paid: 0, balance: 0 };
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const booking = await queryOne<Booking>(
    `select ${BOOKING_FIELDS}
     from bookings b join glampings g on g.id = b.glamping_id
     where b.id = $1`,
    [id],
  );
  return booking ? hydrateBooking(booking) : null;
}

export async function getBookingByCode(code: string): Promise<Booking | null> {
  const booking = await queryOne<Booking>(
    `select ${BOOKING_FIELDS}
     from bookings b join glampings g on g.id = b.glamping_id
     where upper(b.code) = upper($1)`,
    [code],
  );
  return booking ? hydrateBooking(booking) : null;
}

async function hydrateBooking(booking: Booking): Promise<Booking> {
  const [activities, services, payments, history] = await Promise.all([
    query<BookingActivity>(
      `select id, activity_id as "activityId", activity_name as "activityName", quantity,
              unit_price as "unitPrice", total
       from booking_activities where booking_id = $1 order by created_at asc`,
      [booking.id],
    ),
    query<BookingService>(
      `select id, service_id as "serviceId", service_name as "serviceName", quantity,
              unit_price as "unitPrice", total
       from booking_services where booking_id = $1 order by created_at asc`,
      [booking.id],
    ),
    query<Payment>(
      `select id, booking_id as "bookingId", amount, method, reference, status,
              paid_at as "paidAt", notes, created_by as "createdBy", created_at as "createdAt"
       from payments where booking_id = $1 order by paid_at desc, created_at desc`,
      [booking.id],
    ),
    query<{
      id: string;
      fromStatus: string | null;
      toStatus: string;
      note: string;
      createdBy: string;
      createdAt: string;
    }>(
      `select id, from_status as "fromStatus", to_status as "toStatus", note,
              created_by as "createdBy", created_at as "createdAt"
       from booking_status_history where booking_id = $1 order by created_at desc`,
      [booking.id],
    ),
  ]);
  return { ...booking, activities, services, payments, history };
}

export async function listCustomers(search?: string): Promise<Customer[]> {
  const params: unknown[] = [];
  let clause = "";
  if (search?.trim()) {
    clause = `where c.full_name ilike $1 or c.email ilike $1 or c.phone ilike $1`;
    params.push(`%${search.trim()}%`);
  }
  return query<Customer>(
    `select c.id, c.full_name as "fullName", c.email, c.phone, c.document, c.city, c.notes,
            c.created_at as "createdAt",
            count(b.id)::int as "bookingsCount",
            coalesce(sum(b.paid_amount) filter (where b.status <> 'cancelled'), 0) as "totalSpent",
            max(b.created_at) as "lastBookingAt"
     from customers c
     left join bookings b on b.customer_id = c.id
     ${clause}
     group by c.id
     order by max(b.created_at) desc nulls last, c.created_at desc
     limit 200`,
    params,
  );
}

export async function addPayment(
  client: PoolClient,
  bookingId: string,
  input: {
    amount: number;
    method: string;
    reference?: string;
    paidAt?: string;
    notes?: string;
    createdBy: string;
  },
): Promise<void> {
  await client.query(
    `insert into payments (booking_id, amount, method, reference, status, paid_at, notes, created_by)
     values ($1,$2,$3,$4,'approved', coalesce($5::date, current_date), $6, $7)`,
    [bookingId, input.amount, input.method, input.reference ?? "", input.paidAt ?? null, input.notes ?? "", input.createdBy],
  );
  await syncPaymentStatus(client, bookingId);
}

export async function deletePayment(client: PoolClient, bookingId: string, paymentId: string): Promise<boolean> {
  const result = await client.query("delete from payments where id = $1 and booking_id = $2", [paymentId, bookingId]);
  if (result.rowCount === 0) return false;
  await syncPaymentStatus(client, bookingId);
  return true;
}

export async function syncPaymentStatus(client: PoolClient, bookingId: string): Promise<void> {
  await client.query(
    `update bookings b set
       paid_amount = coalesce(p.paid, 0),
       balance = greatest(b.total - coalesce(p.paid, 0), 0),
       payment_status = case
         when coalesce(p.paid, 0) >= b.total then 'paid'
         when coalesce(p.paid, 0) >= b.deposit_required and b.deposit_required > 0 then 'deposit_paid'
         when coalesce(p.paid, 0) > 0 and b.deposit_required = 0 then 'deposit_paid'
         else 'unpaid'
       end,
       updated_at = now()
     from (
       select coalesce(sum(amount) filter (where status = 'approved'), 0) as paid
       from payments where booking_id = $1
     ) p
     where b.id = $1`,
    [bookingId],
  );
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [revenue, pendingBalance, bookingsThisMonth, activeBookings, occupancy, activeGlampings, customers, pendingBookings] =
    await Promise.all([
      queryOne<{ total: number }>("select coalesce(sum(amount), 0) as total from payments where status = 'approved'"),
      queryOne<{ total: number }>(
        "select coalesce(sum(balance), 0) as total from bookings where status not in ('cancelled', 'no_show')",
      ),
      queryOne<{ n: number }>(
        "select count(*)::int as n from bookings where created_at >= date_trunc('month', now())",
      ),
      queryOne<{ n: number }>(
        "select count(*)::int as n from bookings where status in ('pending', 'confirmed', 'checked_in')",
      ),
      queryOne<{ nights: number }>(
        `select coalesce(sum(greatest(0, least(check_out, current_date + 30) - greatest(check_in, current_date))), 0)::int as nights
         from bookings
         where status in ('pending', 'confirmed', 'checked_in')
           and check_in < current_date + 30 and check_out > current_date`,
      ),
      queryOne<{ n: number }>("select count(*)::int as n from glampings where active = true"),
      queryOne<{ n: number }>("select count(*)::int as n from customers"),
      queryOne<{ n: number }>("select count(*)::int as n from bookings where status = 'pending'"),
    ]);

  const capacity = (activeGlampings?.n ?? 0) * 30;
  const [monthlyRevenue, statusRows, recentBookings, upcomingBookings] = await Promise.all([
    query<{ month: string; total: number }>(
      `select to_char(paid_at, 'YYYY-MM') as month, coalesce(sum(amount), 0) as total
       from payments
       where status = 'approved' and paid_at >= (current_date - interval '6 months')
       group by 1 order by 1 asc`,
    ),
    query<{ status: string; n: number }>("select status, count(*)::int as n from bookings group by status"),
    listBookings({ limit: 6 }),
    query<Booking>(
      `select ${BOOKING_FIELDS}
       from bookings b join glampings g on g.id = b.glamping_id
       where b.status in ('pending', 'confirmed', 'checked_in') and b.check_in >= current_date
       order by b.check_in asc limit 6`,
    ),
  ]);

  return {
    revenue: revenue?.total ?? 0,
    pendingBalance: pendingBalance?.total ?? 0,
    bookingsThisMonth: bookingsThisMonth?.n ?? 0,
    activeBookings: activeBookings?.n ?? 0,
    occupancy: capacity > 0 ? Math.min(100, Math.round(((occupancy?.nights ?? 0) / capacity) * 100)) : 0,
    activeGlampings: activeGlampings?.n ?? 0,
    customers: customers?.n ?? 0,
    pendingBookings: pendingBookings?.n ?? 0,
    monthlyRevenue,
    statusCounts: Object.fromEntries(statusRows.map((row) => [row.status, row.n])),
    recentBookings: recentBookings.bookings,
    upcomingBookings,
  };
}

export async function listContactMessages() {
  return query<{
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
  }>(
    `select id, name, email, phone, subject, message, status, created_at as "createdAt"
     from contact_messages order by created_at desc limit 100`,
  );
}
