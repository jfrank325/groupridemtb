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

  // --- TRAILS (expanded with loops) ---
  const allatoonaTrails = await Promise.all([
    prisma.trail.create({ data: { name: 'Rusty Bucket', location: 'Allatoona Creek', distanceKm: 3.5, difficulty: 'Intermediate' } }),
    prisma.trail.create({ data: { name: 'Voodoo', location: 'Allatoona Creek', distanceKm: 4.0, difficulty: 'Advanced' } }),
    prisma.trail.create({ data: { name: 'Mumbo Jumbo', location: 'Allatoona Creek', distanceKm: 2.7, difficulty: 'Intermediate' } }),
    prisma.trail.create({ data: { name: 'Hocus Pocus', location: 'Allatoona Creek', distanceKm: 1.5, difficulty: 'Advanced' } }),
    prisma.trail.create({ data: { name: 'Mason’s Connector', location: 'Allatoona Creek', distanceKm: 2.3, difficulty: 'Beginner' } }),
  ])

  const blanketsTrails = await Promise.all([
    prisma.trail.create({ data: { name: 'Dwelling Loop', location: 'Blankets Creek', distanceKm: 4.2, difficulty: 'Intermediate' } }),
    prisma.trail.create({ data: { name: 'Van Michael Trail', location: 'Blankets Creek', distanceKm: 4.8, difficulty: 'Advanced' } }),
    prisma.trail.create({ data: { name: 'South Loop', location: 'Blankets Creek', distanceKm: 3.0, difficulty: 'Beginner' } }),
    prisma.trail.create({ data: { name: 'Mosquito Flats', location: 'Blankets Creek', distanceKm: 1.0, difficulty: 'Beginner' } }),
    prisma.trail.create({ data: { name: 'Quehl Holler', location: 'Blankets Creek', distanceKm: 1.2, difficulty: 'Advanced' } }),
  ])

  const sopeTrails = await Promise.all([
    prisma.trail.create({ data: { name: 'Paper Mill Trail', location: 'Sope Creek / Cochran Shoals', distanceKm: 3.0, difficulty: 'Intermediate' } }),
    prisma.trail.create({ data: { name: 'Creek Loop', location: 'Sope Creek / Cochran Shoals', distanceKm: 2.5, difficulty: 'Intermediate' } }),
    prisma.trail.create({ data: { name: 'Cochran Shoals Connector', location: 'Sope Creek / Cochran Shoals', distanceKm: 1.2, difficulty: 'Beginner' } }),
  ])

  const northCooperTrails = await Promise.all([
    prisma.trail.create({ data: { name: 'North Loop', location: 'North Cooper Lake Park', distanceKm: 1.6, difficulty: 'Intermediate' } }),
    prisma.trail.create({ data: { name: 'Skills Area', location: 'North Cooper Lake Park', distanceKm: 0.5, difficulty: 'Beginner' } }),
  ])

  // --- FAVORITES ---
  await prisma.user.update({ where: { id: alice.id }, data: { favoriteTrails: { connect: [allatoonaTrails[0], sopeTrails[0]] } } })
  await prisma.user.update({ where: { id: bob.id }, data: { favoriteTrails: { connect: [blanketsTrails[0], blanketsTrails[1]] } } })
  await prisma.user.update({ where: { id: charlie.id }, data: { favoriteTrails: { connect: [northCooperTrails[0]] } } })

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

  console.log('✅ Seed complete: users, friends, trails, rides (multi-trail), favorites, messages.')
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
