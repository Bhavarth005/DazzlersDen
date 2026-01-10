import { cookies } from 'next/headers';

export async function POST() {
	const cookieStore = await cookies();

  // Method 1: The distinct delete method
  cookieStore.delete('Authorization');
  cookieStore.delete('user_role');

  // Method 2: Manually setting expiration (if needed)
  cookieStore.set('Authorization', '', { expires: new Date(0) });
  cookieStore.set('user_role', '', { expires: new Date(0) });
  
  return Response.json({ message: "Logged out" });
}