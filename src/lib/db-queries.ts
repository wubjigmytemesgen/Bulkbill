


import { query } from './mysql';

// Simple MySQL-backed implementations for common DB operations used across the app.
// These functions deliberately keep `any` shapes to match the existing codebase
// and allow an incremental migration. Later we can add precise types.

export const getStaffMemberForAuth = async (email: string, password?: string) => {
    // Check both email and password for authentication
    const rows: any = await query(
        'SELECT sm.*, r.role_name FROM staff_members sm LEFT JOIN roles r ON sm.role_id = r.id WHERE sm.email = ? AND sm.password = ?',
        [email, password]
    );
    return rows[0] ?? null;
};

export const dbGetAllBranches = async () => {
    return await query('SELECT * FROM branches');
};

export const dbCreateBranch = async (branch: any) => {
    // Remove created_at and updated_at if present, so MySQL can auto-fill them
    try {
        const cleanBranch = { ...branch };
        delete cleanBranch.created_at;
        delete cleanBranch.updated_at;
        const keys = Object.keys(cleanBranch);
        const placeholders = keys.map(() => '?').join(',');
        const sql = `INSERT INTO branches (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${placeholders})`;
        const res: any = await query(sql, keys.map(k=>cleanBranch[k]));
        if (res && res.insertId) {
            const inserted = await query('SELECT * FROM branches WHERE id = ?', [res.insertId]);
            return inserted[0];
        }
        return cleanBranch;
    } catch (error) {
        console.error('dbCreateBranch error:', error);
        throw error;
    }
};

export const dbUpdateBranch = async (id: string, branch: any) => {
    // Remove created_at and updated_at if present, so MySQL can auto-update them
    const cleanBranch = { ...branch };
    delete cleanBranch.created_at;
    delete cleanBranch.updated_at;
    const keys = Object.keys(cleanBranch);
    if (keys.length === 0) return null;
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE branches SET ${setClause} WHERE id = ?`, [...keys.map(k=>cleanBranch[k]), id]);
    const updated = await query('SELECT * FROM branches WHERE id = ?', [id]);
    return updated[0] ?? null;
};

export const dbDeleteBranch = async (id: string) => {
    await query('DELETE FROM branches WHERE id = ?', [id]);
    return true;
};

export const dbGetAllCustomers = async () => await query('SELECT * FROM individual_customers');
export const dbCreateCustomer = async (customer: any) => {
    const keys = Object.keys(customer);
    const placeholders = keys.map(() => '?').join(',');
    const sql = `INSERT INTO individual_customers (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${placeholders})`;
    const res: any = await query(sql, keys.map(k=>customer[k]));
    if (res && res.insertId) return (await query('SELECT * FROM individual_customers WHERE id = ?', [res.insertId]))[0];
    return customer;
};
export const dbUpdateCustomer = async (customerKeyNumber: string, customer: any) => {
    const keys = Object.keys(customer);
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE individual_customers SET ${setClause} WHERE customerKeyNumber = ?`, [...keys.map(k=>customer[k]), customerKeyNumber]);
    return (await query('SELECT * FROM individual_customers WHERE customerKeyNumber = ?', [customerKeyNumber]))[0] ?? null;
};
export const dbDeleteCustomer = async (customerKeyNumber: string) => { await query('DELETE FROM individual_customers WHERE customerKeyNumber = ?', [customerKeyNumber]); return true; };

export const dbGetAllBulkMeters = async () => await query('SELECT * FROM bulk_meters');
export const dbCreateBulkMeter = async (bulkMeter: any) => {
    const keys = Object.keys(bulkMeter);
    const sql = `INSERT INTO bulk_meters (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
    const res: any = await query(sql, keys.map(k=>bulkMeter[k]));
    if (res && res.insertId) return (await query('SELECT * FROM bulk_meters WHERE id = ?', [res.insertId]))[0];
    // If insertId is not provided (table uses a custom primary key like customerKeyNumber),
    // attempt to return the row by customerKeyNumber if present.
    if (bulkMeter.customerKeyNumber) {
        const rows: any = await query('SELECT * FROM bulk_meters WHERE customerKeyNumber = ?', [bulkMeter.customerKeyNumber]);
        return rows[0] ?? bulkMeter;
    }
    return bulkMeter;
};
export const dbGetBulkMeterById = async (customerKeyNumber: string) => {
    const rows: any = await query('SELECT * FROM bulk_meters WHERE customerKeyNumber = ?', [customerKeyNumber]);
    return rows[0] ?? null;
}

export const dbUpdateBulkMeter = async (customerKeyNumber: string, bulkMeter: any) => {
    const keys = Object.keys(bulkMeter);
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE bulk_meters SET ${setClause} WHERE customerKeyNumber = ?`, [...keys.map(k=>bulkMeter[k]), customerKeyNumber]);
    return (await query('SELECT * FROM bulk_meters WHERE customerKeyNumber = ?', [customerKeyNumber]))[0] ?? null;
};
export const dbDeleteBulkMeter = async (customerKeyNumber: string) => { await query('DELETE FROM bulk_meters WHERE customerKeyNumber = ?', [customerKeyNumber]); return true; };

export const dbGetAllStaffMembers = async () => await query('SELECT * FROM staff_members');
export const dbCreateStaffMember = async (staffMember: any) => {
    const keys = Object.keys(staffMember);
    const sql = `INSERT INTO staff_members (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
    const res: any = await query(sql, keys.map(k=>staffMember[k]));
    if (res && res.insertId) return (await query('SELECT * FROM staff_members WHERE id = ?', [res.insertId]))[0];
    return staffMember;
};
export const dbUpdateStaffMember = async (email: string, staffMember: any) => {
    const keys = Object.keys(staffMember);
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE staff_members SET ${setClause} WHERE email = ?`, [...keys.map(k=>staffMember[k]), email]);
    return (await query('SELECT * FROM staff_members WHERE email = ?', [email]))[0] ?? null;
};
export const dbDeleteStaffMember = async (email: string) => { await query('DELETE FROM staff_members WHERE email = ?', [email]); return true; };

export const dbGetAllBills = async () => await query('SELECT * FROM bills');
export const dbCreateBill = async (bill: any) => {
    const keys = Object.keys(bill);
    const sql = `INSERT INTO bills (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
    const res: any = await query(sql, keys.map(k=>bill[k]));
    if (res && res.insertId) return (await query('SELECT * FROM bills WHERE id = ?', [res.insertId]))[0];
    return bill;
};
export const dbUpdateBill = async (id: string, bill: any) => {
    const keys = Object.keys(bill);
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE bills SET ${setClause} WHERE id = ?`, [...keys.map(k=>bill[k]), id]);
    return (await query('SELECT * FROM bills WHERE id = ?', [id]))[0] ?? null;
};
export const dbDeleteBill = async (id: string) => { await query('DELETE FROM bills WHERE id = ?', [id]); return true; };

export const dbGetAllIndividualCustomerReadings = async () => await query('SELECT * FROM individual_customer_readings');
export const dbCreateIndividualCustomerReading = async (reading: any) => {
    const keys = Object.keys(reading);
    const sql = `INSERT INTO individual_customer_readings (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
    const res: any = await query(sql, keys.map(k=>reading[k]));
    if (res && res.insertId) return (await query('SELECT * FROM individual_customer_readings WHERE id = ?', [res.insertId]))[0];
    return reading;
};
export const dbUpdateIndividualCustomerReading = async (id: string, reading: any) => {
    const keys = Object.keys(reading);
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE individual_customer_readings SET ${setClause} WHERE id = ?`, [...keys.map(k=>reading[k]), id]);
    return (await query('SELECT * FROM individual_customer_readings WHERE id = ?', [id]))[0] ?? null;
};
export const dbDeleteIndividualCustomerReading = async (id: string) => { await query('DELETE FROM individual_customer_readings WHERE id = ?', [id]); return true; };

export const dbGetAllBulkMeterReadings = async () => await query('SELECT * FROM bulk_meter_readings');
export const dbCreateBulkMeterReading = async (reading: any) => {
    try {
        const keys = Object.keys(reading);
        const sql = `INSERT INTO bulk_meter_readings (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
        const res: any = await query(sql, keys.map(k=>reading[k]));
        // If driver provided insertId (auto-increment), use it.
        if (res && res.insertId) {
            const rows: any = await query('SELECT * FROM bulk_meter_readings WHERE id = ?', [res.insertId]);
            return rows[0] ?? reading;
        }

        // If caller supplied an id (UUID) in the payload, try to return the row by id.
        if (reading.id) {
            const rows: any = await query('SELECT * FROM bulk_meter_readings WHERE id = ?', [reading.id]);
            return rows[0] ?? reading;
        }

        // Fallback: try to find the inserted row by natural keys: bulk_meter_id, reading_date, reading_value
        if (reading.bulk_meter_id && reading.reading_date) {
            const rows: any = await query(
                'SELECT * FROM bulk_meter_readings WHERE bulk_meter_id = ? AND reading_date = ? AND reading_value = ? LIMIT 1',
                [reading.bulk_meter_id, reading.reading_date, reading.reading_value]
            );
            return rows[0] ?? reading;
        }

        // Last resort: return the original payload so callers can at least use the provided values
        return reading;
    } catch (error) {
        console.error('dbCreateBulkMeterReading error:', error);
        throw error;
    }
};
export const dbUpdateBulkMeterReading = async (id: string, reading: any) => {
    const keys = Object.keys(reading);
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE bulk_meter_readings SET ${setClause} WHERE id = ?`, [...keys.map(k=>reading[k]), id]);
    return (await query('SELECT * FROM bulk_meter_readings WHERE id = ?', [id]))[0] ?? null;
};
export const dbDeleteBulkMeterReading = async (id: string) => { await query('DELETE FROM bulk_meter_readings WHERE id = ?', [id]); return true; };

export const dbGetAllPayments = async () => await query('SELECT * FROM payments');
export const dbCreatePayment = async (payment: any) => {
    const keys = Object.keys(payment);
    const sql = `INSERT INTO payments (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
    const res: any = await query(sql, keys.map(k=>payment[k]));
    if (res && res.insertId) return (await query('SELECT * FROM payments WHERE id = ?', [res.insertId]))[0];
    return payment;
};
export const dbUpdatePayment = async (id: string, payment: any) => {
    const keys = Object.keys(payment);
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE payments SET ${setClause} WHERE id = ?`, [...keys.map(k=>payment[k]), id]);
    return (await query('SELECT * FROM payments WHERE id = ?', [id]))[0] ?? null;
};
export const dbDeletePayment = async (id: string) => { await query('DELETE FROM payments WHERE id = ?', [id]); return true; };

export const dbGetAllReportLogs = async () => await query('SELECT * FROM reports');
export const dbCreateReportLog = async (log: any) => {
    const keys = Object.keys(log);
    const sql = `INSERT INTO reports (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
    const res: any = await query(sql, keys.map(k=>log[k]));
    if (res && res.insertId) return (await query('SELECT * FROM reports WHERE id = ?', [res.insertId]))[0];
    return log;
};
export const dbUpdateReportLog = async (id: string, log: any) => {
    const keys = Object.keys(log);
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE reports SET ${setClause} WHERE id = ?`, [...keys.map(k=>log[k]), id]);
    return (await query('SELECT * FROM reports WHERE id = ?', [id]))[0] ?? null;
};
export const dbDeleteReportLog = async (id: string) => { await query('DELETE FROM reports WHERE id = ?', [id]); return true; };

export const dbGetAllNotifications = async () => await query('SELECT * FROM notifications');
export const dbCreateNotification = async (notification: any) => {
    const payload = notification || {};
    // Support both RPC-style payloads (p_title, p_message...) and direct notification objects
    if ('p_title' in payload) {
        const title = payload.p_title;
        const message = payload.p_message;
        const sender_name = payload.p_sender_name;
        const target_branch_id = payload.p_target_branch_id ?? null;
        const created_at = new Date().toISOString();
        const res: any = await query(
            'INSERT INTO notifications (title, message, sender_name, target_branch_id, created_at) VALUES (?, ?, ?, ?, ?)',
            [title, message, sender_name, target_branch_id, created_at]
        );
        if (res && res.insertId) {
            const inserted = await query('SELECT * FROM notifications WHERE id = ?', [res.insertId]);
            return inserted[0] ?? null;
        }
        return {
            id: null,
            title,
            message,
            sender_name,
            target_branch_id,
            created_at,
        };
    }

    const keys = Object.keys(payload);
    if (keys.length === 0) return null;
    const sql = `INSERT INTO notifications (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
    const res: any = await query(sql, keys.map(k=>payload[k]));
    if (res && res.insertId) return (await query('SELECT * FROM notifications WHERE id = ?', [res.insertId]))[0];
    return null;
};

export const dbGetAllRoles = async () => await query('SELECT * FROM roles');
export const dbGetAllPermissions = async () => await query('SELECT * FROM permissions');
export const dbGetAllRolePermissions = async () => await query('SELECT * FROM role_permissions');
export const dbRpcUpdateRolePermissions = async (roleId: number, permissionIds: number[]) => {
    // Update role_permissions mapping for given role
    await query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    if (permissionIds && permissionIds.length > 0) {
        const values = permissionIds.map(() => '(?,?)').join(',');
        const params: any[] = [];
        permissionIds.forEach(pid => { params.push(roleId, pid); });
        await query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`, params);
    }
    return true;
};

export const dbGetAllTariffs = async () => await query('SELECT * FROM tariffs');
export const dbGetTariffByTypeAndYear = async (customerType: string, year: number) => {
    const rows: any = await query('SELECT * FROM tariffs WHERE customer_type = ? AND year = ? LIMIT 1', [customerType, year]);
    return rows[0] ?? null;
};
export const dbCreateTariff = async (tariff: any) => {
    const keys = Object.keys(tariff);
    const sql = `INSERT INTO tariffs (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
    const res: any = await query(sql, keys.map(k=>tariff[k]));
    if (res && res.insertId) return (await query('SELECT * FROM tariffs WHERE id = ?', [res.insertId]))[0];
    return tariff;
};
export const dbUpdateTariff = async (customerType: string, year: number, tariff: any) => {
    const keys = Object.keys(tariff);
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE tariffs SET ${setClause} WHERE customer_type = ? AND year = ?`, [...keys.map(k=>tariff[k]), customerType, year]);
    const data = await query('SELECT * FROM tariffs WHERE customer_type = ? AND year = ?', [customerType, year]);
    return data[0] ?? null;
};

export const dbGetAllKnowledgeBaseArticles = async () => await query('SELECT * FROM knowledge_base_articles');
export const dbCreateKnowledgeBaseArticle = async (article: any) => {
    const keys = Object.keys(article);
    const sql = `INSERT INTO knowledge_base_articles (${keys.map(k=>`\`${k}\``).join(',')}) VALUES (${keys.map(()=>'?').join(',')})`;
    const res: any = await query(sql, keys.map(k=>article[k]));
    if (res && res.insertId) return (await query('SELECT * FROM knowledge_base_articles WHERE id = ?', [res.insertId]))[0];
    return article;
};
export const dbUpdateKnowledgeBaseArticle = async (id: number, article: any) => {
    const keys = Object.keys(article);
    const setClause = keys.map(k=>`\`${k}\` = ?`).join(',');
    await query(`UPDATE knowledge_base_articles SET ${setClause} WHERE id = ?`, [...keys.map(k=>article[k]), id]);
    return (await query('SELECT * FROM knowledge_base_articles WHERE id = ?', [id]))[0] ?? null;
};
export const dbDeleteKnowledgeBaseArticle = async (id: number) => { await query('DELETE FROM knowledge_base_articles WHERE id = ?', [id]); return true; };

