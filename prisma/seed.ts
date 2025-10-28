import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // --- USERS ---
  const alice = await prisma.user.create({ data: { name: 'Alice Johnson', email: 'alice@example.com' } })
  const bob = await prisma.user.create({ data: { name: 'Bob Miller', email: 'bob@example.com' } })
  const charlie = await prisma.user.create({ data: { name: 'Charlie Davis', email: 'charlie@example.com' } })

  // --- FRIENDS (mutual) ---
  await prisma.user.update({ where: { id: alice.id }, data: { friends: { connect: [{ id: bob.id }, { id: charlie.id }] } } })
  await prisma.user.update({ where: { id: bob.id }, data: { friends: { connect: [{ id: alice.id }] } } })
  await prisma.user.update({ where: { id: charlie.id }, data: { friends: { connect: [{ id: alice.id }] } } })

  // --- TRAILS (with coordinates added) ---
  const allatoonaTrails = await Promise.all([
    prisma.trail.create({ data: { name: 'Rusty Bucket', location: 'Allatoona Creek', distanceKm: 3.5, difficulty: 'Intermediate', coordinates: [[-84.5635, 34.0732], [-84.5650, 34.0745], [-84.5660, 34.0750]] } }),
    prisma.trail.create({ data: { name: 'Voodoo', location: 'Allatoona Creek', distanceKm: 4.0, difficulty: 'Advanced', coordinates: [[-84.5670, 34.0760], [-84.5685, 34.0775], [-84.5695, 34.0780]] } }),
    prisma.trail.create({ data: { name: 'Mumbo Jumbo', location: 'Allatoona Creek', distanceKm: 2.7, difficulty: 'Intermediate', coordinates: [[-84.5700, 34.0790], [-84.5710, 34.0800], [-84.5720, 34.0810]] } }),
    prisma.trail.create({ data: { name: 'Hocus Pocus', location: 'Allatoona Creek', distanceKm: 1.5, difficulty: 'Advanced', coordinates: [[-84.5730, 34.0820], [-84.5740, 34.0830], [-84.5750, 34.0840]] } }),
    prisma.trail.create({ data: { name: 'Mason’s Connector', location: 'Allatoona Creek', distanceKm: 2.3, difficulty: 'Beginner', coordinates: [[-84.5760, 34.0850], [-84.5770, 34.0860], [-84.5780, 34.0870]] } }),
  ])

  const blanketsTrails = await Promise.all([
    prisma.trail.create({ data: { name: 'Dwelling Loop', location: 'Blankets Creek', distanceKm: 4.2, difficulty: 'Intermediate', coordinates: [[-84.4935, 34.0162], [-84.4945, 34.0170], [-84.4955, 34.0180]] } }),
    prisma.trail.create({ data: { name: 'Van Michael Trail', location: 'Blankets Creek', distanceKm: 4.8, difficulty: 'Advanced', coordinates: [[-84.4960, 34.0190], [-84.4970, 34.0200], [-84.4980, 34.0210]] } }),
    prisma.trail.create({ data: { name: 'South Loop', location: 'Blankets Creek', distanceKm: 3.0, difficulty: 'Beginner', coordinates: [[-84.4990, 34.0220], [-84.5000, 34.0230], [-84.5010, 34.0240]] } }),
    prisma.trail.create({ data: { name: 'Mosquito Flats', location: 'Blankets Creek', distanceKm: 1.0, difficulty: 'Beginner', coordinates: [[-84.5020, 34.0250], [-84.5030, 34.0260], [-84.5040, 34.0270]] } }),
    prisma.trail.create({ data: { name: 'Quehl Holler', location: 'Blankets Creek', distanceKm: 1.2, difficulty: 'Advanced', coordinates: [[-84.5050, 34.0280], [-84.5060, 34.0290], [-84.5070, 34.0300]] } }),
  ])

  const sopeTrails = await Promise.all([
    prisma.trail.create({ data: { name: 'Paper Mill Trail', location: 'Sope Creek / Cochran Shoals', distanceKm: 3.0, difficulty: 'Intermediate', coordinates: [[-84.4540, 34.0470], [-84.4550, 34.0480], [-84.4560, 34.0490]] } }),
    prisma.trail.create({ data: { name: 'Creek Loop', location: 'Sope Creek / Cochran Shoals', distanceKm: 2.5, difficulty: 'Intermediate', coordinates: [[-84.4570, 34.0500], [-84.4580, 34.0510], [-84.4590, 34.0520]] } }),
    prisma.trail.create({ data: { name: 'Cochran Shoals Connector', location: 'Sope Creek / Cochran Shoals', distanceKm: 1.2, difficulty: 'Beginner', coordinates: [[-84.4600, 34.0530], [-84.4610, 34.0540], [-84.4620, 34.0550]] } }),
  ])

  const northCooperTrails = await Promise.all([
    prisma.trail.create({ data: { name: 'North Loop', location: 'North Cooper Lake Park', distanceKm: 1.6, difficulty: 'Intermediate', coordinates: [[-84.4310, 34.0790], [-84.4320, 34.0800], [-84.4330, 34.0810]] } }),
    prisma.trail.create({ data: { name: 'Skills Area', location: 'North Cooper Lake Park', distanceKm: 0.5, difficulty: 'Beginner', coordinates: [[-84.4340, 34.0820], [-84.4350, 34.0830], [-84.4360, 34.0840]] } }),
  ])

  // --- FAVORITES ---
  await prisma.user.update({
    where: { id: alice.id },
    data: {
      favoriteTrails: {
        connect: [
          { id: allatoonaTrails[0].id },
          { id: sopeTrails[0].id }
        ]
      }
    }
  })
  await prisma.user.update({
    where: { id: alice.id },
    data: {
      favoriteTrails: {
        connect: [
          { id: blanketsTrails[0].id },
          { id: blanketsTrails[1].id }
        ]
      }
    }
  })
  await prisma.user.update({
    where: { id: alice.id },
    data: {
      favoriteTrails: {
        connect: [
          { id: northCooperTrails[0].id }]
      }
    }
  })

  // --- RIDES WITH MULTIPLE TRAILS ---
  const ride1 = await prisma.ride.create({
    data: {
      userId: alice.id,
      date: new Date('2025-10-18T13:00:00.000Z'),
      durationMin: 150,
      notes: 'Saturday loop hitting Rusty Bucket + Voodoo + Mumbo Jumbo.',
      attendees: { create: [{ userId: alice.id }, { userId: bob.id }, { userId: charlie.id }] },
      trails: { create: allatoonaTrails.map(t => ({ trailId: t.id })) },
    },
  })

  const ride2 = await prisma.ride.create({
    data: {
      userId: bob.id,
      date: new Date('2025-10-26T09:00:00.000Z'),
      durationMin: 120,
      notes: 'Blankets Creek flow lines ride covering Dwelling Loop + Van Michael + Quehl Holler.',
      attendees: { create: [{ userId: bob.id }, { userId: alice.id }] },
      trails: { create: [blanketsTrails[0], blanketsTrails[1], blanketsTrails[4]].map(t => ({ trailId: t.id })) },
    },
  })

  const ride3 = await prisma.ride.create({
    data: {
      userId: charlie.id,
      date: new Date('2025-11-03T16:00:00.000Z'),
      durationMin: 60,
      notes: 'Sope Creek combo: Paper Mill + Creek Loop + Cochran Connector.',
      attendees: { create: [{ userId: charlie.id }, { userId: alice.id }] },
      trails: { create: sopeTrails.map(t => ({ trailId: t.id })) },
    },
  })

  const ride4 = await prisma.ride.create({
    data: {
      userId: charlie.id,
      date: new Date('2025-11-10T12:30:00.000Z'),
      durationMin: 45,
      notes: 'North Cooper Lake Park short loop + skills area practice.',
      attendees: { create: [{ userId: charlie.id }, { userId: bob.id }] },
      trails: { create: northCooperTrails.map(t => ({ trailId: t.id })) },
    },
  })

  // --- MESSAGES ---
  await prisma.message.create({
    data: {
      content: 'Allatoona ride tomorrow! Rusty Bucket + Voodoo loops.',
      sender: { connect: { id: alice.id } },
      ride: { connect: { id: ride1.id } },
      recipients: {
        create: [
          { user: { connect: { id: bob.id } }, read: false },
          { user: { connect: { id: charlie.id } }, read: true },
        ],
      },
    },
  })

  await prisma.message.create({
    data: {
      content: 'Blankets Creek this weekend? Dwelling + Van Michael + Quehl Holler!',
      sender: { connect: { id: bob.id } },
      ride: { connect: { id: ride2.id } },
      recipients: {
        create: [
          { user: { connect: { id: alice.id } }, read: true },
          { user: { connect: { id: charlie.id } }, read: false },
        ],
      },
    },
  })

  await prisma.message.create({
    data: {
      content: 'Sope Creek combo Saturday afternoon, see you at the trailhead!',
      sender: { connect: { id: charlie.id } },
      ride: { connect: { id: ride3.id } },
      recipients: {
        create: [
          { user: { connect: { id: alice.id } }, read: false },
          { user: { connect: { id: bob.id } }, read: false },
        ],
      },
    },
  })

  console.log('✅ Seed complete: users, friends, trails (with coordinates), rides, favorites, messages.')
}

main()
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
