import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SENTRY Database Seeding (Indian Border Screening)...');

  // 1. Create Default Checkpoint
  const checkpoint = await prisma.checkpoint.upsert({
    where: { id: 'ck-attari-wagah-01' },
    update: {},
    create: {
      id: 'ck-attari-wagah-01',
      name: 'Attari-Wagah Border Checkpoint',
      location: 'Amritsar Terminal B, Gate 4 (Punjab Sector)'
    }
  });
  console.log(`✅ Created Checkpoint: ${checkpoint.name}`);

  // Hashed Passwords
  const commonPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(commonPassword, 10);

  // 2. Create Users across 4 Roles
  const users = [
    {
      id: 'usr-officer-01',
      email: 'officer@sentry.gov.in',
      name: 'Officer R. Sharma',
      role: Role.OFFICER,
      checkpointId: checkpoint.id
    },
    {
      id: 'usr-supervisor-01',
      email: 'supervisor@sentry.gov.in',
      name: 'Supervisor M. Vance',
      role: Role.SUPERVISOR,
      checkpointId: checkpoint.id
    },
    {
      id: 'usr-admin-01',
      email: 'admin@sentry.gov.in',
      name: 'Admin D. Croft',
      role: Role.ADMIN,
      checkpointId: null
    },
    {
      id: 'usr-auditor-01',
      email: 'auditor@sentry.gov.in',
      name: 'Auditor S. Thorne',
      role: Role.AUDITOR,
      checkpointId: null
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash,
        role: user.role,
        checkpointId: user.checkpointId
      }
    });
  }
  console.log('✅ Created 4 Users (Officer, Supervisor, Admin, Auditor)');

  // 3. Create Watchlist Entries (Indian Passports & International Flags)
  const watchlistData = [
    {
      fullName: 'Aarav Sharma',
      documentNumber: 'Z4091823',
      nationality: 'IND',
      reason: 'Interpol Red Notice #2026-IND-991 - Forged Indian Passport Stamp & Identity Theft'
    },
    {
      fullName: 'Vikramaditya Singh',
      documentNumber: 'P9920144',
      nationality: 'IND',
      reason: 'Stolen Passport Registry Alert - Counterfeit MRZ Data'
    },
    {
      fullName: 'Pavel Novak',
      documentNumber: 'C40217755',
      nationality: 'CZE',
      reason: 'Altered Visa Stamp & Counterfeit Entry Permit'
    },
    {
      fullName: 'Priya Patel',
      documentNumber: 'M8820194',
      nationality: 'IND',
      reason: 'Watchlist Flag - Font Irregularity & Tampered Laminate'
    },
    {
      fullName: 'Rajesh Kumar',
      documentNumber: 'K4019285',
      nationality: 'IND',
      reason: 'Suspected Facial Biometric Impersonation & Multiple Alias'
    }
  ];

  for (const item of watchlistData) {
    const existing = await prisma.watchlistEntry.findFirst({
      where: { documentNumber: item.documentNumber }
    });
    if (!existing) {
      await prisma.watchlistEntry.create({
        data: {
          ...item,
          addedByAdminId: 'usr-admin-01'
        }
      });
    }
  }
  console.log('✅ Seeded 5 Watchlist Entries with Indian Passport flags');

  // 4. Create Default ModelWeightConfig
  const existingConfig = await prisma.modelWeightConfig.findFirst();
  if (!existingConfig) {
    await prisma.modelWeightConfig.create({
      data: {
        ocrWeight: 0.15,
        validationWeight: 0.20,
        tamperingWeight: 0.40,
        faceMatchWeight: 0.25,
        updatedByAdminId: 'usr-admin-01'
      }
    });
    console.log('✅ Created Default Model Weight Config (ocr: 0.15, val: 0.20, tamp: 0.40, face: 0.25)');
  }

  console.log('\n=======================================================');
  console.log('   🇮🇳 SENTRY DEMO CREDENTIALS FOR HACKATHON PRESENTATION');
  console.log('=======================================================');
  console.log('  Officer    : officer@sentry.gov.in    | Password: Password123!');
  console.log('  Supervisor : supervisor@sentry.gov.in | Password: Password123!');
  console.log('  Admin      : admin@sentry.gov.in      | Password: Password123!');
  console.log('  Auditor    : auditor@sentry.gov.in    | Password: Password123!');
  console.log('=======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
