-- Phase 2: category keywords for the rules-tier fallback (AI simplification).
-- ruleCategorize previously passed keywords: [] and matched nothing.

alter table public.categories
  add column if not exists keywords text[] not null default '{}';

comment on column public.categories.keywords is
  'Merchant/keyword tokens for offline rule-based categorization. Nigerian merchants seeded below.';

-- Seed Nigerian merchant keywords (reviewed list — regenerate via Claude only as a one-off).
update public.categories set keywords = array['gtbank','gtb','access bank','zenith','uba','first bank','fidelity','sterling','wema','union bank','polaris','bank charge','stamp duty','vat on charge','sms charge','account maintenance']
  where name = 'Bank Charges';

update public.categories set keywords = array['cinema','netflix','spotify','dstv','gotv','showmax','restaurant','bar','club','entertainment']
  where name = 'Entertainment';

update public.categories set keywords = array['generator','laptop','computer','printer','pos terminal','equipment','machinery','inverter','solar']
  where name = 'Equipment';

update public.categories set keywords = array['desk','chair','cabinet','furniture','sofa','shelf']
  where name = 'Furniture';

update public.categories set keywords = array['insurance','premium','axa','leadway','aiico','cornerstone','mutual benefit']
  where name = 'Insurance';

update public.categories set keywords = array['interest credit','interest income','savings interest']
  where name = 'Interest Income';

update public.categories set keywords = array['loan repayment','loan debit','hire purchase','lease payment','credit facility']
  where name = 'Loan Repayment';

update public.categories set keywords = array['facebook ads','google ads','marketing','advertising','billboard','flyer','campaign','jumia ads']
  where name = 'Marketing';

update public.categories set keywords = array['stationery','office supplies','paper','toner','biro','stapler','file']
  where name = 'Office Supplies';

update public.categories set keywords = array['other income','miscellaneous credit','sundry income']
  where name = 'Other Income';

update public.categories set keywords = array['penalty','fine','late fee','overdraft interest']
  where name = 'Penalties';

update public.categories set keywords = array['personal','family','school fees','pocket money']
  where name = 'Personal';

update public.categories set keywords = array['legal','lawyer','audit','consultant','professional fee','accountant','notary']
  where name = 'Professional Fees';

update public.categories set keywords = array['rent','lease','landlord','office rent','shop rent']
  where name = 'Rent Expense';

update public.categories set keywords = array['rent received','rental income','tenant payment']
  where name = 'Rent Received';

update public.categories set keywords = array['repair','maintenance','servicing','spare part']
  where name = 'Repairs';

update public.categories set keywords = array['salary','salaries','wage','wages','payroll','staff payment','allowance']
  where name = 'Salaries & Wages';

update public.categories set keywords = array['sales','pos','invoice payment','customer payment','revenue','shoprite','jumia','konga']
  where name = 'Sales Revenue';

update public.categories set keywords = array['service income','consulting income','fee received','retainer']
  where name = 'Service Income';

update public.categories set keywords = array['tax','firs','wht','vat remittance','paye','company income tax','cit']
  where name = 'Tax Payment';

update public.categories set keywords = array['bolt','uber','travel','flight','hotel','taxi','transport','fare']
  where name = 'Travel';

update public.categories set keywords = array['ikeja electric','aedc','ekedc','phcn','nepa','diesel','fuel','mtn','airtel','glo','9mobile','water bill','waste']
  where name = 'Utilities';

update public.categories set keywords = array['vehicle','car','fuel station','totalenergies','oando','nnpc','motor','tyre','tracking']
  where name = 'Vehicle';

revoke all on table public.categories from anon;
