"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Eye, Edit2, Trash2, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Complaint, ComplaintPriority, ComplaintStatus } from "@/types";
import { ComplaintDetailsModalAdmin } from "./complaint-details-modal-admin";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ComplaintTableAdminProps {
  complaints: Complaint[];
  onUpdateComplaint: (updatedComplaint: Complaint) => void;
  onDeleteComplaint: (complaintId: string) => void;
}

export function ComplaintTableAdmin({ complaints, onUpdateComplaint, onDeleteComplaint }: ComplaintTableAdminProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedComplaint, setSelectedComplaint] = React.useState<Complaint | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { toast } = useToast();

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsModalOpen(true);
  };

  const handleDelete = (complaintId: string) => {
    onDeleteComplaint(complaintId);
    toast({ title: "Complaint Deleted", description: `Complaint #${complaintId.slice(-6)} has been removed.` });
  };

  const columns: ColumnDef<Complaint>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="capitalize">#{row.getValue<string>("id").slice(-6)}</div>,
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("customerName")}</div>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => <div>{row.getValue("category")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.getValue("status")}</Badge>,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      }
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as ComplaintPriority | undefined;
        return priority ? <Badge variant={priority === ComplaintPriority.Critical || priority === ComplaintPriority.High ? "destructive" : "secondary"}>{priority}</Badge> : <Badge variant="outline">N/A</Badge>;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      }
    },
    {
      accessorKey: "assignedToName",
      header: "Assigned To",
      cell: ({ row }) => <div>{row.getValue("assignedToName") || "Unassigned"}</div>,
    },
    {
      accessorKey: "submittedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Submitted
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.getValue("submittedAt")), "PP"),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const complaint = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewDetails(complaint)}>
                <Eye className="mr-2 h-4 w-4" /> View/Manage
              </DropdownMenuItem>
              <DropdownMenuSeparator />
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Complaint
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the complaint
                      #{complaint.id.slice(-6)}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(complaint.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: complaints,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: { pageSize: 10 }
    }
  });
  
  const statusOptions = Object.values(ComplaintStatus);
  const priorityOptions = Object.values(ComplaintPriority);

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2 flex-wrap">
        <Input
          placeholder="Filter by customer name..."
          value={(table.getColumn("customerName")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("customerName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4"/> Filters <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                className="capitalize"
                checked={(table.getColumn("status")?.getFilterValue() as string[])?.includes(status) ?? false}
                onCheckedChange={(value) => {
                  const currentFilter = (table.getColumn("status")?.getFilterValue() as string[]) ?? [];
                  if (value) {
                    table.getColumn("status")?.setFilterValue([...currentFilter, status]);
                  } else {
                    table.getColumn("status")?.setFilterValue(currentFilter.filter(s => s !== status));
                  }
                }}
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
             {(table.getColumn("status")?.getFilterValue() as string[])?.length > 0 && (
                <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => table.getColumn("status")?.setFilterValue([])} className="text-xs text-destructive">Clear Status Filter</DropdownMenuItem>
                </>
            )}
            <DropdownMenuLabel className="pt-2">Filter by Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {priorityOptions.map((priority) => (
              <DropdownMenuCheckboxItem
                key={priority}
                className="capitalize"
                checked={(table.getColumn("priority")?.getFilterValue() as string[])?.includes(priority) ?? false}
                onCheckedChange={(value) => {
                  const currentFilter = (table.getColumn("priority")?.getFilterValue() as string[]) ?? [];
                  if (value) {
                    table.getColumn("priority")?.setFilterValue([...currentFilter, priority]);
                  } else {
                    table.getColumn("priority")?.setFilterValue(currentFilter.filter(p => p !== priority));
                  }
                }}
              >
                {priority}
              </DropdownMenuCheckboxItem>
            ))}
            {(table.getColumn("priority")?.getFilterValue() as string[])?.length > 0 && (
                 <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => table.getColumn("priority")?.setFilterValue([])} className="text-xs text-destructive">Clear Priority Filter</DropdownMenuItem>
                </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-2">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id === 'customerName' ? 'Customer' : column.id === 'assignedToName' ? 'Assigned To' : column.id === 'submittedAt' ? 'Submitted' : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      {selectedComplaint && (
        <ComplaintDetailsModalAdmin
          complaint={selectedComplaint}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedComplaint(null);
          }}
          onUpdateComplaint={onUpdateComplaint}
        />
      )}
    </div>
  );
}

