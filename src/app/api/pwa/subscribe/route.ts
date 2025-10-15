import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/app/lib/api-response';

// POST /api/pwa/subscribe - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription) {
      return errorResponse('Subscription object is required', 400);
    }

    // Here you would typically save the subscription to your database
    // associated with the user ID
    console.log('Push subscription received:', subscription);
    console.log('User ID:', userId);

    // Example: Save to database
    // await prisma.pushSubscription.create({
    //   data: {
    //     userId: userId,
    //     endpoint: subscription.endpoint,
    //     p256dh: subscription.keys.p256dh,
    //     auth: subscription.keys.auth,
    //   },
    // });

    return successResponse({
      message: 'Push notification subscription saved successfully',
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return errorResponse('Failed to save push subscription', 500);
  }
}

// DELETE /api/pwa/subscribe - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint, userId } = await request.json();

    if (!endpoint) {
      return errorResponse('Endpoint is required', 400);
    }

    // Here you would typically remove the subscription from your database
    console.log('Removing push subscription:', endpoint);
    console.log('User ID:', userId);

    // Example: Remove from database
    // await prisma.pushSubscription.deleteMany({
    //   where: {
    //     userId: userId,
    //     endpoint: endpoint,
    //   },
    // });

    return successResponse({
      message: 'Push notification subscription removed successfully',
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return errorResponse('Failed to remove push subscription', 500);
  }
}
