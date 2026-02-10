# Database Quick Start

## 🚀 3-Minute Setup

### 1. Open Supabase SQL Editor
```
https://supabase.com/dashboard/project/hcpfviemzpdnrhnxrvip/sql/new
```

### 2. Run Schema (First)
- Open: `supabase/migrations/001_initial_schema.sql`
- Copy all → Paste in SQL Editor → Run

### 3. Run Seeds (Second)
- Open: `supabase/seed.sql`
- Copy all → Paste in SQL Editor → Run

### 4. Verify It Worked
```bash
npm run db:verify
```

## 📊 What You Get

- **6 motorcycles** (Honda, Yamaha, Harley, Kawasaki, BMW)
- **2 diagnostic trees** (Engine won't start, Won't idle)
- **7 DTC codes** (P0301, P0302, etc.)

## ✅ Test the Connection

```bash
npm run db:test
```

## 📖 Need More Info?

See: `DATABASE_SETUP.md` for complete documentation

## 🆘 Troubleshooting

**"relation does not exist"**
→ Run the schema migration first (step 2 above)

**"permission denied"**
→ Check RLS policies were created (in schema file)

**Can't connect**
→ Verify `.env.local` has correct credentials

## 🔧 Useful Commands

```bash
npm run db:migrate  # Print instructions
npm run db:verify   # Check tables exist
npm run db:test     # Test API queries
```

## 📁 Key Files

```
supabase/
├── migrations/
│   └── 001_initial_schema.sql  ← Create tables
└── seed.sql                     ← Insert data

src/types/
└── database.types.ts            ← TypeScript types

scripts/
├── verify-schema-rest.js        ← Check setup
└── test-api.js                  ← Test queries
```

## 🎯 Next Steps

After setup:
1. Run `npm run db:test` to verify
2. Start building components
3. Query bikes: `supabase.from('motorcycles').select('*')`

---

**Need help?** Check `DATABASE_SETUP.md` or `supabase/README.md`
