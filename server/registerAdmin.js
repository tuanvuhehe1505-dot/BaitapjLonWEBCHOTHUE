// Simple registration script to call the API
async function run() {
  try {
    // Nếu chạy local: http://localhost:3000/api/auth/register
    // Nếu chạy Render: https://baitapjlonwebchothue.onrender.com/api/auth/register
    const url = "https://baitapjlonwebchothue.onrender.com/api/auth/register";
    const body = {
      name: "Dat Admin",
      phone: "0344886556",
      password: "123456",
      adminCode: "dat1505",
    };

    console.log(`Registering admin to: ${url}`);

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
