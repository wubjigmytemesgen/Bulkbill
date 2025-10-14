"use client";

import type { IndividualCustomer as DomainIndividualCustomer, IndividualCustomerStatus } from '@/app/admin/individual-customers/individual-customer-types';
import type { BulkMeter as DomainBulkMeterTypeFromTypes } from '@/app/admin/bulk-meters/bulk-meter-types'; 
import type { Branch as DomainBranch } from '@/app/admin/branches/branch-types';
import type { StaffMember as DomainStaffMember } from '@/app/admin/staff-management/staff-types';
import { calculateBillFromTariff, calculateBill, type CustomerType, type SewerageConnection, type PaymentStatus, type BillCalculationResult, type TariffInfo, type TariffTier } from '@/lib/billing';
import { KnowledgeBaseArticle, KnowledgeBaseArticleInsert, KnowledgeBaseArticleUpdate } from '@/app/admin/knowledge-base/knowledge-base-types';

import {
  getAllBranchesAction,
  createBranchAction,
  updateBranchAction,
  deleteBranchAction,
  getAllCustomersAction,
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  getAllBulkMetersAction,
  createBulkMeterAction,
  updateBulkMeterAction,
  deleteBulkMeterAction,
  getAllStaffMembersAction,
  createStaffMemberAction,
  updateStaffMemberAction,
  deleteStaffMemberAction,
  getStaffMemberForAuthAction,
  getAllBillsAction,
  createBillAction,
  updateBillAction,
  deleteBillAction,
  getAllIndividualCustomerReadingsAction,
  createIndividualCustomerReadingAction,
  updateIndividualCustomerReadingAction,
  deleteIndividualCustomerReadingAction,
  getAllBulkMeterReadingsAction,
  createBulkMeterReadingAction,
  updateBulkMeterReadingAction,
  deleteBulkMeterReadingAction,
  createPaymentAction,
  deletePaymentAction,
  getAllPaymentsAction,
  updatePaymentAction,
  createReportLogAction,
  deleteReportLogAction,
  getAllReportLogsAction,
  updateReportLogAction,
  createNotificationAction,
  getAllNotificationsAction,
  getAllRolesAction,
  getAllPermissionsAction,
  getAllRolePermissionsAction,
  rpcUpdateRolePermissionsAction,
  getAllTariffsAction,
  createTariffAction,
  updateTariffAction,
  createKnowledgeBaseArticleAction,
  updateKnowledgeBaseArticleAction,
  deleteKnowledgeBaseArticleAction,
  getAllKnowledgeBaseArticlesAction
} from './actions';


// NOTE: During incremental migration from Postgres -> MySQL we relax
// the strict generated DB types in this data-store. The db-queries/actions
// layer returns loose shapes and we map them to domain types in the mappers
// below. Using `any` here prevents widespread type churn while we complete
// the migration and introduce a proper DB boundary layer.
type RoleRow = any;
type PermissionRow = any;
type RolePermissionRow = any;
type Branch = any;
type BulkMeterRow = any;
type IndividualCustomer = any;
type StaffMemberRow = any;
type Bill = any;
type IndividualCustomerReading = any;
type BulkMeterReading = any;
type Payment = any;
type ReportLog = any;
type NotificationRow = any;
type TariffRow = any;
type KnowledgeBaseArticleRow = any;

type BranchInsert = any;
type BranchUpdate = any;
type BulkMeterInsert = any;
type BulkMeterUpdate = any;
type IndividualCustomerInsert = any;
type IndividualCustomerUpdate = any;
type StaffMemberInsert = any;
type StaffMemberUpdate = any;
type BillInsert = any;
type BillUpdate = any;
type IndividualCustomerReadingInsert = any;
type IndividualCustomerReadingUpdate = any;
type BulkMeterReadingInsert = any;
type BulkMeterReadingUpdate = any;
type PaymentInsert = any;
type PaymentUpdate = any;
type ReportLogInsert = any;
type ReportLogUpdate = any;
type NotificationInsert = any;
type TariffInsert = any;
type TariffUpdate = any;
// keep the imported KnowledgeBaseArticleInsert/Update types from domain module


export type { RoleRow, PermissionRow, RolePermissionRow, Branch, BulkMeterRow, IndividualCustomer, StaffMember, Bill, IndividualCustomerReading, BulkMeterReading, Payment, ReportLog, NotificationRow, BranchInsert, BranchUpdate, BulkMeterInsert, BulkMeterUpdate, IndividualCustomerInsert, IndividualCustomerUpdate, StaffMemberInsert, StaffMemberUpdate, BillInsert, BillUpdate, IndividualCustomerReadingInsert, IndividualCustomerReadingUpdate, BulkMeterReadingInsert, BulkMeterReadingUpdate, PaymentInsert, PaymentUpdate, ReportLogInsert, ReportLogUpdate, NotificationInsert, TariffRow, TariffInsert, TariffUpdate };


export type { RoleRow as DomainRole, PermissionRow as DomainPermission, RolePermissionRow as DomainRolePermission } from './actions';

// Use TariffInfo and TariffTier types from the billing module to keep a single source of truth.


export interface DomainNotification {
  id: string;
  createdAt: string;
  title: string;
  message: string;
  senderName: string;
  targetBranchId: string | null;
}

export interface DomainBill {
  id: string;
  individualCustomerId?: string | null;
  bulkMeterId?: string | null;
  billPeriodStartDate: string;
  billPeriodEndDate: string;
  monthYear: string;
  previousReadingValue: number;
  currentReadingValue: number;
  usageM3?: number | null;
  differenceUsage?: number | null;
  baseWaterCharge: number;
  sewerageCharge?: number | null;
  maintenanceFee?: number | null;
  sanitationFee?: number | null;
  meterRent?: number | null;
  balanceCarriedForward?: number | null;
  totalAmountDue: number;
  amountPaid?: number;
  balanceDue?: number | null;
  dueDate: string;
  paymentStatus: PaymentStatus;
  billNumber?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DomainIndividualCustomerReading {
  id: string;
  individualCustomerId: string;
  readerStaffId?: string | null;
  readingDate: string;
  monthYear: string;
  readingValue: number;
  isEstimate?: boolean | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DomainBulkMeterReading {
  id: string;
  bulkMeterId: string;
  readerStaffId?: string | null;
  readingDate: string;
  monthYear: string;
  readingValue: number;
  isEstimate?: boolean | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DisplayReading {
    id: string;
    meterId: string | null;
    meterType: 'individual' | 'bulk';
    meterIdentifier: string;
    readingValue: number;
    readingDate: string;
    monthYear: string;
    notes?: string | null;
}

export interface DomainPayment {
  id: string;
  billId?: string | null;
  individualCustomerId?: string | null;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Online Payment' | 'Other';
  transactionReference?: string | null;
  processedByStaffId?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DomainReportLog {
  id: string;
  reportName: 'CustomerDataExport' | 'BulkMeterDataExport' | 'BillingSummary' | 'WaterUsageReport' | 'PaymentHistoryReport' | 'MeterReadingAccuracy';
  description?: string | null;
  generatedAt: string;
  generatedByStaffId?: string | null;
  parameters?: any | null;
  fileFormat?: string | null;
  fileName?: string | null;
  status?: 'Generated' | 'Pending' | 'Failed' | 'Archived' | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface StoreOperationResult<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    isNotFoundError?: boolean;
    error?: any;
}

type BulkMeter = DomainBulkMeterTypeFromTypes;
type StaffMember = DomainStaffMember;
type DomainRole = import('./actions').RoleRow;
type DomainPermission = import('./actions').PermissionRow;
type DomainRolePermission = import('./actions').RolePermissionRow;

let branches: DomainBranch[] = [];
let customers: DomainIndividualCustomer[] = [];
let bulkMeters: BulkMeter[] = [];
let staffMembers: StaffMember[] = [];
let bills: DomainBill[] = [];
let individualCustomerReadings: DomainIndividualCustomerReading[] = [];
let bulkMeterReadings: DomainBulkMeterReading[] = [];
let payments: DomainPayment[] = [];
let reportLogs: DomainReportLog[] = [];
let notifications: DomainNotification[] = [];
let roles: DomainRole[] = [];
let permissions: DomainPermission[] = [];
let rolePermissions: DomainRolePermission[] = [];
let tariffs: TariffRow[] = [];
let knowledgeBaseArticles: KnowledgeBaseArticle[] = [];


let branchesFetched = false;
let customersFetched = false;
let bulkMetersFetched = false;
let staffMembersFetched = false;
let billsFetched = false;
let individualCustomerReadingsFetched = false;
let bulkMeterReadingsFetched = false;
let paymentsFetched = false;
let reportLogsFetched = false;
let notificationsFetched = false;
let rolesFetched = false;
let permissionsFetched = false;
let rolePermissionsFetched = false;
let tariffsFetched = false;
let knowledgeBaseArticlesFetched = false;


type Listener<T> = (data: T[]) => void;
const branchListeners: Set<Listener<DomainBranch>> = new Set();
const customerListeners: Set<Listener<DomainIndividualCustomer>> = new Set();
const bulkMeterListeners: Set<Listener<BulkMeter>> = new Set();
const staffMemberListeners: Set<Listener<StaffMember>> = new Set();
const billListeners: Set<Listener<DomainBill>> = new Set();
const individualCustomerReadingListeners: Set<Listener<DomainIndividualCustomerReading>> = new Set();
const bulkMeterReadingListeners: Set<Listener<DomainBulkMeterReading>> = new Set();
const paymentListeners: Set<Listener<DomainPayment>> = new Set(); 
const reportLogListeners: Set<Listener<DomainReportLog>> = new Set();
const notificationListeners: Set<Listener<DomainNotification>> = new Set();
const roleListeners: Set<Listener<DomainRole>> = new Set();
const permissionListeners: Set<Listener<DomainPermission>> = new Set();
const rolePermissionListeners: Set<Listener<DomainRolePermission>> = new Set();
const tariffListeners: Set<Listener<TariffRow>> = new Set();
const knowledgeBaseArticleListeners: Set<Listener<KnowledgeBaseArticle>> = new Set();

const notifyBranchListeners = () => branchListeners.forEach(listener => listener([...branches]));
const notifyCustomerListeners = () => customerListeners.forEach(listener => listener([...customers]));
const notifyBulkMeterListeners = () => bulkMeterListeners.forEach(listener => listener([...bulkMeters]));
const notifyStaffMemberListeners = () => staffMemberListeners.forEach(listener => listener([...staffMembers]));
const notifyBillListeners = () => billListeners.forEach(listener => listener([...bills]));
const notifyIndividualCustomerReadingListeners = () => individualCustomerReadingListeners.forEach(listener => listener([...individualCustomerReadings]));
const notifyBulkMeterReadingListeners = () => bulkMeterReadingListeners.forEach(listener => listener([...bulkMeterReadings]));
const notifyPaymentListeners = () => paymentListeners.forEach(listener => listener([...payments])); 
const notifyReportLogListeners = () => reportLogListeners.forEach(listener => listener([...reportLogs]));
const notifyNotificationListeners = () => notificationListeners.forEach(listener => listener([...notifications]));
const notifyRoleListeners = () => roleListeners.forEach(listener => listener([...roles]));
const notifyPermissionListeners = () => permissionListeners.forEach(listener => listener([...permissions]));
const notifyRolePermissionListeners = () => rolePermissionListeners.forEach(listener => listener([...rolePermissions]));
const notifyTariffListeners = () => tariffListeners.forEach(listener => listener([...tariffs]));
const notifyKnowledgeBaseArticleListeners = () => knowledgeBaseArticleListeners.forEach(listener => listener([...knowledgeBaseArticles]));


// --- Mappers ---
const mapDbNotificationToDomain = (dbNotification: NotificationRow): DomainNotification => ({
  id: dbNotification.id,
  createdAt: dbNotification.created_at,
  title: dbNotification.title,
  message: dbNotification.message,
  senderName: dbNotification.sender_name,
  targetBranchId: dbNotification.target_branch_id,
});

const mapDbBranchToDomain = (dbBranch: Branch): DomainBranch => ({
  id: dbBranch.id,
  name: dbBranch.name,
  location: dbBranch.location,
  contactPerson: dbBranch.contactPerson || undefined,
  contactPhone: dbBranch.contactPhone ? String(dbBranch.contactPhone) : undefined,
  status: dbBranch.status,
});

const parsePhoneNumberForDB = (phoneString?: string): number | null => {
  if (!phoneString) return null;
  const digits = phoneString.replace(/\D/g, '');
  if (digits === '') return null;
  const parsedNumber = parseInt(digits, 10);
  return isNaN(parsedNumber) ? null : parsedNumber;
};

const mapDomainBranchToInsert = (branch: Omit<DomainBranch, 'id'>): BranchInsert => ({
  name: branch.name,
  location: branch.location,
  contactPerson: branch.contactPerson,
  contactPhone: parsePhoneNumberForDB(branch.contactPhone),
  status: branch.status,
});

const mapDomainBranchToUpdate = (branch: Partial<Omit<DomainBranch, 'id'>>): BranchUpdate => {
    const updatePayload: BranchUpdate = {};
    if (branch.name !== undefined) updatePayload.name = branch.name;
    if (branch.location !== undefined) updatePayload.location = branch.location;
    if (branch.contactPerson !== undefined) updatePayload.contactPerson = branch.contactPerson;
    if (branch.contactPhone !== undefined) updatePayload.contactPhone = parsePhoneNumberForDB(branch.contactPhone);
    if (branch.status !== undefined) updatePayload.status = branch.status;
    return updatePayload;
};


const mapDbCustomerToDomain = async (dbCustomer: IndividualCustomer): Promise<DomainIndividualCustomer> => {
  const usage = dbCustomer.currentReading - dbCustomer.previousReading;
  const { totalBill: bill } = await computeBillLocal(usage, dbCustomer.customerType, dbCustomer.sewerageConnection, Number(dbCustomer.meterSize), dbCustomer.month);
  return {
    customerKeyNumber: dbCustomer.customerKeyNumber,
    name: dbCustomer.name,
    contractNumber: dbCustomer.contractNumber,
    customerType: dbCustomer.customerType,
    bookNumber: dbCustomer.bookNumber,
    ordinal: Number(dbCustomer.ordinal),
    meterSize: Number(dbCustomer.meterSize),
    meterNumber: dbCustomer.meterNumber,
    previousReading: Number(dbCustomer.previousReading),
    currentReading: Number(dbCustomer.currentReading),
    month: dbCustomer.month,
    specificArea: dbCustomer.specificArea,
    subCity: dbCustomer.subCity,
    woreda: dbCustomer.woreda,
    sewerageConnection: dbCustomer.sewerageConnection,
    assignedBulkMeterId: dbCustomer.assignedBulkMeterId || undefined,
    branchId: dbCustomer.branch_id || undefined,
    status: dbCustomer.status,
    paymentStatus: dbCustomer.paymentStatus,
    calculatedBill: bill,
    created_at: dbCustomer.created_at,
    updated_at: dbCustomer.updated_at,
    approved_by: dbCustomer.approved_by,
    approved_at: dbCustomer.approved_at,
  };
};

// Helper: compute bill using local tariff store. Returns zeros if tariff is missing.
async function computeBillLocal(usage: number, customerType: CustomerType, sewerageConnection: SewerageConnection, meterSize: number, month: string): Promise<BillCalculationResult> {
  // Use live tariff data from DB for the billing year when calculating bills.
  // `calculateBill` will attempt to fetch the tariff for the given billing month/year
  // from the database and fall back to a zeroed result on failure.
  try {
    return await calculateBill(usage, customerType, sewerageConnection, meterSize, month);
  } catch (e) {
    console.warn('computeBillLocal: calculateBill failed, returning zero bill.', e);
    return { totalBill: 0, baseWaterCharge: 0, maintenanceFee: 0, sanitationFee: 0, vatAmount: 0, meterRent: 0, sewerageCharge: 0 };
  }
}

const mapDomainCustomerToInsert = async (
  customer: Partial<DomainIndividualCustomer>
): Promise<IndividualCustomerInsert> => {
  const usage = (customer.currentReading || 0) - (customer.previousReading || 0);
  const { totalBill: bill } = await computeBillLocal(usage, customer.customerType!, customer.sewerageConnection!, Number(customer.meterSize), customer.month!);
  return {
    name: customer.name!,
    customerKeyNumber: customer.customerKeyNumber!,
    contractNumber: customer.contractNumber!,
    customerType: customer.customerType!,
    bookNumber: customer.bookNumber!,
    ordinal: Number(customer.ordinal) || 0,
    meterSize: Number(customer.meterSize) || 0,
    meterNumber: customer.meterNumber!,
    previousReading: Number(customer.previousReading) || 0,
    currentReading: Number(customer.currentReading) || 0,
    month: customer.month!,
    specificArea: customer.specificArea!,
    subCity: customer.subCity!,
    woreda: customer.woreda!,
    sewerageConnection: customer.sewerageConnection!,
    assignedBulkMeterId: customer.assignedBulkMeterId,
    branch_id: customer.branchId, 
    status: customer.status || 'Active', 
    paymentStatus: customer.paymentStatus || 'Unpaid', 
    calculatedBill: bill,
  };
};

const mapDomainCustomerToUpdate = async (customerWithUpdates: DomainIndividualCustomer): Promise<IndividualCustomerUpdate> => {
    const updatePayload: IndividualCustomerUpdate = {
        name: customerWithUpdates.name,
        customerKeyNumber: customerWithUpdates.customerKeyNumber,
        contractNumber: customerWithUpdates.contractNumber,
        customerType: customerWithUpdates.customerType,
        bookNumber: customerWithUpdates.bookNumber,
        ordinal: Number(customerWithUpdates.ordinal),
        meterSize: Number(customerWithUpdates.meterSize),
        meterNumber: customerWithUpdates.meterNumber,
        previousReading: Number(customerWithUpdates.previousReading),
        currentReading: Number(customerWithUpdates.currentReading),
        month: customerWithUpdates.month,
        specificArea: customerWithUpdates.specificArea,
        subCity: customerWithUpdates.subCity,
        woreda: customerWithUpdates.woreda,
        sewerageConnection: customerWithUpdates.sewerageConnection,
        assignedBulkMeterId: customerWithUpdates.assignedBulkMeterId,
        branch_id: customerWithUpdates.branchId,
        status: customerWithUpdates.status,
        paymentStatus: customerWithUpdates.paymentStatus,
        approved_by: customerWithUpdates.approved_by,
        approved_at: customerWithUpdates.approved_at,
    };

    const usage = customerWithUpdates.currentReading - customerWithUpdates.previousReading;
  const { totalBill } = await computeBillLocal(
        usage,
        customerWithUpdates.customerType,
        customerWithUpdates.sewerageConnection,
        Number(customerWithUpdates.meterSize),
        customerWithUpdates.month
    );
    updatePayload.calculatedBill = totalBill;

    return updatePayload;
};


const mapDbBulkMeterToDomain = async (dbBulkMeter: BulkMeterRow): Promise<BulkMeter> => {
  const calculatedBmUsage = (dbBulkMeter.currentReading ?? 0) - (dbBulkMeter.previousReading ?? 0);
  const bmUsage = dbBulkMeter.bulk_usage === null || dbBulkMeter.bulk_usage === undefined
                  ? calculatedBmUsage
                  : Number(dbBulkMeter.bulk_usage);

  const { totalBill: calculatedBmTotalBill } = await computeBillLocal(bmUsage, dbBulkMeter.charge_group || 'Non-domestic', dbBulkMeter.sewerage_connection || 'No', Number(dbBulkMeter.meterSize), dbBulkMeter.month);
  const bmTotalBill = dbBulkMeter.total_bulk_bill === null || dbBulkMeter.total_bulk_bill === undefined
                      ? calculatedBmTotalBill
                      : Number(dbBulkMeter.total_bulk_bill);
  return {
    customerKeyNumber: dbBulkMeter.customerKeyNumber,
    name: dbBulkMeter.name,
    contractNumber: dbBulkMeter.contractNumber,
    meterSize: Number(dbBulkMeter.meterSize),
    meterNumber: dbBulkMeter.meterNumber,
    previousReading: Number(dbBulkMeter.previousReading),
    currentReading: Number(dbBulkMeter.currentReading),
    month: dbBulkMeter.month,
    specificArea: dbBulkMeter.specificArea,
    subCity: dbBulkMeter.subCity,
    woreda: dbBulkMeter.woreda,
    branchId: dbBulkMeter.branch_id || undefined, 
    status: dbBulkMeter.status,
    paymentStatus: dbBulkMeter.paymentStatus,
    chargeGroup: dbBulkMeter.charge_group,
    sewerageConnection: dbBulkMeter.sewerage_connection,
    bulkUsage: bmUsage,
    totalBulkBill: bmTotalBill,
    differenceUsage: dbBulkMeter.difference_usage === null || dbBulkMeter.difference_usage === undefined ? undefined : Number(dbBulkMeter.difference_usage),
    differenceBill: dbBulkMeter.difference_bill === null || dbBulkMeter.difference_bill === undefined ? undefined : Number(dbBulkMeter.difference_bill),
    outStandingbill: dbBulkMeter.outStandingbill ? Number(dbBulkMeter.outStandingbill) : 0, 
    xCoordinate: dbBulkMeter.x_coordinate ? Number(dbBulkMeter.x_coordinate) : undefined,
    yCoordinate: dbBulkMeter.y_coordinate ? Number(dbBulkMeter.y_coordinate) : undefined,
    approved_by: dbBulkMeter.approved_by,
    approved_at: dbBulkMeter.approved_at,
    location: dbBulkMeter.subCity,
  };
};


const mapDomainBulkMeterToInsert = async (bm: Partial<BulkMeter>): Promise<BulkMeterInsert> => {
  const calculatedBulkUsage = (bm.currentReading ?? 0) - (bm.previousReading ?? 0);
  const { totalBill: calculatedTotalBulkBill } = await computeBillLocal(calculatedBulkUsage, bm.chargeGroup as CustomerType || "Non-domestic", bm.sewerageConnection || "No", Number(bm.meterSize), bm.month!);

  const allIndividualCustomers = getCustomers();
  const associatedCustomers = allIndividualCustomers.filter(c => c.assignedBulkMeterId === bm.customerKeyNumber);
  const sumIndividualUsage = associatedCustomers.reduce((acc, cust) => acc + ((cust.currentReading ?? 0) - (cust.previousReading ?? 0)), 0);

  const differenceUsage = calculatedBulkUsage - sumIndividualUsage;
  const { totalBill: differenceBill } = await computeBillLocal(differenceUsage, bm.chargeGroup as CustomerType || "Non-domestic", bm.sewerageConnection || "No", Number(bm.meterSize), bm.month!);

  return {
    name: bm.name!,
    customerKeyNumber: bm.customerKeyNumber!,
    contractNumber: bm.contractNumber!,
    meterSize: Number(bm.meterSize) || 0,
    meterNumber: bm.meterNumber!,
    previousReading: Number(bm.previousReading) || 0,
    currentReading: Number(bm.currentReading) || 0,
    month: bm.month!,
    specificArea: bm.specificArea!,
    subCity: bm.subCity!,
    woreda: bm.woreda!,
    branch_id: bm.branchId, 
    status: bm.status || 'Active',
    // tolerate an extra 'Pending' status coming from older data; DB types may allow it
    paymentStatus: (bm.paymentStatus as any) || 'Unpaid',
    charge_group: bm.chargeGroup as "Domestic" | "Non-domestic" || 'Non-domestic',
    sewerage_connection: bm.sewerageConnection || 'No',
    bulk_usage: calculatedBulkUsage,
    total_bulk_bill: calculatedTotalBulkBill,
    difference_usage: differenceUsage,
    difference_bill: differenceBill,
    outStandingbill: bm.outStandingbill ? Number(bm.outStandingbill) : 0, 
    x_coordinate: bm.xCoordinate,
    y_coordinate: bm.yCoordinate,
  };
};


const mapDomainBulkMeterToUpdate = async (bulkMeterWithUpdates: BulkMeter): Promise<BulkMeterUpdate> => {
    const updatePayload: BulkMeterUpdate = {
        name: bulkMeterWithUpdates.name,
        customerKeyNumber: bulkMeterWithUpdates.customerKeyNumber,
        contractNumber: bulkMeterWithUpdates.contractNumber,
        meterSize: Number(bulkMeterWithUpdates.meterSize),
        meterNumber: bulkMeterWithUpdates.meterNumber,
        previousReading: Number(bulkMeterWithUpdates.previousReading),
        currentReading: Number(bulkMeterWithUpdates.currentReading),
        month: bulkMeterWithUpdates.month,
        specificArea: bulkMeterWithUpdates.specificArea,
        subCity: bulkMeterWithUpdates.subCity,
        woreda: bulkMeterWithUpdates.woreda,
        branch_id: bulkMeterWithUpdates.branchId,
        status: bulkMeterWithUpdates.status,
    paymentStatus: (bulkMeterWithUpdates.paymentStatus as any),
        charge_group: bulkMeterWithUpdates.chargeGroup as "Domestic" | "Non-domestic",
        sewerage_connection: bulkMeterWithUpdates.sewerageConnection,
        outStandingbill: Number(bulkMeterWithUpdates.outStandingbill),
        x_coordinate: bulkMeterWithUpdates.xCoordinate,
        y_coordinate: bulkMeterWithUpdates.yCoordinate,
        approved_by: bulkMeterWithUpdates.approved_by,
        approved_at: bulkMeterWithUpdates.approved_at,
    };

    const newBulkUsage = bulkMeterWithUpdates.currentReading - bulkMeterWithUpdates.previousReading;
  const { totalBill: newTotalBulkBill } = await computeBillLocal(
        newBulkUsage,
        bulkMeterWithUpdates.chargeGroup as CustomerType,
        bulkMeterWithUpdates.sewerageConnection,
        Number(bulkMeterWithUpdates.meterSize),
        bulkMeterWithUpdates.month
    );

    updatePayload.bulk_usage = newBulkUsage;
    updatePayload.total_bulk_bill = newTotalBulkBill;

    const allIndividualCustomers = getCustomers();
    const associatedCustomers = allIndividualCustomers.filter(c => c.assignedBulkMeterId === bulkMeterWithUpdates.customerKeyNumber);
    
    const sumIndividualUsage = associatedCustomers.reduce((acc, cust) => acc + ((cust.currentReading ?? 0) - (cust.previousReading ?? 0)), 0);
    
    const newDifferenceUsage = newBulkUsage - sumIndividualUsage;
    updatePayload.difference_usage = newDifferenceUsage;
    
  const { totalBill: newDifferenceBill } = await computeBillLocal(
        newDifferenceUsage,
        bulkMeterWithUpdates.chargeGroup as CustomerType,
        bulkMeterWithUpdates.sewerageConnection,
        Number(bulkMeterWithUpdates.meterSize),
        bulkMeterWithUpdates.month
    );
    updatePayload.difference_bill = newDifferenceBill;
    
    return updatePayload;
};


const mapDbStaffToDomain = (dbStaff: StaffMemberRow & { roles?: { role_name: string } | null; role_name?: string }): StaffMember => ({
  id: dbStaff.id,
  name: dbStaff.name,
  email: dbStaff.email,
  password: dbStaff.password || undefined,
  branchName: dbStaff.branch,
  status: dbStaff.status,
  phone: dbStaff.phone || undefined,
  hireDate: dbStaff.hire_date || undefined,
  role: dbStaff.role_name || dbStaff.roles?.role_name || dbStaff.role, // Handle direct role_name from auth query
  roleId: dbStaff.role_id || undefined,
});

const mapDomainStaffToInsert = (staff: StaffMember): StaffMemberInsert => ({
  id: staff.id,
  name: staff.name,
  email: staff.email,
  password: staff.password,
  branch: staff.branchName,
  status: staff.status,
  phone: staff.phone,
  hire_date: staff.hireDate,
  role: staff.role,
  role_id: staff.roleId,
});

const mapDomainStaffToUpdate = (staff: Partial<Omit<StaffMember, 'id' | 'email'>>): Omit<StaffMemberUpdate, 'email'> => {
    const updatePayload: Omit<StaffMemberUpdate, 'email'> = {};
    if(staff.name !== undefined) updatePayload.name = staff.name;
    if(staff.branchName !== undefined) updatePayload.branch = staff.branchName;
    if(staff.status !== undefined) updatePayload.status = staff.status;
    if(staff.phone !== undefined) updatePayload.phone = staff.phone;
    if(staff.hireDate !== undefined) updatePayload.hire_date = staff.hireDate;
    if(staff.role !== undefined) updatePayload.role = staff.role;
    if(staff.roleId !== undefined) updatePayload.role_id = staff.roleId;
    if(staff.password !== undefined && staff.password) {
        updatePayload.password = staff.password;
    } else {
        delete updatePayload.password;
    }
    return updatePayload;
};


const mapDbBillToDomain = (dbBill: Bill): DomainBill => ({
  id: dbBill.id,
  individualCustomerId: dbBill.individual_customer_id,
  bulkMeterId: dbBill.bulk_meter_id,
  billPeriodStartDate: dbBill.bill_period_start_date,
  billPeriodEndDate: dbBill.bill_period_end_date,
  monthYear: dbBill.month_year,
  previousReadingValue: Number(dbBill.previous_reading_value),
  currentReadingValue: Number(dbBill.current_reading_value),
  usageM3: dbBill.usage_m3 ? Number(dbBill.usage_m3) : null,
  differenceUsage: dbBill.difference_usage ? Number(dbBill.difference_usage) : null,
  baseWaterCharge: Number(dbBill.base_water_charge),
  sewerageCharge: dbBill.sewerage_charge ? Number(dbBill.sewerage_charge) : null,
  maintenanceFee: dbBill.maintenance_fee ? Number(dbBill.maintenance_fee) : null,
  sanitationFee: dbBill.sanitation_fee ? Number(dbBill.sanitation_fee) : null,
  meterRent: dbBill.meter_rent ? Number(dbBill.meter_rent) : null,
  balanceCarriedForward: dbBill.balance_carried_forward ? Number(dbBill.balance_carried_forward) : null,
  totalAmountDue: Number(dbBill.total_amount_due),
  amountPaid: dbBill.amount_paid ? Number(dbBill.amount_paid) : undefined,
  balanceDue: dbBill.balance_due ? Number(dbBill.balance_due) : null,
  dueDate: dbBill.due_date,
  paymentStatus: dbBill.payment_status,
  billNumber: dbBill.bill_number,
  notes: dbBill.notes,
  createdAt: dbBill.created_at,
  updatedAt: dbBill.updated_at,
});

const mapDomainBillToDb = (bill: Partial<DomainBill>): Partial<BillInsert | BillUpdate> => {
    const payload: Partial<BillInsert | BillUpdate> = {};
    if (bill.individualCustomerId !== undefined) payload.individual_customer_id = bill.individualCustomerId;
    if (bill.bulkMeterId !== undefined) payload.bulk_meter_id = bill.bulkMeterId;
    if (bill.billPeriodStartDate !== undefined) payload.bill_period_start_date = bill.billPeriodStartDate;
    if (bill.billPeriodEndDate !== undefined) payload.bill_period_end_date = bill.billPeriodEndDate;
    if (bill.monthYear !== undefined) payload.month_year = bill.monthYear;
    if (bill.previousReadingValue !== undefined) payload.previous_reading_value = bill.previousReadingValue;
    if (bill.currentReadingValue !== undefined) payload.current_reading_value = bill.currentReadingValue;
    if (bill.usageM3 !== undefined) payload.usage_m3 = bill.usageM3;
    if (bill.differenceUsage !== undefined) payload.difference_usage = bill.differenceUsage;
    if (bill.baseWaterCharge !== undefined) payload.base_water_charge = bill.baseWaterCharge;
    if (bill.sewerageCharge !== undefined) payload.sewerage_charge = bill.sewerageCharge;
    if (bill.maintenanceFee !== undefined) payload.maintenance_fee = bill.maintenanceFee;
    if (bill.sanitationFee !== undefined) payload.sanitation_fee = bill.sanitationFee;
    if (bill.meterRent !== undefined) payload.meter_rent = bill.meterRent;
    if (bill.balanceCarriedForward !== undefined) payload.balance_carried_forward = bill.balanceCarriedForward;
    if (bill.totalAmountDue !== undefined) payload.total_amount_due = bill.totalAmountDue;
    if (bill.amountPaid !== undefined) payload.amount_paid = bill.amountPaid;
    if (bill.dueDate !== undefined) payload.due_date = bill.dueDate;
    if (bill.paymentStatus !== undefined) payload.payment_status = bill.paymentStatus;
    if (bill.billNumber !== undefined) payload.bill_number = bill.billNumber;
    if (bill.notes !== undefined) payload.notes = bill.notes;
    return payload;
};

const mapDbIndividualReadingToDomain = (dbReading: IndividualCustomerReading): DomainIndividualCustomerReading => ({
  id: dbReading.id,
  individualCustomerId: dbReading.individual_customer_id,
  readerStaffId: dbReading.reader_staff_id,
  readingDate: dbReading.reading_date,
  monthYear: dbReading.month_year,
  readingValue: Number(dbReading.reading_value),
  isEstimate: dbReading.is_estimate,
  notes: dbReading.notes,
  createdAt: dbReading.created_at,
  updatedAt: dbReading.updated_at,
});

const mapDomainIndividualReadingToDb = (mr: Partial<DomainIndividualCustomerReading>): Partial<IndividualCustomerReadingInsert | IndividualCustomerReadingUpdate> => {
    const payload: Partial<IndividualCustomerReadingInsert | IndividualCustomerReadingUpdate> = {};
    if (mr.individualCustomerId !== undefined) payload.individual_customer_id = mr.individualCustomerId;
    if (mr.readerStaffId !== undefined) payload.reader_staff_id = mr.readerStaffId;
    if (mr.readingDate !== undefined) payload.reading_date = mr.readingDate;
    if (mr.monthYear !== undefined) payload.month_year = mr.monthYear;
    if (mr.readingValue !== undefined) payload.reading_value = mr.readingValue;
    if (mr.isEstimate !== undefined) payload.is_estimate = mr.isEstimate;
    if (mr.notes !== undefined) payload.notes = mr.notes;
    return payload;
};

const mapDbBulkReadingToDomain = (dbReading: BulkMeterReading): DomainBulkMeterReading => ({
  id: dbReading.id,
  bulkMeterId: dbReading.bulk_meter_id,
  readerStaffId: dbReading.reader_staff_id,
  readingDate: dbReading.reading_date,
  monthYear: dbReading.month_year,
  readingValue: Number(dbReading.reading_value),
  isEstimate: dbReading.is_estimate,
  notes: dbReading.notes,
  createdAt: dbReading.created_at,
  updatedAt: dbReading.updated_at,
});

const mapDomainBulkReadingToDb = (mr: Partial<DomainBulkMeterReading>): Partial<BulkMeterReadingInsert | BulkMeterReadingUpdate> => {
    const payload: Partial<BulkMeterReadingInsert | BulkMeterReadingUpdate> = {};
    if (mr.bulkMeterId !== undefined) payload.bulk_meter_id = mr.bulkMeterId;
    if (mr.readerStaffId !== undefined) payload.reader_staff_id = mr.readerStaffId;
    if (mr.readingDate !== undefined) payload.reading_date = mr.readingDate;
    if (mr.monthYear !== undefined) payload.month_year = mr.monthYear;
    if (mr.readingValue !== undefined) payload.reading_value = mr.readingValue;
    if (mr.isEstimate !== undefined) payload.is_estimate = mr.isEstimate;
    if (mr.notes !== undefined) payload.notes = mr.notes;
    return payload;
};

const mapDbPaymentToDomain = (dbPayment: Payment): DomainPayment => ({
  id: dbPayment.id,
  billId: dbPayment.bill_id,
  individualCustomerId: dbPayment.individual_customer_id,
  paymentDate: dbPayment.payment_date,
  amountPaid: Number(dbPayment.amount_paid),
  paymentMethod: dbPayment.payment_method,
  transactionReference: dbPayment.transaction_reference,
  processedByStaffId: dbPayment.processed_by_staff_id,
  notes: dbPayment.notes,
  createdAt: dbPayment.created_at,
  updatedAt: dbPayment.updated_at,
});

const mapDomainPaymentToDb = (p: Partial<DomainPayment>): Partial<PaymentInsert | PaymentUpdate> => {
    const payload: Partial<PaymentInsert | PaymentUpdate> = {};
    if (p.billId !== undefined) payload.bill_id = p.billId;
    if (p.individualCustomerId !== undefined) payload.individual_customer_id = p.individualCustomerId;
    if (p.paymentDate !== undefined) payload.payment_date = p.paymentDate;
    if (p.amountPaid !== undefined) payload.amount_paid = p.amountPaid;
    if (p.paymentMethod !== undefined) payload.payment_method = p.paymentMethod;
    if (p.transactionReference !== undefined) payload.transaction_reference = p.transactionReference;
    if (p.processedByStaffId !== undefined) payload.processed_by_staff_id = p.processedByStaffId;
    if (p.notes !== undefined) payload.notes = p.notes;
    return payload;
};

const mapDbReportLogToDomain = (dbLog: ReportLog): DomainReportLog => ({
  id: dbLog.id,
  reportName: dbLog.report_name,
  description: dbLog.description,
  generatedAt: dbLog.generated_at,
  generatedByStaffId: dbLog.generated_by_staff_id,
  parameters: dbLog.parameters,
  fileFormat: dbLog.file_format,
  fileName: dbLog.file_name,
  status: dbLog.status,
  createdAt: dbLog.created_at,
  updatedAt: dbLog.updated_at,
});

const mapDomainReportLogToDb = (rl: Partial<DomainReportLog>): Partial<ReportLogInsert | ReportLogUpdate> => {
    const payload: Partial<ReportLogInsert | ReportLogUpdate> = {};
    if (rl.reportName !== undefined) payload.report_name = rl.reportName;
    if (rl.description !== undefined) payload.description = rl.description;
    if (rl.generatedByStaffId !== undefined) payload.generated_by_staff_id = rl.generatedByStaffId;
    if (rl.parameters !== undefined) payload.parameters = rl.parameters;
    if (rl.fileFormat !== undefined) payload.file_format = rl.fileFormat;
    if (rl.fileName !== undefined) payload.file_name = rl.fileName;
    if (rl.status !== undefined) payload.status = rl.status;
    return payload;
};

const mapDbKnowledgeBaseArticleToDomain = (dbArticle: KnowledgeBaseArticleRow): KnowledgeBaseArticle => ({
    id: dbArticle.id,
    created_at: dbArticle.created_at,
    title: dbArticle.title,
    content: dbArticle.content,
    category: dbArticle.category || undefined,
});

async function fetchAllTariffs() {
    const { data, error } = await getAllTariffsAction();
    if (data) {
        tariffs = data;
        notifyTariffListeners();
    } else {
        console.error("DataStore: Failed to fetch tariffs. Database error:", JSON.stringify(error, null, 2));
    }
    tariffsFetched = true;
    return tariffs;
}


async function fetchAllBranches() {
  const { data, error } = await getAllBranchesAction();
  if (data) {
    branches = data.map(mapDbBranchToDomain);
    notifyBranchListeners();
  } else {
    console.error("DataStore: Failed to fetch branches. Database error:", JSON.stringify(error, null, 2));
  }
  branchesFetched = true;
  return branches;
}

async function fetchAllCustomers() {
  const { data, error } = await getAllCustomersAction();
  if (data) {
    customers = await Promise.all(data.map(mapDbCustomerToDomain));
    notifyCustomerListeners();
  } else {
    console.error("DataStore: Failed to fetch customers. Database error:", JSON.stringify(error, null, 2));
  }
  customersFetched = true;
  return customers;
}

async function fetchAllBulkMeters() {
  const { data: rawBulkMeters, error: fetchError } = await getAllBulkMetersAction();

  if (fetchError) {
    console.error("DataStore: Failed to fetch bulk meters. Database error:", JSON.stringify(fetchError, null, 2));
    bulkMetersFetched = true;
    return [];
  }

  if (!rawBulkMeters) {
    bulkMeters = [];
    notifyBulkMeterListeners();
    bulkMetersFetched = true;
    return [];
  }

  let processedBulkMeters = rawBulkMeters;
  
  if (!customersFetched) { 
    await initializeCustomers();
  }
  
  const updatedRowsFromBackfill: BulkMeterRow[] = [];
  let backfillPerformed = false;

  for (const dbBulkMeter of rawBulkMeters) {
    if (
      dbBulkMeter.bulk_usage === null ||
      dbBulkMeter.total_bulk_bill === null ||
      dbBulkMeter.difference_usage === null ||
      dbBulkMeter.difference_bill === null
    ) {
      backfillPerformed = true;
      const currentReading = Number(dbBulkMeter.currentReading) || 0;
      const previousReading = Number(dbBulkMeter.previousReading) || 0;

      const calculatedBulkUsage = currentReading - previousReading;
  const { totalBill: calculatedTotalBulkBill } = await computeBillLocal(calculatedBulkUsage, dbBulkMeter.charge_group || 'Non-domestic', dbBulkMeter.sewerage_connection || 'No', Number(dbBulkMeter.meterSize), dbBulkMeter.month);

      const associatedCustomersData = getCustomers().filter(c => c.assignedBulkMeterId === dbBulkMeter.customerKeyNumber);
      const sumIndividualUsage = associatedCustomersData.reduce((acc, cust) => acc + ((cust.currentReading ?? 0) - (cust.previousReading ?? 0)), 0);
      
      const calculatedDifferenceUsage = calculatedBulkUsage - sumIndividualUsage;
  const { totalBill: calculatedDifferenceBill } = await computeBillLocal(calculatedDifferenceUsage, dbBulkMeter.charge_group || 'Non-domestic', dbBulkMeter.sewerage_connection || 'No', Number(dbBulkMeter.meterSize), dbBulkMeter.month);


      const updatePayload: BulkMeterUpdate = {
        bulk_usage: calculatedBulkUsage,
        total_bulk_bill: calculatedTotalBulkBill,
        difference_usage: calculatedDifferenceUsage,
        difference_bill: calculatedDifferenceBill,
      };

      const { data: updatedRow, error: updateError } = await updateBulkMeterAction(dbBulkMeter.customerKeyNumber, updatePayload);
      if (updateError) {
        console.error(`DataStore: Failed to backfill bulk meter ${dbBulkMeter.customerKeyNumber}. Error:`, JSON.stringify(updateError, null, 2));
        updatedRowsFromBackfill.push(dbBulkMeter); 
      } else if (updatedRow) {
        updatedRowsFromBackfill.push(updatedRow); 
      } else {
        updatedRowsFromBackfill.push(dbBulkMeter);
      }
    } else {
      updatedRowsFromBackfill.push(dbBulkMeter); 
    }
  }
  if (backfillPerformed) {
      processedBulkMeters = updatedRowsFromBackfill; 
  }
  
  bulkMeters = await Promise.all(processedBulkMeters.map(mapDbBulkMeterToDomain));
  notifyBulkMeterListeners();
  bulkMetersFetched = true;
  return bulkMeters;
}


async function fetchAllStaffMembers() {
  const { data, error } = await getAllStaffMembersAction();
  if (data) {
    staffMembers = data.map(mapDbStaffToDomain);
    notifyStaffMemberListeners();
  } else {
    console.error("DataStore: Failed to fetch staff members. Database error:", JSON.stringify(error, null, 2));
  }
  staffMembersFetched = true;
  return staffMembers;
}

async function fetchAllBills() {
    const { data, error } = await getAllBillsAction();
    if (data) {
        bills = data.map(mapDbBillToDomain);
        notifyBillListeners();
    } else {
        console.error("DataStore: Failed to fetch bills. Database error:", JSON.stringify(error, null, 2));
    }
    billsFetched = true;
    return bills;
}

async function fetchAllIndividualCustomerReadings() {
    const { data, error } = await getAllIndividualCustomerReadingsAction();
    if (data) {
        individualCustomerReadings = data.map(mapDbIndividualReadingToDomain);
        notifyIndividualCustomerReadingListeners();
    } else {
        console.error("DataStore: Failed to fetch individual customer readings. Database error:", JSON.stringify(error, null, 2));
    }
    individualCustomerReadingsFetched = true;
    return individualCustomerReadings;
}

async function fetchAllBulkMeterReadings() {
    const { data, error } = await getAllBulkMeterReadingsAction();
    if (data) {
        bulkMeterReadings = data.map(mapDbBulkReadingToDomain);
        notifyBulkMeterReadingListeners();
    } else {
        console.error("DataStore: Failed to fetch bulk meter readings. Database error:", JSON.stringify(error, null, 2));
    }
    bulkMeterReadingsFetched = true;
    return bulkMeterReadings;
}

async function fetchAllPayments() {
    const { data, error } = await getAllPaymentsAction();
    if (data) {
        payments = data.map(mapDbPaymentToDomain);
        notifyPaymentListeners();
    } else {
        console.error("DataStore: Failed to fetch payments. Database error:", JSON.stringify(error, null, 2));
    }
    paymentsFetched = true;
    return payments;
}

async function fetchAllReportLogs() {
    const { data, error } = await getAllReportLogsAction();
    if (data) {
        reportLogs = data.map(mapDbReportLogToDomain);
        notifyReportLogListeners();
    } else {
        console.error("DataStore: Failed to fetch report logs. Database error:", JSON.stringify(error, null, 2));
    }
    reportLogsFetched = true;
    return reportLogs;
}

async function fetchAllNotifications() {
  const { data, error } = await getAllNotificationsAction();
  if (data) {
    notifications = data.map(mapDbNotificationToDomain);
    notifyNotificationListeners();
  } else {
    console.error("DataStore: Failed to fetch notifications. Database error:", JSON.stringify(error, null, 2));
  }
  notificationsFetched = true;
  return notifications;
}

async function fetchAllRoles() {
  const { data, error } = await getAllRolesAction();
  if (data) {
    roles = data;
    notifyRoleListeners();
  } else {
    console.error("DataStore: Failed to fetch roles. Database error:", JSON.stringify(error, null, 2));
  }
  rolesFetched = true;
  return roles;
}

async function fetchAllPermissions() {
  const { data, error } = await getAllPermissionsAction();
  if (data) {
    permissions = data;
    notifyPermissionListeners();
  } else {
    console.error("DataStore: Failed to fetch permissions. Database error:", JSON.stringify(error, null, 2));
  }
  permissionsFetched = true;
  return permissions;
}

async function fetchAllRolePermissions() {
  const { data, error } = await getAllRolePermissionsAction();
  if (data) {
    rolePermissions = data;
    notifyRolePermissionListeners();
  } else {
    console.error("DataStore: Failed to fetch role permissions. Database error:", JSON.stringify(error, null, 2));
  }
  rolePermissionsFetched = true;
  return rolePermissions;
}

async function fetchAllKnowledgeBaseArticles() {
  const { data, error } = await getAllKnowledgeBaseArticlesAction();
  if (error) {
    console.error("DataStore: Failed to fetch knowledge base articles. Error:", error);
    knowledgeBaseArticles = [];
  } else {
    knowledgeBaseArticles = data.map(mapDbKnowledgeBaseArticleToDomain);
  }
  notifyKnowledgeBaseArticleListeners();
  knowledgeBaseArticlesFetched = true;
  return knowledgeBaseArticles;
}

export async function initializeKnowledgeBaseArticles() {
  if (!knowledgeBaseArticlesFetched) {
    await fetchAllKnowledgeBaseArticles();
  }
}

export const getKnowledgeBaseArticles = (): KnowledgeBaseArticle[] => [...knowledgeBaseArticles];

export const addKnowledgeBaseArticle = async (article: KnowledgeBaseArticleInsert): Promise<StoreOperationResult<KnowledgeBaseArticle>> => {
  const { data, error } = await createKnowledgeBaseArticleAction(article);
  if (!error && data) {
    const newArticle = mapDbKnowledgeBaseArticleToDomain(data);
    knowledgeBaseArticles = [newArticle, ...knowledgeBaseArticles];
    notifyKnowledgeBaseArticleListeners();
    return { success: true, data: newArticle };
  }
  return { success: false, message: error?.message || "Failed to add article." };
};

export const updateKnowledgeBaseArticle = async (id: number, article: KnowledgeBaseArticleUpdate): Promise<StoreOperationResult<KnowledgeBaseArticle>> => {
  const { data, error } = await updateKnowledgeBaseArticleAction(id, article);
  if (!error && data) {
    const updatedArticle = mapDbKnowledgeBaseArticleToDomain(data);
    knowledgeBaseArticles = knowledgeBaseArticles.map(a => a.id === id ? updatedArticle : a);
    notifyKnowledgeBaseArticleListeners();
    return { success: true, data: updatedArticle };
  }
  return { success: false, message: error?.message || "Failed to update article." };
};

export const deleteKnowledgeBaseArticle = async (id: number): Promise<StoreOperationResult<void>> => {
  const { error } = await deleteKnowledgeBaseArticleAction(id);
  if (!error) {
    knowledgeBaseArticles = knowledgeBaseArticles.filter(a => a.id !== id);
    notifyKnowledgeBaseArticleListeners();
    return { success: true };
  }
  return { success: false, message: error.message };
};

export const subscribeToKnowledgeBaseArticles = (listener: Listener<KnowledgeBaseArticle>): (() => void) => {
  knowledgeBaseArticleListeners.add(listener);
  if (knowledgeBaseArticlesFetched) listener([...knowledgeBaseArticles]);
  else initializeKnowledgeBaseArticles().then(() => listener([...knowledgeBaseArticles]));
  return () => knowledgeBaseArticleListeners.delete(listener);
};



export const initializeBranches = async () => {
  if (!branchesFetched || branches.length === 0) {
    await fetchAllBranches();
  }
};

export const initializeCustomers = async () => {
  if (!customersFetched || customers.length === 0) {
    await fetchAllCustomers();
  }
};

export const initializeBulkMeters = async () => {
  if (!bulkMetersFetched || bulkMeters.length === 0) { 
    await fetchAllBulkMeters();
  }
};

export const initializeStaffMembers = async () => {
  if (!staffMembersFetched || staffMembers.length === 0) {
    await fetchAllStaffMembers();
  }
};

export const initializeBills = async () => {
    if (!billsFetched || bills.length === 0) await fetchAllBills();
};
export const initializeIndividualCustomerReadings = async () => {
    if (!individualCustomerReadingsFetched || individualCustomerReadings.length === 0) await fetchAllIndividualCustomerReadings();
};
export const initializeBulkMeterReadings = async () => {
    if (!bulkMeterReadingsFetched || bulkMeterReadings.length === 0) await fetchAllBulkMeterReadings();
};
export const initializePayments = async () => {
    if (!paymentsFetched || payments.length === 0) await fetchAllPayments();
};
export const initializeReportLogs = async () => {
    if (!reportLogsFetched || reportLogs.length === 0) await fetchAllReportLogs();
};

export const initializeNotifications = async () => {
  if (!notificationsFetched) {
    await fetchAllNotifications();
  }
};

export const initializeRoles = async () => {
  if (!rolesFetched) {
    await fetchAllRoles();
  }
};

export const initializePermissions = async () => {
  if (!permissionsFetched) {
    await fetchAllPermissions();
  }
};

export const initializeRolePermissions = async () => {
  if (!rolePermissionsFetched) {
    await fetchAllRolePermissions();
  }
};

export const initializeTariffs = async () => {
    if (!tariffsFetched) {
        await fetchAllTariffs();
    }
    return tariffs;
};

export const getTariff = (customerType: CustomerType, year: number): TariffInfo | undefined => {
  if (tariffs.length === 0) {
    // Tariffs not yet loaded — caller should initialize tariffs before using getTariff.
    console.warn("DataStore: getTariff called but tariffs array is empty. This indicates tariffs haven't been initialized yet.");
    return undefined;
  }
    const tariff = tariffs.find(t => t.customer_type === customerType && t.year === year);
    if (!tariff) {
        console.warn(`DataStore: No tariff found for customer type "${customerType}" and year "${year}" in the local store.`);
        return undefined;
    }
    
    // Safely parse JSON fields which might be strings from the database.
    const parseJsonField = (field: any, fieldName: string) => {
        if (field === null || field === undefined) return fieldName.includes('tiers') ? [] : {};
        if (typeof field === 'object') return field;
        if (typeof field === 'string') {
            try { return JSON.parse(field); } catch (e) {
                console.error(`Failed to parse JSON for ${fieldName} from data-store for tariff ${customerType}/${year}`, e);
                return fieldName.includes('tiers') ? [] : {};
            }
        }
        return fieldName.includes('tiers') ? [] : {};
    };

  return {
    customer_type: tariff.customer_type as CustomerType,
    year: tariff.year,
    tiers: parseJsonField(tariff.tiers, 'tiers'),
    maintenance_percentage: tariff.maintenance_percentage,
    sanitation_percentage: tariff.sanitation_percentage,
    sewerage_tiers: parseJsonField(tariff.sewerage_tiers, 'sewerage_tiers'),
    meter_rent_prices: parseJsonField(tariff.meter_rent_prices, 'meter_rent_prices'),
        vat_rate: tariff.vat_rate,
        domestic_vat_threshold_m3: tariff.domestic_vat_threshold_m3,
    };
};



export const getBranches = (): DomainBranch[] => [...branches];
export const getCustomers = (): DomainIndividualCustomer[] => [...customers];
export const getBulkMeters = (): BulkMeter[] => [...bulkMeters];
export const getStaffMembers = (): StaffMember[] => [...staffMembers];
export const getBills = (): DomainBill[] => [...bills];
export const getIndividualCustomerReadings = (): DomainIndividualCustomerReading[] => [...individualCustomerReadings];
export const getBulkMeterReadings = (): DomainBulkMeterReading[] => [...bulkMeterReadings];
export const getNotifications = (): DomainNotification[] => [...notifications];
export const getRoles = (): DomainRole[] => [...roles];
export const getPermissions = (): DomainPermission[] => [...permissions];
export const getRolePermissions = (): DomainRolePermission[] => [...rolePermissions];

export function getMeterReadings(): (DomainIndividualCustomerReading | DomainBulkMeterReading)[] {
    const allReadings = [
        ...individualCustomerReadings.map(r => ({ ...r, meterType: 'individual_customer_meter' })),
        ...bulkMeterReadings.map(r => ({ ...r, meterType: 'bulk_meter' }))
    ];
    return allReadings.sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());
}

export const getPayments = (): DomainPayment[] => [...payments];
export const getReportLogs = (): DomainReportLog[] => [...reportLogs];

export const getBulkMeterPaymentStatusCounts = (): { totalBMs: number; paidBMs: number; unpaidBMs: number } => {
  const totalBMs = bulkMeters.length;
  const paidBMs = bulkMeters.filter(bm => bm.paymentStatus === 'Paid').length;
  const unpaidBMs = totalBMs - paidBMs;
  return { totalBMs, paidBMs, unpaidBMs };
};

export const addBranch = async (branchData: Omit<DomainBranch, 'id'>): Promise<StoreOperationResult<DomainBranch>> => {
  const payload = mapDomainBranchToInsert(branchData);
  const { data: newDbBranch, error } = await createBranchAction(payload);
  if (newDbBranch && !error) {
    const newBranch = mapDbBranchToDomain(newDbBranch);
    branches = [newBranch, ...branches];
    notifyBranchListeners();
    return { success: true, data: newBranch };
  }
  console.error("DataStore: Failed to add branch. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: error?.message || "Failed to add branch.", error };
};

export const updateBranch = async (id: string, branchData: Partial<Omit<DomainBranch, 'id'>>): Promise<StoreOperationResult<void>> => {
  const updatePayload = mapDomainBranchToUpdate(branchData);
  const { data: updatedDbBranch, error } = await updateBranchAction(id, updatePayload);
  if (updatedDbBranch && !error) {
    const updatedBranch = mapDbBranchToDomain(updatedDbBranch);
    branches = branches.map(b => b.id === id ? updatedBranch : b);
    notifyBranchListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to update branch. Error:", JSON.stringify(error, null, 2));
  let userMessage = "Failed to update branch.";
  let isNotFoundError = false;
  if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
    userMessage = "Failed to update branch: Record not found.";
    isNotFoundError = true;
  } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    userMessage = `Failed to update branch: ${error.message}`;
  }
  return { success: false, message: userMessage, isNotFoundError, error };
};

export const deleteBranch = async (branchId: string): Promise<StoreOperationResult<void>> => {
  const { error } = await deleteBranchAction(branchId);
  if (!error) {
    branches = branches.filter(b => b.id !== branchId);
    notifyBranchListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to delete branch. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to delete branch.", error };
};

export const addCustomer = async (
  customerData: Partial<DomainIndividualCustomer>,
  currentUser: StaffMember
): Promise<StoreOperationResult<DomainIndividualCustomer>> => {
    // Check if customer with the same key already exists
    const existingCustomer = customers.find(c => c.customerKeyNumber === customerData.customerKeyNumber);
    if (existingCustomer) {
        return { success: false, message: `Customer with key '${customerData.customerKeyNumber}' already exists.` };
    }

  const userRole = currentUser?.role?.toLowerCase();
  const finalStatus: IndividualCustomerStatus = (userRole === 'staff' || userRole === 'staff management')
    ? 'Pending Approval'
    : 'Active';

  const customerDataWithStatus = { ...customerData, status: finalStatus };
  const customerPayload = await mapDomainCustomerToInsert(customerDataWithStatus);

  const { data: newDbCustomer, error } = await createCustomerAction(customerPayload);

  if (newDbCustomer && !error) {
    const newCustomer = await mapDbCustomerToDomain(newDbCustomer);
    customers.push(newCustomer);
    notifyCustomerListeners();
    return { success: true, data: newCustomer };
  }
  
  if (error && (error as any).code === '23505') { 
      return { success: false, message: `Customer with key '${customerData.customerKeyNumber}' already exists.`, error };
  }
  
  console.error("DataStore: Failed to add customer. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: error?.message || "Failed to add customer.", error };
};


export const updateCustomer = async (customerKeyNumber: string, customerData: Partial<Omit<DomainIndividualCustomer, 'customerKeyNumber'>>): Promise<StoreOperationResult<void>> => {
    const existingCustomer = customers.find(c => c.customerKeyNumber === customerKeyNumber);
    if (!existingCustomer) {
        return { success: false, message: "Customer not found to update.", isNotFoundError: true };
    }

    // Create a complete, updated domain object by merging the new data with existing data.
    const updatedDomainCustomer: DomainIndividualCustomer = {
        ...existingCustomer,
        ...customerData,
    };

    const updatePayloadDb = await mapDomainCustomerToUpdate(updatedDomainCustomer);

    const { data: updatedDbCustomer, error } = await updateCustomerAction(customerKeyNumber, updatePayloadDb);

    if (updatedDbCustomer && !error) {
        const updatedCustomer = await mapDbCustomerToDomain(updatedDbCustomer);
        customers = customers.map(c => c.customerKeyNumber === customerKeyNumber ? updatedCustomer : c);
        notifyCustomerListeners();
        return { success: true };
    } else {
        console.error("DataStore: Failed to update customer. Original error object:", JSON.stringify(error, null, 2));
        let userMessage = "Failed to update customer due to an unexpected error.";
        let isNotFoundError = false;
        if (error && typeof error === 'object') {
            const dbError = error as any;
            if (dbError.code === 'PGRST204') {
                userMessage = "Failed to update customer: Record not found. It may have been deleted.";
                isNotFoundError = true;
            } else if (dbError.message) {
                userMessage = `Failed to update customer: ${dbError.message}`;
            }
        }
        return { success: false, message: userMessage, isNotFoundError, error };
    }
};

export const deleteCustomer = async (customerKeyNumber: string): Promise<StoreOperationResult<void>> => {
  const { error } = await deleteCustomerAction(customerKeyNumber);
  if (!error) {
    customers = customers.filter(c => c.customerKeyNumber !== customerKeyNumber);
    notifyCustomerListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to delete customer. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to delete customer.", error };
};

export const addBulkMeter = async (
    bulkMeterDomainData: Partial<BulkMeter>,
    currentUser: StaffMember
): Promise<StoreOperationResult<BulkMeter>> => {
    // Check if bulk meter with the same key already exists
    const existingBulkMeter = bulkMeters.find(bm => bm.customerKeyNumber === bulkMeterDomainData.customerKeyNumber);
    if (existingBulkMeter) {
        return { success: false, message: `Bulk meter with key '${bulkMeterDomainData.customerKeyNumber}' already exists.` };
    }

  const userRole = currentUser?.role?.toLowerCase();
  const finalStatus = (userRole === 'staff' || userRole === 'staff management')
      ? 'Pending Approval'
      : 'Active';

  const bulkMeterPayload = await mapDomainBulkMeterToInsert({ ...bulkMeterDomainData, status: finalStatus });
  
  const { data: newDbBulkMeter, error } = await createBulkMeterAction(bulkMeterPayload);
  if (newDbBulkMeter && !error) {
    const newBulkMeter = await mapDbBulkMeterToDomain(newDbBulkMeter);
    bulkMeters = [newBulkMeter, ...bulkMeters];
    notifyBulkMeterListeners();
    return { success: true, data: newBulkMeter };
  }
  
  if (error && (error as any).code === '23505') { 
      return { success: false, message: `Bulk Meter with key '${bulkMeterDomainData.customerKeyNumber}' already exists.`, error };
  }

  console.error("DataStore: Failed to add bulk meter. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to add bulk meter.", error };
};

export const updateBulkMeter = async (customerKeyNumber: string, bulkMeterData: Partial<Omit<BulkMeter, 'customerKeyNumber'>>): Promise<StoreOperationResult<BulkMeter>> => {
    const existingBulkMeter = bulkMeters.find(bm => bm.customerKeyNumber === customerKeyNumber);
    if (!existingBulkMeter) {
        return { success: false, message: "Bulk meter not found to update.", isNotFoundError: true };
    }

    const updatedDomainBulkMeter: BulkMeter = {
        ...existingBulkMeter,
        ...bulkMeterData,
    };
    
    const updatePayloadToSend = await mapDomainBulkMeterToUpdate(updatedDomainBulkMeter);
    const { data: updatedDbBulkMeter, error } = await updateBulkMeterAction(customerKeyNumber, updatePayloadToSend);
    
    if (updatedDbBulkMeter && !error) {
        const updatedBulkMeter = await mapDbBulkMeterToDomain(updatedDbBulkMeter);
        bulkMeters = bulkMeters.map(bm => bm.customerKeyNumber === customerKeyNumber ? updatedBulkMeter : bm);
        notifyBulkMeterListeners();
        return { success: true, data: updatedBulkMeter };
    }
    
    console.error("DataStore: Failed to update bulk meter. Error:", JSON.stringify(error, null, 2));
    let userMessage = "Failed to update bulk meter.";
    let isNotFoundError = false;
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
        userMessage = "Failed to update bulk meter: Record not found.";
        isNotFoundError = true;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        userMessage = `Failed to update bulk meter: ${error.message}`;
    }
    return { success: false, message: userMessage, isNotFoundError, error };
};

export const deleteBulkMeter = async (customerKeyNumber: string): Promise<StoreOperationResult<void>> => {
  const { error } = await deleteBulkMeterAction(customerKeyNumber);
  if (!error) {
    bulkMeters = bulkMeters.filter(bm => bm.customerKeyNumber !== customerKeyNumber);
    notifyBulkMeterListeners();
    return { success: true };
  }
  console.error("DataStore: Failed to delete bulk meter. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to delete bulk meter.", error };
};

export const addStaffMember = async (staffData: Omit<StaffMember, 'id'> & {id?: string}): Promise<StoreOperationResult<StaffMember>> => {
  if (!rolesFetched) {
    await initializeRoles();
  }
  const role = roles.find(r => r.role_name === staffData.role);
  if (!role) {
    return { success: false, message: `Role '${staffData.role}' not found.` };
  }
  
  const staffDataWithRoleId = { ...staffData, roleId: role.id };
  const payload = mapDomainStaffToInsert(staffDataWithRoleId as StaffMember);

  const { data: newDbStaff, error } = await createStaffMemberAction(payload);
  
  if (error) {
    // Check for unique constraint violation
    if ((error as any).code === '23505' && (error as any).message.includes('staff_members_email_key')) {
      return { success: false, message: `A staff member with the email '${staffData.email}' already exists.` };
    }
    // Generic error handling
    console.error("DataStore: Failed to add staff member. Error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add staff member.", error };
  }

  if (newDbStaff) {
    const newStaff = mapDbStaffToDomain(newDbStaff);
    staffMembers = [newStaff, ...staffMembers];
    notifyStaffMemberListeners();
    return { success: true, data: newStaff };
  }
  
  return { success: false, message: "An unknown error occurred while adding the staff member." };
};


export const updateStaffMember = async (email: string, updatedStaffData: Partial<Omit<StaffMember, 'id' | 'email'>>): Promise<StoreOperationResult<void>> => {
  const staffUpdateDataWithRoleId: Partial<StaffMember> = { ...updatedStaffData };

  // If a role name is being updated, find its ID.
  if (updatedStaffData.role) {
    if (!rolesFetched) {
      await initializeRoles();
    }
    const role = roles.find(r => r.role_name === updatedStaffData.role);
    if (!role) {
      return { success: false, message: `Role '${updatedStaffData.role}' not found.` };
    }
    staffUpdateDataWithRoleId.roleId = role.id;
  }

  const staffUpdatePayload = mapDomainStaffToUpdate(staffUpdateDataWithRoleId);
  const { data: updatedDbStaff, error } = await updateStaffMemberAction(email, staffUpdatePayload);

  if (updatedDbStaff && !error) {
    const updatedStaff = mapDbStaffToDomain(updatedDbStaff);
    staffMembers = staffMembers.map(s => (s.email === email ? updatedStaff : s));
    notifyStaffMemberListeners();
    return { success: true };
  }
  
  console.error("DataStore: Failed to update staff member. Error:", JSON.stringify(error, null, 2));
  return { success: false, message: (error as any)?.message || "Failed to update staff member.", error };
};


export const deleteStaffMember = async (email: string): Promise<StoreOperationResult<void>> => {
  const { error } = await deleteStaffMemberAction(email);
  if (error) {
    console.error("DataStore: Failed to delete staff member profile.", error);
    return { success: false, message: (error as any)?.message || "Failed to delete staff profile." };
  }
  
  staffMembers = staffMembers.filter(s => s.email !== email);
  notifyStaffMemberListeners();
  return { success: true };
};

export const addBill = async (billData: Omit<DomainBill, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoreOperationResult<DomainBill>> => {
    const payload = mapDomainBillToDb(billData) as BillInsert;
    const { data: newDbBill, error } = await createBillAction(payload);
    if (newDbBill && !error) {
        const newBill = mapDbBillToDomain(newDbBill);
        bills = [newBill, ...bills];
        notifyBillListeners();
        return { success: true, data: newBill };
    }
    console.error("DataStore: Failed to add bill. Database error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add bill.", error };
};

export const updateExistingBill = async (id: string, billUpdateData: Partial<Omit<DomainBill, 'id'>>): Promise<StoreOperationResult<void>> => {
    const payload = mapDomainBillToDb(billUpdateData) as BillUpdate;
    const { data: updatedDbBill, error } = await updateBillAction(id, payload);
    if (updatedDbBill && !error) {
        const updatedBill = mapDbBillToDomain(updatedDbBill);
        bills = bills.map(b => b.id === id ? updatedBill : b);
        notifyBillListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to update bill. Database error:", JSON.stringify(error, null, 2));
    let userMessage = "Failed to update bill.";
    let isNotFoundError = false;
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
      userMessage = "Failed to update bill: Record not found.";
      isNotFoundError = true;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      userMessage = `Failed to update bill: ${error.message}`;
    }
    return { success: false, message: userMessage, isNotFoundError, error };
};

export const removeBill = async (billId: string): Promise<StoreOperationResult<void>> => {
    const { error } = await deleteBillAction(billId);
    if (!error) {
        bills = bills.filter(b => b.id !== billId);
        notifyBillListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to delete bill. Database error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to delete bill.", error };
};

export const addIndividualCustomerReading = async (readingData: Omit<DomainIndividualCustomerReading, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoreOperationResult<DomainIndividualCustomerReading>> => {
    const customer = customers.find(c => c.customerKeyNumber === readingData.individualCustomerId);
    if (!customer) {
        return { success: false, message: "Customer not found." };
    }
    if (readingData.readingValue < customer.currentReading) {
        return { success: false, message: `New reading (${readingData.readingValue}) cannot be lower than the current reading (${customer.currentReading}).` };
    }

    const payload = mapDomainIndividualReadingToDb(readingData) as IndividualCustomerReadingInsert;
    const { data: newDbReading, error: readingInsertError } = await createIndividualCustomerReadingAction(payload);

    if (readingInsertError || !newDbReading) {
        let userMessage = (readingInsertError as any)?.message || "Failed to add reading.";
        if (readingInsertError && (readingInsertError as any).message.includes('violates row-level security policy')) {
             userMessage = "Permission denied to add readings. Please check Row Level Security policies in the database.";
        }
        console.error("DataStore: Failed to add individual reading. Database error:", JSON.stringify(readingInsertError, null, 2));
        return { success: false, message: userMessage, error: readingInsertError };
    }

    const updateResult = await updateCustomer(customer.customerKeyNumber, { currentReading: newDbReading.reading_value, month: newDbReading.month_year });

    if (!updateResult.success) {
        await deleteIndividualCustomerReadingAction(newDbReading.id);
        const errorMessage = `Reading recorded, but failed to update the customer's main record. Error: ${updateResult.message}`;
        console.error(errorMessage, updateResult.error);
        return { success: false, message: errorMessage, error: updateResult.error };
    }
    
    const newReading = mapDbIndividualReadingToDomain(newDbReading);
    individualCustomerReadings = [newReading, ...individualCustomerReadings];
    notifyIndividualCustomerReadingListeners();

    return { success: true, data: newReading };
};

export const addBulkMeterReading = async (readingData: Omit<DomainBulkMeterReading, 'id' | 'createdAt' | 'updatedAt'>): Promise<StoreOperationResult<DomainBulkMeterReading>> => {
  const bulkMeter = bulkMeters.find(bm => bm.customerKeyNumber === readingData.bulkMeterId);
  if (!bulkMeter) {
    return { success: false, message: "Bulk meter not found." };
  }
  if (readingData.readingValue < bulkMeter.currentReading) {
    return { success: false, message: `New reading (${readingData.readingValue}) cannot be lower than the current reading (${bulkMeter.currentReading}).` };
  }

  const payload = mapDomainBulkReadingToDb(readingData) as BulkMeterReadingInsert;

  // Ensure there's an id for the reading (schema uses VARCHAR(36) id)
  if (!payload.id) {
    try {
      if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        payload.id = (crypto as any).randomUUID();
      } else {
        payload.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    } catch (e) {
      payload.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  const { data: newDbReading, error: readingInsertError } = await createBulkMeterReadingAction(payload);

  if (readingInsertError || !newDbReading) {
    let userMessage = (readingInsertError as any)?.message || "Failed to add reading.";
    if (readingInsertError && (readingInsertError as any).message && (readingInsertError as any).message.includes('violates row-level security policy')) {
      userMessage = "Permission denied to add readings. Please check Row Level Security policies in the database.";
    }
    // Try to surface useful DB error details when available
    const readable = readingInsertError && typeof readingInsertError === 'object' ? JSON.stringify(readingInsertError, Object.getOwnPropertyNames(readingInsertError), 2) : String(readingInsertError);
    console.error("DataStore: Failed to add bulk meter reading. Database error:", readable);
    return { success: false, message: userMessage, error: readingInsertError };
  }

  const updateResult = await updateBulkMeter(bulkMeter.customerKeyNumber, { currentReading: newDbReading.reading_value, month: newDbReading.month_year });

  if (!updateResult.success) {
    // Attempt cleanup using the id we generated or the returned id
    try { await deleteBulkMeterReadingAction(newDbReading?.id || payload.id); } catch (er) { console.error('Cleanup failed', er); }

    const errorMessage = `Failed to update the bulk meter's main record, so the new reading was discarded. Reason: ${updateResult.message}`;
    console.error(errorMessage, updateResult.error);
    return { success: false, message: errorMessage, error: updateResult.error };
  }

  const newReading = mapDbBulkReadingToDomain(newDbReading);
  bulkMeterReadings = [newReading, ...bulkMeterReadings];
  notifyBulkMeterReadingListeners();

  return { success: true, data: newReading };
};


export const addPayment = async (paymentData: Omit<DomainPayment, 'id'>): Promise<StoreOperationResult<DomainPayment>> => {
    const payload = mapDomainPaymentToDb(paymentData) as PaymentInsert;
    const { data: newDbPayment, error } = await createPaymentAction(payload);
    if (newDbPayment && !error) {
        const newPayment = mapDbPaymentToDomain(newDbPayment);
        payments = [newPayment, ...payments];
        notifyPaymentListeners();
        return { success: true, data: newPayment };
    }
    console.error("DataStore: Failed to add payment. Database error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add payment.", error };
};
export const updateExistingPayment = async (id: string, paymentUpdateData: Partial<Omit<DomainPayment, 'id'>>): Promise<StoreOperationResult<void>> => {
    const payload = mapDomainPaymentToDb(paymentUpdateData) as PaymentUpdate;
    const { data: updatedDbPayment, error } = await updatePaymentAction(id, payload);
    if (updatedDbPayment && !error) {
        const updatedPayment = mapDbPaymentToDomain(updatedDbPayment);
        payments = payments.map(p => p.id === id ? updatedPayment : p);
        notifyPaymentListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to update payment. Database error:", JSON.stringify(error, null, 2));
    let userMessage = "Failed to update payment.";
    let isNotFoundError = false;
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
      userMessage = "Failed to update payment: Record not found.";
      isNotFoundError = true;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      userMessage = `Failed to update payment: ${error.message}`;
    }
    return { success: false, message: userMessage, isNotFoundError, error };
};
export const removePayment = async (paymentId: string): Promise<StoreOperationResult<void>> => {
    const { error } = await deletePaymentAction(paymentId);
    if (!error) {
        payments = payments.filter(p => p.id !== paymentId);
        notifyPaymentListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to delete payment. Database error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to delete payment.", error };
};

export const addReportLog = async (logData: Omit<DomainReportLog, 'id' | 'generatedAt'> & { generatedAt?: string } ): Promise<StoreOperationResult<DomainReportLog>> => {
    const payload = mapDomainReportLogToDb(logData) as ReportLogInsert;
    if(!payload.generated_at) payload.generated_at = new Date().toISOString();
    const { data: newDbLog, error } = await createReportLogAction(payload);
    if (newDbLog && !error) {
        const newLog = mapDbReportLogToDomain(newDbLog);
        reportLogs = [newLog, ...reportLogs];
        notifyReportLogListeners();
        return { success: true, data: newLog };
    }
    console.error("DataStore: Failed to add report log. Database error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add report log.", error };
};
export const updateExistingReportLog = async (id: string, logUpdateData: Partial<Omit<DomainReportLog, 'id'>>): Promise<StoreOperationResult<void>> => {
    const payload = mapDomainReportLogToDb(logUpdateData) as ReportLogUpdate;
    const { data: updatedDbLog, error } = await updateReportLogAction(id, payload);
    if (updatedDbLog && !error) {
        const updatedLog = mapDbReportLogToDomain(updatedDbLog);
        reportLogs = reportLogs.map(l => l.id === id ? updatedLog : l);
        notifyReportLogListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to update report log. Database error:", JSON.stringify(error, null, 2));
    let userMessage = "Failed to update report log.";
    let isNotFoundError = false;
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST204') {
      userMessage = "Failed to update report log: Record not found.";
      isNotFoundError = true;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      userMessage = `Failed to update report log: ${error.message}`;
    }
    return { success: false, message: userMessage, isNotFoundError, error };
};
export const removeReportLog = async (logId: string): Promise<StoreOperationResult<void>> => {
    const { error } = await deleteReportLogAction(logId);
    if (!error) {
        reportLogs = reportLogs.filter(l => l.id !== logId);
        notifyReportLogListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to delete report log. Database error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to delete report log.", error };
};

export const addNotification = async (notificationData: { title: string; message: string; senderName: string; targetBranchId: string | null }): Promise<StoreOperationResult<DomainNotification>> => {
  // createNotificationAction expects a notification-like object; our DB helper accepts the RPC-style payload too,
  // but the TypeScript signature in actions.ts uses NotificationInsert; cast to any to avoid type mismatch here.
  const payload = {
    p_title: notificationData.title,
    p_message: notificationData.message,
    p_sender_name: notificationData.senderName,
    p_target_branch_id: notificationData.targetBranchId,
  } as any;

  const { data, error } = await createNotificationAction(payload as any);
  
  if (data && !error) {
    const newNotification = mapDbNotificationToDomain(data as NotificationRow);
    notifications = [newNotification, ...notifications].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    notifyNotificationListeners();
    return { success: true, data: newNotification };
  }
  
  let userMessage = "Failed to add notification.";
  if (error) {
    console.error("DataStore: Failed to add notification. DB error:", JSON.stringify(error, null, 2));
    if ((error as any).message?.includes('does not exist')) {
        userMessage = "The database is missing a required function. Please run the SQL script provided in the documentation to create it.";
    } else if ((error as any).message) {
        userMessage = (error as any).message;
    }
  }
  
  return { success: false, message: userMessage, error };
};


export const updateRolePermissions = async (roleId: number, permissionIds: number[]): Promise<StoreOperationResult<void>> => {
    const { error } = await rpcUpdateRolePermissionsAction(roleId, permissionIds);
    if (!error) {
        await fetchAllRolePermissions();
        return { success: true };
    }
    console.error("DataStore: Failed to update role permissions. RPC error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to update permissions.", error };
};


export const updateTariff = async (customerType: CustomerType, year: number, tariff: Partial<TariffInfo>): Promise<StoreOperationResult<void>> => {
    const updatePayload: TariffUpdate = {};
  if (tariff.tiers) updatePayload.tiers = tariff.tiers as any;
  // tariffs.tiers is stored as JSON in the DB; accept domain TariffTier[] and let DB adapter handle serialization
  if (tariff.tiers) updatePayload.tiers = tariff.tiers as any;
  if ((tariff as any).sewerage_tiers) updatePayload.sewerage_tiers = (tariff as any).sewerage_tiers as any;
    if (tariff.maintenance_percentage) updatePayload.maintenance_percentage = tariff.maintenance_percentage;
    if (tariff.sanitation_percentage) updatePayload.sanitation_percentage = tariff.sanitation_percentage;
    if (tariff.meter_rent_prices) updatePayload.meter_rent_prices = tariff.meter_rent_prices;
    if (tariff.vat_rate) updatePayload.vat_rate = tariff.vat_rate;
    if (tariff.domestic_vat_threshold_m3) updatePayload.domestic_vat_threshold_m3 = tariff.domestic_vat_threshold_m3;

  // Serialize JSON fields to strings so the DB layer stores valid JSON
  if (updatePayload.tiers && typeof updatePayload.tiers !== 'string') {
    try { updatePayload.tiers = JSON.stringify(updatePayload.tiers); } catch (e) { /* keep as-is */ }
  }
  if ((updatePayload as any).sewerage_tiers && typeof (updatePayload as any).sewerage_tiers !== 'string') {
    try { (updatePayload as any).sewerage_tiers = JSON.stringify((updatePayload as any).sewerage_tiers); } catch (e) { /* keep as-is */ }
  }
  if (updatePayload.meter_rent_prices && typeof updatePayload.meter_rent_prices !== 'string') {
    try { updatePayload.meter_rent_prices = JSON.stringify(updatePayload.meter_rent_prices); } catch (e) { /* keep as-is */ }
  }

  // If no fields to update, return no-op
  if (Object.keys(updatePayload).length === 0) {
    return { success: true };
  }

  const { data: updatedDbTariff, error } = await updateTariffAction(customerType, year, updatePayload);
    if (updatedDbTariff && !error) {
        tariffs = tariffs.map(t => (t.customer_type === customerType && t.year === year) ? updatedDbTariff : t);
        notifyTariffListeners();
        return { success: true };
    }
    console.error("DataStore: Failed to update tariff. Error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to update tariff.", error };
};

export const addTariff = async (tariffData: Omit<TariffInfo, 'id'>): Promise<StoreOperationResult<TariffInfo>> => {
  const payload: TariffInsert = {
        customer_type: tariffData.customer_type,
        year: tariffData.year,
    tiers: tariffData.tiers as any,
        maintenance_percentage: tariffData.maintenance_percentage,
        sanitation_percentage: tariffData.sanitation_percentage,
    sewerage_tiers: (tariffData as any).sewerage_tiers as any,
    meter_rent_prices: tariffData.meter_rent_prices,
        vat_rate: tariffData.vat_rate,
        domestic_vat_threshold_m3: tariffData.domestic_vat_threshold_m3,
    };
    // Ensure JSON fields are serialized
    try {
      if (payload.tiers && typeof payload.tiers !== 'string') payload.tiers = JSON.stringify(payload.tiers as any);
  if ((payload as any).sewerage_tiers && typeof (payload as any).sewerage_tiers !== 'string') (payload as any).sewerage_tiers = JSON.stringify((payload as any).sewerage_tiers);
      if (payload.meter_rent_prices && typeof payload.meter_rent_prices !== 'string') payload.meter_rent_prices = JSON.stringify(payload.meter_rent_prices as any);
    } catch (e) {
      // ignore serialization errors here; DB layer will throw if invalid
    }
    const { data, error } = await createTariffAction(payload);
    if (data && !error) {
        tariffs = [...tariffs, data];
        notifyTariffListeners();
        const mappedData = getTariff(data.customer_type as CustomerType, data.year);
        if (mappedData) {
          return { success: true, data: mappedData };
        } else {
          return { success: false, message: "Failed to map new tariff after creation." };
        }
    }
    console.error("DataStore: Failed to add tariff. Error:", JSON.stringify(error, null, 2));
    return { success: false, message: (error as any)?.message || "Failed to add tariff.", error };
};

// --- Approval Workflow Functions ---
export const approveCustomer = async (customerKeyNumber: string, approverId: string): Promise<StoreOperationResult<void>> => {
  const updatePayload: Partial<DomainIndividualCustomer> = {
    status: 'Active',
    approved_by: approverId,
    approved_at: new Date().toISOString(),
  };
  return await updateCustomer(customerKeyNumber, updatePayload);
};

export const rejectCustomer = async (customerKeyNumber: string, rejectorId: string): Promise<StoreOperationResult<void>> => {
  const updatePayload: Partial<DomainIndividualCustomer> = {
    status: 'Rejected',
    approved_by: rejectorId, // Log who rejected it
    approved_at: new Date().toISOString(),
  };
  return await updateCustomer(customerKeyNumber, updatePayload);
};

export const approveBulkMeter = async (customerKeyNumber: string, approverId: string): Promise<StoreOperationResult<void>> => {
    const updatePayload: Partial<BulkMeter> = {
        status: 'Active',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
    };
  // callers expect a void result for approve/reject flows; we call the existing updateBulkMeter and ignore its returned data
  await updateBulkMeter(customerKeyNumber, updatePayload);
  return { success: true } as StoreOperationResult<void>;
}

export const rejectBulkMeter = async (customerKeyNumber: string, rejectorId: string): Promise<StoreOperationResult<void>> => {
    const updatePayload: Partial<BulkMeter> = {
        status: 'Rejected',
        approved_by: rejectorId,
        approved_at: new Date().toISOString(),
    };
  await updateBulkMeter(customerKeyNumber, updatePayload);
  return { success: true } as StoreOperationResult<void>;
}


export const subscribeToBranches = (listener: Listener<DomainBranch>): (() => void) => {
  branchListeners.add(listener);
  if (branchesFetched) listener([...branches]); else initializeBranches().then(() => listener([...branches]));
  return () => branchListeners.delete(listener);
};

export const subscribeToCustomers = (listener: Listener<DomainIndividualCustomer>): (() => void) => {
  customerListeners.add(listener);
if (customersFetched) listener([...customers]); else initializeCustomers().then(() => listener([...customers]));
  return () => customerListeners.delete(listener);
};

export const subscribeToBulkMeters = (listener: Listener<BulkMeter>): (() => void) => {
  bulkMeterListeners.add(listener);
  if (bulkMetersFetched) listener([...bulkMeters]); else initializeBulkMeters().then(() => listener([...bulkMeters]));
  return () => bulkMeterListeners.delete(listener);
};

export const subscribeToStaffMembers = (listener: Listener<StaffMember>): (() => void) => {
  staffMemberListeners.add(listener);
  if (staffMembersFetched) listener([...staffMembers]); else initializeStaffMembers().then(() => listener([...staffMembers]));
  return () => staffMemberListeners.delete(listener);
};

export const subscribeToBills = (listener: Listener<DomainBill>): (() => void) => {
    billListeners.add(listener);
    if (billsFetched) listener([...bills]); else initializeBills().then(() => listener([...bills]));
    return () => billListeners.delete(listener);
};
export const subscribeToIndividualCustomerReadings = (listener: Listener<DomainIndividualCustomerReading>): (() => void) => {
    individualCustomerReadingListeners.add(listener);
    if (individualCustomerReadingsFetched) listener([...individualCustomerReadings]); else initializeIndividualCustomerReadings().then(() => listener([...individualCustomerReadings]));
    return () => individualCustomerReadingListeners.delete(listener);
};
export const subscribeToBulkMeterReadings = (listener: Listener<DomainBulkMeterReading>): (() => void) => {
    bulkMeterReadingListeners.add(listener);
    if (bulkMeterReadingsFetched) listener([...bulkMeterReadings]); else initializeBulkMeterReadings().then(() => listener([...bulkMeterReadings]));
    return () => bulkMeterReadingListeners.delete(listener);
};
export const subscribeToPayments = (listener: Listener<DomainPayment>): (() => void) => {
    paymentListeners.add(listener);
    if (paymentsFetched) listener([...payments]); else initializePayments().then(() => listener([...payments]));
    return () => paymentListeners.delete(listener);
};
export const subscribeToReportLogs = (listener: Listener<DomainReportLog>): (() => void) => {
    reportLogListeners.add(listener);
    if (reportLogsFetched) listener([...reportLogs]); else initializeReportLogs().then(() => listener([...reportLogs]));
    return () => reportLogListeners.delete(listener);
};
export const subscribeToNotifications = (listener: Listener<DomainNotification>): (() => void) => {
  notificationListeners.add(listener);
  if (notificationsFetched) listener([...notifications]); else initializeNotifications().then(() => listener([...notifications]));
  return () => notificationListeners.delete(listener);
};
export const subscribeToRoles = (listener: Listener<DomainRole>): (() => void) => {
  roleListeners.add(listener);
  if (rolesFetched) listener([...roles]); else initializeRoles().then(() => listener([...roles]));
  return () => roleListeners.delete(listener);
};

export const subscribeToPermissions = (listener: Listener<DomainPermission>): (() => void) => {
  permissionListeners.add(listener);
  if (permissionsFetched) listener([...permissions]); else initializePermissions().then(() => listener([...permissions]));
  return () => permissionListeners.delete(listener);
};

export const subscribeToRolePermissions = (listener: Listener<DomainRolePermission>): (() => void) => {
  rolePermissionListeners.add(listener);
  if (rolePermissionsFetched) listener([...rolePermissions]); else initializeRolePermissions().then(() => listener([...rolePermissions]));
  return () => rolePermissionListeners.delete(listener);
};

export const subscribeToTariffs = (listener: Listener<TariffRow>): (() => void) => {
    tariffListeners.add(listener);
    if (tariffsFetched) listener([...tariffs]); else initializeTariffs().then(() => listener([...tariffs]));
    return () => tariffListeners.delete(listener);
};


export const authenticateStaffMember = async (email: string, password: string): Promise<StoreOperationResult<StaffMember>> => {
    const { data: staffData, error: staffError } = await getStaffMemberForAuthAction(email, password);

  if (staffError || !staffData) {
    if (staffError) {
      // Better logging for Error objects (message + stack) and for other error shapes.
      try {
        if (staffError instanceof Error) {
          console.error("DataStore: Authentication error:", staffError.message);
          if (staffError.stack) console.error(staffError.stack);
        } else {
          // JSON.stringify may omit non-enumerable properties (like Error.message),
          // so attempt stringify but fall back to a raw log if that fails.
          try {
            console.error("DataStore: Authentication error:", JSON.stringify(staffError, null, 2));
          } catch (e) {
            console.error("DataStore: Authentication error:", staffError);
          }
        }
      } catch (e) {
        // Defensive fallback in case checking instanceof or logging throws in some runtimes
        console.error("DataStore: Authentication error (fallback):", staffError);
      }
    }

    // If the error looks like a DB/connection error (timeout/refused), return a clearer message
    try {
      const errCode = (staffError && (staffError as any).code) || (staffError && (staffError as any).errno) || null;
      if (errCode === 'ETIMEDOUT' || errCode === 'ECONNREFUSED' || errCode === 'ENOTFOUND') {
        return { success: false, message: 'Unable to connect to the database. Please try again later.', isNotFoundError: false, error: staffError };
      }
    } catch (e) {
      // ignore
    }

    return { success: false, message: "Invalid email or password.", isNotFoundError: true, error: staffError };
  }

    const user = mapDbStaffToDomain(staffData);

    let userRoleId = user.roleId;

    if (!userRoleId && user.role) {
        if (!rolesFetched) await initializeRoles();
        const foundRole = roles.find(r => r.role_name === user.role);
        if (foundRole) {
            userRoleId = foundRole.id;
            user.roleId = userRoleId;
        } else {
            console.error(`DataStore: Could not find a matching role ID for role name "${user.role}" during login for user ${email}.`);
        }
    }
    
    let permissions: string[] = [];
    if (userRoleId) {
        const { data: rolePerms, error: permissionError } = await getAllRolePermissionsAction();
        const { data: allPerms } = await getAllPermissionsAction();

        if (rolePerms && allPerms && !permissionError) {
            const permissionIdsForRole = new Set(rolePerms.filter((rp: any) => rp.role_id === userRoleId).map((rp: any) => rp.permission_id));
            permissions = allPerms.filter((p: any) => permissionIdsForRole.has(p.id)).map((p: any) => p.name);
        } else if (permissionError) {
            console.error("DataStore: Failed to fetch permissions for role.", permissionError);
        }
    }
    user.permissions = permissions;
    
    if (user.branchName) {
        if (branches.length === 0) {
          await initializeBranches();
        }
        
        const normalizeBranchName = (name: string) => name.toLowerCase().replace(/\s*branch\s*$/, '').trim();
        const normalizedStaffBranchName = normalizeBranchName(user.branchName);

        const matchedBranch = branches.find(b => {
            const normalizedOfficialName = normalizeBranchName(b.name);
            return normalizedOfficialName === normalizedStaffBranchName || normalizedOfficialName.includes(normalizedStaffBranchName) || normalizedStaffBranchName.includes(normalizedOfficialName);
        });
        
        if (matchedBranch) {
            user.branchId = matchedBranch.id;
            user.branchName = matchedBranch.name;
        } else {
            console.warn(`DataStore: Could not find a branch matching the name "${user.branchName}" for user ${user.email}.`);
            user.branchName = 'Unknown Branch';
            delete user.branchId;
        }
    }
    
    return { success: true, data: user };
};

export const getBulkMeterByCustomerKey = async (key: string): Promise<StoreOperationResult<BulkMeter>> => {
    const bulkMeter = bulkMeters.find(bm => bm.customerKeyNumber === key);
    if (bulkMeter) {
        return { success: true, data: bulkMeter };
    }
  // Fallback to DB if not in local store — use action wrapper which returns { data, error }
  const { data, error } = await getAllBulkMetersAction();
  if (error || !data) {
    return { success: false, message: "Bulk meter not found", error };
  }
  const found = (data as any[]).find(b => b.customerKeyNumber === key);
  if (!found) return { success: false, message: "Bulk meter not found" };
  const domainData = await mapDbBulkMeterToDomain(found as any);
  return { success: true, data: domainData };
};


export async function loadInitialData() {
  await initializeTariffs();
  await Promise.all([
    initializeBranches(),
    initializeCustomers(),
    initializeBulkMeters(), 
    initializeStaffMembers(),
    initializeBills(),
    initializeIndividualCustomerReadings(),
    initializeBulkMeterReadings(),
    initializePayments(),
    initializeReportLogs(),
    initializeNotifications(),
    initializeRoles(),
    initializePermissions(),
    initializeRolePermissions(),
    initializeKnowledgeBaseArticles(),
  ]);
}