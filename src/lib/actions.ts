'use server'
import {
  dbCreateBranch,
  dbDeleteBranch,
  dbGetAllBranches,
  dbUpdateBranch,
  dbCreateIndividualCustomer,
  dbDeleteCustomer,
  dbGetAllCustomers,
  dbUpdateCustomer,
  dbCreateBulkMeter,
  dbDeleteBulkMeter,
  dbGetAllBulkMeters,
  dbUpdateBulkMeter,
  dbCreateStaffMember,
  dbDeleteStaffMember,
  dbGetAllStaffMembers,
  dbUpdateStaffMember,
  getStaffMemberForAuth as dbGetStaffMemberForAuth,
  dbCreateBill,
  dbDeleteBill,
  dbGetAllBills,
  dbUpdateBill,
  dbCreateIndividualCustomerReading,
  dbDeleteIndividualCustomerReading,
  dbGetAllIndividualCustomerReadings,
  dbUpdateIndividualCustomerReading,
  dbCreateBulkMeterReading,
  dbDeleteBulkMeterReading,
  dbGetAllBulkMeterReadings,
  dbUpdateBulkMeterReading,
  dbCreatePayment,
  dbDeletePayment,
  dbGetAllPayments,
  dbUpdatePayment,
  dbCreateReportLog,
  dbDeleteReportLog,
  dbGetAllReportLogs,
  dbUpdateReportLog,
  dbCreateNotification,
  dbDeleteNotification,
  dbGetAllNotifications,
  dbUpdateNotification,
  dbGetAllRoles,
  dbCreateRole,
  dbGetAllPermissions,
  dbCreatePermission,
  dbUpdatePermission,
  dbDeletePermission,
  dbGetAllRolePermissions,
  dbRpcUpdateRolePermissions,
  dbGetAllTariffs,
  dbGetTariffByTypeAndDate,
  dbCreateTariff,
  dbUpdateTariff,
  dbCreateKnowledgeBaseArticle,
  dbUpdateKnowledgeBaseArticle,
  dbDeleteKnowledgeBaseArticle,
  dbGetAllKnowledgeBaseArticles,
  dbUpdateBillStatus,
  dbCreateBillWorkflowLog,
  dbGetBillWorkflowLogs as dbGetBillWorkflowLogsQuery,
  dbGetBillById as dbGetBillByIdQuery,
  dbGetCustomerById,
  dbGetBulkMeterById,
  dbGetBranchById,
  dbGetStaffPermissions,
  dbGetIndividualCustomerReadingsByCustomer,
  dbGetBulkMeterReadingsByMeter,
  dbCreateCustomerSession,
  dbRevokeCustomerSession,
  dbGetActiveCustomerSessions,
  dbIsCustomerSessionValid,
  dbCreateFaultCode,
  dbUpdateFaultCode,
  dbDeleteFaultCode,
  dbGetAllFaultCodes,
  dbGetFaultCodeById,
  dbGetBillsByCustomerId,
  dbGetBillsByBulkMeterId,
} from './db-queries';

import { calculateBill, type CustomerType, type SewerageConnection } from './billing';
import { encrypt, getSession } from './auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import type { Database } from '@/types/db';

// Helper types to extract Row, Insert, and Update types from the database definition
type PublicTables = Database['public']['Tables'];

const generateBillKey = (billId: string) => {
  const idHex = (billId || "").replace(/-/g, '').substring(0, 8);
  const idNumeric = parseInt(idHex, 16);
  return isNaN(idNumeric) ? "BBPT-0000000000" : `BBPT-${String(idNumeric).padStart(10, '0')}`;
};

type RoleRow = PublicTables['roles']['Row'];
type PermissionRow = PublicTables['permissions']['Row'];
type RolePermissionRow = PublicTables['role_permissions']['Row'];
type RoleInsert = PublicTables['roles']['Insert'];
type PermissionInsert = PublicTables['permissions']['Insert'];
type PermissionUpdate = PublicTables['permissions']['Update'];
type Branch = PublicTables['branches']['Row'];
type BulkMeterRow = PublicTables['bulk_meters']['Row'];
type IndividualCustomer = PublicTables['individual_customers']['Row'];
type StaffMember = PublicTables['staff_members']['Row'];
type Bill = PublicTables['bills']['Row'];
type IndividualCustomerReading = PublicTables['individual_customer_readings']['Row'];
type BulkMeterReading = PublicTables['bulk_meter_readings']['Row'];
type Payment = PublicTables['payments']['Row'];
type ReportLog = PublicTables['reports']['Row'];
type NotificationRow = PublicTables['notifications']['Row'];
type TariffRow = PublicTables['tariffs']['Row'] & { effective_date: string; year?: number };
type KnowledgeBaseArticleRow = PublicTables['knowledge_base_articles']['Row'];

type BranchInsert = PublicTables['branches']['Insert'];
type BranchUpdate = PublicTables['branches']['Update'];
type BulkMeterInsert = PublicTables['bulk_meters']['Insert'];
type BulkMeterUpdate = PublicTables['bulk_meters']['Update'];
type IndividualCustomerInsert = PublicTables['individual_customers']['Insert'];
type IndividualCustomerUpdate = PublicTables['individual_customers']['Update'];
type StaffMemberInsert = PublicTables['staff_members']['Insert'];
type StaffMemberUpdate = PublicTables['staff_members']['Update'];
type BillInsert = PublicTables['bills']['Insert'];
type BillUpdate = PublicTables['bills']['Update'];
type IndividualCustomerReadingInsert = PublicTables['individual_customer_readings']['Insert'];
type IndividualCustomerReadingUpdate = PublicTables['individual_customer_readings']['Update'];
type BulkMeterReadingInsert = PublicTables['bulk_meter_readings']['Insert'];
type BulkMeterReadingUpdate = PublicTables['bulk_meter_readings']['Update'];
type PaymentInsert = PublicTables['payments']['Insert'];
type PaymentUpdate = PublicTables['payments']['Update'];
type ReportLogInsert = PublicTables['reports']['Insert'];
type ReportLogUpdate = PublicTables['reports']['Update'];
type NotificationInsert = PublicTables['notifications']['Insert'];
type NotificationUpdate = PublicTables['notifications']['Update'];
type TariffInsert = PublicTables['tariffs']['Insert'];
type TariffUpdate = PublicTables['tariffs']['Update'];
type KnowledgeBaseArticleInsert = PublicTables['knowledge_base_articles']['Insert'];
type KnowledgeBaseArticleUpdate = PublicTables['knowledge_base_articles']['Update'];

// Manually define FaultCode types since they are not in the generated Database type yet
export interface FaultCodeRow {
  id: string;
  code: string;
  description: string | null;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FaultCodeInsert {
  id?: string;
  code: string;
  description?: string | null;
  category?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FaultCodeUpdate {
  code?: string;
  description?: string | null;
  category?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}


export type { RoleRow, PermissionRow, RolePermissionRow, Branch, BulkMeterRow, IndividualCustomer, StaffMember, Bill, IndividualCustomerReading, BulkMeterReading, Payment, ReportLog, NotificationRow, BranchInsert, BranchUpdate, BulkMeterInsert, BulkMeterUpdate, IndividualCustomerInsert, IndividualCustomerUpdate, StaffMemberInsert, StaffMemberUpdate, BillInsert, BillUpdate, IndividualCustomerReadingInsert, IndividualCustomerReadingUpdate, BulkMeterReadingInsert, BulkMeterReadingUpdate, PaymentInsert, PaymentUpdate, ReportLogInsert, ReportLogUpdate, NotificationInsert, NotificationUpdate, TariffRow, TariffInsert, TariffUpdate, KnowledgeBaseArticleInsert, KnowledgeBaseArticleUpdate, KnowledgeBaseArticleRow };


const wrap = async <T>(fn: () => Promise<T>) => {
  try {
    const data = await fn();
    return { data, error: null } as any;
  } catch (e) {
    // Ensure the full error is serialized, not just a generic object
    const errorObject = e instanceof Error
      ? { name: e.name, message: e.message, stack: e.stack }
      : typeof e === 'object' && e !== null
        ? e
        : { message: String(e) };
    return { data: null, error: errorObject } as any;
  }
};

const checkPermission = async (permission: string) => {
  const session = await getSession();
  if (!session || !session.id) {
    throw new Error('User not authenticated');
  }
  const permissions = session.permissions || [];
  if (!permissions.includes(permission)) {
    throw new Error(`Forbidden: Missing permission ${permission}`);
  }
  return session;
};

export async function getBranchByIdAction(id: string) { return await wrap(() => dbGetBranchById(id)); }

export async function getAllBranchesAction() { return await wrap(() => dbGetAllBranches()); }
export async function createBranchAction(branch: BranchInsert) {
  return await wrap(async () => {
    const result = await dbCreateBranch(branch);
    await logSecurityEventAction({ event: 'Create Branch', details: { branch } });
    return result;
  });
}
export async function updateBranchAction(id: string, branch: BranchUpdate) {
  return await wrap(async () => {
    const result = await dbUpdateBranch(id, branch);
    await logSecurityEventAction({ event: 'Update Branch', details: { id, updates: branch } });
    return result;
  });
}
export async function deleteBranchAction(id: string) {
  return await wrap(async () => {
    await dbDeleteBranch(id);
    await logSecurityEventAction({ event: 'Delete Branch', severity: 'Warning', details: { id } });
  });
}

export async function getAllCustomersAction() { return await wrap(() => dbGetAllCustomers()); }
export async function createCustomerAction(customer: IndividualCustomerInsert) {
  return await wrap(async () => {
    const session = await checkPermission('customers_create');
    // If staff member creates it, it must be for their branch and pending approval
    if (session.role.toLowerCase() === 'staff') {
      customer.branch_id = session.branchId || customer.branch_id;
      customer.status = 'Pending Approval';
    }
    const result = await dbCreateIndividualCustomer(customer);
    await logSecurityEventAction({
      event: 'Create Customer',
      customerKeyNumber: result.data?.customerKeyNumber,
      details: { customer }
    });
    return result;
  });
}
export async function updateCustomerAction(customerKeyNumber: string, customer: IndividualCustomerUpdate) {
  return await wrap(async () => {
    const result = await dbUpdateCustomer(customerKeyNumber, customer);
    await logSecurityEventAction({
      event: 'Update Customer',
      customerKeyNumber,
      details: { updates: customer }
    });
    return result;
  });
}
export async function deleteCustomerAction(customerKeyNumber: string) {
  return await wrap(async () => {
    await dbDeleteCustomer(customerKeyNumber);
    await logSecurityEventAction({
      event: 'Delete Customer',
      severity: 'Warning',
      customerKeyNumber
    });
  });
}

export async function approveCustomerAction(customerKeyNumber: string) {
  return await wrap(async () => {
    const session = await checkPermission('customers_approve');
    const result = await dbUpdateCustomer(customerKeyNumber, {
      status: 'Active',
      approved_by: session.id,
      approved_at: new Date().toISOString()
    });
    await logSecurityEventAction({ event: 'Approve Customer', customerKeyNumber });
    return result;
  });
}

export async function rejectCustomerAction(customerKeyNumber: string) {
  return await wrap(async () => {
    const session = await checkPermission('customers_approve');
    const result = await dbUpdateCustomer(customerKeyNumber, {
      status: 'Rejected',
      approved_by: session.id,
      approved_at: new Date().toISOString()
    });
    await logSecurityEventAction({ event: 'Reject Customer', severity: 'Warning', customerKeyNumber });
    return result;
  });
}

export async function getCustomerByIdAction(customerKeyNumber: string) { return await wrap(() => dbGetCustomerById(customerKeyNumber)); }
export async function getAllBulkMetersAction() { return await wrap(() => dbGetAllBulkMeters()); }
export async function getBulkMeterByIdAction(customerKeyNumber: string) { return await wrap(() => dbGetBulkMeterById(customerKeyNumber)); }
export async function createBulkMeterAction(bulkMeter: BulkMeterInsert) {
  return await wrap(async () => {
    const session = await checkPermission('bulk_meters_create');
    // If staff member creates it, it must be for their branch and pending approval
    if (session.role.toLowerCase() === 'staff') {
      bulkMeter.branch_id = session.branchId || bulkMeter.branch_id;
      bulkMeter.status = 'Pending Approval';
    }
    const result = await dbCreateBulkMeter(bulkMeter);
    await logSecurityEventAction({
      event: 'Create Bulk Meter',
      customerKeyNumber: bulkMeter.customerKeyNumber,
      details: { bulkMeter }
    });
    return result;
  });
}
export async function updateBulkMeterAction(customerKeyNumber: string, bulkMeter: BulkMeterUpdate) {
  return await wrap(async () => {
    const result = await dbUpdateBulkMeter(customerKeyNumber, bulkMeter);
    await logSecurityEventAction({
      event: 'Update Bulk Meter',
      customerKeyNumber,
      details: { updates: bulkMeter }
    });
    return result;
  });
}
export async function deleteBulkMeterAction(customerKeyNumber: string) {
  return await wrap(async () => {
    await dbDeleteBulkMeter(customerKeyNumber);
    await logSecurityEventAction({
      event: 'Delete Bulk Meter',
      severity: 'Warning',
      customerKeyNumber
    });
  });
}

export async function approveBulkMeterAction(customerKeyNumber: string) {
  return await wrap(async () => {
    const session = await checkPermission('bulk_meters_approve');
    const result = await dbUpdateBulkMeter(customerKeyNumber, {
      status: 'Active',
      approved_by: session.id,
      approved_at: new Date().toISOString()
    });
    await logSecurityEventAction({
      event: 'Approve Bulk Meter',
      customerKeyNumber
    });
    return result;
  });
}

export async function rejectBulkMeterAction(customerKeyNumber: string) {
  return await wrap(async () => {
    const session = await checkPermission('bulk_meters_approve');
    const result = await dbUpdateBulkMeter(customerKeyNumber, {
      status: 'Rejected',
      approved_by: session.id,
      approved_at: new Date().toISOString()
    });
    await logSecurityEventAction({
      event: 'Reject Bulk Meter',
      severity: 'Warning',
      customerKeyNumber
    });
    return result;
  });
}

export async function getAllStaffMembersAction() { return await wrap(() => dbGetAllStaffMembers()); }
export async function createStaffMemberAction(staffMember: StaffMemberInsert) {
  return await wrap(async () => {
    const result = await dbCreateStaffMember(staffMember);
    await logSecurityEventAction({
      event: 'Create Staff Member',
      details: { staffMember }
    });
    return result;
  });
}
export async function updateStaffMemberAction(email: string, staffMember: StaffMemberUpdate) {
  return await wrap(async () => {
    const result = await dbUpdateStaffMember(email, staffMember);
    await logSecurityEventAction({
      event: 'Update Staff Member',
      details: { email, updates: staffMember }
    });
    return result;
  });
}
export async function deleteStaffMemberAction(email: string) {
  return await wrap(async () => {
    await dbDeleteStaffMember(email);
    await logSecurityEventAction({
      event: 'Delete Staff Member',
      severity: 'Warning',
      details: { email }
    });
  });
}
export async function getStaffMemberForAuthAction(email: string, password?: string) { return await wrap(() => dbGetStaffMemberForAuth(email, password)); }

export async function getAllBillsAction() { return await wrap(() => dbGetAllBills()); }
export async function createBillAction(bill: BillInsert) {
  return await wrap(async () => {
    const session = await checkPermission('bill:create');
    const result = await dbCreateBill(bill);

    // Generate and update BILLKEY
    if (result && result.id) {
      const billKey = generateBillKey(result.id);
      await dbUpdateBill(result.id, { BILLKEY: billKey });
      result.BILLKEY = billKey; // Update returned object
    }

    await logSecurityEventAction({
      event: 'Create Bill',
      customerKeyNumber: bill.CUSTOMERKEY || undefined,
      details: { bill }
    });
    return result;
  });
}

export async function closeBillingCycleAction(payload: {
  bill: BillInsert;
  meterUpdate: {
    customerKeyNumber: string;
    previousReading: number;
    currentReading: number;
    outStandingbill: number;
    paymentStatus: string;
  };
}) {
  return await wrap(async () => {
    const session = await checkPermission('billing:close_cycle');

    // 1. Create the Bill
    const billResult = await dbCreateBill(payload.bill);

    // Generate and update BILLKEY
    if (billResult && billResult.id) {
      const billKey = generateBillKey(billResult.id);
      await dbUpdateBill(billResult.id, { BILLKEY: billKey });
      billResult.BILLKEY = billKey; // Update returned object
    }

    // 2. Update the Bulk Meter
    const meterResult = await dbUpdateBulkMeter(payload.meterUpdate.customerKeyNumber, {
      previousReading: payload.meterUpdate.previousReading,
      currentReading: payload.meterUpdate.currentReading,
      outStandingbill: payload.meterUpdate.outStandingbill as any,
      paymentStatus: payload.meterUpdate.paymentStatus as any,
    });

    // 3. Log Security Event
    await logSecurityEventAction({
      event: 'Close Billing Cycle',
      customerKeyNumber: payload.meterUpdate.customerKeyNumber,
      details: {
        billId: billResult.id,
        meterUpdate: payload.meterUpdate
      }
    });

    return { bill: billResult, meter: meterResult };
  });
}
export async function updateBillAction(id: string, bill: BillUpdate) {
  return await wrap(async () => {
    const session = await checkPermission('bill:update');
    const result = await dbUpdateBill(id, bill);
    await logSecurityEventAction({
      event: 'Update Bill',
      details: { id, updates: bill }
    });
    return result;
  });
}
export async function deleteBillAction(id: string) {
  return await wrap(async () => {
    const session = await checkPermission('bill:delete');
    await dbDeleteBill(id);
    await logSecurityEventAction({
      event: 'Delete Bill',
      severity: 'Warning',
      details: { id }
    });
  });
}
export async function getBillByIdAction(id: string) { return await wrap(() => dbGetBillByIdQuery(id)); }

export async function submitBillAction(id: string) {
  return await wrap(async () => {
    const session = await checkPermission('bill:submit');
    // Validation logic can go here (e.g., check if current status is Draft)
    const bill = await dbUpdateBillStatus(id, 'Pending Approval');
    await dbCreateBillWorkflowLog({
      bill_id: id,
      from_status: 'Draft',
      to_status: 'Pending Approval',
      changed_by: session.id
    });
    await logSecurityEventAction({
      event: 'Submit Bill',
      details: { id }
    });
    return bill;
  });
}

export async function approveBillAction(id: string) {
  return await wrap(async () => {
    const session = await checkPermission('bill:approve');
    const approvalDate = new Date();
    const bill = await dbUpdateBillStatus(id, 'Approved', approvalDate, session.id);
    await dbCreateBillWorkflowLog({
      bill_id: id,
      from_status: 'Pending Approval',
      to_status: 'Approved',
      changed_by: session.id
    });
    await logSecurityEventAction({
      event: 'Approve Bill',
      details: { id }
    });
    return bill;
  });
}

export async function rejectBillAction(id: string, reason: string) {
  return await wrap(async () => {
    const session = await checkPermission('bill:rework');
    const bill = await dbUpdateBillStatus(id, 'Rework');
    await dbCreateBillWorkflowLog({
      bill_id: id,
      from_status: 'Pending Approval',
      to_status: 'Rework',
      changed_by: session.id,
      reason: reason
    });
    await logSecurityEventAction({
      event: 'Reject Bill',
      severity: 'Warning',
      details: { id, reason }
    });
    return bill;
  });
}

export async function postBillAction(id: string) {
  return await wrap(async () => {
    const session = await checkPermission('bill:post');
    const bill = await dbUpdateBillStatus(id, 'Posted');
    await dbCreateBillWorkflowLog({
      bill_id: id,
      from_status: 'Approved',
      to_status: 'Posted',
      changed_by: session.id
    });
    await logSecurityEventAction({
      event: 'Post Bill',
      details: { id }
    });
    return bill;
  });
}

export async function correctBillAction(id: string, reason: string) {
  return await wrap(async () => {
    const session = await checkPermission('bill:correct');
    const bill = await dbUpdateBillStatus(id, 'Rework');
    await dbCreateBillWorkflowLog({
      bill_id: id,
      from_status: 'Posted',
      to_status: 'Rework',
      changed_by: session.id,
      reason: reason || 'Correction requested'
    });
    await logSecurityEventAction({
      event: 'Correct Bill',
      severity: 'Warning',
      details: { id, reason }
    });
    return bill;
  });
}

export async function getBillWorkflowLogsAction(billId: string) {
  return await wrap(() => dbGetBillWorkflowLogsQuery(billId));
}

export async function getAllIndividualCustomerReadingsAction() { return await wrap(() => dbGetAllIndividualCustomerReadings()); }
export async function createIndividualCustomerReadingAction(reading: IndividualCustomerReadingInsert) {
  return await wrap(async () => {
    const result = await dbCreateIndividualCustomerReading(reading);
    await logSecurityEventAction({
      event: 'Create Indiv. Reading',
      customerKeyNumber: reading.individual_customer_id,
      details: { reading }
    });
    return result;
  });
}
export async function updateIndividualCustomerReadingAction(id: string, reading: IndividualCustomerReadingUpdate) {
  return await wrap(async () => {
    const result = await dbUpdateIndividualCustomerReading(id, reading);
    await logSecurityEventAction({
      event: 'Update Indiv. Reading',
      details: { id, updates: reading }
    });
    return result;
  });
}
export async function deleteIndividualCustomerReadingAction(id: string) {
  return await wrap(async () => {
    await dbDeleteIndividualCustomerReading(id);
    await logSecurityEventAction({
      event: 'Delete Indiv. Reading',
      severity: 'Warning',
      details: { id }
    });
  });
}

export async function getAllBulkMeterReadingsAction() { return await wrap(() => dbGetAllBulkMeterReadings()); }
export async function createBulkMeterReadingAction(reading: BulkMeterReadingInsert) {
  return await wrap(async () => {
    const result = await dbCreateBulkMeterReading(reading);
    await logSecurityEventAction({
      event: 'Create Bulk Reading',
      customerKeyNumber: reading.CUSTOMERKEY,
      details: { reading }
    });
    return result;
  });
}
export async function updateBulkMeterReadingAction(id: string, reading: BulkMeterReadingUpdate) {
  return await wrap(async () => {
    const result = await dbUpdateBulkMeterReading(id, reading);
    await logSecurityEventAction({
      event: 'Update Bulk Reading',
      details: { id, updates: reading }
    });
    return result;
  });
}
export async function deleteBulkMeterReadingAction(id: string) {
  return await wrap(async () => {
    await dbDeleteBulkMeterReading(id);
    await logSecurityEventAction({
      event: 'Delete Bulk Reading',
      severity: 'Warning',
      details: { id }
    });
  });
}

export async function getAllPaymentsAction() { return await wrap(() => dbGetAllPayments()); }
export async function createPaymentAction(payment: PaymentInsert) {
  return await wrap(async () => {
    const result = await dbCreatePayment(payment);
    await logSecurityEventAction({
      event: 'Create Payment',
      customerKeyNumber: payment.individual_customer_id || undefined,
      details: { payment }
    });
    return result;
  });
}
export async function updatePaymentAction(id: string, payment: PaymentUpdate) {
  return await wrap(async () => {
    const result = await dbUpdatePayment(id, payment);
    await logSecurityEventAction({
      event: 'Update Payment',
      details: { id, updates: payment }
    });
    return result;
  });
}
export async function deletePaymentAction(id: string) {
  return await wrap(async () => {
    await dbDeletePayment(id);
    await logSecurityEventAction({
      event: 'Delete Payment',
      severity: 'Warning',
      details: { id }
    });
  });
}

export async function getAllReportLogsAction() { return await wrap(() => dbGetAllReportLogs()); }
export async function createReportLogAction(log: ReportLogInsert) {
  return await wrap(async () => {
    const result = await dbCreateReportLog(log);
    await logSecurityEventAction({
      event: 'Create Report',
      details: { log }
    });
    return result;
  });
}
export async function updateReportLogAction(id: string, log: ReportLogUpdate) {
  return await wrap(async () => {
    const result = await dbUpdateReportLog(id, log);
    await logSecurityEventAction({
      event: 'Update Report',
      details: { id, updates: log }
    });
    return result;
  });
}
export async function deleteReportLogAction(id: string) {
  return await wrap(async () => {
    await dbDeleteReportLog(id);
    await logSecurityEventAction({
      event: 'Delete Report',
      severity: 'Warning',
      details: { id }
    });
  });
}

export async function getAllNotificationsAction() { return await wrap(() => dbGetAllNotifications()); }
export async function deleteNotificationAction(id: string) {
  return await wrap(async () => {
    await dbDeleteNotification(id);
    await logSecurityEventAction({
      event: 'Delete Notification',
      severity: 'Warning',
      details: { id }
    });
  });
}
export async function updateNotificationAction(id: string, notification: NotificationUpdate) {
  return await wrap(async () => {
    const result = await dbUpdateNotification(id, notification);
    await logSecurityEventAction({
      event: 'Update Notification',
      details: { id, updates: notification }
    });
    return result;
  });
}
export async function createNotificationAction(notification: NotificationInsert) {
  return await wrap(async () => {
    const result = await dbCreateNotification(notification);
    await logSecurityEventAction({
      event: 'Create Notification',
      details: { notification }
    });
    return result;
  });
}

export async function getAllRolesAction() { return await wrap(() => dbGetAllRoles()); }
export async function createRoleAction(role: RoleInsert) {
  return await wrap(async () => {
    const result = await dbCreateRole(role);
    await logSecurityEventAction({
      event: 'Create Role',
      severity: 'Warning',
      details: { role }
    });
    return result;
  });
}
export async function getAllPermissionsAction() { return await wrap(() => dbGetAllPermissions()); }
export const createPermissionAction = async (permission: PermissionInsert) => await wrap(async () => {
  const result = await dbCreatePermission(permission);
  await logSecurityEventAction({
    event: 'Create Permission',
    severity: 'Warning',
    details: { permission }
  });
  return result;
});
export const updatePermissionAction = async (id: number, permission: PermissionUpdate) => await wrap(async () => {
  const result = await dbUpdatePermission(id, permission);
  await logSecurityEventAction({
    event: 'Update Permission',
    severity: 'Warning',
    details: { id, updates: permission }
  });
  return result;
});
export const deletePermissionAction = async (id: number) => await wrap(async () => {
  await dbDeletePermission(id);
  await logSecurityEventAction({
    event: 'Delete Permission',
    severity: 'Critical',
    details: { id }
  });
});
export async function getAllRolePermissionsAction() { return await wrap(() => dbGetAllRolePermissions()); }

export async function rpcUpdateRolePermissionsAction(roleId: number, permissionIds: number[]) {
  return await wrap(async () => {
    // 1. Check permission
    await checkPermission('permissions_edit');

    // 2. Perform DB update
    const result = await dbRpcUpdateRolePermissions(roleId, permissionIds);

    // 3. Log security event
    await logSecurityEventAction({
      event: 'Update Role Permissions',
      severity: 'Warning',
      details: { roleId, permissionIds }
    });

    // 4. Revalidate paths to clear caches
    revalidatePath('/admin/roles-and-permissions');
    revalidatePath('/staff/roles-and-permissions');

    return result;
  });
}


export async function getAllTariffsAction() { return await wrap(() => dbGetAllTariffs()); }
export async function createTariffAction(tariff: TariffInsert) {
  return await wrap(async () => {
    const result = await dbCreateTariff(tariff);
    await logSecurityEventAction({
      event: 'Create Tariff',
      severity: 'Critical',
      details: { tariff }
    });
    return result;
  });
}
export async function updateTariffAction(customerType: string, effectiveDate: string, tariff: TariffUpdate) {
  return await wrap(async () => {
    // Capture current tariff for audit comparison
    const oldTariff = await dbGetTariffByTypeAndDate(customerType, effectiveDate);

    const result = await dbUpdateTariff(customerType, effectiveDate, tariff);

    await logSecurityEventAction({
      event: 'Update Tariff',
      severity: 'Critical',
      details: {
        customerType,
        effectiveDate,
        old_values: oldTariff,
        new_values: tariff
      }
    });
    return result;
  });
}

export async function getAllKnowledgeBaseArticlesAction() { return await wrap(() => dbGetAllKnowledgeBaseArticles()); }
export async function createKnowledgeBaseArticleAction(article: KnowledgeBaseArticleInsert) {
  return await wrap(async () => {
    const result = await dbCreateKnowledgeBaseArticle(article);
    await logSecurityEventAction({
      event: 'Create KB Article',
      details: { article }
    });
    return result;
  });
}
export async function updateKnowledgeBaseArticleAction(id: number, article: KnowledgeBaseArticleUpdate) {
  return await wrap(async () => {
    const result = await dbUpdateKnowledgeBaseArticle(id, article);
    await logSecurityEventAction({
      event: 'Update KB Article',
      details: { id, updates: article }
    });
    return result;
  });
}
export async function deleteKnowledgeBaseArticleAction(id: number) {
  return await wrap(async () => {
    await dbDeleteKnowledgeBaseArticle(id);
    await dbLogSecurityEvent('Delete KB Article', undefined, undefined, undefined, 'Warning', { id });
  });
}

export async function calculateBillAction(
  consumption: number,
  customerType: CustomerType,
  sewerageConnection: SewerageConnection,
  meterSize: string | number,
  billingMonth: string,
  sewerageCONS?: number,
  baseWaterChargeCONS?: number
) {
  const size = typeof meterSize === 'string' ? parseFloat(meterSize) : meterSize;
  return await wrap(() => calculateBill(consumption, customerType, sewerageConnection, size || 0, billingMonth, sewerageCONS, baseWaterChargeCONS));
}

import { dbLogSecurityEvent } from './db-queries';

export interface LogOptions {
  event: string;
  severity?: 'Info' | 'Warning' | 'Critical';
  customerKeyNumber?: string;
  details?: any;
}

export async function logSecurityEventAction(options: LogOptions | string) {
  return await wrap(async () => {
    const session = await getSession();

    let event: string;
    let severity: 'Info' | 'Warning' | 'Critical' = 'Info';
    let details: any = {};
    let customerKeyNumber: string | undefined;

    if (typeof options === 'string') {
      event = options;
    } else {
      event = options.event;
      severity = options.severity || 'Info';
      details = options.details || {};
      customerKeyNumber = options.customerKeyNumber;
    }

    await dbLogSecurityEvent(
      event,
      session?.email || 'System',
      session?.branchName || 'N/A',
      undefined,
      severity,
      details,
      customerKeyNumber
    );
    return true;
  });
}

// =====================================================
// Customer Portal Actions
// =====================================================

export interface CustomerAuthResult {
  customer_key_number: string | null;
  name: string | null;
  email: string | null;
  phone_number: string | null;
  is_portal_enabled: boolean;
  success: boolean;
  message: string;
}

export async function getCustomerAccountAction(
  customerKeyNumber: string
): Promise<{ data: any | null; error: any }> {
  return await wrap(async () => {
    const dbCustomer = await dbGetCustomerById(customerKeyNumber);
    if (!dbCustomer) return null;

    // Map database fields to UI-expected fields for customer portal
    return {
      ...dbCustomer,
      meterNumber: dbCustomer.METER_KEY || dbCustomer.meterNumber,
      customerKeyNumber: dbCustomer.customerKeyNumber,
      name: dbCustomer.name,
      contractNumber: dbCustomer.contractNumber,
      meterSize: dbCustomer.meterSize,
      currentReading: dbCustomer.currentReading,
      previousReading: dbCustomer.previousReading,
      month: dbCustomer.month,
      specificArea: dbCustomer.specificArea,
      subCity: dbCustomer.subCity,
      woreda: dbCustomer.woreda,
      status: dbCustomer.status,
      customerType: dbCustomer.customerType,
      sewerageConnection: dbCustomer.sewerageConnection || dbCustomer.sewerage_connection,
      charge_group: dbCustomer.charge_group || dbCustomer.customerType,
      email: dbCustomer.email,
      phone_number: dbCustomer.phone_number,
    };
  });
}

export async function getBulkMeterAccountAction(
  customerKeyNumber: string
): Promise<{ data: any | null; error: any }> {
  return await wrap(async () => {
    const dbBulkMeter = await dbGetBulkMeterById(customerKeyNumber);
    if (!dbBulkMeter) return null;

    // Map database fields to UI-expected fields for customer portal
    return {
      ...dbBulkMeter,
      meterNumber: dbBulkMeter.METER_KEY || dbBulkMeter.meterNumber,
      customerKeyNumber: dbBulkMeter.customerKeyNumber,
      name: dbBulkMeter.name,
      contractNumber: dbBulkMeter.contractNumber,
      meterSize: dbBulkMeter.meterSize,
      currentReading: dbBulkMeter.currentReading,
      previousReading: dbBulkMeter.previousReading,
      month: dbBulkMeter.month,
      specificArea: dbBulkMeter.specificArea,
      subCity: dbBulkMeter.subCity,
      woreda: dbBulkMeter.woreda,
      status: dbBulkMeter.status,
      sewerageConnection: dbBulkMeter.sewerage_connection,
      charge_group: dbBulkMeter.charge_group,
    };
  });
}

export async function getCustomerReadingsAction(
  customerKeyNumber: string
): Promise<{ data: IndividualCustomerReading[] | null; error: any }> {
  return await wrap(async () => {
    return await dbGetIndividualCustomerReadingsByCustomer(customerKeyNumber);
  });
}

export async function getBulkMeterReadingsAction(
  customerKeyNumber: string
): Promise<{ data: BulkMeterReading[] | null; error: any }> {
  return await wrap(async () => {
    return await dbGetBulkMeterReadingsByMeter(customerKeyNumber);
  });
}

export async function getCustomerBillsAction(
  customerKeyNumber: string
): Promise<{ data: any[] | null; error: any }> {
  return await wrap(async () => {
    return await dbGetBillsByCustomerId(customerKeyNumber);
  });
}

export async function getBulkMeterBillsAction(
  customerKeyNumber: string
): Promise<{ data: any[] | null; error: any }> {
  return await wrap(async () => {
    return await dbGetBillsByBulkMeterId(customerKeyNumber);
  });
}

// =====================================================
// Customer Session Management Actions
// =====================================================

export async function createCustomerSessionAction(session: {
  customer_key_number: string;
  customer_type: string;
  ip_address?: string;
  device_name?: string;
  location?: string;
}) {
  return await wrap(async () => {
    const result = await dbCreateCustomerSession(session);
    await logSecurityEventAction({
      event: 'Customer Login',
      customerKeyNumber: session.customer_key_number,
      details: { device_name: session.device_name, location: session.location }
    });
    return result;
  });
}

export async function revokeCustomerSessionAction(sessionId: string) {
  return await wrap(async () => {
    const result = await dbRevokeCustomerSession(sessionId);
    await logSecurityEventAction({
      event: 'Customer Session Revoked',
      severity: 'Warning',
      details: { sessionId }
    });
    return result;
  });
}

export async function getActiveCustomerSessionsAction() {
  return await wrap(() => dbGetActiveCustomerSessions());
}

export async function validateCustomerSessionAction(sessionId: string) {
  return await wrap(() => dbIsCustomerSessionValid(sessionId));
}

// =====================================================
// Fault Code Management Actions
// =====================================================

export async function getAllFaultCodesAction() { return await wrap(() => dbGetAllFaultCodes()); }
export async function getFaultCodeByIdAction(id: string) { return await wrap(() => dbGetFaultCodeById(id)); }

export async function createFaultCodeAction(faultCode: FaultCodeInsert) {
  return await wrap(async () => {
    // Optionally add permission check here, e.g. checkPermission(user.id, 'settings_update')
    // For now assuming the UI handles checks or we add it later
    const result = await dbCreateFaultCode(faultCode);
    await logSecurityEventAction({
      event: 'Create Fault Code',
      details: { faultCode }
    });
    return result;
  });
}

export async function updateFaultCodeAction(id: string, faultCode: FaultCodeUpdate) {
  return await wrap(async () => {
    const result = await dbUpdateFaultCode(id, faultCode);
    await logSecurityEventAction({
      event: 'Update Fault Code',
      details: { id, updates: faultCode }
    });
    return result;
  });
}

export async function deleteFaultCodeAction(id: string) {
  return await wrap(async () => {
    await dbDeleteFaultCode(id);
    await logSecurityEventAction({
      event: 'Delete Fault Code',
      severity: 'Warning',
      details: { id }
    });
  });
}

// =====================================================

