async function run() {
  try {
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0344886556", password: "123456" }),
    });
    const loginJson = await loginRes.json();
    console.log("Login HTTP", loginRes.status);
    console.log(loginJson);
    if (!loginJson.token) return;

    const meRes = await fetch("http://localhost:3000/api/auth/me", {
      headers: { Authorization: "Bearer " + loginJson.token },
    });
    const meJson = await meRes.json();
    console.log("/me HTTP", meRes.status);
    console.log(meJson);
  } catch (err) {
    console.error("Error:", err);
    process.exitCode = 2;
  }
}

run();
