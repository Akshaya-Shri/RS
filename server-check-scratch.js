async function checkServer() {
  try {
    const res = await fetch('http://localhost:3000/api/products');
    console.log(`Server responded to /api/products: status ${res.status}`);
    const data = await res.json();
    console.log(`Success: ${data.success}, data length: ${data.data?.length}`);
  } catch (err) {
    console.log(`✗ Server failed to respond: ${err.message}`);
  }
}

checkServer();
