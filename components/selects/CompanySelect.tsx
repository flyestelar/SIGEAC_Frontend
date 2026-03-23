import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useGetUserLocationsByCompanyId } from "@/hooks/sistema/usuario/useGetUserLocationsByCompanyId";
import { useCompanyStore } from "@/stores/CompanyStore";
import { Company } from "@/types";
import { Loader2 } from "lucide-react";

const CompanySelect = () => {
  // Hooks y estados
  const { user, loading: userLoading } = useAuth();

  const { selectedCompany, selectedStation, setSelectedCompany, setSelectedStation } = useCompanyStore();
  
  const {
    data: locations,
    isPending: locationsLoading,
    isError,
  } = useGetUserLocationsByCompanyId(selectedCompany?.id);

  const selectedLocation = selectedStation
    ? locations?.find((location) => location.id.toString() === selectedStation)
    : null;

    const stationAddress = selectedLocation ? `${selectedLocation.cod_iata} - ${selectedLocation.type}` : null;

  // Handlers
  const handleCompanySelect = (companyId: string) => {
    const company = user?.companies?.find((c) => c.id.toString() === companyId);
    if (company) {
      setSelectedCompany(company);
    }
  };

  const handleStationSelect = (value: string) => {
    setSelectedStation(value);
  };

  // Funciones auxiliares
  const getCompanySelectValue = () => {
    return selectedCompany ? selectedCompany.id.toString() : '';
  };

  const getCompanySelectPlaceholder = () => {
    return selectedCompany
      ? selectedCompany.name[0].toUpperCase() + selectedCompany.name.slice(1)
      : 'Empresa';
  };

  // Render
  return (
    <div className="hidden items-center space-x-2 justify-center md:flex md:flex-1">
      <Select
        value={getCompanySelectValue()}
        onValueChange={handleCompanySelect}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={getCompanySelectPlaceholder()} />
        </SelectTrigger>
        <SelectContent>
          {userLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : (
            user?.companies?.map((company: Company) => (
              <SelectItem value={company.id.toString()} key={company.id}>
                {company.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Select
        disabled={!selectedCompany}
        value={selectedStation || ''}
        onValueChange={handleStationSelect}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue
            placeholder={
              locationsLoading ? (
                <Loader2 className="animate-spin size-4" />
              ) : (
                stationAddress || 'Estación'
              )
            }
          />
        </SelectTrigger>
        <SelectContent>
          {locationsLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : isError ? (
            <p className="p-2 text-xs text-muted-foreground italic">
              Ha ocurrido un error al cargar las estaciones...
            </p>
          ) : locations?.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground italic">
              No hay estaciones disponibles
            </p>
          ) : (
            locations?.map((location) => (
              <SelectItem value={location.id.toString()} key={location.id}>
                {location.cod_iata}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CompanySelect;
