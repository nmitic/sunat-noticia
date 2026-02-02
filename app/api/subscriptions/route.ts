import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, emailSubscriptionTable } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';

const subscriptionSchema = z.object({
  email: z.string().email('Email inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = subscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Email inválido' },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if email already exists
    const [existing] = await db.select()
      .from(emailSubscriptionTable)
      .where(eq(emailSubscriptionTable.email, email))
      .limit(1);

    if (existing) {
      if (existing.active) {
        return NextResponse.json(
          { error: 'Este correo ya está suscrito' },
          { status: 400 }
        );
      } else {
        // Reactivate if previously unsubscribed
        await db.update(emailSubscriptionTable)
          .set({ active: true })
          .where(eq(emailSubscriptionTable.email, email));

        return NextResponse.json(
          { message: 'Suscripción reactivada exitosamente' },
          { status: 200 }
        );
      }
    }

    // Create new subscription
    const [subscription] = await db.insert(emailSubscriptionTable)
      .values({ email, active: true })
      .returning();

    return NextResponse.json(
      { message: 'Suscripción exitosa', data: subscription },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing subscription:', message);

    return NextResponse.json(
      { error: 'Error al procesar la suscripción' },
      { status: 500 }
    );
  }
}
