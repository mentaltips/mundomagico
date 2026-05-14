async function test() {
  const childId = 'child-enzo'
  const url = `http://localhost:3000/api/children/${childId}/guardians`
  try {
    const res = await fetch(url)
    console.log('Status:', res.status)
    const data = await res.json()
    console.log('Data:', JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error:', err.message)
  }
}
test()
