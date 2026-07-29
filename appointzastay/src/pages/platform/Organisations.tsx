import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BedDouble,
  Building2,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Loader2,
  PenTool,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useManagedOrganisation } from "@/hooks/useManagedOrganisation";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { platformApi, type PlatformOrganisationRow } from "@/services/platform.service";
import { Button } from "@/components/ui/button";

function VerificationCell({
  org,
  onToggle,
  pending,
}: {
  org: PlatformOrganisationRow;
  onToggle: (org: PlatformOrganisationRow) => void;
  pending: boolean;
}) {
  if (org.isVerified) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={pending}
          onClick={() => onToggle(org)}
        >
          Unverify
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="secondary" className="gap-1 shrink-0">
        <ShieldX className="w-3.5 h-3.5" />
        Not verified
      </Badge>
      <Button
        type="button"
        size="sm"
        className="h-7 text-xs"
        disabled={pending}
        onClick={() => onToggle(org)}
      >
        Verify
      </Button>
    </div>
  );
}

function ManageActions({
  org,
  onManage,
}: {
  org: PlatformOrganisationRow;
  onManage: (org: PlatformOrganisationRow, path: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Button
        type="button"
        size="sm"
        className="h-7 text-xs"
        onClick={() => onManage(org, "/staff/organisation?section=basic&edit=basic")}
      >
        Edit
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs">
            Manage
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => onManage(org, "/staff/organisation?section=basic&edit=basic")}>
            <Building2 className="mr-2 h-4 w-4" />
            Organisation profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onManage(org, "/staff/site-builder")}>
            <PenTool className="mr-2 h-4 w-4" />
            Site builder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onManage(org, "/staff/rooms/definitions")}>
            <BedDouble className="mr-2 h-4 w-4" />
            Rooms
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onManage(org, "/staff/bookings")}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Bookings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onManage(org, "/staff/credits")}>
            <CreditCard className="mr-2 h-4 w-4" />
            Credits & wallet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onManage(org, "/staff/users")}>
            Users
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onManage(org, "/staff/customers")}>
            Customers
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onManage(org, "/staff/dashboard")}>
            Dashboard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function PlatformOrganisationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setManagedOrganisation } = useManagedOrganisation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["platform-organisations"],
    queryFn: () => platformApi.listOrganisations(),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ organisationId, verified }: { organisationId: string; verified: boolean }) =>
      platformApi.setVerification(organisationId, verified),
    onSuccess: (row) => {
      queryClient.setQueryData<{ organisations: PlatformOrganisationRow[]; total: number }>(
        ["platform-organisations"],
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            organisations: prev.organisations.map((o) => (o.id === row.id ? row : o)),
          };
        }
      );
      toast({
        title: row.isVerified ? "Organisation verified" : "Verification removed",
        description: `${row.name} is now ${row.isVerified ? "verified" : "not verified"}.`,
      });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Could not update verification.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    },
  });

  const handleToggle = (org: PlatformOrganisationRow) => {
    verifyMutation.mutate({ organisationId: org.id, verified: !org.isVerified });
  };

  const handleManage = (org: PlatformOrganisationRow, path: string) => {
    setManagedOrganisation({ id: org.id, name: org.name });
    void queryClient.invalidateQueries();
    navigate(path);
  };

  const organisations = data?.organisations ?? [];

  return (
    <PlatformShell
      title="All organisations"
      subtitle={
        organisations.length > 0
          ? `${organisations.length} propert${organisations.length === 1 ? "y" : "ies"} on the platform`
          : "Review properties, users, customers, and verification status."
      }
    >
      {isLoading && (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading organisations…
              </div>
            )}

            {error && (
              <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Could not load organisations. Your account may not have platform access.
              </div>
            )}

            {!isLoading && !error && organisations.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">No organisations registered yet.</p>
            )}

            {!isLoading && !error && organisations.length > 0 && (
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="min-w-[180px]">Property</TableHead>
                    <TableHead className="min-w-[200px]">Address</TableHead>
                    <TableHead className="whitespace-nowrap">Mobile</TableHead>
                    <TableHead className="min-w-[140px]">Owner</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Users</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Customers</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Credits</TableHead>
                    <TableHead className="min-w-[150px]">Verification</TableHead>
                    <TableHead className="text-right min-w-[130px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organisations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="align-top">
                        <div className="font-medium">{org.name}</div>
                        <div className="text-xs text-muted-foreground">{org.slug || org.id}</div>
                        {org.email && (
                          <div className="text-xs text-muted-foreground mt-0.5">{org.email}</div>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-sm whitespace-normal break-words">
                        {org.address || "—"}
                      </TableCell>
                      <TableCell className="align-top font-mono text-sm whitespace-nowrap">
                        {org.phone || org.ownerPhone || "—"}
                      </TableCell>
                      <TableCell className="align-top">
                        <div>{org.ownerName || "—"}</div>
                        {org.ownerEmail && (
                          <div className="text-xs text-muted-foreground">{org.ownerEmail}</div>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-right font-mono tabular-nums">
                        {(org.userCount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="align-top text-right font-mono tabular-nums">
                        {(org.customerCount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="align-top text-right font-mono tabular-nums">
                        {org.walletCreditBalance.toLocaleString()}
                      </TableCell>
                      <TableCell className="align-top">
                        <VerificationCell
                          org={org}
                          onToggle={handleToggle}
                          pending={
                            verifyMutation.isPending &&
                            verifyMutation.variables?.organisationId === org.id
                          }
                        />
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <ManageActions org={org} onManage={handleManage} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
    </PlatformShell>
  );
}
