

"use client";

import * as React from "react";
import { PlusCircle, Gauge, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { BulkMeter } from "./bulk-meter-types";
import { BulkMeterFormDialog, type BulkMeterFormValues } from "./bulk-meter-form-dialog"; 
import { BulkMeterTable } from "./bulk-meter-table";
import { 
  getBulkMeters, 
  addBulkMeter as addBulkMeterToStore, 
  updateBulkMeter as updateBulkMeterInStore, 
  deleteBulkMeter as deleteBulkMeterFromStore,
  subscribeToBulkMeters,
  initializeBulkMeters,
  getBranches,
  initializeBranches,
  subscribeToBranches
} from "@/lib/data-store";
import type { Branch } from "../branches/branch-types";
import { TablePagination } from "@/components/ui/table-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import type { StaffMember } from "../staff-management/staff-types";

export default function BulkMetersPage() {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<StaffMember | null>(null);
  const [bulkMeters, setBulkMeters] = React.useState<BulkMeter[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedBulkMeter, setSelectedBulkMeter] = React.useState<BulkMeter | null>(null);
  const [bulkMeterToDelete, setBulkMeterToDelete] = React.useState<BulkMeter | null>(null);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  React.useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    }
    setIsLoading(true);
    Promise.all([
      initializeBulkMeters(),
      initializeBranches()
    ]).then(() => {
      setBulkMeters(getBulkMeters());
      setBranches(getBranches());
      setIsLoading(false);
    });
    
    const unsubscribeBM = subscribeToBulkMeters((updatedBulkMeters) => {
       setBulkMeters(updatedBulkMeters);
    });
    const unsubscribeBranches = subscribeToBranches((updatedBranches) => {
      setBranches(updatedBranches);
    });

    return () => {
      unsubscribeBM();
      unsubscribeBranches();
    };
  }, []);

  const handleAddBulkMeter = () => {
    setSelectedBulkMeter(null);
    setIsFormOpen(true);
  };

  const handleEditBulkMeter = (bulkMeter: BulkMeter) => {
    setSelectedBulkMeter(bulkMeter);
    setIsFormOpen(true);
  };

  const handleDeleteBulkMeter = (bulkMeter: BulkMeter) => {
    setBulkMeterToDelete(bulkMeter);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (bulkMeterToDelete) {
      await deleteBulkMeterFromStore(bulkMeterToDelete.customerKeyNumber);
      toast({ title: "Bulk Meter Deleted", description: `${bulkMeterToDelete.name} has been removed.` });
      setBulkMeterToDelete(null);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleSubmitBulkMeter = async (data: BulkMeterFormValues) => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'User information not found.' });
      return;
    }
    
    if (selectedBulkMeter) {
      if (!hasPermission('bulk_meters_update')) { toast({ variant: 'destructive', title: 'Unauthorized', description: 'You do not have permission to update bulk meters.' }); return; }
      const result = await updateBulkMeterInStore(selectedBulkMeter.customerKeyNumber, data);
      if (result.success) {
        toast({ title: "Bulk Meter Updated", description: `${data.name} has been updated.` });
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: result.message });
      }
    } else {
      if (!hasPermission('bulk_meters_create')) { toast({ variant: 'destructive', title: 'Unauthorized', description: 'You do not have permission to create bulk meters.' }); return; }
      const result = await addBulkMeterToStore(data, currentUser); 
      if (result.success) {
        toast({ title: "Bulk Meter Added", description: `${data.name} has been added and is pending approval.` });
      } else {
        toast({ variant: "destructive", title: "Add Failed", description: result.message });
      }
    }
    setIsFormOpen(false);
    setSelectedBulkMeter(null);
  };

  const filteredBulkMeters = bulkMeters.filter(bm =>
    bm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bm.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bm.branchId && branches.find(b => b.id === bm.branchId)?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    bm.subCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bm.woreda.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const paginatedBulkMeters = filteredBulkMeters.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Bulk Meters Management</h1>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search bulk meters..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {hasPermission('bulk_meters_create') && (
            <Button onClick={handleAddBulkMeter} className="flex-shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New
            </Button>
          )}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Bulk Meter List</CardTitle>
          <CardDescription>View, edit, and manage bulk meter information.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="mt-4 p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
                Loading bulk meters...
             </div>
           ) : bulkMeters.length === 0 && !searchTerm ? (
             <div className="mt-4 p-8 border-2 border-dashed rounded-lg bg-muted/50 text-center">
                <Gauge className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold">No Bulk Meters Found</h3>
                <p className="text-muted-foreground mt-1">Click "Add New" to get started.</p>
             </div>
           ) : (
            <BulkMeterTable
              data={paginatedBulkMeters}
              onEdit={handleEditBulkMeter}
              onDelete={handleDeleteBulkMeter}
              branches={branches}
              canEdit={hasPermission('bulk_meters_update')}
              canDelete={hasPermission('bulk_meters_delete')}
            />
          )}
        </CardContent>
        {filteredBulkMeters.length > 0 && (
          <TablePagination
            count={filteredBulkMeters.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(value) => {
              setRowsPerPage(value);
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        )}
      </Card>

      {(hasPermission('bulk_meters_create') || hasPermission('bulk_meters_update')) && (
        <BulkMeterFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleSubmitBulkMeter}
          defaultValues={selectedBulkMeter}
        />
      )}

      {hasPermission('bulk_meters_delete') && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the bulk meter {bulkMeterToDelete?.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBulkMeterToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
