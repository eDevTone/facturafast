-- CFDI Fácil - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Perfil Fiscal del Usuario (datos del CSF)
create table if not exists user_fiscal_profile (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null unique,
  rfc varchar(13) not null,
  razon_social text not null,
  regimen_fiscal varchar(10) not null,
  codigo_postal varchar(5) not null,
  direccion_fiscal text,
  certificado_cer text, -- Base64 encoded
  certificado_key text, -- Base64 encoded
  certificado_password text, -- Encrypted
  constancia_fiscal_url text, -- URL del PDF original
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Clientes
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  rfc varchar(13) not null,
  razon_social text not null,
  email text,
  telefono varchar(20),
  codigo_postal varchar(5) not null,
  regimen_fiscal varchar(10),
  uso_cfdi varchar(10) not null default 'P01', -- P01, G03, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_client_rfc_per_user unique(user_id, rfc)
);

-- Facturas
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  client_id uuid references clients not null,
  folio integer not null,
  serie varchar(25),
  fecha_emision timestamp with time zone default timezone('utc'::text, now()) not null,
  subtotal numeric(15,2) not null,
  iva numeric(15,2) not null default 0,
  retenciones numeric(15,2) not null default 0,
  total numeric(15,2) not null,
  moneda varchar(3) not null default 'MXN',
  forma_pago varchar(2) not null, -- 01, 02, 03, etc.
  metodo_pago varchar(3) not null, -- PUE, PPD
  uso_cfdi varchar(10) not null,
  xml_url text,
  pdf_url text,
  uuid varchar(36), -- Folio Fiscal SAT
  estatus varchar(20) not null default 'draft', -- draft, timbrada, cancelada
  motivo_cancelacion varchar(2),
  fecha_cancelacion timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_folio_per_user unique(user_id, serie, folio)
);

-- Conceptos/Items de Factura
create table if not exists invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices on delete cascade not null,
  clave_prod_serv varchar(8) not null default '84111506', -- Clave SAT
  descripcion text not null,
  cantidad numeric(15,2) not null,
  unidad varchar(10) not null default 'E48', -- E48 = Unidad de servicio
  valor_unitario numeric(15,2) not null,
  importe numeric(15,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para performance
create index idx_invoices_user_id on invoices(user_id);
create index idx_invoices_client_id on invoices(client_id);
create index idx_invoices_estatus on invoices(estatus);
create index idx_invoices_fecha_emision on invoices(fecha_emision desc);
create index idx_clients_user_id on clients(user_id);
create index idx_invoice_items_invoice_id on invoice_items(invoice_id);

-- RLS (Row Level Security)
alter table user_fiscal_profile enable row level security;
alter table clients enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

-- Policies: Users can only see their own data
create policy "Users can view own fiscal profile"
  on user_fiscal_profile for select
  using (auth.uid() = user_id);

create policy "Users can insert own fiscal profile"
  on user_fiscal_profile for insert
  with check (auth.uid() = user_id);

create policy "Users can update own fiscal profile"
  on user_fiscal_profile for update
  using (auth.uid() = user_id);

create policy "Users can view own clients"
  on clients for select
  using (auth.uid() = user_id);

create policy "Users can insert own clients"
  on clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update own clients"
  on clients for update
  using (auth.uid() = user_id);

create policy "Users can view own invoices"
  on invoices for select
  using (auth.uid() = user_id);

create policy "Users can insert own invoices"
  on invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own invoices"
  on invoices for update
  using (auth.uid() = user_id);

create policy "Users can view invoice items"
  on invoice_items for select
  using (exists (
    select 1 from invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = auth.uid()
  ));

create policy "Users can insert invoice items"
  on invoice_items for insert
  with check (exists (
    select 1 from invoices
    where invoices.id = invoice_items.invoice_id
    and invoices.user_id = auth.uid()
  ));

-- Function to auto-increment folio
create or replace function get_next_folio(p_user_id uuid, p_serie varchar default null)
returns integer as $$
declare
  next_folio integer;
begin
  select coalesce(max(folio), 0) + 1 into next_folio
  from invoices
  where user_id = p_user_id
  and (serie = p_serie or (serie is null and p_serie is null));
  
  return next_folio;
end;
$$ language plpgsql;

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger update_user_fiscal_profile_updated_at
  before update on user_fiscal_profile
  for each row
  execute function update_updated_at_column();
