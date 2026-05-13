"use client"

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyStore } from "@/stores/CompanyStore";
import { useGetManufacturers } from "@/hooks/general/fabricantes/useGetManufacturers";

export default function IdentificationFields({ form, path }: any) {
  const { selectedCompany } = useCompanyStore();
  const { data: manufacturers, isLoading: isManufacturersLoading } = useGetManufacturers(selectedCompany?.slug);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField control={form.control} name={`${path}.serial`} render={({ field }: any) => (
        <FormItem>
          <FormLabel>Serial</FormLabel>
          <FormControl>
            <Input placeholder="Serial (opcional)" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <FormField control={form.control} name={`${path}.manufacturer_id`} render={({ field }: any) => (
        <FormItem>
          <FormLabel>Fabricante</FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger>
                <SelectValue placeholder={isManufacturersLoading ? "Cargando..." : "Selecciona fabricante"} />
              </SelectTrigger>
              <SelectContent>
                {(manufacturers || []).filter((m: any) => m.type === "PART").map((m: any) => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}
