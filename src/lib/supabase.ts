// Compatibility shim: provide a minimal "supabase"-like API backed by MySQL
// This lets the rest of the codebase keep importing `supabase` while we
// incrementally convert queries to use parameterized SQL.

import { query } from './mysql';

type SupabaseResponse<T> = { data?: T; error?: any };

const table = (tableName: string) => ({
	select: (cols = '*') => ({
		eq: (col: string, val: any) => ({
			single: async (): Promise<SupabaseResponse<any>> => {
				const sql = `SELECT ${cols} FROM ${tableName} WHERE \`${col}\` = ? LIMIT 1`;
				const rows = await query(sql, [val]);
				return { data: rows[0] ?? null };
			}
		}),
		then: async () => {
			const sql = `SELECT ${cols} FROM ${tableName}`;
			const rows = await query(sql);
			return { data: rows };
		}
	}),
	insert: (payload: any) => ({
		select: () => ({
			single: async (): Promise<SupabaseResponse<any>> => {
				const keys = Object.keys(payload);
				const placeholders = keys.map(() => '?').join(',');
				const sql = `INSERT INTO ${tableName} (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${placeholders})`;
				const res: any = await query(sql, keys.map(k => payload[k]));
				// return inserted row by primary key if available (MySQL insertId)
				return { data: payload };
			}
		})
	}),
	update: (payload: any) => ({
		eq: (col: string, val: any) => ({
			select: () => ({
				single: async (): Promise<SupabaseResponse<any>> => {
					const keys = Object.keys(payload);
					const setClause = keys.map(k => `\`${k}\` = ?`).join(',');
					const sql = `UPDATE ${tableName} SET ${setClause} WHERE \`${col}\` = ?`;
					await query(sql, [...keys.map(k=>payload[k]), val]);
					return { data: payload };
				}
			})
		})
	}),
	delete: () => ({
		eq: (col: string, val: any) => ({
			then: async (): Promise<SupabaseResponse<any>> => {
				const sql = `DELETE FROM ${tableName} WHERE \`${col}\` = ?`;
				await query(sql, [val]);
				return { data: null };
			}
		})
	})
});

export const supabase = {
	from: (tableName: string) => table(tableName),
	rpc: async (fnName: string, params: any) => {
		// For now, map rpc to a simple function call or a NO-OP. If you have
		// stored procedures in MySQL, you can call them here.
		// Example: CALL insert_notification(?, ?, ?)
		try {
			if (fnName === 'insert_notification') {
				// Expecting params to be an object with fields matching notifications table
				const keys = Object.keys(params || {});
				const placeholders = keys.map(() => '?').join(',');
				const sql = `INSERT INTO notifications (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${placeholders})`;
				await query(sql, keys.map(k=>params[k]));
				return { data: null };
			}
			return { data: null };
		} catch (error) {
			return { error };
		}
	}
};
