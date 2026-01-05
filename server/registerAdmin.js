// Simple registration script to call the local API
async function run() {
  try {
    const url = "http://localhost:3000/api/auth/register";
    const body = {
      name: "Dat Admin",
      phone: "0344886556",
      password: "123456",
      adminCode: "dat1505",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    console.log("HTTP", res.status);
    try {
      console.log(JSON.parse(text));
    } catch (e) {
      console.log(text);
    }
  } catch (err) {
    console.error("Request failed:", err.message || err);
    process.exitCode = 2;
  }
}

run();
