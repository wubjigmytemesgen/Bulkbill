
import { query } from './mysql';

export async function logSecurityEvent(event: string, staff_email?: string, branch_name?: string) {
  try {
    const ip_address = await fetch('/api/ip').then(res => res.json()).then(data => data.ip).catch(() => 'unknown');
    console.log('Logging security event:', { event, staff_email, branch_name, ip_address });
    const sql = 'INSERT INTO security_logs (event, staff_email, branch_name, ip_address) VALUES (?, ?, ?, ?)';
    await query(sql, [event, staff_email, branch_name, ip_address]);
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}
