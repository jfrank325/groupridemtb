async function getRides() {
  const res = await fetch("/api/rides", { next: { revalidate: 60 } })
  return res.json()
}
