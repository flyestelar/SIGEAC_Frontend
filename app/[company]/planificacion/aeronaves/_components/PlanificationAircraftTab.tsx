import { MaintenanceAircraft } from '@/types'

const PlanificationAircraftTab = ({ aircraft }: { aircraft: MaintenanceAircraft }) => {
    return (
        <div>Componente de Tab para {aircraft.acronym}</div>
    )
}

export default PlanificationAircraftTab