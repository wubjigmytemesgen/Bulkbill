
"use client";

import * as React from "react";
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, AlertCircle, Eye, Check, ChevronsUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getCustomers,
  getBulkMeters,
  initializeCustomers,
  initializeBulkMeters,
  getBranches,
  initializeBranches,
  getBills,
  initializeBills
} from "@/lib/data-store";
import type { IndividualCustomer } from "@/app/admin/individual-customers/individual-customer-types";
import type { BulkMeter } from "@/app/admin/bulk-meters/bulk-meter-types";
import { Alert, AlertTitle, AlertDescription as UIAlertDescription } from "@/components/ui/alert";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ReportDataView } from '@/app/admin/reports/report-data-view';
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface User {
  email: string;
  role: "admin" | "staff" | "Admin" | "Staff";
  branchName?: string;
  branchId?: string;
}

interface ReportFilters {
  branchId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface ReportType {
  id: string;
  name: string;
  description: string;
  headers?: string[];
  getData?: (filters: ReportFilters) => any[];
}

const arrayToXlsxBlob = (data: any[], headers: string[]): Blob => {
  const worksheetData = [
    headers,
    ...data.map(row => headers.map(header => row[header] ?? '')),
  ];

  const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[address]) {
        XLSX.utils.sheet_add_aoa(ws, [[headers[C] || '']], { origin: address });
    }
    ws[address].s = { font: { bold: true } };
  }
  const colWidths = headers.map((header, colIndex) => {
    let maxLength = (header || '').length;
    for (const dataRow of worksheetData.slice(1)) {
      const cellValue = dataRow[colIndex];
      if (cellValue != null) {
        maxLength = Math.max(maxLength, String(cellValue).length);
      }
    }
    return { wch: Math.min(maxLength + 2, 60) };
  });
  ws['!cols'] = colWidths;

  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

const downloadFile = (content: Blob, fileName: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const availableStaffReports: ReportType[] = [
  {
    id: "customer-data-branch-export",
    name: "My Branch Customer Data (XLSX)",
    description: "Download a list of individual customers assigned to your branch.",
    headers: [
      "customerKeyNumber", "name", "contractNumber", "customerType", "bookNumber", "ordinal",
      "meterSize", "meterNumber", "previousReading", "currentReading", "month", "specificArea",
      "subCity", "woreda", "sewerageConnection", "assignedBulkMeterId", "status", "paymentStatus", "calculatedBill"
    ],
    getData: (filters: ReportFilters) => {
        const { branchId, startDate, endDate } = filters;
        if (!branchId) return [];
        const allCustomers = getCustomers();
        const allBulkMeters = getBulkMeters();

        const branchBulkMeterIds = new Set(allBulkMeters.filter(bm => bm.branchId === branchId).map(bm => bm.customerKeyNumber));
        
        let filteredData = allCustomers.filter(c => 
            c.branchId === branchId || 
            (c.assignedBulkMeterId && branchBulkMeterIds.has(c.assignedBulkMeterId))
        );

        if (startDate && endDate) {
            const start = startDate.getTime();
            const end = endDate.getTime();
            filteredData = filteredData.filter(c => {
              if (!c.created_at) return false;
              try {
                const customerDate = new Date(c.created_at).getTime();
                return customerDate >= start && customerDate <= end;
              } catch { return false; }
            });
        }
        return filteredData;
    },
  },
  {
    id: "bulk-meter-data-branch-export",
    name: "My Branch Bulk Meter Data (XLSX)",
    description: "Download a list of bulk meters relevant to your branch.",
    headers: [
      "customerKeyNumber", "name", "contractNumber", "meterSize", "meterNumber",
      "previousReading", "currentReading", "month", "specificArea", "subCity", "woreda", "status", "paymentStatus"
    ],
    getData: (filters: ReportFilters) => {
       const { branchId } = filters;
       if (!branchId) return [];
        let filteredData = getBulkMeters().filter(bm => bm.branchId === branchId);
        // Note: Date filtering not implemented for bulk meters as they lack a `created_at` field
        return filteredData;
    },
  },
  {
    id: "billing-summary-branch",
    name: "My Branch Billing Summary (XLSX)",
    description: "Summary of generated bills for all customers and bulk meters in your branch.",
    headers: [
        "id", "individualCustomerId", "bulkMeterId", "billPeriodStartDate", "billPeriodEndDate", 
        "monthYear", "previousReadingValue", "currentReadingValue", "usageM3", 
        "baseWaterCharge", "sewerageCharge", "maintenanceFee", "sanitationFee", 
        "meterRent", "totalAmountDue", "amountPaid", "balanceDue", "dueDate", 
        "paymentStatus", "billNumber", "notes", "createdAt", "updatedAt"
    ],
    getData: (filters: ReportFilters) => {
        const { branchId, startDate, endDate } = filters;
        if (!branchId) return [];

        let allBillsFromStore = getBills();
        const allCustomers = getCustomers();
        const allBulkMeters = getBulkMeters();

        const branchBulkMeterKeys = new Set(allBulkMeters.filter(bm => bm.branchId === branchId).map(bm => bm.customerKeyNumber));
        let filteredBills = allBillsFromStore.filter(bill => {
            if (bill.bulkMeterId) return branchBulkMeterKeys.has(bill.bulkMeterId);
            if (bill.individualCustomerId) {
                const customer = allCustomers.find(c => c.customerKeyNumber === bill.individualCustomerId);
                if (!customer) return false;
                return customer.branchId === branchId || (customer.assignedBulkMeterId && branchBulkMeterKeys.has(customer.assignedBulkMeterId));
            }
            return false;
        });

        if (startDate && endDate) {
             const start = startDate.getTime();
             const end = endDate.getTime();
             filteredBills = filteredBills.filter(b => {
               try {
                 const billDate = new Date(b.billPeriodEndDate).getTime();
                 return billDate >= start && billDate <= end;
               } catch { return false; }
             });
        }
        return filteredBills;
    },
  },
];

export default function StaffReportsPage() {
  const { toast } = useToast();
  const [selectedReportId, setSelectedReportId] = React.useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [staffBranchName, setStaffBranchName] = React.useState<string | undefined>(undefined);
  const [staffBranchId, setStaffBranchId] = React.useState<string | undefined>(undefined);
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [selectedColumns, setSelectedColumns] = React.useState<Set<string>>(new Set());
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = React.useState(false);
  const [reportData, setReportData] = React.useState<any[] | null>(null);

  const selectedReport = availableStaffReports.find(report => report.id === selectedReportId);

  React.useEffect(() => {
    initializeCustomers();
    initializeBulkMeters();
    initializeBranches();
    initializeBills();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.role.toLowerCase() === "staff" && parsedUser.branchId && parsedUser.branchName) {
          setStaffBranchName(parsedUser.branchName);
          setStaffBranchId(parsedUser.branchId);
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  React.useEffect(() => {
    setSelectedColumns(new Set(selectedReport?.headers || []));
  }, [selectedReport]);

  const getFilteredData = React.useCallback(() => {
    if (!selectedReport?.getData || !staffBranchId) {
      return [];
    }
    return selectedReport.getData({
        branchId: staffBranchId,
        startDate: dateRange?.from,
        endDate: dateRange?.to,
    });
  }, [selectedReport, staffBranchId, dateRange]);


  const handleGenerateReport = () => {
    if (!selectedReport) return;

    if (!selectedReport.getData || !selectedReport.headers) {
      toast({
        variant: "destructive",
        title: "Report Not Implemented",
        description: `${selectedReport.name} is not available for download yet.`,
      });
      return;
    }
    if (!staffBranchId) {
        toast({
            variant: "destructive",
            title: "Branch Information Missing",
            description: "Cannot generate branch-specific report without branch information.",
        });
        return;
    }

    setIsGenerating(true);

    try {
      const data = getFilteredData();
      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: `No data available to generate ${selectedReport.name}.`,
        });
        setIsGenerating(false);
        return;
      }

      const finalHeaders = Array.from(selectedColumns);
      const xlsxBlob = arrayToXlsxBlob(data, finalHeaders);
      const fileName = `${selectedReport.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadFile(xlsxBlob, fileName);
      
      toast({
        title: "Report Generated",
        description: `${selectedReport.name} has been downloaded as ${fileName}.`,
      });

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        variant: "destructive",
        title: "Error Generating Report",
        description: "An unexpected error occurred while generating the report.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewReport = () => {
    if (!selectedReport) return;
    
    setReportData(null); 

    if (!selectedReport.getData || !selectedReport.headers) {
        toast({ variant: "destructive", title: "Report Not Implemented" });
        return;
    }

    const data = getFilteredData();
    if (!data || data.length === 0) {
      toast({ title: "No Data", description: `No data found for ${selectedReport.name} with the selected filters.` });
      return;
    }

    setReportData(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Generate Reports {staffBranchName ? `(${staffBranchName})` : ''}</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>Select a report type and apply filters to generate and download.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="report-type">Select Report Type</Label>
            <Select value={selectedReportId} onValueChange={(value) => {
              setSelectedReportId(value);
              setReportData(null);
            }}>
              <SelectTrigger id="report-type" className="w-full md:w-[400px]">
                <SelectValue placeholder="Choose a report..." />
              </SelectTrigger>
              <SelectContent>
                {availableStaffReports.map((report) => (
                  <SelectItem key={String(report.id)} value={String(report.id)} disabled={!report.getData}>
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      {report.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReport && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>{selectedReport.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                 {selectedReport.getData ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Filter by Branch</Label>
                        <div className="p-2 border rounded-md text-sm text-muted-foreground bg-background">
                          {staffBranchName || 'N/A'}
                        </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="date-range-filter">Filter by Date</Label>
                          <DateRangePicker 
                              date={dateRange} 
                              onDateChange={setDateRange}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label>Select Columns</Label>
                          <Popover open={isColumnSelectorOpen} onOpenChange={setIsColumnSelectorOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isColumnSelectorOpen}
                                className="w-full justify-between"
                                disabled={!selectedReport.headers}
                              >
                                {selectedColumns.size} of {selectedReport.headers?.length} selected
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search columns..." />
                                <CommandEmpty>No column found.</CommandEmpty>
                                <CommandList>
                                  <CommandGroup>
                                    {selectedReport.headers?.map((header) => (
                                      <CommandItem
                                        key={header}
                                        value={header}
                                        onSelect={() => {
                                          setSelectedColumns(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(header)) {
                                              newSet.delete(header);
                                            } else {
                                              newSet.add(header);
                                            }
                                            return newSet;
                                          });
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedColumns.has(header) ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                      </div>
                    </div>
                  </div>
                 ) : (
                   <Alert variant="default" className="mt-4 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30">
                     <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                     <AlertTitle className="text-blue-700 dark:text-blue-300">Coming Soon</AlertTitle>
                     <UIAlertDescription className="text-blue-600 dark:text-blue-400">
                         This report is currently under development.
                     </UIAlertDescription>
                   </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {selectedReport && selectedReport.getData && (
            <div className="flex flex-wrap gap-2">
               <Button onClick={handleViewReport} disabled={isGenerating || !selectedReportId || !staffBranchId}>
                <Eye className="mr-2 h-4 w-4" />
                View Report
              </Button>
              <Button onClick={handleGenerateReport} disabled={isGenerating || !selectedReportId || !staffBranchId}>
                <Download className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : `Generate & Download ${selectedReport.name.replace(" (XLSX)", "")}`}
              </Button>
            </div>
          )}

          {!selectedReportId && (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Please select a report type to see details and generate.
             </div>
          )}
        </CardContent>
      </Card>
      
      {reportData && selectedColumns.size > 0 && (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Report Preview: {selectedReport?.name.replace(" (XLSX)", "")}</CardTitle>
                <CardDescription>Displaying {reportData.length} row(s) with {selectedColumns.size} column(s).</CardDescription>
            </CardHeader>
            <CardContent>
                <ReportDataView data={reportData} headers={Array.from(selectedColumns)} />
            </CardContent>
        </Card>
      )}

    </div>
  );
}
