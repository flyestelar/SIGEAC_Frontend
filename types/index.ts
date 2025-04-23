export type Accountant = {
  id: number,
  name: string,
}

export type AdministrationCompany = {
  id: number,
  name: string,
  rif: string,
  fiscal_address: string,
  phone_number: string,
  created_at: string,
  updated_at: string,
}

export type Aircraft = {
  id: number,
  client: Client,
  location: Location,
  location_id?: number;
  fabricant: string,
  brand: string,
  serial: string,
  acronym: string,
  flight_hours: number,
  cycles: number,
  fabricant_date: Date,
  owner: string,
  aircraft_operator: string,
  type_engine: string,
  number_engine: string,
  comments: string,
  model: string,
  status: "VENDIDO" | "EN POSESION" | "RENTADO",
}

export type AdministrationArticle = {
  id: number,
  serial: string,
  name: string,
  status: "VENDIDO" | "EN POSESION" | "RENTADO",
  price: string,
  brand: string,
  type: string,
}

export type Article = {
  id?: number,
  article_type?: string,
  part_number: string,
  alternative_part_number?: string,
  status?: string,
  serial?: string,
  description?: string,
  zone?: string,
  manufacturer?: Manufacturer,
  condition?: Condition,
  condition_id?: string,
  weight?: number,
  cost?: number,
  unit?: string,
  quantity?: number,
  batches?: Batch,
  batch_id?: number,
  vendor_id?: string,
  certifcate_8130?: File|string,
  certifcate_vendor?: File|string,
  certifcate_fabricant?: File|string,
  image?:File| string,
}

export type Bank = {
  id: number,
  name: string,
  type: string,
  created_by: string,
  updated_by: string,
}

export type BankAccount = {
  id: number,
  name: string,
  account_number: string,
  account_type: string,
  account_owner: string,
  bank: Bank,
  cards: Card[],
  company: Company,
  created_by: string,
  updated_by: string,
}

export type Batch = {
  id: number,
  name: string,
  slug: string,
  description: string,
  category: string,
  ata_code: string,
  brand:string,
  is_hazarous: boolean,
  medition_unit: string,
  min_quantity: number,
  zone: string,
  warehouse_id: number,
  warehouse_name: string,
}

export type Card = {
  id: number,
  name: string,
  card_number: string,
  type: string,
  bank_account: BankAccount,
  created_by: string,
  updated_by: string,
}

export type Cash = {
  id: number,
  name: string,
  total_amount: string,
  coin: "BOLIVARES" | "DOLARES" | "EUROS",
}

export type CashMovement = {
  id: number,
  responsible: Employee,
  cash: Cash,
  company: Company,
  date: Date,
  type: "INCOME" | "OUTPUT",
  accountant: Accountant,
  category: string,
  sub_category: string,
  sub_category_details: string,
  amount: number,
  bank_account: BankAccount, 
  vendor: Vendor,
  client: Client,
  cash_id: string;
}

export type Client = {
  id: number,
  name: string,
  dni: string,
  address: string,
  email: string,
  phone: string,
  balance: number,
  pay_credit_days: number,
}

export type Condition = {
  id: number,
  name: string,
  description: string,
  registered_by: string,
  updated_by: string,
}

export interface ConsumableArticle extends Article {
  is_managed?: boolean,
  quantity?: number,
  caducate_date?: string,
  fabrication_date?: string,
}

export type Convertion = {
  id: number,
  secondary_unit: string,
  convertion_rate: number,
  unit: Unit,
  quantity_unit: number,
  updated_by: string,
  registered_by: string,
  created_at: Date,
  updated_at: Date,
}

export type Company = {
  id: number,
  name: string,
  description: string,
  rif: string,
  cod_inac: string,
  fiscal_address: string,
  phone_number: number,
  alt_phone_number: number,
  cod_iata: string,
  cod_oaci: string,
  created_at: string,
  updated_at: string,
}

export interface ComponentArticle extends Article {
  caducate_date?: string,
  fabrication_date?: string,
  hour_date?: number,
  cycle_date?: number,
  calendar_date?: string,
  component_id?: number,
}

export type Credit ={
  id: number,
  renting: Renting,
  flight: Flight,
  vendor: Vendor,
  client: Client,
  details: string,
  type: "PAGAR" | "COBRAR",
  opening_date: Date,
  closing_date: Date,
  deadline: Date,
  debt: number,
  payed_amount: number,
  status: "PENDIENTE" | "PAGADO",
}

export type CreditPayment = {
  id: number,
  bank_account: BankAccount,
  pay_method: "EFECTIVO" | "TRANSFERENCIA",
  pay_amount: string,
  payment_date: Date,
  pay_description: string,
}

export type Department = {
  id: number,
  address: string,
  type: string,
  is_main_base: string,
  cod_iata: string,
  name: string,
  email: string,
}

export type MaintenanceClient = {
  id: number
  name: string,
  email: string,
  address: string,
  phone_number: string,
}

export type MaintenanceAircraft = {
  id: number,
  client: MaintenanceClient,
  manufacturer: Manufacturer,
  serial: string,
  acronym: string,
  flight_hours: number,
  flight_cycles: number,
  fabricant_date: string,
  aircraft_parts: MaintenanceAircraftPart[],
  location: Location,
  comments: string,
}

export type MaintenanceAircraftPart = {
  part_number: string,
  part_name: string,
  part_hours: number,
  part_cycles: number,
  aircraft: MaintenanceAircraft,
}

export type FlightControl = {
  flight_number: string,
  aircraft_operator: string,
  origin: string,
  destination: string,
  flight_date: string,
  flight_hours: number,
  flight_cycles: number,
  aircraft: MaintenanceAircraft,
}

export type MaintenanceService = {
  id: number
  name: string,
  description: string,
  manufacturer: Manufacturer,
  tasks: ServiceTask[],
}

export type ServiceTask = {
  id: number,
  description: string,
  batch: Batch,
  service: MaintenanceService,
}

export interface WorkOrder extends Request {
  order_number: string
  service: string,
  aircraft: MaintenanceAircraft,
  status: boolean,
  description: string,
  employee: Employee,
}

export interface DispatchRequest extends Request {
  part_number: string,
  destination_place: string,
  batch: {
    id: string,
    name: string,
    category: string,
    article_count: number,
    min_quantity: number,
    articles: {
      article_id: string,
      serial: string,
      part_number: string,
      quantity: string,
      unit: Convertion[],
    }[]
  },
  category: string,
}

export type Employee = {
  id: number,
  first_name: string,
  last_name: string,
  company: string,
  dni: string,
  job_title: JobTitle,
  department: Department,
  user?: User,
  location: Location,
}

export type Flight = {
  id:number,
  flight_number: string,
  client: Client, 
  route: Route,      
  aircraft: Aircraft,  
  date: string,
  details: string,
  fee: number,
  total_amount: number, 
  type: "CARGA" | "PAX" | "CHART",
  payed_amount: number,
  debt_status: "PENDIENTE" | "PAGADO",
  bank_account: BankAccount,
}

export type FlightPayment = {
  id: number,
  bank_account: BankAccount,
  flight: Flight,
  client: Client,
  pay_method: "EFECTIVO" | "TRANSFERENCIA",
  pay_amount: string,
  payment_date: Date,
  pay_description: string,
}

export type GeneralSalesReport = {
  requisition_order: Requisition,
  purchase_order?: PurchaseOrder,
  quote_order?: Quote[],
}[]

export type JobTitle = {
  id: number,
  name: string,
  description: string,
  department: Department,
}

export type Location = {
  id: number,
  name: string,
  address: string,
  type: string,
  isMainBase: boolean,
  cod_iata: string,
  companies: Company[],
}

export type Manufacturer = {
  id: number,
  name: string,
  description: string,
}

export type Module = {
  id: number,
  order_number: string,
  status: string,
  created_by: User,
  requested_by: string,
  batch: {
    name: string,
    batch_articles: {
      article_part_number: string,
      quantity: number,
      unit?: Convertion,
      image: string,
    }[]
  }[],
  received_by: string,
  justification: string,
  arrival_date: Date,
  submission_date: Date,
  work_order: WorkOrder,
  aircraft: MaintenanceAircraft,
}

export type Vendor = {
id: string | number,
  name: string,
  description: string,
  company_id: string,
}

export type Permission = {
  id: number,
  name: string,
  label: string,
  modules: {
    id: number,
    name: string,
    description: string,
    registered_by: string,
    company_id: string,
    pivot: {
      permission_id: string,
      module_id: string,
    },
    company: {
      id: number,
      name: string,
      description: string,
    }
  }[],
}

export type PurchaseOrder = {
  id: number,
  order_number: string,
  justification: string,
  article_purchase_order: {
    batch?: {
      name: string,
    }
    id: number,
    article_part_number: string,
    quantity: number,
    unit_price: string,
    article_tax: number,
    usa_tracking: string,
    ock_tracking: string,
    article_location: string,
  }[],
  status: string,
  purchase_date: Date,
  tax: number,
  wire_fee: number,
  card?: Card,
  bank_account?: BankAccount,
  handling_fee: number,
  shipping_fee: number,
  ock_shipping: number,
  usa_shipping: number,
  sub_total: number,
  total: number,
  vendor: Vendor,
  requisition_order: Requisition,
  quote_order: Quote,
  location: Location,
  created_by: string,
  company: string,
}

export type Quote = {
  id: number,
  quote_number: string,
  justification: string,
  article_quote_order: {
    batch: {
      name: string,
    },
    article_part_number: string,
    quantity: number,
    unit_price: string,
    unit?: Convertion,
    image: string,
  }[],
  sub_total: number,
  total: number,
  vendor: Vendor,
  requisition_order: Requisition,
  quote_date: Date,
  created_by: string,
  status: string,
}

export type Renting = {
  id: number;
  description: string,
  status: "EN PROCESO" | "CULMINADO" | "RETRASADO",
  type: "AERONAVE" | "ARTICULO",
  price: number,
  payed_amount: number,
  start_date: Date,
  end_date: Date,
  deadline: Date,
  article: AdministrationArticle,
  aircraft: Aircraft,
  client: Client,
  debt_status: "PENDIENTE" | "PAGADO",
  bank_account: BankAccount,
  //reference_pic: string,
}

export type Request = {
  id: number,
  request_number: string,
  justification: string,
  submission_date: string,
  work_order?: WorkOrder,
  requisition_order?: string,
  article?: Article,
  requested_by: string,
  created_by: string,
}

export type Requisition = {
  id: number,
  order_number: string,
  status: string,
  created_by: User,
  requested_by: string,
  batch: {
    name: string,
    batch_articles: {
      article_part_number: string,
      quantity: number,
      unit?: Convertion,
      image: string,
    }[]
  }[],
  received_by: string,
  justification: string,
  arrival_date: Date,
  submission_date: Date,
  work_order: WorkOrder,
  aircraft: Aircraft,
}

export type Role = {
  id: number,
  name: string,
  companyId: number;
  permissions: Permission[],
  company: {
    id: number,
    name: string,
    description: string,
  }[]
}

export type Route = {
  id: number;
  from: string;
  to: string;
  layovers: string;
};

export type Sell ={
  id: number,
  client: Client,
  concept: string,
  total_price: number,
  payed_amount: number,
  date: Date,
  reference_pic: string,
}

export interface ToolArticle extends Article {
  is_special: boolean,
}

export type ToolBox = {
  id: number,
  name: string,
  created_by: string,
  delivered_by: string,
  employee: Employee,
  tool: {
    serial: string,
    article: ToolArticle,
  }[],
}

export type Unit = {
  id: number,
  value: string,
  label: string,
  updated_by: string,
  registered_by: string,

  created_at: Date,
  updated_at: Date,
}

export type User = {
  id: number;
  username: string;
  first_name: string,
  last_name: string,
  email: string;
  isActive: boolean,
  roles?: {
    id: number,
    name: string,
    permissions: Permission[]
  }[];
  permissions: Permission[],
  companies: Company[]
}

export type AdministrationVendor = {
  id: string | number,
  name: string,
  email: string,
  phone: string,
  address: string,
  type: "PROVEEDOR" | "BENEFICIARIO",
  created_at: Date,
  updated_at: Date,
}

export type Warehouse = {
  id: string,
  name: string,
  address: string,
  company: string,
  type: string, 
}

export interface WorkOrder extends Request {
  order_number: string
  service: string,
  aircraft: MaintenanceAircraft,
  status: boolean,
  description: string,
  employee: Employee,
}

export type ActivityReport = {
  id: number,
  date: string,
  user: User,
  activities: Activity[],
  observation?: string,
}

export type Activity = {
  id: number,
  start_hour: string,
  final_hour: string,
  description: string,
  result?: string,
}
